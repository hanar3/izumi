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
import { redis } from "../utils/redis";
import { youtube } from "../utils/youtube";
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

  private async search() {
    const query = this.args.join(" ");
    const cachedURL = await redis.get(query);

    if (cachedURL) return cachedURL;

    this.message.reply("Searching for song...");

    const search = await youtube.search.list({
      access_token: process.env.YOUTUBE_API_KEY,
      part: ["id"],
      q: query,
    });

    if (!search.data.items)
      throw new AppError("Search did not retrieve any results");
    let url = "";
    for (const item of search.data.items) {
      if (item.id?.kind === "youtube#video" && item.id?.videoId) {
        url = `https://youtu.be/${item.id.videoId}`;
        break;
      }
    }

    if (!url) throw new AppError("Could not find song " + query);

    await redis.set(query, url);
    return url;
  }

  private async enqueueSong() {
    let url = this.args.join(" ");
    if (!url.startsWith("http")) {
      // If it`s not a link, it`s probably a song title, so search for the link
      url = await this.search();
    }

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
