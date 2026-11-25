import {
    SlashCommandBuilder,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ChannelType,
    MessageFlags,
    type ChatInputCommandInteraction,
    type MessageContextMenuCommandInteraction,
    type ModalSubmitInteraction,
    type StringSelectMenuInteraction,
    type MessageActionRowComponentBuilder
} from 'discord.js';
import { CONFIG } from './config.js';
import {
    loadDb,
    saveDb,
    type CustomButton,
    type CustomSelectOption,
    type CustomCommand
} from './database.js';
import {
    isAdmin,
    canUseCommand,
    getAllCommands,
    getCommandAccess,
    setCommandAccess,
    type AccessRole
} from './permissions.js';

const sentCommandMessages = new Map<string, string>();
const pendingNotifyModals = new Map<
    string,
    { action: 'add' | 'edit'; id: string; roleId: string; channelId: string }
>();

export function trackCommandMessage(messageId: string, commandId: string): void {
    sentCommandMessages.set(messageId, commandId);
    if (sentCommandMessages.size > 1000) {
        const oldestKey = sentCommandMessages.keys().next().value;
        if (oldestKey) sentCommandMessages.delete(oldestKey);
    }
}

function isValidHttpUrl(raw: string): boolean {
    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function parseButtonsInput(raw: string): CustomButton[] {
    const result: CustomButton[] = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split('|').map(p => p.trim());
        const label = parts[0];
        const url = parts[1];

        if (label && url && isValidHttpUrl(url)) {
            result.push({ label: label.slice(0, 80), url });
        }
    }
    return result.slice(0, 25);
}

function parseSelectInput(raw: string): CustomSelectOption[] {
    const result: CustomSelectOption[] = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split('|').map(p => p.trim());
        const label = parts[0];
        const url = parts[1];
        const description = parts[2];

        if (label && url && isValidHttpUrl(url)) {
            const option: CustomSelectOption = {
                label: label.slice(0, 100),
                url
            };
            if (description) {
                option.description = description.slice(0, 100);
            }
            result.push(option);
        }
    }
    return result.slice(0, 25);
}

function formatButtonsForModal(buttons: CustomButton[]): string {
    return buttons.map(b => `${b.label} | ${b.url}`).join('\n');
}

function formatSelectForModal(options: CustomSelectOption[]): string {
    return options
        .map(o => (o.description ? `${o.label} | ${o.url} | ${o.description}` : `${o.label} | ${o.url}`))
        .join('\n');
}

function buildEditCommandModal(customId: string, commandId: string, existing: CustomCommand): ModalBuilder {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(`Edit Command: ${commandId}`);
    const descInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Description (shown in i help)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(existing.description);
    const contentInput = new TextInputBuilder()
        .setCustomId('content')
        .setLabel('Command Response Text')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(existing.content);
    const buttonsInput = new TextInputBuilder()
        .setCustomId('buttons')
        .setLabel('Link Buttons (one per line: Label | URL)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(formatButtonsForModal(existing.buttons));
    const selectInput = new TextInputBuilder()
        .setCustomId('select_options')
        .setLabel('Select Menu (Label | URL | Description)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(formatSelectForModal(existing.selectOptions));

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(buttonsInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(selectInput)
    );

    return modal;
}

export function buildCustomCommandComponents(
    commandId: string,
    cmd: CustomCommand
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
    const hasSelect = cmd.selectOptions.length > 0;
    const maxButtonRows = hasSelect ? 4 : 5;

    if (cmd.buttons.length > 0) {
        const maxButtons = maxButtonRows * 5;
        const buttons = cmd.buttons.slice(0, maxButtons);

        for (let i = 0; i < buttons.length; i += 5) {
            const chunk = buttons.slice(i, i + 5);
            const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                chunk.map(btn =>
                    new ButtonBuilder()
                        .setLabel(btn.label)
                        .setURL(btn.url)
                        .setStyle(ButtonStyle.Link)
                )
            );
            rows.push(row);
        }
    }

    if (hasSelect) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId(`custom_select_${commandId}`)
            .setPlaceholder('Select an option...')
            .addOptions(
                cmd.selectOptions.slice(0, 25).map((opt, idx) => {
                    const builder = new StringSelectMenuOptionBuilder()
                        .setLabel(opt.label)
                        .setValue(String(idx));
                    if (opt.description) {
                        builder.setDescription(opt.description);
                    }
                    return builder;
                })
            );

        rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu));
    }

    return rows;
}

