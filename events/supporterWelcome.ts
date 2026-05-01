import {
    EmbedBuilder,
    type GuildMember,
    type PartialGuildMember,
    type TextChannel
} from 'discord.js';
import { CONFIG } from '../config.js';

export async function handleRoleUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
) {
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

    for (const [roleId] of addedRoles) {
        const roleConfig = CONFIG.ROLES.SPECIAL[roleId];

        if (roleConfig) {
            const channel = newMember.guild.channels.cache.get(CONFIG.CHANNELS.WELCOME) as TextChannel;

            if (channel) {
                const embed = new EmbedBuilder()
                    .setColor(roleConfig.color)
                    .setTitle(`New status: ${roleConfig.name}!`)
                    .setThumbnail(newMember.user.displayAvatarURL())
                    .setDescription(`Congratulations ${newMember}! Now you have access to **${roleConfig.name}** mods.`)
                    .addFields({
                        name: 'Next Steps:',
                        value: `1. Connect Steam: <#${CONFIG.CHANNELS.STEAM_CONNECT}>\n2. Download mods: <#${CONFIG.CHANNELS.MOD_LINKS}>\n\n[Watch Tutorial](${CONFIG.LINKS.TUTORIAL_VIDEO}) | FAQ: <#${CONFIG.CHANNELS.FAQ}>`
                    })
                    .setTimestamp();

                await channel.send({ content: `${newMember}`, embeds: [embed] }).catch(console.error);
            }
        }
    }
}