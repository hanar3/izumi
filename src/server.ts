import "dotenv/config";
import {
  Client,
  Intents,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js";
import { Manager } from "erela.js";
import { redis } from "./utils/redis";
import { CommandManager } from "./managers/CommandManager";
import Spotify from "erela.js-spotify";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.manager = new Manager({
  plugins: [
    new Spotify({
      clientID: process.env.SPOTIFY_CL_ID || "",
      clientSecret: process.env.SPOTIFY_CL_SECRET || "",
    }),
  ],
  nodes: [
    {
      host: "localhost",
      port: 2333,
      password: "youshallnotpass",
    },
  ],

  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
})
  .on("nodeConnect", (node) =>
    console.log(`Node ${node.options.identifier} connected`)
  )
  .on("nodeError", (node, error) =>
    console.log(
      `Node ${node.options.identifier} had an error: ${error.message}`
    )
  )
  .on("trackStart", (player, track) => {
    if (!player.textChannel) {
      console.log("Player text channel is undefined");
      return;
    }

    const textChannel = client.channels.cache.get(
      player.textChannel
    ) as TextChannel;

    if (!textChannel) {
      return;
    }
    const embed = new MessageEmbed()
      .setThumbnail(
        `https://img.youtube.com/vi/${player.queue.current.identifier}/mqdefault.jpg`
      )
      .setURL(player?.queue?.current?.uri ?? "")
      .setTitle(`**${player.queue?.current?.title}**`)
      .addField(` Duration: `, `\`${player.queue?.current?.duration}\``, true)
      .addField(`Song By: `, `\`${player.queue?.current?.author}\``, true)
      .addField(` Queue length: `, `\`${player.queue.length} Songs\``, true)
      .setFooter(`Requested by: ${player.queue.current?.requester}`);
    textChannel.send({ embeds: [embed] });
  })
  .on("queueEnd", (player) => {
    if (!player.textChannel) {
      console.log("Player text channel is undefined");
      return;
    }

    const textChannel = client.channels.cache.get(
      player.textChannel
    ) as TextChannel;

    if (!textChannel) {
      return;
    }
    textChannel.send(`Queue has ended`);

    player.destroy();
  });

client.once("ready", async () => {
  await redis.connect();
  client.user?.setPresence({
    activities: [
      {
        name: "-help",
        url: "http://instagram.com/mochiko.jpg",
      },
    ],
  });

  console.log("Ready!");
  client.manager.init(client.user?.id);
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on("messageCreate", async (message: Message) => {
  const commandManager = new CommandManager();
  await commandManager.execute(message);
});

client.login(process.env.DISCORD_TOKEN).then(() => console.log("Connected"));
