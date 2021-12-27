import { VoiceConnection } from "@discordjs/voice";
import MusicPlayer from "../utils/MusicPlayer";
import { Track } from "../utils/Track";
import { ICommand } from "./ICommand";

export class PlayCommand implements ICommand {
  constructor(private track: Track, private connection: VoiceConnection) {}

  async execute(): Promise<void> {
    this.playSong();
  }

  private async playSong() {
    MusicPlayer.setVoiceConnection(this.connection);
    MusicPlayer.enqueue(this.track);
  }
}
