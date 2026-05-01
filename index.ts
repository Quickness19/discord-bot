import {
    Client,
    GatewayIntentBits,
    Partials,
    type Message
} from 'discord.js';
import * as dotenv from 'dotenv';
import { CONFIG } from './config.js';
import { commands } from './commands/handler.js';
import { handleRestrictedChannel } from './events/softban.js';
import { handleRoleUpdate } from './events/supporterWelcome.js';
import { handleAutoReaction } from './events/autoReaction.js';

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

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    await handleRestrictedChannel(message);
    await handleAutoReaction(message);

    if (!message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

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