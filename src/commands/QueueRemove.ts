import { Emoji, LimitedCollection, Message, MessageEmbed } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class QueueRemove implements BaseCommand {
  static command = "queueremove";
  static aliases = ["qrm", "qr"];
  static usage = "`-queueremove <position>`";
  static description = "Removes a track from queue";

  manager: CommandManager;
  player: Player | undefined;

  constructor(private message: Message, private args: string[]) {}
  async execute(): Promise<any> {
    this.player = this.message.client.manager.get(this.message.guild?.id || "");
    if (!this.args.length) throw new InvalidArgsError(QueueRemove.usage);

    if (!this.player)
      throw new AppError("I am currently not playing anything!");

    if (this.player.queue.size === 0) {
      this.message.reply("The queue is empty.");
    }

    const [index] = this.args;
    const parsedIndex = parseInt(index) - 1;
    if (
      parsedIndex > this.player.queue.size ||
      parsedIndex < 0 ||
      isNaN(parsedIndex)
    )
      throw new AppError(
        `Please provide a valid number (between 1 and ${
          this.player.queue.size - 1
        })`
      );

    this.player.queue.remove(parsedIndex);
    this.message.react("👌");
  }
}
