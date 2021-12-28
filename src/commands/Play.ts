import { VoiceConnection } from "@discordjs/voice";
import {
  CommandInteractionOptionResolver,
  Message,
  StageChannel,
  VoiceChannel,
} from "discord.js";
import { Track } from "../utils/Track";
import { BaseCommand } from "./BaseCommand";
import { connectToChannel } from "../utils/connectToChannel";

import MusicPlayer from "../utils/MusicPlayer";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";
import ytsr from "ytsr";
import { CommandManager } from "../managers/CommandManager";
export class PlayCommand implements BaseCommand {
  static command = "play";
  static aliases = ["p", "pl"];
  static usage = "`!play <url>`";
  static description = "Plays the specified song";

  manager: CommandManager;

  constructor(private message: Message, private args: string[]) {}

  async execute() {
    if (!this.args.length) throw new InvalidArgsError(PlayCommand.usage);

    await this.enqueueSong();
    const connection = await this.joinVoiceChannel();
    MusicPlayer.setVoiceConnection(connection);
    MusicPlayer.subscribeVoiceConnection();
  }

  private async joinVoiceChannel(): Promise<VoiceConnection> {
    const channel = this.message.member?.voice.channel;

    if (!channel) {
      // Disallow playing a song if user is not currently on a voice channel
      MusicPlayer.stop();
      throw new AppError("Please join a voice channel first");
    }

    const connection = await connectToChannel(channel);

    return connection;
  }

  private async enqueueSong() {
    let resourceToPlay = this.args.join(" ");
    let url = resourceToPlay;

    if (!url.startsWith("http")) {
      url = "";

      const filters = await ytsr.getFilters(resourceToPlay);

      if (filters) {
        const filteredUrl = filters?.get("Type")?.get("Video")?.url;
        if (!filteredUrl) throw new AppError("Could not build filter url");
        const { items } = await ytsr(filteredUrl, { limit: 10 });
        console.log({ items });
        for (const item of items) {
          if (item.type === `video`) {
            url = item.url;
            break;
          }
        }
      }
    }

    if (!url) throw new AppError("Could not find a link to this song");
    console.log({ url: resourceToPlay });

    const track = await this.createTrack(url);
    MusicPlayer.enqueue(track);
  }

  async createTrack(url: string) {
    const track = await Track.from(url, {
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
    return track;
  }
}
