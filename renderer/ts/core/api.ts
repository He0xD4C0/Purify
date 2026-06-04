// API client — wraps fetch() to local backend

const API_BASE = `http://${location.hostname}:15678`;

interface ApiOptions {
  cookie?: string;
  [key: string]: unknown;
}

async function request(path: string, options: ApiOptions = {}): Promise<any> {
  const url = API_BASE + path;
  const cookie = options.cookie || localStorage.getItem('purify_cookie') || '';

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (key !== 'cookie' && value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  }
  if (cookie) body.append('cookie', cookie);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(`[API] ${path} failed:`, err);
    throw err;
  }
}

// ---- Auth ----
export const api = {
  loginCellphone: (phone: string, password: string) =>
    request('/login/cellphone', { phone, password }),

  loginQrKey: () => request('/login/qr/key'),

  loginQrCreate: (key: string, qrimg?: boolean) =>
    request('/login/qr/create', { key, qrimg: qrimg ? 'true' : undefined }),

  loginQrCheck: (key: string) => request('/login/qr/check', { key }),

  loginRefresh: () => request('/login/refresh'),

  loginStatus: () => request('/login/status'),

  logout: () => request('/logout'),

  // ---- User ----
  userAccount: () => request('/user/account'),
  userDetail: (uid: string) => request('/user/detail', { uid }),
  userPlaylist: (uid: string) => request('/user/playlist', { uid }),
  userSubcount: () => request('/user/subcount'),
  userLevel: () => request('/user/level'),
  userRecord: (uid?: string, type?: number) =>
    request('/user/record', { uid, type }),
  userUpdate: (params: Record<string, string>) =>
    request('/user/update', params),
  recentListenList: () => request('/recent_listen_list'),

  // ---- Playback ----
  songUrlV1: (id: string | number, level?: string) =>
    request('/song/url/v1', { id, level: level || 'lossless' }),

  songDetail: (ids: string) => request('/song/detail', { ids }),

  checkMusic: (id: string | number) => request('/check/music', { id }),

  scrobble: (id: string | number, sourceid?: number, time?: number) =>
    request('/scrobble', { id, sourceid, time }),

  // ---- Lyrics ----
  lyric: (id: string | number) => request('/lyric', { id }),
  lyricNew: (id: string | number) => request('/lyric/new', { id }),

  // ---- Search ----
  search: (keywords: string, type = 1, limit = 30, offset = 0) =>
    request('/search', { keywords, type, limit, offset }),

  cloudsearch: (keywords: string, type = 1, limit = 30, offset = 0) =>
    request('/cloudsearch', { keywords, type, limit, offset }),

  searchHot: () => request('/search/hot'),
  searchSuggest: (keywords: string) => request('/search/suggest', { keywords }),
  searchMultimatch: (keywords: string) =>
    request('/search/multimatch', { keywords }),

  // ---- Discovery ----
  banner: (type = 0) => request('/banner', { type }),
  personalized: (limit = 20) => request('/personalized', { limit }),
  personalizedNewsong: (limit = 12) =>
    request('/personalized/newsong', { limit }),
  recommendSongs: () => request('/recommend/songs'),
  recommendResource: () => request('/recommend/resource'),
  homepageDragonBall: () => request('/homepage/dragon/ball'),

  // ---- Playlist ----
  playlistDetail: (id: string | number) => request('/playlist/detail', { id }),
  playlistTrackAll: (id: string | number) =>
    request('/playlist/track/all', { id }),
  playlistCreate: (name: string) => request('/playlist/create', { name }),
  playlistDelete: (id: string | number) => request('/playlist/delete', { id }),
  playlistTrackAdd: (op: string, pid: string | number, tracks: string) =>
    request('/playlist/track/add', { op, pid, tracks }),
  playlistTrackDelete: (op: string, pid: string | number, tracks: string) =>
    request('/playlist/track/delete', { op, pid, tracks }),
  playlistSubscribe: (t: string, id: string | number) =>
    request('/playlist/subscribe', { t, id }),
  playlistCatlist: () => request('/playlist/catlist'),
  playlistHot: () => request('/playlist/hot'),
  playlistHighqualityTags: () => request('/playlist/highquality/tags'),

  // ---- Likes ----
  like: (id: string | number, like = true) =>
    request('/like', { id, like }),
  likelist: (uid: string) => request('/likelist', { uid }),
  playlistMylike: () => request('/playlist/mylike'),

  // ---- Album ----
  album: (id: string | number) => request('/album', { id }),
  albumDetail: (id: string | number) => request('/album/detail', { id }),
  albumNew: (area?: string, limit?: number, offset?: number) =>
    request('/album/new', { area, limit, offset }),

  // ---- Artist ----
  artistDetail: (id: string | number) => request('/artist/detail', { id }),
  artistSongs: (id: string | number) => request('/artist/songs', { id }),
  artistTopSong: (id: string | number) => request('/artist/top/song', { id }),
  artistAlbum: (id: string | number) => request('/artist/album', { id }),

  // ---- Similar ----
  simiSong: (id: string | number) => request('/simi/song', { id }),
  simiPlaylist: (id: string | number) => request('/simi/playlist', { id }),

  // ---- FM ----
  personalFm: () => request('/personal_fm'),

  // ---- Toplists ----
  toplist: () => request('/toplist'),
  toplistDetail: () => request('/toplist/detail'),
  topSong: (type = 0) => request('/top/song', { type }),

  // ---- Misc ----
  dailySignin: () => request('/daily_signin'),
};
