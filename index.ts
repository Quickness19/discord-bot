import {
    Client,
    GatewayIntentBits,
    Message,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    TextChannel
} from 'discord.js';
import * as dotenv from 'dotenv';
import { createHelpEmbed, createInfoEmbed } from './embeds.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Нужно для мута
    ],
});

const prefix = "i";
const TARGET_CHANNEL_ID = '1495753296302837852'; // Замени на ID нужного канала
const ALLOWED_ROLES = ['1167052029605199884', '1263268123574800406']; // Те, кого бот не трогает

client.once('ready', (c) => {
    console.log(`✅ Готово! Авторизован как ${c.user.tag}`);
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;

    //AutoMute
    if (message.channelId === TARGET_CHANNEL_ID) {
        const hasPermission = message.member?.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

        if (!hasPermission) {
            try {
                const duration = 7 * 24 * 60 * 60 * 1000;
                await message.member?.timeout(duration, 'Сообщение в запрещенном канале');

                const messages = await message.channel.messages.fetch({ limit: 100 });
                const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
                const toDelete = messages.filter(m =>
                    m.author.id === message.author.id &&
                    m.createdTimestamp > twoHoursAgo
                );

                if (toDelete.size > 0 && message.channel.isTextBased() && 'bulkDelete' in message.channel) {
                    await message.channel.bulkDelete(toDelete);
                } else {
                    await message.delete().catch(() => null);
                }
                return;
            } catch (e) {
                console.error('Ошибка при муте:', e);
            }
        }
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    //Commands
    if (command === 'mods') {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Help here!')
            .setDescription("Help is here! Read the information below to get an answer to.\nVery detailed information about all potential issues and their solutions: <#1396763045518114826>")
            .addFields(
                { name: 'Very detailed information about all potential issues and their solutions.', value: `<#1396763045518114826>`, inline: true },
                { name: 'Владелец', value: `<@${message.guild?.ownerId}>`, inline: true },
                { name: 'Mods:', value: `fsaf`, inline: false },
            )
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);