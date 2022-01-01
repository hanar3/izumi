import { Emoji, LimitedCollection, Message, MessageEmbed } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class Jump implements BaseCommand {
  static command = "jump";
  static aliases = ["jpm", "j"];
  static usage = "`-jump <position>`";
  static description = "Jump to a track on the queue";

  manager: CommandManager;
  player: Player | undefined;

  constructor(private message: Message, private args: string[]) {}
  async execute(): Promise<any> {
    this.player = this.message.client.manager.get(this.message.guild?.id || "");
    if (!this.args.length) throw new InvalidArgsError(Jump.usage);

    if (!this.player)
      throw new AppError("I am currently not playing anything!");

    if (this.player.queue.size === 0) {
      this.message.reply("The queue is empty.");
    }

    const [index] = this.args;
    const realIndex = parseInt(index) - 1;
    if (realIndex > this.player.queue.size || realIndex < 0 || isNaN(realIndex))
      throw new AppError(
        `Please provide a valid number (between 1 and ${
          this.player.queue.size - 1
        })`
      );

    this.player.stop(realIndex);
    this.message.react("👌");
  }
}
