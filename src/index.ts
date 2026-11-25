import { Client, GatewayIntentBits, Partials, type Message } from 'discord.js';
import * as dotenv from 'dotenv';
import { CONFIG } from './config.js';
import { commands } from './commands/handler.js';
import { handleRestrictedChannel } from './events/softban.js';
import { handleRoleUpdate } from './events/supporterWelcome.js';
import { handleAutoReaction } from './events/autoReaction.js';
import { handleSlashCommand, handleModal } from './interactions.js';
import { loadDb } from './database.js';

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

// Обработка Slash Commands и модальных окон
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
    }
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    await handleRestrictedChannel(message);
    await handleAutoReaction(message);

    if (!message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    // 1. Сначала проверяем динамические команды из базы
    const db = loadDb();
    if (db.customCommands[commandName]) {
        await message.reply(db.customCommands[commandName]);
        return;
    }

    // 2. Затем проверяем хардкод команды из handler.ts
    const command = commands.get(commandName);
    if (command) {
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
});

client.login(process.env.DISCORD_TOKEN);