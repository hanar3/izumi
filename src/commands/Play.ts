import { VoiceConnection } from "@discordjs/voice";
import { Message, StageChannel, VoiceChannel } from "discord.js";
import { Track } from "../utils/Track";
import { ICommand } from "./ICommand";
import { connectToChannel } from "../utils/connectToChannel";

import MusicPlayer from "../utils/MusicPlayer";

export class PlayCommand implements ICommand {
  channel: VoiceChannel | StageChannel | null | undefined;

  constructor(private message: Message, private args: string) {}

  async execute() {
    const channel = this.message.member?.voice.channel;

    if (!channel) {
      // Disallow playing a song if user is not currently on a voice channel
      this.message.channel.send({
        content: `${this.message.author} please join a voice channel before using !play`,
      });
      return;
    }

    const connection = await connectToChannel(channel);

    this.playSong(connection);
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
