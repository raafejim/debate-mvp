"use client";

interface Props {
  name: string;
  onCancel: () => void;
}

export function QueueView({ name, onCancel }: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-accent opacity-20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full bg-accent opacity-40 animate-pulse"></div>
            <div className="absolute inset-4 rounded-full bg-accent"></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-3">Looking for an opponent…</h2>
        <p className="text-zinc-400 mb-10">
          You&apos;re in queue as <span className="text-white font-medium">{name}</span>.
          We&apos;ll pair you with the next person looking to debate.
        </p>

        <button
          onClick={onCancel}
          className="bg-panel border border-border hover:border-zinc-600 text-zinc-300 font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}
