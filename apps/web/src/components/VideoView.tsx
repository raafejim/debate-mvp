"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/types";

interface Props {
  opponentName: string;
  matchedCard: Card | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  mediaError: string | null;
  onToggleVideo: (enabled: boolean) => void;
  onToggleAudio: (enabled: boolean) => void;
  onLeave: () => void;
}

export function VideoView({
  opponentName,
  matchedCard,
  localStream,
  remoteStream,
  mediaError,
  onToggleVideo,
  onToggleAudio,
  onLeave,
}: Props) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleVideo = () => {
    const next = !videoOn;
    setVideoOn(next);
    onToggleVideo(next);
  };

  const toggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    onToggleAudio(next);
  };

  if (mediaError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-panel border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">Can&apos;t access camera or microphone</h2>
          <p className="text-zinc-400 mb-6">{mediaError}</p>
          <button
            onClick={onLeave}
            className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-3 sm:p-4">
      {matchedCard && (
        <div className="bg-panel border border-accent/30 rounded-xl px-4 sm:px-5 py-3 mb-3 sm:mb-4 text-center max-w-4xl mx-auto w-full">
          <span className="text-xs text-accent uppercase tracking-wider mr-2 sm:mr-3 font-semibold">
            Debating
          </span>
          <span className="font-medium text-sm sm:text-base">
            {matchedCard.statement}
          </span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-h-0 max-w-6xl mx-auto w-full">
        <VideoTile
          videoRef={localRef}
          label="You"
          muted
          hidden={!videoOn}
          hiddenLabel="Your camera is off"
        />
        <VideoTile
          videoRef={remoteRef}
          label={opponentName}
          muted={false}
          hidden={!remoteStream}
          hiddenLabel={`Connecting to ${opponentName}…`}
        />
      </div>

      <div className="flex justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
        <ControlButton onClick={toggleAudio} active={audioOn} activeLabel="Mute mic" inactiveLabel="Unmute mic">
          {audioOn ? <MicIcon /> : <MicOffIcon />}
        </ControlButton>
        <ControlButton onClick={toggleVideo} active={videoOn} activeLabel="Turn off camera" inactiveLabel="Turn on camera">
          {videoOn ? <VideoIcon /> : <VideoOffIcon />}
        </ControlButton>
        <button
          onClick={onLeave}
          className="bg-no hover:bg-no/90 text-white font-semibold px-5 sm:px-7 py-3 rounded-full transition-colors flex items-center gap-2"
          title="Leave call"
        >
          <PhoneIcon />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </main>
  );
}

function VideoTile({
  videoRef,
  label,
  muted,
  hidden,
  hiddenLabel,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  label: string;
  muted: boolean;
  hidden: boolean;
  hiddenLabel: string;
}) {
  return (
    <div className="relative bg-panel rounded-2xl overflow-hidden border border-border aspect-video md:aspect-auto md:h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover bg-black"
      />
      {hidden && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg">
          <div className="text-zinc-500 text-sm sm:text-base">{hiddenLabel}</div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
        {label}
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  active,
  activeLabel,
  inactiveLabel,
  children,
}: {
  onClick: () => void;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={active ? activeLabel : inactiveLabel}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
        active
          ? "bg-panel border border-border hover:border-zinc-600 text-white"
          : "bg-no/20 border border-no/40 text-no hover:bg-no/30"
      }`}
    >
      {children}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function VideoOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.6 13.9c-.4 1.8.7 3.7 2.4 4.5 4.6 1.9 9.6 1.9 14.1 0 1.7-.8 2.8-2.7 2.4-4.5l-.4-1.9c-.2-.9-.9-1.6-1.8-1.7l-2.5-.4c-.8-.1-1.6.3-1.9 1l-.7 1.5c-2.3-.8-4.4-2.4-5.6-4.5l1.4-.9c.7-.4 1-1.2.8-2L11.2 2c-.2-.8-1-1.4-1.8-1.4H7c-.9 0-1.7.7-1.9 1.5l-.5 1.9c-.4 1.7-.5 3.4-.3 5.1.1 1.6.5 3.2 1.3 4.8z" />
    </svg>
  );
}
