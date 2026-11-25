import { EmbedBuilder, type Guild, type Message, type Client } from 'discord.js';
import { CONFIG } from './config.js';

export const Embeds = {
    // Ваши старые эмбеды
    helpLegacy: (client: Client) => new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📚 Список команд')
        .setDescription('Префикс для всех команд: `i`')
        .addFields(
            { name: '`iping`', value: 'Проверить бота', inline: true },
            { name: '`iinfo`', value: 'Инфо о сервере', inline: true }
        )
        .setThumbnail(client.user?.displayAvatarURL() || null)
        .setTimestamp(),

    info: (message: Message) => new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`Сервер: ${message.guild?.name}`)
        .setThumbnail(message.guild?.iconURL() || null)
        .addFields(
            { name: '👤 Участников', value: `${message.guild?.memberCount}`, inline: true },
            { name: '📅 Создан', value: `${message.guild?.createdAt.toLocaleDateString()}`, inline: true }
        ),

    // Перенесенные новые эмбеды
    loveu: () => new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('I love u too ❤️')
        .setTimestamp(),

    help: () => new EmbedBuilder()
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
        .setTimestamp(),

    suggest: () => new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('How to create a suggestion')
        .setDescription("Hello! Below is a guide on how to create a suggestion for your idea.")
        .addFields(
            { name: 'Use GitHub', value: `I read it more often than the Discord forum.\n-> <#${CONFIG.CHANNELS.GITHUB}>`, inline: false },
            { name: 'Use Discord Forum', value: `I read it there too, but less frequently.\n-> <#${CONFIG.CHANNELS.FORUM}>`, inline: false },
            { name: 'Report Bugs', value: `We review existing bugs and fix them if necessary.\n-> <#${CONFIG.CHANNELS.BUGS}>`, inline: false },
        )
        .setTimestamp(),

    ea: () => new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Early Access Info')
        .setDescription("Hello! If you’re having trouble getting access to Early Access mods, follow these steps:")
        .addFields(
            { name: '1. Connect Patreon/Boosty', value: `Connect your Discord account to Patreon or Boosty to get your tier role.`, inline: false },
            { name: '2. Connect Steam', value: `Connect your Steam account to your Discord to verify membership.\n-> <#${CONFIG.CHANNELS.STEAM_CONNECT}>`, inline: false },
            { name: '3. Get the Links', value: `Go to the <#${CONFIG.CHANNELS.MOD_LINKS}> channel to access the mod links.`, inline: false },
            { name: 'More Help', value: `Details: <#${CONFIG.CHANNELS.FAQ}>\nTutorial: ${CONFIG.LINKS.TUTORIAL_VIDEO}`, inline: false },
        )
        .setTimestamp(),

    mpw: () => new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('MPW Library')
        .setDescription("MPW (My Perfect Windows) Library is a core mod for clean and user-friendly UI.")
        .addFields(
            { name: 'Download', value: `[Steam Workshop](${CONFIG.LINKS.MPW_WORKSHOP})`, inline: false },
            { name: 'SA (Special Activation)', value: `An alternative way to activate abilities or features in our mods.`, inline: false },
        )
        .setTimestamp(),

    mods: () => new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Early Access Mods')
        .setDescription("List of mods available for specific tiers.")
        .addFields(
            { name: 'Tier 1 / Booster', value: `Clay Soldiers Mod`, inline: true },
            { name: 'Tier 2', value: `Prostheses Mod 2.0\nPer Pixel Mod`, inline: true },
            { name: 'Support us', value: `[Patreon](${CONFIG.LINKS.PATREON}) | [Boosty](${CONFIG.LINKS.BOOSTY})`, inline: false },
        )
        .setTimestamp(),

    devStats: (guild: Guild, stats: { total: number, bans: number, boosters: number, special: number, t2: number, t1: number }) =>
        new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('🛠️ Developer Statistics')
            .setDescription(
                `Total Members\n —** ${stats.total}**\n\n` +
                `Banned Users\n —** ${stats.bans}**\n\n` +
                `Server Boosters\n —** ${stats.boosters}**\n\n` +
                `Tier Special\n —** ${stats.special}**\n\n` +
                `Tier 2\n —** ${stats.t2}**\n\n` +
                `Tier 1\n —** ${stats.t1}**`
            )
            .setTimestamp()
};