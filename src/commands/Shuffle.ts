import { Message, MessageEmbed } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class Shuffle implements BaseCommand {
  static command = "shuffle";
  static aliases = [];
  static usage = "`-shuffle`";
  static description = "Shuffle the playlist";

  manager: CommandManager;
  player: Player | undefined;

  constructor(private message: Message, private args: string[]) {}
  async execute(): Promise<any> {
    this.player = this.message.client.manager.get(this.message.guild?.id || "");
    if (!this.player)
      throw new AppError("I am currently not playing anything!w");

    const channel = this.message.member?.voice.channel;
    if (!channel)
      throw new AppError("Please join a voice channel to use this command");

    if (channel.id !== this.player.voiceChannel) {
      throw new AppError(
        "You need to be in my voice channel to use this command!"
      );
    }

    if (this.player.queue.size === 0) {
      this.message.reply("No songs to shuffle!");
      this.player.destroy();
    }

    this.player.queue.shuffle();
    this.message.react("🔀");
  }
}
