import {
    GuildMember,
    PermissionFlagsBits,
    type APIInteractionGuildMember,
    type PermissionsBitField
} from 'discord.js';
import { CONFIG } from './config.js';
import { loadDb, saveDb, type CommandAccessRule } from './database.js';

export type AccessRole = 'user' | 'moderator';

export interface CommandMeta {
    id: string;
    name: string;
    description: string;
    defaults: CommandAccessRule;
}

export const BUILTIN_COMMANDS: CommandMeta[] = [
    {
        id: 'slash_command',
        name: '/command',
        description: 'Manage custom commands (add/edit/delete/list)',
        defaults: { user: false, moderator: true }
    },
    {
        id: 'slash_softban',
        name: '/softban',
        description: 'Manage softban settings (state/channel/announcement)',
        defaults: { user: false, moderator: true }
    },
    {
        id: 'slash_clear',
        name: '/clear',
        description: 'Clear messages in the current channel',
        defaults: { user: false, moderator: true }
    },
    {
        id: 'cmd_help',
        name: `${CONFIG.PREFIX} help`,
        description: 'Show the list of commands available to you',
        defaults: { user: true, moderator: true }
    },
    {
        id: 'cmd_clear',
        name: `${CONFIG.PREFIX} clear`,
        description: 'Clear messages in the current channel (prefix command)',
        defaults: { user: false, moderator: true }
    },
    {
        id: 'slash_notify',
        name: '/notify',
        description: 'Manage role notifications (add/edit/delete/list)',
        defaults: { user: false, moderator: true }
    },
];

type MemberLike = GuildMember | APIInteractionGuildMember | null;

function hasRole(member: MemberLike, roleId: string): boolean {
    if (!member) return false;
    if (member instanceof GuildMember) {
        return member.roles.cache.has(roleId);
    }
    if (Array.isArray(member.roles)) {
        return member.roles.includes(roleId);
    }
    return false;
}

export function isAdmin(
    member: MemberLike,
    permissions?: Readonly<PermissionsBitField> | null
): boolean {
    if (permissions?.has(PermissionFlagsBits.Administrator)) return true;
    if (member instanceof GuildMember && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    return hasRole(member, CONFIG.ROLES.INTSTUDIO);
}

export function isModerator(member: MemberLike): boolean {
    return hasRole(member, CONFIG.ROLES.MODERATOR);
}

export function getAllCommands(): CommandMeta[] {
    const db = loadDb();
    const custom: CommandMeta[] = Object.entries(db.customCommands).map(([cmd, data]) => ({
        id: `custom_${cmd}`,
        name: `${CONFIG.PREFIX} ${cmd}`,
        description: data.description || 'No description',
        defaults: { user: true, moderator: true }
    }));

    return [...BUILTIN_COMMANDS, ...custom];
}

export function getCommandAccess(commandId: string): CommandAccessRule | null {
    const meta = getAllCommands().find(c => c.id === commandId);
    if (!meta) return null;

    const db = loadDb();
    return db.commandAccess[commandId] ?? meta.defaults;
}

export function setCommandAccess(commandId: string, role: AccessRole, allowed: boolean): boolean {
    const current = getCommandAccess(commandId);
    if (!current) return false;

    const db = loadDb();
    db.commandAccess[commandId] = {
        ...current,
        [role]: allowed
    };
    saveDb(db);
    return true;
}

export function canUseCommand(
    commandId: string,
    member: MemberLike,
    permissions?: Readonly<PermissionsBitField> | null
): boolean {
    if (isAdmin(member, permissions)) return true;

    const access = getCommandAccess(commandId);
    if (!access) return false;

    if (isModerator(member)) {
        return access.moderator;
    }

    return access.user;
}