"use client";

interface Props {
  name: string;
  setName: (n: string) => void;
  onStart: () => void;
  connected: boolean;
}

export function HomeView({ name, setName, onStart, connected }: Props) {
  const canStart = connected && name.trim().length > 0;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            <span className="text-accent">Debate</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Find someone who disagrees with you.
          </p>
        </div>

        <div className="bg-panel border border-border rounded-2xl p-6 space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              Display name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canStart) onStart();
              }}
              maxLength={32}
              placeholder="e.g. Alex"
              autoFocus
              className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full bg-accent hover:bg-accent/90 disabled:bg-accentMuted disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-base"
          >
            {connected ? "Start debating" : "Connecting…"}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6 leading-relaxed">
          You&apos;ll answer Yes/No/Skip on debate statements. When you and your
          opponent disagree on a topic, you&apos;ll be put in a video call to
          debate it live.
        </p>
      </div>
    </main>
  );
}
