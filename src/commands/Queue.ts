import { Emoji, LimitedCollection, Message, MessageEmbed } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class Queue implements BaseCommand {
  static command = "queue";
  static aliases = ["q"];
  static usage = "`-queue`";
  static description = "Shows the music queue";

  manager: CommandManager;
  player: Player | undefined;

  constructor(private message: Message, private args: string[]) {}
  async execute(): Promise<any> {
    this.player = this.message.client.manager.get(this.message.guild?.id || "");
    if (!this.player)
      throw new AppError("I am currently not playing anything!");

    if (this.player.queue.size === 0) {
      this.message.reply("The queue is empty.");
    }
    const LIMIT_PER_PAGE = 10;
    const queue = this.player.queue
      .map(
        (track, index) =>
          `${index + 1} - [${track.title}](${track.uri})[${track.requester}]`
      )
      .join("\n");

    const embed = new MessageEmbed().setTitle("Queue").setDescription(queue);
    this.message.reply({ embeds: [embed] });
  }
}
