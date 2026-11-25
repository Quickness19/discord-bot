import { REST, Routes } from 'discord.js';
import { slashCommandDefinitions } from './interactions.js';
import * as dotenv from 'dotenv';
dotenv.config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands('1469621059501428736'), { body: slashCommandDefinitions });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();