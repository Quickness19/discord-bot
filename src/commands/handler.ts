import { type Message, Collection, EmbedBuilder } from 'discord.js';
import { canUseCommand, getAllCommands } from '../permissions.js';

interface BotCommand {
    execute: (message: Message, args: string[]) => Promise<void>;
}

export const commands = new Collection<string, BotCommand>();

commands.set('help', {
    execute: async (message) => {
        const available = getAllCommands().filter(cmd => canUseCommand(cmd.id, message.member));

        const description = available.length
            ? available.map(cmd => `\`${cmd.name}\`: ${cmd.description}`).join('\n')
            : 'No commands available.';

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📋 Available Commands')
            .setDescription(description)
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
});

commands.set('clear', {
    execute: async (message, args) => {
        if (!message.channel.isTextBased() || message.channel.isDMBased() || !('bulkDelete' in message.channel)) return;

        const amount = parseInt(args[0] ?? '', 10);

        const sendTempReply = async (text: string) => {
            const reply = await message.reply(text);
            setTimeout(() => reply.delete().catch(() => { }), 5000);
        };

        if (isNaN(amount) || amount <= 0) {
            return sendTempReply('Please specify a number of messages greater than 0 — Example: `i clear 10`');
        }

        const deleteCount = Math.min(amount, 99);

        try {
            const deleted = await message.channel.bulkDelete(deleteCount + 1, true);
            const removed = Math.max(0, deleted.size - 1);
            const successMsg = await message.channel.send(`✅ Deleted — **${removed}** messages.`);
            setTimeout(() => successMsg.delete().catch(() => { }), 3000);
        } catch (error) {
            console.error('[CLEAR COMMAND] Error:', error);
            await sendTempReply('Error — messages older than 14 days cannot be bulk deleted.');
        }
    }
});