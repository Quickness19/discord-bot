import { Message, EmbedBuilder, Collection } from 'discord.js';
import { CONFIG } from '../config.js';

interface BotCommand {
    execute: (message: Message, args: string[]) => Promise<void>;
}

export const commands = new Collection<string, BotCommand>();

commands.set('loveu', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('I love u too ❤️')
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('help', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Commands list')
            .setDescription("List of commands available for you.")
            .addFields(
                { name: '`i help`', value: `⟶ List of commands that this bot can provide.`, inline: false },
                { name: '`i ea`', value: `⟶ Guide for Patreon or Boosty subscribers.`, inline: false },
                { name: '`i mpw`', value: `⟶ About MPW Library mod and SA.`, inline: false },
                { name: '`i mods`', value: `⟶ List of early access mods for different tiers.`, inline: false },
                { name: '`i suggest`', value: `⟶ About suggestions and bug reports.`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('suggest', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('How to create a suggestion')
            .setDescription("Hello! Below is a guide on how to create a suggestion for your idea.")
            .addFields(
                { name: 'Use GitHub', value: `I read it more often than the Discord forum.\n-> <#${CONFIG.CHANNELS.GITHUB}>`, inline: false },
                { name: 'Use Discord Forum', value: `I read it there too, but less frequently.\n-> <#${CONFIG.CHANNELS.FORUM}>`, inline: false },
                { name: 'Report Bugs', value: `We review existing bugs and fix them if necessary.\n-> <#${CONFIG.CHANNELS.BUGS}>`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('ea', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Early Access Info')
            .setDescription("Hello! If you’re having trouble getting access to Early Access mods, follow these steps:")
            .addFields(
                { name: '1. Connect Patreon/Boosty', value: `Connect your Discord account to Patreon or Boosty to get your tier role.`, inline: false },
                { name: '2. Connect Steam', value: `Connect your Steam account to your Discord to verify membership.\n-> <#${CONFIG.CHANNELS.STEAM_CONNECT}>`, inline: false },
                { name: '3. Get the Links', value: `Go to the <#${CONFIG.CHANNELS.MOD_LINKS}> channel to access the mod links.`, inline: false },
                { name: 'More Help', value: `Details: <#${CONFIG.CHANNELS.FAQ}>\nTutorial: ${CONFIG.LINKS.TUTORIAL_VIDEO}`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('mpw', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('MPW Library')
            .setDescription("MPW (My Perfect Windows) Library is a core mod for clean and user-friendly UI.")
            .addFields(
                { name: 'Download', value: `[Steam Workshop](${CONFIG.LINKS.MPW_WORKSHOP})`, inline: false },
                { name: 'SA (Special Activation)', value: `An alternative way to activate abilities or features in our mods.`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('mods', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Early Access Mods')
            .setDescription("List of mods available for specific tiers.")
            .addFields(
                { name: 'Tier 1 / Booster', value: `Clay Soldiers Mod`, inline: true },
                { name: 'Tier 2', value: `Prostheses Mod 2.0\nPer Pixel Mod`, inline: true },
                { name: 'Support us', value: `[Patreon](${CONFIG.LINKS.PATREON}) | [Boosty](${CONFIG.LINKS.BOOSTY})`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('dev', {
    execute: async (message) => {
        if (!message.member?.roles.cache.has(CONFIG.ROLES.INTSTUDIO)) {
            return;
        }

        const { guild } = message;
        if (!guild) return;

        try {
            await guild.members.fetch();
            const bans = await guild.bans.fetch();

            const totalMembers = guild.memberCount;

            const t1Id = '1167052029592621136';
            const t2Id = '1167052029592621137';
            const boosterId = '1174039260609921114';
            const specialId = '1495295242851581972';

            const members = Array.from(guild.members.cache.values());

            const t2Count = members.filter(m => m.roles.cache.has(t2Id)).length;
            const t1Count = members.filter(m => m.roles.cache.has(t1Id) && !m.roles.cache.has(t2Id)).length;
            const boosterCount = guild.roles.cache.get(boosterId)?.members.size || 0;
            const specialCount = guild.roles.cache.get(specialId)?.members.size || 0;

            const embed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('🛠️ Developer Statistics')
                .setDescription(
                    `Total Members\n —** ${totalMembers}**\n\n` +
                    `Banned Users\n —** ${bans.size}**\n\n` +
                    `Server Boosters\n —** ${boosterCount}**\n\n` +
                    `Tier Special\n —** ${specialCount}**\n\n` +
                    `Tier 2\n —** ${t2Count}**\n\n` +
                    `Tier 1\n —** ${t1Count}**`
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in i dev:', error);
            await message.reply('Failed to fetch statistics.');
        }
    }
});

commands.set('clear', {
    execute: async (message, args) => {
        const adminRoleId = CONFIG.ROLES.INTSTUDIO;
        if (!adminRoleId || !message.member?.roles.cache.has(adminRoleId)) {
            return;
        }

        if (!message.channel.isTextBased() || message.channel.isDMBased() || !('bulkDelete' in message.channel)) {
            return;
        }

        const firstArg = args[0] ?? "";
        if (!firstArg) {
            const reply = await message.reply('Please specify a number of messages greater than 0 — Example: `i clear 10`');
            setTimeout(() => reply.delete().catch(() => { }), 5000);
            return;
        }

        const amount = parseInt(firstArg);

        if (isNaN(amount) || amount <= 0) {
            const reply = await message.reply('Please specify a number of messages greater than 0 — Example: `i clear 10`');
            setTimeout(() => reply.delete().catch(() => { }), 5000);
            return;
        }

        const deleteCount = Math.min(amount, 100);

        try {
            const deleted = await message.channel.bulkDelete(deleteCount + 1, true);

            const successMsg = await message.channel.send(`✅ Deleted — **${deleted.size - 1}** messages.`);

            setTimeout(() => successMsg.delete().catch(() => { }), 3000);
        } catch (error) {
            console.error('Clear error:', error);
            await message.reply('Error — messages older than 14 days cannot be bulk deleted.');
        }
    }
});