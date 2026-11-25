import { REST, Routes } from 'discord.js';
import { slashCommandDefinitions } from './interactions.js';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID || '1469621059501428736';

if (!token) {
    throw new Error('DISCORD_TOKEN is missing in .env');
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(clientId), { body: slashCommandDefinitions });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();