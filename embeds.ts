import { EmbedBuilder, Client, Message } from 'discord.js';

export const createHelpEmbed = (client: Client) => {
    return new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📚 Список команд')
        .setDescription('Префикс для всех команд: `i`')
        .addFields(
            { name: '`iping`', value: 'Проверить бота', inline: true },
            { name: '`iinfo`', value: 'Инфо о сервере', inline: true }
        )
        .setThumbnail(client.user?.displayAvatarURL() || null)
        .setTimestamp();
};

export const createInfoEmbed = (message: Message) => {
    return new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`Сервер: ${message.guild?.name}`)
        .setThumbnail(message.guild?.iconURL() || null)
        .addFields(
            { name: '👤 Участников', value: `${message.guild?.memberCount}`, inline: true },
            { name: '📅 Создан', value: `${message.guild?.createdAt.toLocaleDateString()}`, inline: true }
        );
};