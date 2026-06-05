// Global playability checker — determines if a song can be played and why not
import { auth } from './auth.js';
/** Check if a song is playable given the user's auth state */
export function checkPlayability(meta) {
    const fee = meta.fee || 0;
    const priv = meta.privilege;
    const userVip = auth.vipType;
    const userLoggedIn = auth.loggedIn;
    // No privilege data — use fee only
    if (!priv) {
        if (fee === 0)
            return ok('free', 'standard');
        if (fee === 1)
            return userLoggedIn ? ok('vip', 'exhigh') : blocked('vip', 'VIP 限定，请登录后播放');
        if (fee === 4)
            return blocked('purchase', '付费单曲，需购买后播放');
        if (fee === 8)
            return userLoggedIn ? ok('free', 'standard') : blocked('free', '登录后可播放');
        if (fee === 16)
            return userLoggedIn && userVip === 'svip' ? ok('svip', 'lossless') : blocked('svip', '黑胶 SVIP 限定');
        return ok('free', 'standard');
    }
    const pl = priv.pl;
    const st = priv.st;
    const maxbr = priv.maxbr || 0;
    const freeTrial = priv.freeTrialInfo;
    // Status -200 = unavailable
    if (st === -200)
        return blocked('unavailable', '平台无版权');
    // pl === 0 and dl === 0: cannot play
    if (pl === 0 && (priv.dl || 0) === 0) {
        return blocked('unavailable', '平台无版权');
    }
    // Has free trial — can play a preview
    if (freeTrial != null && freeTrial !== undefined) {
        return ok('trial', 'standard');
    }
    // Determine max quality from maxbr
    const quality = maxbrToQuality(maxbr);
    // pl > 0: playable — determine badge and quality access
    if (pl > 0) {
        if (fee === 0)
            return ok('free', quality);
        if (fee === 1) {
            if (!userLoggedIn)
                return blocked('vip', 'VIP 限定，请登录后播放');
            return ok('vip', quality);
        }
        if (fee === 4)
            return blockOrOk('purchase', '付费单曲，需购买后播放', quality);
        if (fee === 8)
            return ok(userLoggedIn ? 'free' : 'free', quality);
        if (fee === 16) {
            if (!userLoggedIn)
                return blocked('svip', '黑胶 SVIP 限定');
            if (userVip !== 'svip')
                return blocked('svip', '黑胶 SVIP 限定');
            return ok('svip', quality);
        }
        return ok('free', quality);
    }
    return blocked('unavailable', '无法播放');
}
/** Check if user can play at requested quality */
export function canPlayQuality(meta, requestedQuality) {
    const result = checkPlayability(meta);
    if (!result.canPlay)
        return false;
    const userVip = auth.vipType;
    const qualities = ['standard', 'higher', 'exhigh', 'lossless', 'hires'];
    const reqLevel = qualities.indexOf(requestedQuality);
    // Lossless and above require VIP
    if (reqLevel >= qualities.indexOf('lossless')) {
        if (userVip === 'none')
            return false;
    }
    // hires requires SVIP
    if (requestedQuality === 'hires' && userVip !== 'svip')
        return false;
    return reqLevel <= qualities.indexOf(result.maxQuality);
}
// ---- Helpers ----
function ok(status, quality) {
    return { canPlay: true, status, reason: '', maxQuality: quality };
}
function blocked(status, reason) {
    return { canPlay: false, status, reason, maxQuality: 'standard' };
}
function blockOrOk(status, reason, quality) {
    // purchase: show as blocked but let user know they can buy
    return { canPlay: false, status, reason, maxQuality: quality };
}
function maxbrToQuality(maxbr) {
    if (maxbr >= 999000)
        return 'hires';
    if (maxbr >= 320000)
        return 'lossless';
    if (maxbr >= 192000)
        return 'exhigh';
    if (maxbr >= 128000)
        return 'higher';
    return 'standard';
}
//# sourceMappingURL=playability.js.map