import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Track } from "./Track";
import { promisify } from "node:util";

const wait = promisify(setTimeout);

class MusicPlayer {
  queue: Array<Track> = [];
  player: AudioPlayer;
  voiceConnection?: VoiceConnection;
  queueLock = false;
  readyLock = false;
  constructor() {
    this.player = createAudioPlayer();

    this.player.on("stateChange", (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.
        (oldState.resource as AudioResource<Track>).metadata.onFinish();
        this.queue.shift();
        void this.processQueue();
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // If the Playing state has been entered, then a new track has started playback.
        (newState.resource as AudioResource<Track>).metadata.onStart();
      }
    });
  }

  handleConnectionStateChange = async (
    _: VoiceConnectionState,
    newState: VoiceConnectionState
  ) => {
    if (!this.voiceConnection) return;

    if (newState.status === VoiceConnectionStatus.Disconnected) {
      if (
        newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
        newState.closeCode === 4014
      ) {
        try {
          await entersState(
            this.voiceConnection!,
            VoiceConnectionStatus.Connecting,
            5_000
          );
        } catch {
          this.voiceConnection!.destroy();
        }
      } else if (this.voiceConnection!.rejoinAttempts < 5) {
        await wait((this.voiceConnection!.rejoinAttempts + 1) * 5_000);
        this.voiceConnection.rejoin();
      } else {
        this.voiceConnection.destroy();
      }
    } else if (newState.status === VoiceConnectionStatus.Destroyed) {
      /**
       * Once destroyed, stop the subscription.
       */
      this.stop();
    } else if (
      !this.readyLock &&
      (newState.status === VoiceConnectionStatus.Connecting ||
        newState.status === VoiceConnectionStatus.Signalling)
    ) {
      /**
       * In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
       * before destroying the voice connection. This stops the voice connection permanently existing in one of these
       * states.
       */
      this.readyLock = true;
      try {
        await entersState(
          this.voiceConnection,
          VoiceConnectionStatus.Ready,
          20_000
        );
      } catch {
        if (
          this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed
        )
          this.voiceConnection.destroy();
      } finally {
        this.readyLock = false;
      }
    }
  };

  setVoiceConnection(connection: VoiceConnection) {
    this.voiceConnection = connection;
  }

  subscribeVoiceConnection() {
    if (!this.voiceConnection) throw new Error("Did not set voice connection");
    this.voiceConnection.subscribe(this.player);
    this.voiceConnection.on("stateChange", this.handleConnectionStateChange);
  }

  async enqueue(track: Track) {
    this.queue.push(track);
    track.onEnqueue(this.queue);
    await this.processQueue();
  }

  /**
   * Attempts to play a Track from the queue.
   */
  private async processQueue(): Promise<void> {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
    if (
      this.queueLock ||
      this.player.state.status !== AudioPlayerStatus.Idle ||
      this.queue.length === 0
    ) {
      return;
    }
    // Lock the queue to guarantee safe access
    this.queueLock = true;

    // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
    const [nextTrack] = this.queue;
    try {
      // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
      const resource = await nextTrack.createAudioResource();
      this.player.play(resource);
      this.queueLock = false;
    } catch (error) {
      // If an error occurred, try the next item of the queue instead
      nextTrack.onError(error as Error);
      this.queueLock = false;
      return this.processQueue();
    }
  }
  /**
   * Stops audio playback and empties the queue.
   */
  public stop() {
    this.queueLock = true;
    this.queue = [];
    this.player.stop(true);
  }
}

export default new MusicPlayer();
