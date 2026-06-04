// Copyright/VIP/SVIP detection — classifies each track
class CopyrightDetector {
    constructor() {
        this.cache = new Map();
    }
    async check(track) {
        const cached = this.cache.get(track.id);
        if (cached && cached.expiry > Date.now()) {
            return cached.status;
        }
        const status = this.classify(track.fee || 0, track.privilege);
        this.cache.set(track.id, {
            status,
            expiry: Date.now() + 5 * 60 * 1000,
        });
        return status;
    }
    classify(fee, privilege) {
        // If we have privilege data, use it primarily
        if (privilege) {
            const pl = privilege.pl; // play level (0 = cannot play)
            const dl = privilege.dl; // download level
            const st = privilege.st; // status (-200 = unavailable)
            const freeTrial = privilege.freeTrialInfo;
            // -200 usually means unavailable
            if (st === -200)
                return 'unavailable';
            // If play level > 0, the song IS playable at some quality
            if (pl > 0) {
                // Determine the access type based on fee
                if (fee === 0)
                    return 'free';
                if (fee === 1)
                    return 'vip';
                if (fee === 4)
                    return 'purchase';
                if (fee === 16)
                    return 'svip';
                // fee=8 with pl>0 is playable (cloud/restricted but available)
                return 'free';
            }
            // pl === 0: cannot play
            if (pl === 0 && dl === 0)
                return 'unavailable';
            // Has free trial?
            if (freeTrial != null && freeTrial !== undefined) {
                return 'trial';
            }
            return 'unavailable';
        }
        // No privilege data — fallback to fee only
        if (fee === 0)
            return 'free';
        if (fee === 1)
            return 'vip';
        if (fee === 4)
            return 'purchase';
        if (fee === 16)
            return 'svip';
        // fee=8 without privilege data — assume playable
        return 'free';
    }
    clearCache() {
        this.cache.clear();
    }
}
export const copyrightDetector = new CopyrightDetector();
//# sourceMappingURL=copyright-detector.js.map