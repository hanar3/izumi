import { Emoji, Message, MessageEmbed } from "discord.js";
import { Player } from "erela.js";
import { AppError } from "../error/AppError";
import { CommandManager } from "../managers/CommandManager";
import { BaseCommand } from "./BaseCommand";

export class Help implements BaseCommand {
  static command = "help";
  static aliases = ["h"];
  static usage = "`-help` | `-help [command]`";
  static description = "Show commands or info on an specific command";

  manager: CommandManager;

  constructor(private message: Message, private args: string[]) {}
  async execute(): Promise<any> {
    const commands = this.manager.commands;
    if (!this.args.length) {
      const embed = new MessageEmbed()
        .setTitle("Here's a list of all my commands:")
        .setDescription(
          commands
            .map(
              (command) =>
                `**-${command.command}**: ${command.description}. ${command.usage}`
            )
            .join("\n\n")
        );

      return this.message.reply({
        embeds: [embed],
      });
    } else {
      const name = this.args[0].toLowerCase();
      const data = [];
      const command =
        commands.get(name) ||
        commands.find((c) => c.aliases && c.aliases.includes(name));
      if (!command) {
        return this.message.reply("That's not a valid command!");
      }

      data.push(`**Name:** ${command.command}`);
      if (command.aliases.length > 0)
        data.push(`**Aliases:** ${command.aliases.join(", ")}`);
      if (command.description)
        data.push(`**Description:** ${command.description}`);
      if (command.usage) data.push(`**Usage:**${command.usage}`);

      const embed = new MessageEmbed()
        .setTitle(`${name} command`)
        .setDescription(data.join("\n"));

      return this.message.reply({ embeds: [embed] });
    }
  }
}
