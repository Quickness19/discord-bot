import {
    SlashCommandBuilder, ChatInputCommandInteraction, ModalBuilder,
    TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder,
    ChannelType, PermissionFlagsBits, ModalSubmitInteraction
} from 'discord.js';
import { loadDb, saveDb } from './database.js';

export const slashCommandDefinitions = [
    new SlashCommandBuilder()
        .setName('command')
        .setDescription('Manage custom text commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('add').setDescription('Add a new command')
            .addStringOption(opt => opt.setName('id').setDescription('Command ID (without prefix)').setRequired(true)))
        .addSubcommand(sub => sub.setName('edit').setDescription('Edit an existing command')
            .addStringOption(opt => opt.setName('id').setDescription('Command ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all custom commands')),

    new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Manage softban settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('state').setDescription('Toggle softban')
            .addStringOption(opt => opt.setName('state').setDescription('On / Off').setRequired(true).addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })))
        .addSubcommand(sub => sub.setName('channel').setDescription('Set restricted channel')
            .addChannelOption(opt => opt.setName('target').setDescription('Channel to restrict').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('announcement').setDescription('Set announcement channel')
            .addChannelOption(opt => opt.setName('target').setDescription('Where to announce bans').addChannelTypes(ChannelType.GuildText).setRequired(true))),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages in current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(opt => opt.setName('number').setDescription('Amount of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100))
];

export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
    const { commandName } = interaction;
    const db = loadDb();

    if (commandName === 'command') {
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const cmds = Object.keys(db.customCommands);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Custom Commands')
                .setDescription(cmds.length ? cmds.map(c => `• \`i ${c}\``).join('\n') : 'No custom commands yet.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const id = interaction.options.getString('id', true).toLowerCase();

        if (sub === 'add') {
            if (db.customCommands[id]) return interaction.reply({ content: 'Command already exists. Use edit.', ephemeral: true });

            const modal = new ModalBuilder().setCustomId(`modal_cmd_add_${id}`).setTitle(`Add Command: ${id}`);
            const input = new TextInputBuilder().setCustomId('content').setLabel('Command Text').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
            await interaction.showModal(modal);
        }

        if (sub === 'edit') {
            if (!db.customCommands[id]) return interaction.reply({ content: 'Command not found.', ephemeral: true });

            const modal = new ModalBuilder().setCustomId(`modal_cmd_edit_${id}`).setTitle(`Edit Command: ${id}`);
            const input = new TextInputBuilder().setCustomId('content').setLabel('Command Text').setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(db.customCommands[id]);
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
            await interaction.showModal(modal);
        }
    }

    if (commandName === 'softban') {
        const sub = interaction.options.getSubcommand();

        if (sub === 'state') {
            const state = interaction.options.getString('state', true) === 'on';
            db.softban.enabled = state;
            saveDb(db);
            return interaction.reply({ content: `✅ Softban is now **${state ? 'ON' : 'OFF'}**.`, ephemeral: true });
        }

        if (sub === 'channel' || sub === 'announcement') {
            const channel = interaction.options.getChannel('target', true);
            if (sub === 'channel') db.softban.targetChannel = channel.id;
            if (sub === 'announcement') db.softban.announceChannel = channel.id;
            saveDb(db);
            return interaction.reply({ content: `✅ ${sub} channel updated to <#${channel.id}>.`, ephemeral: true });
        }
    }

    if (commandName === 'clear') {
        const amount = interaction.options.getInteger('number', true);
        if (!interaction.channel || !('bulkDelete' in interaction.channel)) return;

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `✅ Deleted **${deleted.size}** messages.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: 'Error clearing messages.', ephemeral: true });
        }
    }
}

export async function handleModal(interaction: ModalSubmitInteraction) {
    if (interaction.customId.startsWith('modal_cmd_')) {
        const parts = interaction.customId.split('_');
        const action = parts[2]; // add or edit
        const id = parts[3];
        const content = interaction.fields.getTextInputValue('content');

        const db = loadDb();
        db.customCommands[id] = content;
        saveDb(db);

        await interaction.reply({ content: `✅ Command \`i ${id}\` has been ${action}ed!`, ephemeral: true });
    }
}