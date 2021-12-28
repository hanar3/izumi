import "dotenv/config";
import {
  Client,
  Intents,
  Message,
  Guild,
  User,
  VoiceChannel,
  StageChannel,
} from "discord.js";
import {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  createAudioPlayer,
} from "@discordjs/voice";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
import { createDiscordJSAdapter } from "./adapter";
import { PlayCommand } from "./commands/Play";
import { Track } from "./utils/Track";
import { connectToChannel } from "./utils/connectToChannel";
client.once("ready", () => {
  console.log("Ready!");
});

client.on("messageCreate", async (message: Message) => {
  const prefix = "!";
  if (message.content.startsWith(prefix)) {
    const [command, args] = message.content.split(" ");
    switch (command) {
      case "!play":
        const channel = message.member?.voice.channel;
        if (channel) {
          try {
            const connection = await connectToChannel(channel);
            const track = await Track.from(args, {
              async onStart() {
                await message.reply(`Started playing ${track.title}`);
              },

              async onEnqueue(queue) {
                await message.reply(
                  `Queuing ${track.title} at position ${queue.length - 1}`
                );
              },
              onError(err) {
                console.log(err);
              },

              onFinish() {
                console.log("Finished playing track");
              },
            });

            const playCmd = new PlayCommand(track, connection);

            await playCmd.execute();
          } catch (error) {
            console.error(error);
          }
        } else {
          message.channel.send({
            content: `${message.author} please join a voice channel before using !play`,
          });
          return;
        }

        break;
    }
  }
});

client.login(process.env.DISCORD_TOKEN).then(() => console.log("Connected"));
