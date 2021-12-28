import { Message, Collection } from "discord.js";
import { BaseCommand } from "../commands/BaseCommand";
import { PlayCommand } from "../commands/Play";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";

interface Constructable<T extends BaseCommand> {
  command: string;
  aliases: string[];
  new (...args: any): T;
}

const commandByName: { [key: string]: Constructable<BaseCommand> } = {
  "!play": PlayCommand,
};

export class CommandManager {
  commands: Collection<string, Constructable<BaseCommand>> = new Collection();

  constructor() {
    const commands = [PlayCommand];
    for (const command of commands) {
      this.commands.set(command.command, command);
    }
  }

  async execute(message: Message) {
    const prefix = "!";
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift()?.toLowerCase() ?? "";

    const cmdRef =
      this.commands.get(commandName) ||
      this.commands.find((cmd) => cmd.aliases.includes(commandName));

    if (!cmdRef) return;

    try {
      const cmd = new cmdRef(message, args);
      await cmd.execute();
    } catch (err) {
      if (err instanceof AppError) {
        message.reply(err.message);
      }

      if (err instanceof InvalidArgsError) {
        message.reply(`Usage: ${err.usage}`);
      }
    }
  }
}
