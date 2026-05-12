"use client";

type EndReason = "peer-left" | "exhausted" | "self-left" | "error" | null;

interface Props {
  reason: EndReason;
  message: string | null;
  onHome: () => void;
}

export function EndedView({ reason, message, onHome }: Props) {
  const { title, body } = describe(reason, message);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-panel border border-border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-zinc-400 mb-6">{body}</p>
        <button
          onClick={onHome}
          className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Back to home
        </button>
      </div>
    </main>
  );
}

function describe(reason: EndReason, message: string | null) {
  switch (reason) {
    case "peer-left":
      return {
        title: "Your opponent left",
        body: "The other debater disconnected. Head back and find someone new.",
      };
    case "exhausted":
      return {
        title: "No topic to debate",
        body: "You agreed (or skipped) on every statement. Try again — the deck will be reshuffled.",
      };
    case "self-left":
      return {
        title: "Debate ended",
        body: "Thanks for debating. Want to find another opponent?",
      };
    case "error":
      return {
        title: "Something went wrong",
        body: message || "An unexpected error occurred. Please try again.",
      };
    default:
      return {
        title: "Session ended",
        body: "Ready to debate again?",
      };
  }
}
