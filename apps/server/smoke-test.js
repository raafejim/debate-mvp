// Smoke test: simulates two clients connecting, joining queue, going through cards.
// Run: node smoke-test.js (with server running on :8080)
const { io } = require("socket.io-client");

function client(name) {
  const s = io("http://localhost:8080", { transports: ["websocket"] });
  s.name = name;
  s.on("connect", () => log(name, "connected", s.id));
  s.on("queue:waiting", () => log(name, "in queue"));
  s.on("match:found", (p) => log(name, "matched with", p.opponentName, "(initiator:", p.isInitiator + ")"));
  s.on("card:next", (p) => {
    log(name, `card ${p.index + 1}/${p.total}: "${p.card.statement.slice(0, 50)}…"`);
    s.lastCard = p.card;
  });
  s.on("card:debate", (p) => log(name, `DEBATE on "${p.card.statement}"`));
  s.on("peer:left", () => log(name, "peer left"));
  s.on("error", (p) => log(name, "ERROR:", p.message));
  return s;
}

function log(...args) {
  console.log(`[${new Date().toISOString().slice(11, 23)}]`, ...args);
}

async function run() {
  const a = client("Alice");
  const b = client("Bob");

  await wait(300);
  a.emit("queue:join", { name: "Alice" });
  await wait(200);
  b.emit("queue:join", { name: "Bob" });

  // Wait for first card, both answer "yes" (same — advance)
  await wait(500);
  a.emit("card:answer", { cardId: a.lastCard.id, answer: "yes" });
  b.emit("card:answer", { cardId: b.lastCard.id, answer: "yes" });

  // Both answer "skip" (skip — advance)
  await wait(500);
  a.emit("card:answer", { cardId: a.lastCard.id, answer: "skip" });
  b.emit("card:answer", { cardId: b.lastCard.id, answer: "no" });

  // One yes, one no (debate!)
  await wait(500);
  a.emit("card:answer", { cardId: a.lastCard.id, answer: "yes" });
  b.emit("card:answer", { cardId: b.lastCard.id, answer: "no" });

  await wait(600);
  log("=== shutting down ===");
  a.close();
  b.close();
  process.exit(0);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch(console.error);
