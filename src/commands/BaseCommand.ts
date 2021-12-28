import { CommandManager } from "../managers/CommandManager";

export abstract class BaseCommand {
  static command: string;
  static aliases: string[];
  static description: string;
  manager: CommandManager;
  abstract execute(): Promise<void>;
}
