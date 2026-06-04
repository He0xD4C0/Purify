// Audio playback engine — HTML5 audio + Widevine DRM + Chrome Media Session

import { bus } from '../core/event-bus.js';
import { state, formatTime, type Track } from '../core/app.js';
import { copyrightDetector } from './copyright-detector.js';

class AudioEngine {
  private audio: HTMLAudioElement;
  private urlCache: Map<number, { url: string; expiry: number }> = new Map();

  constructor() {
    this.audio = new Audio();
    this.audio.volume = 1.0;
    this.setupEvents();
    this.setupMediaSession();
  }

  private setupEvents(): void {
    this.audio.addEventListener('play', () => {
      state.playing = true;
      bus.emit('player:state-change', true);
      this.updateMediaSession();
    });

    this.audio.addEventListener('pause', () => {
      state.playing = false;
      bus.emit('player:state-change', false);
      this.updateMediaSession();
    });

    this.audio.addEventListener('timeupdate', () => {
      state.currentTime = this.audio.currentTime;
      bus.emit('player:time-update', this.audio.currentTime);

      // Scrobble at 30s
      if (state.currentTrack && Math.floor(this.audio.currentTime) === 30) {
        this.scrobble();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('[Audio] Error:', e);
      bus.emit('player:error', '音频加载失败');
    });

    // Prevent download for copyright tracks
    this.audio.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
  }

  private updateMediaSession(): void {
    if (!('mediaSession' in navigator)) return;

    const track = state.currentTrack;
    if (!track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      artwork: [
        {
          src: track.album.picUrl ? `${track.album.picUrl}?param=512y512` : '',
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    });

    navigator.mediaSession.playbackState = state.playing ? 'playing' : 'paused';
  }

  async play(track: Track): Promise<void> {
    // Copyright check
    const status = await copyrightDetector.check(track);
    if (status === 'unavailable') {
      bus.emit('player:error', '此歌曲不可用');
      return;
    }
    if (status === 'purchase' && !state.loggedIn) {
      bus.emit('player:error', '此歌曲需付费购买');
      return;
    }

    // Get audio URL
    let url: string | null | undefined = this.urlCache.get(track.id)?.url;
    if (!url || (this.urlCache.get(track.id)?.expiry || 0) < Date.now()) {
      url = await this.fetchAudioUrl(track);
      if (!url) {
        bus.emit('player:error', '获取播放地址失败');
        return;
      }
      this.urlCache.set(track.id, { url, expiry: Date.now() + 20 * 60 * 1000 }); // 20 min cache
    }

    this.audio.src = url;
    await this.audio.play();

    // Preload next
    this.preloadNext();
  }

  private async fetchAudioUrl(track: Track): Promise<string | null> {
    try {
      const res = await fetch(
        `http://${location.hostname}:15678/song/url/v1?id=${track.id}&level=lossless`,
        { method: 'POST' }
      );
      const json = await res.json();
      const data = json.data?.[0];
      return data?.url || null;
    } catch {
      return null;
    }
  }

  private preloadNext(): void {
    const nextTrack = this.getNextTrack();
    if (!nextTrack) return;

    if (!this.urlCache.has(nextTrack.id)) {
      this.fetchAudioUrl(nextTrack).then((url) => {
        if (url) {
          this.urlCache.set(nextTrack.id, { url, expiry: Date.now() + 20 * 60 * 1000 });
        }
      });
    }
  }

  private getNextTrack(): Track | null {
    const { queue, queueIndex, playMode } = state;
    if (queue.length === 0) return null;

    if (playMode === 'single') return queue[queueIndex];
    if (playMode === 'random') {
      const idx = Math.floor(Math.random() * queue.length);
      return queue[idx];
    }
    // list mode
    const nextIdx = (queueIndex + 1) % queue.length;
    return queue[nextIdx];
  }

  togglePlay(): void {
    if (!this.audio.src) {
      // No track loaded — attempt to play from queue
      if (state.queue.length > 0 && state.queueIndex >= 0) {
        const track = state.queue[state.queueIndex];
        this.play(track);
        bus.emit('player:track-change', track);
      }
      return;
    }
    if (this.audio.paused) {
      this.audio.play().catch((e) => console.warn('[Audio] play() rejected:', e));
    } else {
      this.audio.pause();
    }
  }

  playNext(): void {
    const { queue, queueIndex, playMode } = state;
    if (queue.length === 0) return;

    let nextIdx: number;
    if (playMode === 'single') {
      nextIdx = queueIndex;
    } else if (playMode === 'random') {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = (queueIndex + 1) % queue.length;
    }

    state.queueIndex = nextIdx;
    state.currentTrack = queue[nextIdx];
    this.play(state.currentTrack);
    bus.emit('player:track-change', state.currentTrack);
  }

  playPrev(): void {
    const { queue, queueIndex } = state;
    if (queue.length === 0) return;

    const prevIdx = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    state.queueIndex = prevIdx;
    state.currentTrack = queue[prevIdx];
    this.play(state.currentTrack);
    bus.emit('player:track-change', state.currentTrack);
  }

  seek(offset: number): void {
    this.audio.currentTime = Math.max(0, Math.min(this.audio.currentTime + offset, this.audio.duration || 0));
  }

  seekTo(time: number): void {
    this.audio.currentTime = time;
  }

  private async scrobble(): Promise<void> {
    if (!state.currentTrack) return;
    try {
      await fetch(`http://${location.hostname}:15678/scrobble?id=${state.currentTrack.id}&time=${Math.floor(Date.now() / 1000)}`, {
        method: 'POST',
      });
    } catch {
      // silently fail
    }
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration || 0;
  }

  destroy(): void {
    this.audio.pause();
    this.audio.src = '';
  }
}

export const audioEngine = new AudioEngine();
