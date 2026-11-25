import { type Message } from 'discord.js';
import { CONFIG } from '../config.js';

const TARGET_CHANNELS = [
    CONFIG.CHANNELS.ANNOUNCEMENTS,
    CONFIG.CHANNELS.TEASERS
];

export async function handleAutoReaction(message: Message) {
    if (!TARGET_CHANNELS.includes(message.channelId)) return;

    const reactions = [
        CONFIG.EMOJIS.LIKE,
        CONFIG.EMOJIS.DISLIKE
    ];

    try {
        for (const emojiId of reactions) {
            if (emojiId) {
                await message.react(emojiId);
            }
        }
    } catch (error) {
        console.error('[ERROR] Failed to add reactions:', error);
    }
}