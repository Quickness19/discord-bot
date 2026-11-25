import { Message, Collection } from 'discord.js';
import { CONFIG } from '../config.js';
import { Embeds } from '../embeds.js';

interface BotCommand {
    execute: (message: Message, args: string[]) => Promise<void>;
}

export const commands = new Collection<string, BotCommand>();

// Простые команды используют шаблоны из embeds.ts
commands.set('loveu', { execute: async (m) => { await m.reply({ embeds: [Embeds.loveu()] }); } });
commands.set('help', { execute: async (m) => { await m.reply({ embeds: [Embeds.help()] }); } });
commands.set('suggest', { execute: async (m) => { await m.reply({ embeds: [Embeds.suggest()] }); } });
commands.set('ea', { execute: async (m) => { await m.reply({ embeds: [Embeds.ea()] }); } });
commands.set('mpw', { execute: async (m) => { await m.reply({ embeds: [Embeds.mpw()] }); } });
commands.set('mods', { execute: async (m) => { await m.reply({ embeds: [Embeds.mods()] }); } });

commands.set('dev', {
    execute: async (message) => {
        if (!message.member?.roles.cache.has(CONFIG.ROLES.INTSTUDIO)) return;
        const { guild } = message;
        if (!guild) return;

        try {
            await guild.members.fetch();
            const bans = await guild.bans.fetch();
            const members = Array.from(guild.members.cache.values());
            const ids = CONFIG.ROLES.SPECIAL_IDS;

            const t2Count = members.filter(m => m.roles.cache.has(ids.TIER_2)).length;
            const t1Count = members.filter(m => m.roles.cache.has(ids.TIER_1) && !m.roles.cache.has(ids.TIER_2)).length;
            const boosterCount = guild.roles.cache.get(ids.BOOSTER)?.members.size || 0;
            const specialCount = guild.roles.cache.get(ids.SPECIAL)?.members.size || 0;

            const stats = {
                total: guild.memberCount,
                bans: bans.size,
                boosters: boosterCount,
                special: specialCount,
                t2: t2Count,
                t1: t1Count
            };

            await message.reply({ embeds: [Embeds.devStats(guild, stats)] });
        } catch (error) {
            console.error('[DEV COMMAND] Failed to fetch stats:', error);
            await message.reply('Failed to fetch statistics.');
        }
    }
});

commands.set('clear', {
    execute: async (message, args) => {
        if (!message.member?.roles.cache.has(CONFIG.ROLES.INTSTUDIO)) return;
        if (!message.channel.isTextBased() || message.channel.isDMBased() || !('bulkDelete' in message.channel)) return;

        const amount = parseInt(args[0] ?? "");

        const sendTempReply = async (text: string) => {
            const reply = await message.reply(text);
            setTimeout(() => reply.delete().catch(() => { }), 5000);
        };

        if (isNaN(amount) || amount <= 0) {
            return sendTempReply('Please specify a number of messages greater than 0 — Example: `i clear 10`');
        }

        const deleteCount = Math.min(amount, 100);

        try {
            const deleted = await message.channel.bulkDelete(deleteCount + 1, true);
            const successMsg = await message.channel.send(`✅ Deleted — **${deleted.size - 1}** messages.`);
            setTimeout(() => successMsg.delete().catch(() => { }), 3000);
        } catch (error) {
            console.error('[CLEAR COMMAND] Error:', error);
            await sendTempReply('Error — messages older than 14 days cannot be bulk deleted.');
        }
    }
});