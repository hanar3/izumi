import { Message } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { InvalidArgsError } from "../error/InvalidArgsError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class PlayCommand implements BaseCommand {
  static command = "play";
  static aliases = ["p", "pl"];
  static usage = "`-play <url>`";
  static description = "Plays the specified song";

  manager: CommandManager;
  player: Player;
  constructor(private message: Message, private args: string[]) {}

  async execute() {
    const channel = this.message.member?.voice.channel;
    if (!channel) throw new AppError("Please join a voice channel first");

    if (!this.args.length) throw new InvalidArgsError(PlayCommand.usage);

    this.player = this.message.client.manager.create({
      guild: this.message.guild?.id || "",
      voiceChannel: channel.id,
      textChannel: this.message.channel.id,
    });

    if (this.player.state !== "CONNECTED") this.player.connect();
    const search = this.args.join(" ");
    let res;
    try {
      res = await this.player.search(search, this.message.author);
      if (res.loadType === "LOAD_FAILED") {
        if (!this.player.queue.current) this.player.destroy();
        throw res.exception;
      }
    } catch (err) {
      if (!(err instanceof Error)) return;

      return this.message.reply(
        `there was an error while searching: ${err.message}`
      );
    }

    switch (res.loadType) {
      case "NO_MATCHES":
        if (!this.player.queue.current) this.player.destroy();
        return this.message.reply("there were no results found.");
      case "TRACK_LOADED":
        this.player.queue.add(res.tracks[0]);

        if (
          !this.player.playing &&
          !this.player.paused &&
          !this.player.queue.size
        )
          this.player.play();
        return this.message.reply(`enqueuing \`${res.tracks[0].title}\`.`);
      case "PLAYLIST_LOADED":
        this.player.queue.add(res.tracks);

        if (
          !this.player.playing &&
          !this.player.paused &&
          this.player.queue.totalSize === res.tracks.length
        )
          this.player.play();
        return this.message.reply(
          `enqueuing playlist \`${res?.playlist?.name}\` with ${res.tracks.length} tracks.`
        );
      case "SEARCH_RESULT":
        let max = 5;
        if (res.tracks.length < max) max = res.tracks.length;

        const results = res.tracks
          .slice(0, max)
          .map((track, index) => `${++index} - \`${track.title}\``)
          .join("\n");

        this.message.channel.send(results);

        let valid = false;
        do {
          const collected = await this.collectSelection();
          const first = collected?.first()?.content ?? "";

          if (first.toLowerCase() === "end") {
            if (!this.player.queue.current) this.player.destroy();
            this.message.channel.send("Cancelled selection.");
            break;
          }

          const index = Number(first) - 1;
          if (index < 0 || index > max - 1) {
            this.message.reply(
              `the number you provided too small or too big (1-${max}).`
            );
            continue;
          }

          if (isNaN(index)) {
            this.message.reply(`Please provide a valid number (1-${max})`);
            continue;
          }

          valid = true;
          const track = res.tracks[index];
          this.player.queue.add(track);
          if (
            !this.player.playing &&
            !this.player.paused &&
            !this.player.queue.size
          )
            this.player.play();
          return this.message.reply(`enqueuing \`${track.title}\`.`);
        } while (!valid);
    }
  }

  private async collectSelection() {
    try {
      const collected = await this.message.channel.awaitMessages({
        filter: (m) => m.author.id === this.message.author.id,
        max: 1,
        time: 30e3,
        errors: ["time"],
      });

      return collected;
    } catch (e) {
      if (!this.player.queue.current) this.player.destroy();
      this.message.reply("you didn't provide a selection.");
    }
  }
}
