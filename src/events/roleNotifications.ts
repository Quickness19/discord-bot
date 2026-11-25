import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type GuildMember,
    type PartialGuildMember,
    type TextChannel
} from 'discord.js';
import { loadDb } from '../database.js';

export async function handleRoleNotifications(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
) {
    if (oldMember.partial) return;

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    if (addedRoles.size === 0) return;

    const db = loadDb();
    const notifications = Object.values(db.notifications);

    for (const notify of notifications) {
        const addedRole = addedRoles.get(notify.roleId);
        if (!addedRole) continue;

        const channel = newMember.guild.channels.cache.get(notify.channelId) as TextChannel | undefined;
        if (!channel || !channel.isTextBased()) continue;

        let text = notify.content
            .replaceAll('{user}', `${newMember}`)
            .replaceAll('{role}', addedRole.name);

        if (!notify.content.includes('{user}')) {
            text = `${newMember}\n${text}`;
        }

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        if (notify.buttons.length > 0) {
            const buttons = notify.buttons.slice(0, 25);
            for (let i = 0; i < buttons.length; i += 5) {
                const chunk = buttons.slice(i, i + 5);
                rows.push(
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        chunk.map(btn =>
                            new ButtonBuilder()
                                .setLabel(btn.label)
                                .setURL(btn.url)
                                .setStyle(ButtonStyle.Link)
                        )
                    )
                );
            }
        }

        await channel.send({ content: text, components: rows }).catch(console.error);
    }
}