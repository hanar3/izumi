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
client.once("ready", () => {
  console.log("Ready!");
});

client.on("guildCreate", (event) => {
  console.log(event.voiceAdapterCreator);
});

async function connectToChannel(channel: VoiceChannel | StageChannel) {
  /**
   * Here, we try to establish a connection to a voice channel. If we're already connected
   * to this voice channel, @discordjs/voice will just return the existing connection for us!
   */
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: createDiscordJSAdapter(channel),
  });

  /**
   * If we're dealing with a connection that isn't yet Ready, we can set a reasonable
   * time limit before giving up. In this example, we give the voice connection 30 seconds
   * to enter the ready state before giving up.
   */
  try {
    /**
     * Allow ourselves 30 seconds to join the voice channel. If we do not join within then,
     * an error is thrown.
     */
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
    /**
     * At this point, the voice connection is ready within 30 seconds! This means we can
     * start playing audio in the voice channel. We return the connection so it can be
     * used by the caller.
     */
    return connection;
  } catch (error) {
    /**
     * At this point, the voice connection has not entered the Ready state. We should make
     * sure to destroy it, and propagate the error by throwing it, so that the calling function
     * is aware that we failed to connect to the channel.
     */
    connection.destroy();
    throw error;
  }
}
const player = createAudioPlayer();

function playSong() {
  /**
   * Here we are creating an audio resource using a sample song freely available online
   * (see https://www.soundhelix.com/audio-examples)
   *
   * We specify an arbitrary inputType. This means that we aren't too sure what the format of
   * the input is, and that we'd like to have this converted into a format we can use. If we
   * were using an Ogg or WebM source, then we could change this value. However, for now we
   * will leave this as arbitrary.
   */
  const resource = createAudioResource(
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    {
      inputType: StreamType.Arbitrary,
    }
  );

  /**
   * We will now play this to the audio player. By default, the audio player will not play until
   * at least one voice connection is subscribed to it, so it is fine to attach our resource to the
   * audio player this early.
   */
  player.play(resource);

  /**
'   * Here we are using a helper function. It will resolve if the player enters the Playing
'   * state within 5 seconds, otherwise it will reject with an error.
   */
  return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

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
            const track = await Track.from(
              "https://www.youtube.com/watch?v=r66UzB0WuGo",
              {
                onStart() {
                  console.log("Started playing track: ", track.title);
                },
                onError(err) {
                  console.log(err);
                },

                onFinish() {
                  console.log("Finished playing track");
                },
              }
            );

            const playCmd = new PlayCommand(track, connection);

            await playCmd.execute();
            await message.reply("Playing now!");
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
