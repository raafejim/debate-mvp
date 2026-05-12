"use client";

import type { Answer, Card } from "@/lib/types";

interface Props {
  card: Card;
  index: number;
  total: number;
  opponentName: string;
  pickedAnswer: Answer | null;
  onAnswer: (answer: Answer) => void;
  onLeave: () => void;
}

export function CardView({
  card,
  index,
  total,
  opponentName,
  pickedAnswer,
  onAnswer,
  onLeave,
}: Props) {
  const waiting = pickedAnswer !== null;

  return (
    <main className="min-h-screen flex flex-col px-4 py-6">
      <header className="flex justify-between items-center mb-8 max-w-3xl mx-auto w-full">
        <div className="text-sm text-zinc-400">
          Card <span className="text-white font-medium">{index + 1}</span> of {total}
        </div>
        <div className="text-sm text-zinc-400">
          vs <span className="text-white font-medium">{opponentName}</span>
        </div>
        <button
          onClick={onLeave}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Leave
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-panel border border-border rounded-3xl p-8 sm:p-12 mb-8 min-h-[260px] flex items-center justify-center text-center shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-semibold leading-snug">
              {card.statement}
            </h2>
          </div>

          {waiting ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-panel border border-border rounded-full px-5 py-3">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-zinc-300">
                  You picked{" "}
                  <span
                    className={
                      pickedAnswer === "yes"
                        ? "text-yes font-semibold"
                        : pickedAnswer === "no"
                          ? "text-no font-semibold"
                          : "text-skip font-semibold"
                    }
                  >
                    {pickedAnswer === "skip" ? "Skip" : pickedAnswer?.toUpperCase()}
                  </span>{" "}
                  — waiting for {opponentName}…
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => onAnswer("no")}
                className="bg-no/10 hover:bg-no/20 border-2 border-no/40 hover:border-no text-no font-bold py-5 sm:py-6 rounded-2xl text-lg sm:text-xl transition-all active:scale-95"
              >
                No
              </button>
              <button
                onClick={() => onAnswer("skip")}
                className="bg-panel hover:bg-zinc-800 border-2 border-border hover:border-zinc-600 text-zinc-300 font-bold py-5 sm:py-6 rounded-2xl text-lg sm:text-xl transition-all active:scale-95"
              >
                Skip
              </button>
              <button
                onClick={() => onAnswer("yes")}
                className="bg-yes/10 hover:bg-yes/20 border-2 border-yes/40 hover:border-yes text-yes font-bold py-5 sm:py-6 rounded-2xl text-lg sm:text-xl transition-all active:scale-95"
              >
                Yes
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
