import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Matchmaking } from "./matchmaking";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types";

const PORT = parseInt(process.env.PORT || "8080", 10);
const RAW_ORIGIN = process.env.CORS_ORIGIN || "*";
const CORS_ORIGIN =
  RAW_ORIGIN === "*"
    ? "*"
    : RAW_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: { origin: CORS_ORIGIN },
});

const matchmaking = new Matchmaking();

app.get("/health", (_req, res) => {
  res.json({ ok: true, ...matchmaking.stats() });
});

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on("queue:join", ({ name }) => {
    if (matchmaking.getSession(socket.id)) {
      socket.emit("error", { message: "Already in a session" });
      return;
    }
    const cleanName = (name || "").trim().slice(0, 32) || "Anonymous";
    socket.data.name = cleanName;
    socket.data.inQueue = true;

    const result = matchmaking.enqueue({
      socketId: socket.id,
      name: cleanName,
    });

    if (!result.matched) {
      socket.emit("queue:waiting");
      console.log(`[queue] ${socket.id} (${cleanName}) waiting`);
      return;
    }

    const session = result.session;
    const [u1, u2] = session.users;
    io.to(u1.socketId).emit("match:found", {
      opponentName: u2.name,
      isInitiator: true,
    });
    io.to(u2.socketId).emit("match:found", {
      opponentName: u1.name,
      isInitiator: false,
    });

    const firstCard = session.deck[0];
    const payload = {
      card: firstCard,
      index: 0,
      total: session.deck.length,
    };
    io.to(u1.socketId).emit("card:next", payload);
    io.to(u2.socketId).emit("card:next", payload);
    console.log(
      `[match] ${u1.name}(${u1.socketId}) <-> ${u2.name}(${u2.socketId})`,
    );
  });

  socket.on("queue:leave", () => {
    matchmaking.leaveQueue(socket.id);
    socket.data.inQueue = false;
  });

  socket.on("card:answer", ({ cardId, answer }) => {
    if (!["yes", "no", "skip"].includes(answer)) {
      socket.emit("error", { message: "Invalid answer" });
      return;
    }

    const result = matchmaking.recordAnswer(socket.id, cardId, answer);
    if (result.type === "waiting" || result.type === "ignored") return;

    const session = matchmaking.getSession(socket.id);
    if (!session) return;
    const [u1, u2] = session.users;

    if (result.type === "advance") {
      const payload = {
        card: result.card,
        index: result.index,
        total: result.total,
      };
      io.to(u1.socketId).emit("card:next", payload);
      io.to(u2.socketId).emit("card:next", payload);
    } else if (result.type === "debate") {
      const payload = { card: result.card };
      io.to(u1.socketId).emit("card:debate", payload);
      io.to(u2.socketId).emit("card:debate", payload);
      console.log(`[debate] ${u1.name} <-> ${u2.name} on "${result.card.statement}"`);
    } else if (result.type === "exhausted") {
      io.to(u1.socketId).emit("queue:exhausted");
      io.to(u2.socketId).emit("queue:exhausted");
      matchmaking.endSession(socket.id);
      console.log(`[exhausted] ${u1.name} <-> ${u2.name}`);
    }
  });

  socket.on("signal", ({ signal }) => {
    const partnerId = matchmaking.getPartnerSocketId(socket.id);
    if (!partnerId) return;
    io.to(partnerId).emit("peer:signal", { signal });
  });

  socket.on("session:leave", () => {
    const ended = matchmaking.endSession(socket.id);
    if (ended) {
      io.to(ended.partnerSocketId).emit("peer:left");
      console.log(`[leave] ${socket.id} left session ${ended.session.id}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[disconnect] ${socket.id}`);
    matchmaking.leaveQueue(socket.id);
    const ended = matchmaking.endSession(socket.id);
    if (ended) {
      io.to(ended.partnerSocketId).emit("peer:left");
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
  console.log(`[server] CORS origin: ${JSON.stringify(CORS_ORIGIN)}`);
});
