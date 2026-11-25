import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('./database.json');

export interface Database {
    customCommands: Record<string, string>;
    softban: {
        enabled: boolean;
        targetChannel: string | null;
        announceChannel: string | null;
    };
}

const defaultDb: Database = {
    customCommands: {},
    softban: { enabled: true, targetChannel: null, announceChannel: null }
};

export function loadDb(): Database {
    if (!fs.existsSync(DB_PATH)) {
        saveDb(defaultDb);
        return defaultDb;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export function saveDb(data: Database) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}