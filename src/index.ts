import { Client, GatewayIntentBits, Partials, type Message } from 'discord.js';
import * as dotenv from 'dotenv';
import { CONFIG } from './config.js';
import { commands } from './commands/handler.js';
import { handleRestrictedChannel } from './events/softban.js';
import { handleRoleUpdate } from './events/supporterWelcome.js';
import { handleAutoReaction } from './events/autoReaction.js';
import { handleRoleNotifications } from './events/roleNotifications.js';
import {
    handleSlashCommand,
    handleMessageContextMenu,
    handleModal,
    handleSelectMenu,
    buildCustomCommandComponents,
    trackCommandMessage
} from './interactions.js';
import { loadDb } from './database.js';
import { canUseCommand } from './permissions.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
    presence: {
        activities: [{ name: 'Creating mods..', type: 0 }],
        status: 'dnd',
    },
});

client.once('ready', (c) => {
    console.log(`✅ ${c.user.tag} is online!`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isMessageContextMenuCommand()) {
        await handleMessageContextMenu(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
    } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
    }
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    await handleRestrictedChannel(message);
    await handleAutoReaction(message);

    const prefixWithSpace = `${CONFIG.PREFIX} `;
    if (!message.content.toLowerCase().startsWith(prefixWithSpace)) return;

    const args = message.content.slice(prefixWithSpace.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const db = loadDb();
    const customCmd = db.customCommands[commandName];
    if (customCmd) {
        if (!canUseCommand(`custom_${commandName}`, message.member)) return;
        const components = buildCustomCommandComponents(commandName, customCmd);
        const sent = await message.reply({
            content: customCmd.content,
            components
        });
        trackCommandMessage(sent.id, commandName);
        return;
    }

    const command = commands.get(commandName);
    if (command) {
        if (!canUseCommand(`cmd_${commandName}`, message.member)) return;
        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            await message.reply('Command execution error.');
        }
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    await handleRoleUpdate(oldMember, newMember);
    await handleRoleNotifications(oldMember, newMember);
});

client.login(process.env.DISCORD_TOKEN);