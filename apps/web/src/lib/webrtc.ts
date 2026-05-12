type Signal =
  | { kind: "offer"; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; sdp: RTCSessionDescriptionInit }
  | { kind: "ice"; candidate: RTCIceCandidateInit };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export class DebateCall {
  private pc: RTCPeerConnection;
  private localStream: MediaStream;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private hasRemoteDesc = false;
  private closed = false;

  constructor(
    localStream: MediaStream,
    private sendSignal: (signal: Signal) => void,
    private onRemoteStream: (stream: MediaStream) => void,
    private onClose: () => void,
  ) {
    this.localStream = localStream;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    for (const track of localStream.getTracks()) {
      this.pc.addTrack(track, localStream);
    }

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal({
          kind: "ice",
          candidate: e.candidate.toJSON(),
        });
      }
    };

    this.pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) this.onRemoteStream(stream);
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      if (
        !this.closed &&
        (state === "disconnected" || state === "failed" || state === "closed")
      ) {
        this.onClose();
      }
    };
  }

  async initiate(): Promise<void> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.sendSignal({ kind: "offer", sdp: offer });
  }

  async receiveSignal(signal: Signal): Promise<void> {
    if (this.closed) return;
    if (signal.kind === "offer") {
      await this.pc.setRemoteDescription(signal.sdp);
      this.hasRemoteDesc = true;
      await this.flushCandidates();
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.sendSignal({ kind: "answer", sdp: answer });
    } else if (signal.kind === "answer") {
      await this.pc.setRemoteDescription(signal.sdp);
      this.hasRemoteDesc = true;
      await this.flushCandidates();
    } else if (signal.kind === "ice") {
      if (this.hasRemoteDesc) {
        await this.pc.addIceCandidate(signal.candidate);
      } else {
        this.pendingCandidates.push(signal.candidate);
      }
    }
  }

  private async flushCandidates(): Promise<void> {
    for (const c of this.pendingCandidates) {
      try {
        await this.pc.addIceCandidate(c);
      } catch (err) {
        console.warn("Failed to add ICE candidate", err);
      }
    }
    this.pendingCandidates = [];
  }

  setVideoEnabled(enabled: boolean): void {
    for (const t of this.localStream.getVideoTracks()) t.enabled = enabled;
  }

  setAudioEnabled(enabled: boolean): void {
    for (const t of this.localStream.getAudioTracks()) t.enabled = enabled;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.pc.close();
    for (const t of this.localStream.getTracks()) t.stop();
  }
}

export type { Signal };
