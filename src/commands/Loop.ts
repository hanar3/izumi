import { Message } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class Pause implements BaseCommand {
  static command = "loop";
  static aliases = [];
  static usage = "`-loop`";
  static description = "Loops the current song";

  manager: CommandManager;
  player: Player | undefined;

  constructor(private message: Message, private args: string[]) {}
  async execute(): Promise<any> {
    this.player = this.message.client.manager.get(this.message.guild?.id || "");
    if (!this.player)
      throw new AppError("I am currently not playing anything!");

    const channel = this.message.member?.voice.channel;
    if (!channel)
      throw new AppError("Please join a voice channel to use this command");

    if (channel.id !== this.player.voiceChannel) {
      throw new AppError(
        "You need to be in my voice channel to use this command!"
      );
    }

    this.player.setQueueRepeat(!this.player.queueRepeat);
    this.message.reply("🔁");
  }
}
