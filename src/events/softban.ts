import { type Message, type TextChannel } from 'discord.js';
import { CONFIG } from '../config.js';
import { loadDb } from '../database.js';

export async function handleRestrictedChannel(message: Message) {
    const db = loadDb();

    // Проверка статуса и нужного канала из базы
    if (!db.softban.enabled || !db.softban.targetChannel || message.channelId !== db.softban.targetChannel) return;

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

            // Берем канал уведомлений из базы
            if (db.softban.announceChannel) {
                const adminChannel = message.guild?.channels.cache.get(db.softban.announceChannel) as TextChannel;
                if (adminChannel) {
                    await adminChannel.send(`**<@${userId}>** has been soft-banned due to a message in a restricted channel.`);
                }
            }

        } catch (e) {
            console.error('[ERROR] Softban failed:', e);
        }
    }
}