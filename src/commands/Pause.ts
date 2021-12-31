import { Message } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class Pause implements BaseCommand {
  static command = "pause";
  static aliases = [];
  static usage = "`-pause`";
  static description = "Pauses the current song";

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
    if (this.player.playing) {
      this.player.pause(true);
    }
  }
}
