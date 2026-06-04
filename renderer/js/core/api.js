// API client — wraps fetch() to local backend
const API_BASE = `http://${location.hostname}:15678`;
async function request(path, options = {}) {
    const url = API_BASE + path;
    const cookie = options.cookie || localStorage.getItem('purify_cookie') || '';
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
        if (key !== 'cookie' && value !== undefined && value !== null) {
            body.append(key, String(value));
        }
    }
    if (cookie)
        body.append('cookie', cookie);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        const json = await res.json();
        return json;
    }
    catch (err) {
        console.error(`[API] ${path} failed:`, err);
        throw err;
    }
}
// ---- Auth ----
export const api = {
    loginCellphone: (phone, password) => request('/login/cellphone', { phone, password }),
    loginQrKey: () => request('/login/qr/key'),
    loginQrCreate: (key, qrimg) => request('/login/qr/create', { key, qrimg: qrimg ? 'true' : undefined }),
    loginQrCheck: (key) => request('/login/qr/check', { key }),
    loginRefresh: () => request('/login/refresh'),
    loginStatus: () => request('/login/status'),
    logout: () => request('/logout'),
    // ---- User ----
    userAccount: () => request('/user/account'),
    userDetail: (uid) => request('/user/detail', { uid }),
    userPlaylist: (uid) => request('/user/playlist', { uid }),
    userSubcount: () => request('/user/subcount'),
    userLevel: () => request('/user/level'),
    userRecord: (uid, type) => request('/user/record', { uid, type }),
    userUpdate: (params) => request('/user/update', params),
    recentListenList: () => request('/recent_listen_list'),
    // ---- Playback ----
    songUrlV1: (id, level) => request('/song/url/v1', { id, level: level || 'lossless' }),
    songDetail: (ids) => request('/song/detail', { ids }),
    checkMusic: (id) => request('/check/music', { id }),
    scrobble: (id, sourceid, time) => request('/scrobble', { id, sourceid, time }),
    // ---- Lyrics ----
    lyric: (id) => request('/lyric', { id }),
    lyricNew: (id) => request('/lyric/new', { id }),
    // ---- Search ----
    search: (keywords, type = 1, limit = 30, offset = 0) => request('/search', { keywords, type, limit, offset }),
    cloudsearch: (keywords, type = 1, limit = 30, offset = 0) => request('/cloudsearch', { keywords, type, limit, offset }),
    searchHot: () => request('/search/hot'),
    searchSuggest: (keywords) => request('/search/suggest', { keywords }),
    searchMultimatch: (keywords) => request('/search/multimatch', { keywords }),
    // ---- Discovery ----
    banner: (type = 0) => request('/banner', { type }),
    personalized: (limit = 20) => request('/personalized', { limit }),
    personalizedNewsong: (limit = 12) => request('/personalized/newsong', { limit }),
    recommendSongs: () => request('/recommend/songs'),
    recommendResource: () => request('/recommend/resource'),
    homepageDragonBall: () => request('/homepage/dragon/ball'),
    // ---- Playlist ----
    playlistDetail: (id) => request('/playlist/detail', { id }),
    playlistTrackAll: (id) => request('/playlist/track/all', { id }),
    playlistCreate: (name) => request('/playlist/create', { name }),
    playlistDelete: (id) => request('/playlist/delete', { id }),
    playlistTrackAdd: (op, pid, tracks) => request('/playlist/track/add', { op, pid, tracks }),
    playlistTrackDelete: (op, pid, tracks) => request('/playlist/track/delete', { op, pid, tracks }),
    playlistSubscribe: (t, id) => request('/playlist/subscribe', { t, id }),
    playlistCatlist: () => request('/playlist/catlist'),
    playlistHot: () => request('/playlist/hot'),
    playlistHighqualityTags: () => request('/playlist/highquality/tags'),
    // ---- Likes ----
    like: (id, like = true) => request('/like', { id, like }),
    likelist: (uid) => request('/likelist', { uid }),
    playlistMylike: () => request('/playlist/mylike'),
    // ---- Album ----
    album: (id) => request('/album', { id }),
    albumDetail: (id) => request('/album/detail', { id }),
    albumNew: (area, limit, offset) => request('/album/new', { area, limit, offset }),
    // ---- Artist ----
    artistDetail: (id) => request('/artist/detail', { id }),
    artistSongs: (id) => request('/artist/songs', { id }),
    artistTopSong: (id) => request('/artist/top/song', { id }),
    artistAlbum: (id) => request('/artist/album', { id }),
    // ---- Similar ----
    simiSong: (id) => request('/simi/song', { id }),
    simiPlaylist: (id) => request('/simi/playlist', { id }),
    // ---- FM ----
    personalFm: () => request('/personal_fm'),
    // ---- Toplists ----
    toplist: () => request('/toplist'),
    toplistDetail: () => request('/toplist/detail'),
    topSong: (type = 0) => request('/top/song', { type }),
    // ---- Misc ----
    dailySignin: () => request('/daily_signin'),
};
//# sourceMappingURL=api.js.map