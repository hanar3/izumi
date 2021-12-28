export abstract class BaseCommand {
  static command: string;
  static aliases: string[];
  static description: string;
  abstract execute(): Promise<void>;
}
