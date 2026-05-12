"use client";

import type { Card } from "@/lib/types";

interface Props {
  card: Card;
}

export function MatchedTransition({ card }: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="text-accent text-sm uppercase tracking-widest font-semibold mb-4">
          Disagreement found
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
          It&apos;s a debate!
        </h1>
        <div className="bg-panel border border-accent/40 rounded-2xl p-8 mb-8 shadow-xl shadow-accent/10">
          <p className="text-xl sm:text-2xl font-medium leading-snug">
            {card.statement}
          </p>
        </div>
        <p className="text-zinc-400">Connecting your video call…</p>
      </div>
    </main>
  );
}
