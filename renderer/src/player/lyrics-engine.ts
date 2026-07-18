// LRC parser + bilingual display + ruby/furigana annotation

interface LyricLine {
  time: number;    // in seconds
  text: string;
  transText?: string;
  romaText?: string;  // romanization / yomigana
}

interface ParsedLyric {
  lines: LyricLine[];
  offset: number; // global offset in ms
  source: 'official' | 'ai' | 'none';
}

class LyricsEngine {
  private currentLyric: ParsedLyric | null = null;
  private lyricId: number | null = null;

  async fetch(songId: number): Promise<ParsedLyric> {
    // Check cache
    const cacheKey = `lyric_${songId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ParsedLyric;
        this.currentLyric = parsed;
        this.lyricId = songId;
        return parsed;
      } catch { /* ignore */ }
    }

    try {
      const res = await fetch(`http://${location.hostname}:15678/lyric?id=${songId}`, { method: 'POST' });
      const json = await res.json();
      const lrc = json.lrc?.lyric || '';
      const tlyric = json.tlyric?.lyric || '';  // official translation
      const romalrc = json.romalrc?.lyric || ''; // romanization (for ruby)

      const parsed = this.parseLRC(lrc, tlyric, romalrc);
      parsed.source = 'official';

      // Try AI translation if no official translation
      if (!tlyric && localStorage.getItem('purify_ai_enabled') === 'true') {
        try {
          const aiTrans = await this.aiTranslate(parsed);
          parsed.lines = parsed.lines.map((line, i) => ({
            ...line,
            transText: aiTrans[i] || undefined,
          }));
          parsed.source = 'ai';
        } catch { /* AI failed, continue without */ }
      }

      this.currentLyric = parsed;
      this.lyricId = songId;

      // Cache
      localStorage.setItem(cacheKey, JSON.stringify(parsed));

      return parsed;
    } catch {
      return { lines: [], offset: 0, source: 'none' };
    }
  }

  private parseLRC(lrc: string, tlyric: string, romalrc: string): ParsedLyric {
    const lines: LyricLine[] = [];
    let offset = 0;

    // Parse offset tag
    const offsetMatch = lrc.match(/\[offset:([+-]?\d+)\]/);
    if (offsetMatch) {
      offset = parseInt(offsetMatch[1]);
    }

    // Parse trans lyrics
    const transMap = this.parseTransLRCMap(tlyric);
    const romaMap = this.parseTransLRCMap(romalrc);

    // Parse main LRC
    const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;
    const lines_raw = lrc.split('\n');

    for (const line of lines_raw) {
      // Skip metadata tags
      if (line.startsWith('[ti:') || line.startsWith('[ar:') ||
          line.startsWith('[al:') || line.startsWith('[by:') ||
          line.startsWith('[offset:') || line.trim() === '') {
        continue;
      }

      const times: number[] = [];
      let match: RegExpExecArray | null;
      timeRegex.lastIndex = 0;

      while ((match = timeRegex.exec(line)) !== null) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const ms = parseInt(match[3].padEnd(3, '0'));
        times.push(min * 60 + sec + ms / 1000);
      }

      if (times.length === 0) continue;

      const text = line.replace(timeRegex, '').trim();

      for (const time of times) {
        const adjusted = time + offset / 1000;
        lines.push({
          time: adjusted,
          text,
          transText: transMap.get(adjusted) || undefined,
          romaText: romaMap.get(adjusted) || undefined,
        });
      }
    }

    // Sort by time
    lines.sort((a, b) => a.time - b.time);

    return { lines, offset, source: 'official' };
  }

  private parseTransLRCMap(lrc: string): Map<number, string> {
    const map = new Map<number, string>();
    if (!lrc) return map;

    const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;
    const lines = lrc.split('\n');

    for (const line of lines) {
      const times: number[] = [];
      let match: RegExpExecArray | null;
      timeRegex.lastIndex = 0;

      while ((match = timeRegex.exec(line)) !== null) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const ms = parseInt(match[3].padEnd(3, '0'));
        times.push(min * 60 + sec + ms / 1000);
      }

      const text = line.replace(timeRegex, '').trim();

      for (const time of times) {
        map.set(time, text);
      }
    }

    return map;
  }

  private async aiTranslate(parsed: ParsedLyric): Promise<string[]> {
    const apiKey = localStorage.getItem('purify_ai_key') || '';
    const endpoint = localStorage.getItem('purify_ai_endpoint') || 'https://api.openai.com/v1/chat/completions';
    const model = localStorage.getItem('purify_ai_model') || 'gpt-4o-mini';

    if (!apiKey) throw new Error('No API key');

    const originalLines = parsed.lines.map((l) => l.text).filter(Boolean);
    const prompt = `将以下歌词翻译为中文，保留换行，每行输出翻译，不包含时间戳，保持诗意。\n${originalLines.join('\n')}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: '你是一个歌词翻译助手。将歌词翻译为中文，每行对应一行翻译，保持诗意和韵律。只返回翻译文本，不要包含原文、时间戳或任何额外内容。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '';
    return content.split('\n').filter((l: string) => l.trim());
  }

  getCurrent(): ParsedLyric | null {
    return this.currentLyric;
  }

  findLineIndex(time: number): number {
    if (!this.currentLyric) return -1;
    const lines = this.currentLyric.lines;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (time >= lines[i].time) return i;
    }
    return -1;
  }
}

export const lyricsEngine = new LyricsEngine();
