"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  Answer,
  Card,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/types";
import { DebateCall, type Signal } from "@/lib/webrtc";
import { HomeView } from "@/components/HomeView";
import { QueueView } from "@/components/QueueView";
import { CardView } from "@/components/CardView";
import { MatchedTransition } from "@/components/MatchedTransition";
import { VideoView } from "@/components/VideoView";
import { EndedView } from "@/components/EndedView";

type Phase =
  | "home"
  | "queueing"
  | "cards"
  | "matched"
  | "video"
  | "ended";

type EndReason = "peer-left" | "exhausted" | "self-left" | "error";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8080";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export default function Page() {
  const socketRef = useRef<AppSocket | null>(null);
  const callRef = useRef<DebateCall | null>(null);
  const signalQueueRef = useRef<Signal[]>([]);
  const isInitiatorRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<Phase>("home");
  const [name, setName] = useState("");
  const [opponentName, setOpponentName] = useState<string | null>(null);

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardTotal, setCardTotal] = useState(0);
  const [pickedAnswer, setPickedAnswer] = useState<Answer | null>(null);

  const [matchedCard, setMatchedCard] = useState<Card | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const teardownCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setMediaError(null);
    signalQueueRef.current = [];
  }, []);

  const resetSessionState = useCallback(() => {
    setOpponentName(null);
    setCurrentCard(null);
    setCardIndex(0);
    setCardTotal(0);
    setPickedAnswer(null);
    setMatchedCard(null);
    setEndReason(null);
    setErrorMessage(null);
    isInitiatorRef.current = false;
  }, []);

  useEffect(() => {
    const socket: AppSocket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("queue:waiting", () => {
      // server confirmed we're in queue — keep current "queueing" state
    });

    socket.on("match:found", ({ opponentName: opp, isInitiator }) => {
      setOpponentName(opp);
      isInitiatorRef.current = isInitiator;
    });

    socket.on("card:next", ({ card, index, total }) => {
      setCurrentCard(card);
      setCardIndex(index);
      setCardTotal(total);
      setPickedAnswer(null);
      setPhase("cards");
    });

    socket.on("card:debate", ({ card }) => {
      setMatchedCard(card);
      setPhase("matched");
      setTimeout(() => setPhase("video"), 1500);
    });

    socket.on("peer:signal", ({ signal }) => {
      const s = signal as Signal;
      if (callRef.current) {
        void callRef.current.receiveSignal(s);
      } else {
        signalQueueRef.current.push(s);
      }
    });

    socket.on("peer:left", () => {
      teardownCall();
      setEndReason("peer-left");
      setPhase("ended");
    });

    socket.on("queue:exhausted", () => {
      setEndReason("exhausted");
      setPhase("ended");
    });

    socket.on("error", ({ message }) => {
      setErrorMessage(message);
      setEndReason("error");
      setPhase("ended");
    });

    return () => {
      socket.disconnect();
      teardownCall();
    };
  }, [teardownCall]);

  useEffect(() => {
    if (phase !== "video" || callRef.current) return;
    let cancelled = false;

    (async () => {
      const socket = socketRef.current;
      if (!socket) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }

        setLocalStream(stream);

        const call = new DebateCall(
          stream,
          (signal) => socket.emit("signal", { signal }),
          (rs) => setRemoteStream(rs),
          () => {
            // peer connection closed locally; server peer:left will handle UX
          },
        );
        callRef.current = call;

        for (const s of signalQueueRef.current) {
          await call.receiveSignal(s);
        }
        signalQueueRef.current = [];

        if (isInitiatorRef.current) {
          await call.initiate();
        }
      } catch (err) {
        console.error("getUserMedia failed", err);
        const msg =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera and microphone access were denied. Allow access in your browser settings to use video calls."
            : "Could not access your camera or microphone.";
        setMediaError(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase]);

  const startQueue = useCallback(() => {
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) return;
    resetSessionState();
    socketRef.current?.emit("queue:join", { name: trimmed });
    setPhase("queueing");
  }, [name, resetSessionState]);

  const cancelQueue = useCallback(() => {
    socketRef.current?.emit("queue:leave");
    setPhase("home");
  }, []);

  const answerCard = useCallback(
    (answer: Answer) => {
      if (!currentCard || pickedAnswer) return;
      setPickedAnswer(answer);
      socketRef.current?.emit("card:answer", {
        cardId: currentCard.id,
        answer,
      });
    },
    [currentCard, pickedAnswer],
  );

  const leaveSession = useCallback(() => {
    socketRef.current?.emit("session:leave");
    teardownCall();
    setEndReason("self-left");
    setPhase("ended");
  }, [teardownCall]);

  const goHome = useCallback(() => {
    teardownCall();
    resetSessionState();
    setPhase("home");
  }, [teardownCall, resetSessionState]);

  const handleToggleVideo = useCallback((enabled: boolean) => {
    callRef.current?.setVideoEnabled(enabled);
  }, []);
  const handleToggleAudio = useCallback((enabled: boolean) => {
    callRef.current?.setAudioEnabled(enabled);
  }, []);

  switch (phase) {
    case "home":
      return (
        <HomeView
          name={name}
          setName={setName}
          onStart={startQueue}
          connected={connected}
        />
      );
    case "queueing":
      return <QueueView name={name} onCancel={cancelQueue} />;
    case "cards":
      return currentCard ? (
        <CardView
          card={currentCard}
          index={cardIndex}
          total={cardTotal}
          opponentName={opponentName ?? "Opponent"}
          pickedAnswer={pickedAnswer}
          onAnswer={answerCard}
          onLeave={leaveSession}
        />
      ) : null;
    case "matched":
      return matchedCard ? <MatchedTransition card={matchedCard} /> : null;
    case "video":
      return (
        <VideoView
          opponentName={opponentName ?? "Opponent"}
          matchedCard={matchedCard}
          localStream={localStream}
          remoteStream={remoteStream}
          mediaError={mediaError}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          onLeave={leaveSession}
        />
      );
    case "ended":
      return (
        <EndedView
          reason={endReason}
          message={errorMessage}
          onHome={goHome}
        />
      );
  }
}
