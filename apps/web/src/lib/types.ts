export type Answer = "yes" | "no" | "skip";

export interface Card {
  id: string;
  statement: string;
}

export interface ClientToServerEvents {
  "queue:join": (payload: { name: string }) => void;
  "queue:leave": () => void;
  "card:answer": (payload: { cardId: string; answer: Answer }) => void;
  signal: (payload: { signal: unknown }) => void;
  "session:leave": () => void;
}

export interface ServerToClientEvents {
  "queue:waiting": () => void;
  "match:found": (payload: { opponentName: string; isInitiator: boolean }) => void;
  "card:next": (payload: { card: Card; index: number; total: number }) => void;
  "card:debate": (payload: { card: Card }) => void;
  "peer:signal": (payload: { signal: unknown }) => void;
  "peer:left": () => void;
  "queue:exhausted": () => void;
  error: (payload: { message: string }) => void;
}
