// Global playability checker — determines if a song can be played and why not
import { auth } from './auth.js';
/** Check if a song is playable given the user's auth state */
export function checkPlayability(meta) {
    const fee = meta.fee || 0;
    const priv = meta.privilege;
    const userLoggedIn = auth.loggedIn;
    if (!priv) {
        if (fee === 0 || fee === 8)
            return ok('free');
        if (fee === 1 || fee === 16)
            return userLoggedIn ? ok('vip') : blocked('vip', 'VIP 限定，请登录后播放');
        if (fee === 4)
            return blocked('purchase', '付费单曲，需购买后播放');
        return ok('free');
    }
    const pl = priv.pl;
    const dl = priv.dl;
    const st = priv.st;
    if (st === -200)
        return blocked('unavailable', '平台无版权');
    if (pl === 0 && dl === 0)
        return blocked('unavailable', '平台无版权');
    if (pl > 0) {
        if (fee === 0 || fee === 8)
            return ok('free');
        if (fee === 1 || fee === 16)
            return userLoggedIn ? ok('vip') : blocked('vip', 'VIP 限定，请登录后播放');
        if (fee === 4)
            return blocked('purchase', '付费单曲，需购买后播放');
        return ok('free');
    }
    return blocked('unavailable', '无法播放');
}
// ---- Helpers ----
function ok(status) {
    return { canPlay: true, status, reason: '' };
}
function blocked(status, reason) {
    return { canPlay: false, status, reason };
}
//# sourceMappingURL=playability.js.map