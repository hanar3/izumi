import "dotenv/config";
import { Client, Intents, Message } from "discord.js";
import { PlayCommand } from "./commands/Play";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.once("ready", () => {
  console.log("Ready!");
});

client.on("messageCreate", async (message: Message) => {
  const prefix = "!";
  if (message.content.startsWith(prefix)) {
    const [command, args] = message.content.split(" ");

    switch (command) {
      case "!play":
        const playCmd = new PlayCommand(message, args);
        await playCmd.execute();
        break;
    }
  }
});

client.login(process.env.DISCORD_TOKEN).then(() => console.log("Connected"));
