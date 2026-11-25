import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('./database.json');

export interface CommandAccessRule {
    user: boolean;
    moderator: boolean;
}

export interface CustomButton {
    label: string;
    url: string;
}

export interface CustomSelectOption {
    label: string;
    url: string;
    description?: string;
}

export interface CustomCommand {
    content: string;
    description: string;
    buttons: CustomButton[];
    selectOptions: CustomSelectOption[];
}

export interface RoleNotification {
    roleId: string;
    channelId: string;
    content: string;
    buttons: CustomButton[];
}

export interface Database {
    customCommands: Record<string, CustomCommand>;
    softban: {
        enabled: boolean;
        targetChannel: string | null;
        announceChannel: string | null;
    };
    commandAccess: Record<string, CommandAccessRule>;
    notifications: Record<string, RoleNotification>;
}

const defaultDb: Database = {
    customCommands: {},
    softban: { enabled: true, targetChannel: null, announceChannel: null },
    commandAccess: {},
    notifications: {}
};

let dbCache: Database | null = null;

export function loadDb(): Database {
    if (dbCache) return dbCache;

    if (!fs.existsSync(DB_PATH)) {
        saveDb(structuredClone(defaultDb));
        return dbCache!;
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Partial<Database>;
        const rawCommands = (parsed.customCommands ?? {}) as Record<string, string | Partial<CustomCommand>>;
        const customCommands: Record<string, CustomCommand> = {};

        for (const [key, value] of Object.entries(rawCommands)) {
            if (typeof value === 'string') {
                customCommands[key] = {
                    content: value,
                    description: 'No description',
                    buttons: [],
                    selectOptions: []
                };
            } else if (value && typeof value.content === 'string') {
                customCommands[key] = {
                    content: value.content,
                    description: value.description || 'No description',
                    buttons: Array.isArray(value.buttons) ? value.buttons : [],
                    selectOptions: Array.isArray(value.selectOptions) ? value.selectOptions : []
                };
            }
        }

        dbCache = {
            customCommands,
            softban: parsed.softban ?? { enabled: true, targetChannel: null, announceChannel: null },
            commandAccess: parsed.commandAccess ?? {},
            notifications: parsed.notifications ?? {}
        };
    } catch (error) {
        console.error('[ERROR] Failed to parse database.json, using defaults:', error);
        dbCache = structuredClone(defaultDb);
    }

    return dbCache;
}

export function saveDb(data: Database): void {
    dbCache = data;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}