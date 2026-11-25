const SPECIAL_ROLES = {
    TIER_1: '1167052029592621136',
    TIER_2: '1167052029592621137',
    BOOSTER: '1174039260609921114',
    SPECIAL: '1495295242851581972'
};

export const CONFIG = {
    PREFIX: "i",
    CHANNELS: {
        WELCOME: '1495759229871718552',
        TARGET: '1495753296302837852',
        STEAM_CONNECT: '1396606687057809528',
        MOD_LINKS: '1463834587334443206',
        GITHUB: '1449020078401130516',
        FORUM: '1174728604685434980',
        BUGS: '1476990913908572264',
        FAQ: '1396763045518114826',
        ADMIN: '1396754255624409189',
        ANNOUNCEMENTS: '1167055762963574864',
        TEASERS: '1167055830827405332'
    },
    ROLES: {
        INTSTUDIO: '1167052029605199884',
        MODERATOR: '1263268123574800406',
        SOFTBAN_PROTECTION: ['1167052029605199884', '1263268123574800406'],
        SPECIAL_IDS: SPECIAL_ROLES,
        SPECIAL: {
            [SPECIAL_ROLES.TIER_1]: { name: 'Tier 1', color: 0x3498db },
            [SPECIAL_ROLES.TIER_2]: { name: 'Tier 2', color: 0x9b59b6 },
            [SPECIAL_ROLES.BOOSTER]: { name: 'Server booster', color: 0xf47fff },
            [SPECIAL_ROLES.SPECIAL]: { name: 'Tier special', color: 0xe74c3c }
        } as Record<string, { name: string; color: number }>
    },
    LINKS: {
        TUTORIAL_VIDEO: 'https://www.youtube.com/watch?v=FIESGtB-yhM',
        PATREON: 'https://www.patreon.com/intstudio',
        BOOSTY: 'https://boosty.to/intstudio',
        MPW_WORKSHOP: 'https://steamcommunity.com/sharedfiles/filedetails/?id=2953788932'
    },
    EMOJIS: {
        LIKE: '1499650364448706570',
        DISLIKE: '1499650384048689202'
    }
};