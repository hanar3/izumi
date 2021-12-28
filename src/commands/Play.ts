import { VoiceConnection } from "@discordjs/voice";
import { Message, StageChannel, VoiceChannel } from "discord.js";
import { Track } from "../utils/Track";
import { ICommand } from "./ICommand";
import { connectToChannel } from "../utils/connectToChannel";

import MusicPlayer from "../utils/MusicPlayer";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";

export class PlayCommand implements ICommand {
  static usage = "`!play <url>`";

  constructor(private message: Message, private args: string) {}

  async execute() {
    if (!this.args) throw new InvalidArgsError(PlayCommand.usage);

    const connection = await this.joinVoiceChannel();
    this.playSong(connection);
  }

  private async joinVoiceChannel(): Promise<VoiceConnection> {
    const channel = this.message.member?.voice.channel;

    if (!channel) {
      // Disallow playing a song if user is not currently on a voice channel
      throw new AppError("Please join a voice channel first");
    }

    const connection = await connectToChannel(channel);

    return connection;
  }

  private async playSong(connection: VoiceConnection) {
    const track = await Track.from(this.args, {
      onStart: async () => {
        await this.message.reply(`Started playing ${track.title}`);
      },
      onEnqueue: async (queue: Track[]) => {
        await this.message.reply(
          `Queuing ${track.title} at position ${queue.length - 1}`
        );
      },

      onFinish: async () => {
        console.log("Finished playing song");
      },

      onError: async (error) => {
        await this.message.reply(
          `Something went wrong trying to play ${track.title}`
        );
      },
    });
    MusicPlayer.setVoiceConnection(connection);
    MusicPlayer.enqueue(track);
  }
}