export const slashCommandDefinitions = [
    new ContextMenuCommandBuilder()
        .setName('Edit')
        .setType(ApplicationCommandType.Message),

    new SlashCommandBuilder()
        .setName('command')
        .setDescription('Manage custom text commands')
        .addSubcommand(sub => sub.setName('add').setDescription('Add a new custom command')
            .addStringOption(opt => opt.setName('id').setDescription('Command ID (no prefix or spaces)').setRequired(true)))
        .addSubcommand(sub => sub.setName('edit').setDescription('Edit an existing command, its description, buttons and select menu')
            .addStringOption(opt => opt.setName('id').setDescription('Command ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a custom command')
            .addStringOption(opt => opt.setName('id').setDescription('Command ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all custom commands')),

    new SlashCommandBuilder()
        .setName('notify')
        .setDescription('Manage role notifications')
        .addSubcommand(sub => sub.setName('add').setDescription('Add a new role notification')
            .addStringOption(opt => opt.setName('id').setDescription('Notification ID (no spaces)').setRequired(true))
            .addRoleOption(opt => opt.setName('role').setDescription('Role that triggers the notification').setRequired(true))
            .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send the notification').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('edit').setDescription('Edit an existing role notification')
            .addStringOption(opt => opt.setName('id').setDescription('Notification ID').setRequired(true))
            .addRoleOption(opt => opt.setName('role').setDescription('New role (optional)').setRequired(false))
            .addChannelOption(opt => opt.setName('channel').setDescription('New channel (optional)').addChannelTypes(ChannelType.GuildText).setRequired(false)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a role notification')
            .addStringOption(opt => opt.setName('id').setDescription('Notification ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all role notifications')),

    new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Manage role permissions for commands (Admins only)')
        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('Show access permissions for all commands'))
        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Grant command access to a role')
            .addStringOption(opt => opt.setName('id').setDescription('Unique command ID (from /permissions list)').setRequired(true))
            .addStringOption(opt => opt.setName('role').setDescription('Role').setRequired(true).addChoices(
                { name: 'User', value: 'user' },
                { name: 'Moderator', value: 'moderator' }
            )))
        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Revoke command access from a role')
            .addStringOption(opt => opt.setName('id').setDescription('Unique command ID (from /permissions list)').setRequired(true))
            .addStringOption(opt => opt.setName('role').setDescription('Role').setRequired(true).addChoices(
                { name: 'User', value: 'user' },
                { name: 'Moderator', value: 'moderator' }
            ))),

    new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Manage softban settings')
        .addSubcommand(sub => sub.setName('state').setDescription('Toggle softban on or off')
            .addStringOption(opt => opt.setName('state').setDescription('On / Off').setRequired(true).addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })))
        .addSubcommand(sub => sub.setName('channel').setDescription('Set the restricted channel')
            .addChannelOption(opt => opt.setName('target').setDescription('Channel to restrict').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('announcement').setDescription('Set the softban log channel')
            .addChannelOption(opt => opt.setName('target').setDescription('Where to announce softbans').addChannelTypes(ChannelType.GuildText).setRequired(true))),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages in the current channel')
        .addIntegerOption(opt => opt.setName('number').setDescription('Amount of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100))
];

export async function handleMessageContextMenu(interaction: MessageContextMenuCommandInteraction) {
    if (interaction.commandName !== 'Edit') return;

    if (!canUseCommand('slash_command', interaction.member, interaction.memberPermissions)) {
        return interaction.reply({
            content: '❌ You do not have permission to edit commands.',
            flags: MessageFlags.Ephemeral
        });
    }

    const targetMessage = interaction.targetMessage;
    if (targetMessage.author.id !== interaction.client.user.id) {
        return interaction.reply({
            content: '❌ You can only edit messages sent by this bot.',
            flags: MessageFlags.Ephemeral
        });
    }

    let commandId = sentCommandMessages.get(targetMessage.id);

    if (!commandId && targetMessage.reference?.messageId) {
        try {
            const refMessage = await targetMessage.fetchReference();
            const prefixWithSpace = `${CONFIG.PREFIX} `;
            if (refMessage.content.toLowerCase().startsWith(prefixWithSpace)) {
                commandId = refMessage.content
                    .slice(prefixWithSpace.length)
                    .trim()
                    .split(/ +/)[0]
                    ?.toLowerCase();
            }
        } catch {
            // Original user message was deleted or inaccessible
        }
    }

    if (!commandId) {
        return interaction.reply({
            content: '❌ Could not identify a custom command for this message.',
            flags: MessageFlags.Ephemeral
        });
    }

    const db = loadDb();
    const existing = db.customCommands[commandId];
    if (!existing) {
        return interaction.reply({
            content: `❌ Custom command \`${commandId}\` no longer exists.`,
            flags: MessageFlags.Ephemeral
        });
    }

    const modal = buildEditCommandModal(`modal_cmd_editmsg_${targetMessage.id}_${commandId}`, commandId, existing);
    await interaction.showModal(modal);
}

export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
    const { commandName } = interaction;
    const db = loadDb();

    if (commandName === 'notify') {
        if (!canUseCommand('slash_notify', interaction.member, interaction.memberPermissions)) {
            return interaction.reply({
                content: '❌ You do not have permission to manage notifications.',
                flags: MessageFlags.Ephemeral
            });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const entries = Object.entries(db.notifications);
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🔔 Role Notifications')
                .setDescription(
                    entries.length
                        ? entries
                            .map(([id, n]) => `• \`${id}\` | Role: <@&${n.roleId}> | Channel: <#${n.channelId}>`)
                            .join('\n')
                        : 'No role notifications configured yet.'
                );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const id = interaction.options.getString('id', true).trim().toLowerCase();

        if (sub === 'add') {
            if (/\s/.test(id)) {
                return interaction.reply({ content: 'Notification ID cannot contain spaces.', flags: MessageFlags.Ephemeral });
            }
            if (db.notifications[id]) {
                return interaction.reply({ content: 'Notification already exists. Use `/notify edit`.', flags: MessageFlags.Ephemeral });
            }

            const role = interaction.options.getRole('role', true);
            const channel = interaction.options.getChannel('channel', true);

            pendingNotifyModals.set(interaction.user.id, {
                action: 'add',
                id,
                roleId: role.id,
                channelId: channel.id
            });

            const modal = new ModalBuilder()
                .setCustomId('modal_notify_submit')
                .setTitle(`Add Notification: ${id}`);

            const contentInput = new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Message ({user} = ping, {role} = role name)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setPlaceholder('Welcome {user}! You now have access to {role}.');

            const buttonsInput = new TextInputBuilder()
                .setCustomId('buttons')
                .setLabel('Link Buttons (optional: Label | URL)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setPlaceholder('Download | https://steamcommunity.com/...');

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(buttonsInput)
            );
            await interaction.showModal(modal);
        }

        if (sub === 'edit') {
            const existing = db.notifications[id];
            if (!existing) {
                return interaction.reply({ content: 'Notification not found.', flags: MessageFlags.Ephemeral });
            }

            const role = interaction.options.getRole('role', false);
            const channel = interaction.options.getChannel('channel', false);

            pendingNotifyModals.set(interaction.user.id, {
                action: 'edit',
                id,
                roleId: role?.id ?? existing.roleId,
                channelId: channel?.id ?? existing.channelId
            });

            const modal = new ModalBuilder()
                .setCustomId('modal_notify_submit')
                .setTitle(`Edit Notification: ${id}`);

            const contentInput = new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Message ({user} = ping, {role} = role name)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue(existing.content);

            const buttonsInput = new TextInputBuilder()
                .setCustomId('buttons')
                .setLabel('Link Buttons (optional: Label | URL)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setValue(formatButtonsForModal(existing.buttons));

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(buttonsInput)
            );
            await interaction.showModal(modal);
        }

        if (sub === 'delete') {
            if (!db.notifications[id]) {
                return interaction.reply({ content: 'Notification not found.', flags: MessageFlags.Ephemeral });
            }

            delete db.notifications[id];
            saveDb(db);
            return interaction.reply({ content: `✅ Notification \`${id}\` has been deleted.`, flags: MessageFlags.Ephemeral });
        }
    }

    if (commandName === 'permissions') {
        if (!isAdmin(interaction.member, interaction.memberPermissions)) {
            return interaction.reply({
                content: '❌ Only administrators can manage command permissions.',
                flags: MessageFlags.Ephemeral
            });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const lines = getAllCommands().map(cmd => {
                const access = getCommandAccess(cmd.id)!;
                const userIcon = access.user ? '✅' : '❌';
                const modIcon = access.moderator ? '✅' : '❌';
                return `\`${cmd.id}\` | **${cmd.name}** | User: ${userIcon} | Moderator: ${modIcon}`;
            });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🔐 Command Permissions')
                .setDescription(lines.join('\n'))
                .setFooter({ text: 'Administrators always have access to all commands' });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const id = interaction.options.getString('id', true).trim().toLowerCase();
        const role = interaction.options.getString('role', true) as AccessRole;
        const roleLabel = role === 'user' ? 'User' : 'Moderator';
        const allow = sub === 'add';

        if (!setCommandAccess(id, role, allow)) {
            return interaction.reply({
                content: `❌ Command with ID \`${id}\` was not found. Check \`/permissions list\`.`,
                flags: MessageFlags.Ephemeral
            });
        }

        return interaction.reply({
            content: allow
                ? `✅ Granted **${roleLabel}** access to \`${id}\`.`
                : `✅ Revoked **${roleLabel}** access from \`${id}\`.`,
            flags: MessageFlags.Ephemeral
        });
    }

    if (commandName === 'command') {
        if (!canUseCommand('slash_command', interaction.member, interaction.memberPermissions)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const entries = Object.entries(db.customCommands);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Custom Commands')
                .setDescription(
                    entries.length
                        ? entries.map(([cmd, data]) => `• \`i ${cmd}\`: ${data.description}`).join('\n')
                        : 'No custom commands yet.'
                );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const id = interaction.options.getString('id', true).trim().toLowerCase();

        if (sub === 'add') {
            if (/\s/.test(id)) {
                return interaction.reply({ content: 'Command ID cannot contain spaces.', flags: MessageFlags.Ephemeral });
            }
            if (db.customCommands[id]) {
                return interaction.reply({ content: 'Command already exists. Use `/command edit`.', flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder().setCustomId(`modal_cmd_add_${id}`).setTitle(`Add Command: ${id}`);
            const descInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description (shown in i help)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('Short command description');
            const contentInput = new TextInputBuilder()
                .setCustomId('content')
                .setLabel('Command Response Text')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            const buttonsInput = new TextInputBuilder()
                .setCustomId('buttons')
                .setLabel('Link Buttons (one per line: Label | URL)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setPlaceholder('Patreon | https://patreon.com/...\nSteam | https://steamcommunity.com/...');
            const selectInput = new TextInputBuilder()
                .setCustomId('select_options')
                .setLabel('Select Menu (Label | URL | Description)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setPlaceholder('Prostheses Mod | https://... | Tier 2 Early Access');

            modal.addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(buttonsInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(selectInput)
            );
            await interaction.showModal(modal);
        }

        if (sub === 'edit') {
            const existing = db.customCommands[id];
            if (!existing) {
                return interaction.reply({ content: 'Command not found.', flags: MessageFlags.Ephemeral });
            }

            const modal = buildEditCommandModal(`modal_cmd_edit_${id}`, id, existing);
            await interaction.showModal(modal);
        }

        if (sub === 'delete') {
            if (!db.customCommands[id]) {
                return interaction.reply({ content: 'Command not found.', flags: MessageFlags.Ephemeral });
            }

            delete db.customCommands[id];
            delete db.commandAccess[`custom_${id}`];
            saveDb(db);
            return interaction.reply({ content: `✅ Command \`i ${id}\` has been deleted.`, flags: MessageFlags.Ephemeral });
        }
    }

    if (commandName === 'softban') {
        if (!canUseCommand('slash_softban', interaction.member, interaction.memberPermissions)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'state') {
            const state = interaction.options.getString('state', true) === 'on';
            db.softban.enabled = state;
            saveDb(db);
            return interaction.reply({ content: `✅ Softban is now **${state ? 'ON' : 'OFF'}**.`, flags: MessageFlags.Ephemeral });
        }

        if (sub === 'channel' || sub === 'announcement') {
            const channel = interaction.options.getChannel('target', true);
            if (sub === 'channel') db.softban.targetChannel = channel.id;
            if (sub === 'announcement') db.softban.announceChannel = channel.id;
            saveDb(db);
            return interaction.reply({ content: `✅ ${sub} channel updated to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
        }
    }

    if (commandName === 'clear') {
        if (!canUseCommand('slash_clear', interaction.member, interaction.memberPermissions)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }

        const amount = interaction.options.getInteger('number', true);
        if (!interaction.channel || !('bulkDelete' in interaction.channel)) return;

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `✅ Deleted **${deleted.size}** messages.`, flags: MessageFlags.Ephemeral });
        } catch {
            await interaction.reply({ content: 'Error clearing messages.', flags: MessageFlags.Ephemeral });
        }
    }
}

export async function handleModal(interaction: ModalSubmitInteraction) {
    if (interaction.customId === 'modal_notify_submit') {
        if (!canUseCommand('slash_notify', interaction.member, interaction.memberPermissions)) {
            return interaction.reply({
                content: '❌ You do not have permission to perform this action.',
                flags: MessageFlags.Ephemeral
            });
        }

        const pending = pendingNotifyModals.get(interaction.user.id);
        pendingNotifyModals.delete(interaction.user.id);

        if (!pending) {
            return interaction.reply({
                content: '❌ Session expired. Please run `/notify` again.',
                flags: MessageFlags.Ephemeral
            });
        }

        const content = interaction.fields.getTextInputValue('content');
        const buttons = parseButtonsInput(interaction.fields.getTextInputValue('buttons'));

        const db = loadDb();
        db.notifications[pending.id] = {
            roleId: pending.roleId,
            channelId: pending.channelId,
            content,
            buttons
        };
        saveDb(db);

        return interaction.reply({
            content: `✅ Notification \`${pending.id}\` has been ${pending.action === 'add' ? 'added' : 'updated'}! (Role: <@&${pending.roleId}>, Channel: <#${pending.channelId}>)`,
            flags: MessageFlags.Ephemeral
        });
    }

    if (!canUseCommand('slash_command', interaction.member, interaction.memberPermissions)) {
        return interaction.reply({
            content: '❌ You do not have permission to perform this action.',
            flags: MessageFlags.Ephemeral
        });
    }

    if (interaction.customId.startsWith('modal_cmd_editmsg_')) {
        const rest = interaction.customId.slice('modal_cmd_editmsg_'.length);
        const separatorIndex = rest.indexOf('_');
        if (separatorIndex === -1) return;

        const messageId = rest.slice(0, separatorIndex);
        const id = rest.slice(separatorIndex + 1);
        if (!messageId || !id) return;

        const description = interaction.fields.getTextInputValue('description').trim() || 'No description';
        const content = interaction.fields.getTextInputValue('content');
        const buttons = parseButtonsInput(interaction.fields.getTextInputValue('buttons'));
        const selectOptions = parseSelectInput(interaction.fields.getTextInputValue('select_options'));

        const updatedCmd: CustomCommand = { content, description, buttons, selectOptions };
        const db = loadDb();
        db.customCommands[id] = updatedCmd;
        saveDb(db);

        let messageUpdated = false;
        if (interaction.channel && 'messages' in interaction.channel) {
            try {
                const targetMsg = await interaction.channel.messages.fetch(messageId);
                await targetMsg.edit({
                    content: updatedCmd.content,
                    components: buildCustomCommandComponents(id, updatedCmd)
                });
                messageUpdated = true;
            } catch (error) {
                console.error('[ERROR] Failed to edit bot message:', error);
            }
        }

        await interaction.reply({
            content: messageUpdated
                ? `✅ Command \`i ${id}\` and the message have been updated!`
                : `✅ Command \`i ${id}\` has been updated, but the original message could not be edited.`,
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (interaction.customId.startsWith('modal_cmd_')) {
        const parts = interaction.customId.split('_');
        const action = parts[2];
        const id = parts.slice(3).join('_');

        if (!action || !id) return;

        const description = interaction.fields.getTextInputValue('description').trim() || 'No description';
        const content = interaction.fields.getTextInputValue('content');
        const buttons = parseButtonsInput(interaction.fields.getTextInputValue('buttons'));
        const selectOptions = parseSelectInput(interaction.fields.getTextInputValue('select_options'));

        const db = loadDb();
        db.customCommands[id] = { content, description, buttons, selectOptions };
        saveDb(db);

        await interaction.reply({
            content: `✅ Command \`i ${id}\` has been ${action === 'add' ? 'added' : 'updated'}! (Buttons: ${buttons.length}, Select options: ${selectOptions.length})`,
            flags: MessageFlags.Ephemeral
        });
    }
}

export async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
    if (!interaction.customId.startsWith('custom_select_')) return;

    const commandId = interaction.customId.slice('custom_select_'.length);
    const selectedIndex = parseInt(interaction.values[0] ?? '', 10);

    const db = loadDb();
    const cmd = db.customCommands[commandId];
    const option = !isNaN(selectedIndex) ? cmd?.selectOptions[selectedIndex] : undefined;

    if (!option) {
        return interaction.reply({
            content: '❌ This option is no longer available.',
            flags: MessageFlags.Ephemeral
        });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel(`Open: ${option.label}`.slice(0, 80))
            .setURL(option.url)
            .setStyle(ButtonStyle.Link)
    );

    const text = option.description
        ? `**${option.label}**\n${option.description}`
        : `**${option.label}**`;

    await interaction.reply({
        content: text,
        components: [row],
        flags: MessageFlags.Ephemeral
    });
}