import "dotenv/config";
import { Client, Intents, Message } from "discord.js";
import { redis } from "./utils/redis";
import { CommandManager } from "./managers/CommandManager";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.once("ready", async () => {
  await redis.connect();
  console.log("Ready!");
});

client.on("messageCreate", async (message: Message) => {
  const commandManager = new CommandManager();
  await commandManager.execute(message);
});

client.login(process.env.DISCORD_TOKEN).then(() => console.log("Connected"));
