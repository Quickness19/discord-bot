import { type Message, type TextChannel } from 'discord.js';
import { CONFIG } from '../config.js';

export async function handleRestrictedChannel(message: Message) {
    if (message.channelId !== CONFIG.CHANNELS.TARGET) return;

    const member = message.member;
    if (!member) return;

    const hasPermission = member.roles.cache.some(role =>
        CONFIG.ROLES.SOFTBAN_PROTECTION.includes(role.id)
    );

    if (!hasPermission && member.bannable) {
        try {
            const userId = message.author.id;
            const userTag = message.author.tag;

            await member.ban({
                deleteMessageSeconds: 86400,
                reason: 'Softban: Message in restricted channel.'
            });
            await message.guild?.members.unban(userId, 'Softban reset');

            console.log(`[MODERATION] Softbanned ${userTag}`);

            const adminChannel = message.guild?.channels.cache.get(CONFIG.CHANNELS.ADMIN) as TextChannel;
            if (adminChannel) {
                await adminChannel.send(`**<@${userId}>** has been soft-banned due to a message in a restricted channel.`);
            }

        } catch (e) {
            console.error('[ERROR] Softban failed:', e);
        }
    }
}