import { Message, Collection } from "discord.js";
import { BaseCommand } from "../commands/BaseCommand";
import { PlayCommand } from "../commands/Play";
import { Pause } from "../commands/Pause";
import { Resume } from "../commands/Resume";

import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";
import { Stop } from "../commands/Stop";
import { Skip } from "../commands/Skip";
import { Shuffle } from "../commands/Shuffle";
import { Help } from "../commands/Help";
import { Queue } from "../commands/Queue";
import { Jump } from "../commands/Jump";
import { QueueRemove } from "../commands/QueueRemove";
interface Constructable<T extends BaseCommand> {
  command: string;
  aliases: string[];
  usage: string;
  description: string;
  new (...args: any): T;
}

export class CommandManager {
  commands: Collection<string, Constructable<BaseCommand>> = new Collection();

  constructor() {
    const commands = [
      PlayCommand,
      Pause,
      Resume,
      Stop,
      Skip,
      Shuffle,
      Queue,
      Jump,
      QueueRemove,
      Help,
    ];
    for (const command of commands) {
      this.commands.set(command.command, command);
    }
  }

  async execute(message: Message) {
    const prefix = "-";
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift()?.toLowerCase() ?? "";

    const cmdRef =
      this.commands.get(commandName) ||
      this.commands.find((cmd) => cmd.aliases.includes(commandName));

    if (!cmdRef) return;

    try {
      const cmd = new cmdRef(message, args);
      cmd.manager = this;
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
