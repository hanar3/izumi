import { Message } from "discord.js";
import { ICommand } from "../commands/ICommand";
import { PlayCommand } from "../commands/Play";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";

interface Constructable<T extends ICommand> {
  new (...args: any): T;
}

const commandByName: { [key: string]: Constructable<ICommand> } = {
  "!play": PlayCommand,
};

export class CommandManager {
  async execute(message: Message) {
    const prefix = "!";
    if (message.content.startsWith(prefix)) {
      const [command, args] = message.content.split(" ");
      const cmdRef = commandByName[command];
      if (!cmdRef) return;

      try {
        const cmd = new cmdRef(message);
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
}
