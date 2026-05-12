import { randomUUID } from "crypto";
import { shuffledDeck } from "./cards";
import type { Answer, Card } from "./types";

export interface QueuedUser {
  socketId: string;
  name: string;
}

export interface Session {
  id: string;
  users: [QueuedUser, QueuedUser];
  cardIndex: number;
  deck: Card[];
  currentAnswers: Map<string, Answer>;
  phase: "cards" | "video";
}

export type AnswerResult =
  | { type: "waiting" }
  | { type: "ignored" }
  | { type: "advance"; card: Card; index: number; total: number }
  | { type: "debate"; card: Card }
  | { type: "exhausted" };

export class Matchmaking {
  private waiting: QueuedUser | null = null;
  private sessions = new Map<string, Session>();
  private socketToSession = new Map<string, string>();

  enqueue(
    user: QueuedUser,
  ): { matched: false } | { matched: true; session: Session } {
    if (this.waiting && this.waiting.socketId !== user.socketId) {
      const session: Session = {
        id: randomUUID(),
        users: [this.waiting, user],
        cardIndex: 0,
        deck: shuffledDeck(),
        currentAnswers: new Map(),
        phase: "cards",
      };
      this.sessions.set(session.id, session);
      this.socketToSession.set(this.waiting.socketId, session.id);
      this.socketToSession.set(user.socketId, session.id);
      this.waiting = null;
      return { matched: true, session };
    }
    this.waiting = user;
    return { matched: false };
  }

  leaveQueue(socketId: string): void {
    if (this.waiting?.socketId === socketId) {
      this.waiting = null;
    }
  }

  getSession(socketId: string): Session | undefined {
    const sid = this.socketToSession.get(socketId);
    return sid ? this.sessions.get(sid) : undefined;
  }

  getPartnerSocketId(socketId: string): string | undefined {
    const session = this.getSession(socketId);
    if (!session) return undefined;
    return session.users[0].socketId === socketId
      ? session.users[1].socketId
      : session.users[0].socketId;
  }

  endSession(
    socketId: string,
  ): { session: Session; partnerSocketId: string } | undefined {
    const session = this.getSession(socketId);
    if (!session) return undefined;
    const partnerSocketId =
      session.users[0].socketId === socketId
        ? session.users[1].socketId
        : session.users[0].socketId;
    this.sessions.delete(session.id);
    this.socketToSession.delete(session.users[0].socketId);
    this.socketToSession.delete(session.users[1].socketId);
    return { session, partnerSocketId };
  }

  recordAnswer(
    socketId: string,
    cardId: string,
    answer: Answer,
  ): AnswerResult {
    const session = this.getSession(socketId);
    if (!session || session.phase !== "cards") return { type: "ignored" };

    const currentCard = session.deck[session.cardIndex];
    if (!currentCard || currentCard.id !== cardId) return { type: "ignored" };

    if (session.currentAnswers.has(socketId)) return { type: "waiting" };

    session.currentAnswers.set(socketId, answer);
    if (session.currentAnswers.size < 2) return { type: "waiting" };

    const a1 = session.currentAnswers.get(session.users[0].socketId)!;
    const a2 = session.currentAnswers.get(session.users[1].socketId)!;
    const isDebate =
      (a1 === "yes" && a2 === "no") || (a1 === "no" && a2 === "yes");

    if (isDebate) {
      session.phase = "video";
      return { type: "debate", card: currentCard };
    }

    session.cardIndex++;
    session.currentAnswers.clear();
    const nextCard = session.deck[session.cardIndex];
    if (!nextCard) return { type: "exhausted" };

    return {
      type: "advance",
      card: nextCard,
      index: session.cardIndex,
      total: session.deck.length,
    };
  }

  stats(): { waiting: number; sessions: number } {
    return {
      waiting: this.waiting ? 1 : 0,
      sessions: this.sessions.size,
    };
  }
}
