import {
    Client,
    GatewayIntentBits,
    Message,
    EmbedBuilder,
    Collection
} from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

const prefix = "i";
const WELCOME_CHANNEL_ID = '1495759229871718552';
const SPECIAL_ROLES = {
    '1167052029592621136': { name: 'Tier 1', color: 0x3498db },
    '1167052029592621137': { name: 'Tier 2', color: 0x9b59b6 },
    '1174039260609921114': { name: 'Server booster', color: 0xf47fff },
    '1495295242851581972': { name: 'Tier special', color: 0xe74c3c }
};

const TARGET_CHANNEL_ID = '1495753296302837852';
const ALLOWED_ROLES = ['1167052029605199884', '1263268123574800406'];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    presence: {
        activities: [{
            name: 'Creating mods..',
            type: 0
        }],
        status: 'dnd',
    },
});
interface BotCommand {
    execute: (message: Message) => Promise<void>;
}

const commands = new Collection<string, BotCommand>();

commands.set('loveu', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('I love u too')
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('help', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Commands list')
            .setDescription("List of commands.")
            .addFields(
                { name: '__i help__', value: `⟶ List of commands that this bot can provide.`, inline: false },
                { name: '__i ea__', value: `⟶ Guide for Patreon or Boosty subscribers.`, inline: false },
                { name: '__i mpw__', value: `⟶ About MPW Library mod and SA.`, inline: false },
                { name: '__i mods__', value: `⟶ List of early access mods for different tiers.`, inline: false },
                { name: '__i suggest__', value: `⟶ About suggestions and bug reports.`, inline: false },
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
                { name: 'Use GitHub.', value: `I read it more often than the Discord forum.\n-> <#1449020078401130516>`, inline: false },
                { name: 'Use discord forum.', value: `I read it there too, but less frequently.\n-> <#1174728604685434980>`, inline: false },
                { name: 'Report bugs.', value: `We review existing bugs and fix them if necessary. \n-> <#1476990913908572264>`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('ea', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Early access info')
            .setDescription("Hello! If you’re having trouble getting access to Early Access mods, this is for you!")
            .addFields(
                { name: '1. Connect your Discord account to Patreon or Boosty.', value: `This is required to get your tier role here.`, inline: false },
                { name: '2. Connect your Steam account to your Discord account.', value: `Use the Connect Steam button to verify your membership tier\n-> <#1396606687057809528>`, inline: false },
                { name: '3. Get the mod links.', value: `Go to the <#1463834587334443206> channel to access the mod links.`, inline: false },
                { name: '', value: `For more details, you can read the information in <#1396763045518114826>.\nYou can also watch video tutorial.\n-> https://www.youtube.com/watch?v=FIESGtB-yhM`, inline: false },
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
            .setDescription("MPW Library is short for My Perfect Windows Library. This library mod is created to add clean and user-friendly UI for our mods.")
            .addFields(
                { name: 'Download link', value: `-> https://steamcommunity.com/sharedfiles/filedetails/?id=2953788932`, inline: false },
                { name: 'SA', value: `SA stands for Special Activation, which is used in most of our mods as an alternative way to activate abilities or other features.`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('mpwpanel', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('MPW settings')
            .setDescription("Settings for our mods, including the MPW Library, are located in a special button above the Tools tab!")
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

commands.set('mods', {
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Early access mods')
            .setDescription("List of mods available for specific tiers.")
            .addFields(
                { name: 'Tier 1', value: `Clay Soldiers Mod`, inline: false },
                { name: 'Tier 2', value: `Prostheses Mod 2.0\nPer Pixel Mod\n`, inline: false },
                { name: 'Server booster', value: `Clay Soldiers Mod`, inline: false },
                { name: 'Become a paid subscriber to gain access to the mods.', value: `Patreon -> https://www.patreon.com/intstudio\nBoosty -> https://boosty.to/intstudio`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

client.once('ready', (c) => {
    console.log(`✅ Ready! ${c.user.tag}`);
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    if (message.channelId === TARGET_CHANNEL_ID) {
        const member = message.member;
        const hasPermission = member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

        if (!hasPermission && member?.bannable) {
            try {
                const userId = message.author.id;

                await member.ban({
                    deleteMessageSeconds: 86400,
                    reason: 'Softban: Message in restricted channel.'
                });

                await message.guild.members.unban(userId, 'Softban reset');

                return;
            } catch (e) {
                console.error('Error: Softban.', e);
            }
        }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = commands.get(commandName);
    if (command) {
        try {
            await command.execute(message);
        } catch (error) {
            console.error(`Error in ${commandName}:`, error);
            await message.reply('There was an error executing this command.');
        }
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

    if (addedRoles.size > 0) {
        for (const [roleId, role] of addedRoles) {
            if (SPECIAL_ROLES.hasOwnProperty(roleId)) {
                const roleConfig = SPECIAL_ROLES[roleId as keyof typeof SPECIAL_ROLES];
                const channel = newMember.guild.channels.cache.get(WELCOME_CHANNEL_ID);

                if (channel?.isTextBased()) {
                    const embed = new EmbedBuilder()
                        .setColor(roleConfig.color)
                        .setTitle(`New status: ${roleConfig.name}!`)
                        .setDescription(`Congratulations, ${newMember}! you now have access to **${roleConfig.name}** mods!`)
                        .addFields(
                            {
                                name: 'What to do next:',
                                value: '1. Connect your Steam account to Discord\n-> <#1396606687057809528>.\n\n2. Download mods\n-> <#1463834587334443206>\n\n3. Enjoy the mods!\n\nIf you run into any issues, watch this video\n-> https://www.youtube.com/watch?v=FIESGtB-yhM\nOr read more about problems and solutions here\n-> <#1396763045518114826>'
                            }
                        )
                        .setThumbnail(newMember.user.displayAvatarURL())
                        .setTimestamp();

                    await channel.send({
                        content: `${newMember}`,
                        embeds: [embed]
                    });
                }
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);