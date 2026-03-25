const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();

const DIST = path.join(__dirname, "..", "client", "dist");
app.use(express.static(DIST));

const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 25000,
  pingTimeout: 20000,
});

const rooms = new Map();

const ADJECTIVES = [
  "lazy", "happy", "sneaky", "fluffy", "grumpy", "silly", "wobbly", "bouncy",
  "sleepy", "cheeky", "clumsy", "dizzy", "fancy", "goofy", "jolly", "lucky",
  "mighty", "nutty", "peppy", "quirky", "rowdy", "sassy", "tiny", "wacky",
  "zany", "brave", "crispy", "dapper", "fizzy", "giggly", "hyper", "icy",
  "jumpy", "keen", "lively", "mellow", "nifty", "odd", "plucky", "rapid",
  "snappy", "tricky", "upbeat", "vivid", "witty", "cosmic", "funky", "golden",
  "humble", "epic",
];

const NOUNS = [
  "penguin", "taco", "unicorn", "waffle", "llama", "panda", "muffin", "narwhal",
  "otter", "pretzel", "quokka", "raccoon", "sloth", "walrus", "yeti", "badger",
  "cactus", "dingo", "falcon", "goblin", "hamster", "igloo", "jellyfish", "koala",
  "lobster", "moose", "noodle", "octopus", "pickle", "robot", "squid", "tiger",
  "wizard", "alpaca", "biscuit", "cupcake", "dolphin", "espresso", "flamingo",
  "giraffe", "hedgehog", "impala", "jackrabbit", "kiwi", "lemur", "marshmallow",
  "nugget", "owl", "platypus", "raptor",
];

function generateRoomName() {
  const maxAttempts = 500;
  for (let i = 0; i < maxAttempts; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const name = `${adj}-${noun}`;
    if (!rooms.has(name)) return name;
  }
  // Fallback: append random digits
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${noun}-${Math.floor(Math.random() * 1000)}`;
}

function findBySocket(participants, socketId) {
  return participants.find((p) => p.sockets.has(socketId));
}

function isAdmin(participant) {
  return participant.role === "admin" || participant.prevRole === "admin";
}

function getRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const participants = room.participants
    .map((p) => ({
      sockets: [...p.sockets],
      connected: p.sockets.size > 0,
      name: p.name,
      role: p.role,
      isAdmin: isAdmin(p),
      hasVoted: p.vote !== null,
      vote: room.revealed ? p.vote : null,
      voteHistory: room.revealed ? (p.voteHistory || []) : [],
    }));
  return {
    roomCode,
    participants,
    revealed: room.revealed,
  };
}

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("suggest-room-name", (payloadOrCallback, maybeCallback) => {
    const callback = typeof payloadOrCallback === "function"
      ? payloadOrCallback
      : maybeCallback;
    if (typeof callback === "function") {
      callback({ name: generateRoomName() });
    }
  });

  socket.on("create-room", ({ userName, roomName }, callback) => {
    const roomCode = roomName && typeof roomName === "string"
      ? roomName.toLowerCase().trim()
      : generateRoomName();
    if (rooms.has(roomCode)) {
      callback({ success: false, error: "Room name already taken" });
      return;
    }
    rooms.set(roomCode, {
      participants: [{
        sockets: new Set([socket.id]),
        name: userName,
        role: "admin",
        vote: null,
      }],
      revealed: false,
    });
    currentRoom = roomCode;
    socket.join(roomCode);
    callback({ success: true, roomCode, role: "admin" });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("join-room", ({ roomCode, userName }, callback) => {
    const code = roomCode.toLowerCase().trim();
    let room = rooms.get(code);
    if (!room) {
      room = { participants: [], revealed: false };
      rooms.set(code, room);
    }
    const existing = room.participants.find((p) => p.name === userName);
    let role;
    if (existing) {
      existing.sockets.add(socket.id);
      role = existing.role;
    } else {
      const hasAdmin = room.participants.some((p) => isAdmin(p));
      role = hasAdmin ? "participant" : "admin";
      room.participants.push({
        sockets: new Set([socket.id]),
        name: userName,
        role,
        vote: null,
      });
    }
    currentRoom = code;
    socket.join(code);
    const vote = existing ? existing.vote : null;
    callback({ success: true, roomCode: code, role, vote });
    io.to(code).emit("room-update", getRoomState(code));
  });

  socket.on("change-name", ({ roomCode, newName }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = findBySocket(room.participants, socket.id);
    if (!participant) return;
    participant.name = newName;
    if (callback) callback({ success: true });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("toggle-admin", ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = findBySocket(room.participants, socket.id);
    if (!participant) return;
    if (participant.role === "spectator") {
      participant.prevRole = participant.prevRole === "admin" ? "participant" : "admin";
    } else {
      participant.role = participant.role === "admin" ? "participant" : "admin";
    }
    if (callback) callback({ success: true });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("toggle-spectator", ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = findBySocket(room.participants, socket.id);
    if (!participant) return;
    if (participant.role === "spectator") {
      participant.role = participant.prevRole || "participant";
      delete participant.prevRole;
    } else {
      participant.prevRole = participant.role;
      participant.role = "spectator";
      participant.vote = null;
    }
    if (callback) callback({ success: true, role: participant.role });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("vote", ({ roomCode, value }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = findBySocket(room.participants, socket.id);
    if (!participant || participant.role === "spectator") return;
    if (room.revealed && participant.vote !== null && participant.vote !== value) {
      if (!participant.voteHistory) participant.voteHistory = [];
      participant.voteHistory.push(participant.vote);
    }
    participant.vote = value;
    for (const sid of participant.sockets) {
      io.to(sid).emit("sync-vote", value);
    }
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("reveal", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const requester = findBySocket(room.participants, socket.id);
    if (!requester || !isAdmin(requester)) return;
    room.revealed = true;
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("reset", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const requester = findBySocket(room.participants, socket.id);
    if (!requester || !isAdmin(requester)) return;
    room.revealed = false;
    room.participants.forEach((p) => { p.vote = null; delete p.voteHistory; });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("kick", ({ roomCode, participantName }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const requester = findBySocket(room.participants, socket.id);
    if (!requester || !isAdmin(requester)) return;
    const target = room.participants.find((p) => p.name === participantName);
    if (!target || target === requester) return;
    for (const sid of target.sockets) {
      io.to(sid).emit("kicked");
      const s = io.sockets.sockets.get(sid);
      if (s) s.leave(roomCode);
    }
    room.participants = room.participants.filter((p) => p !== target);
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("leave-room", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = findBySocket(room.participants, socket.id);
    if (!participant) return;
    // Remove only this socket; if last socket, remove participant
    participant.sockets.delete(socket.id);
    if (participant.sockets.size === 0) {
      room.participants = room.participants.filter((p) => p !== participant);
    }
    socket.leave(roomCode);
    currentRoom = null;
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const participant = findBySocket(room.participants, socket.id);
    if (!participant) return;
    participant.sockets.delete(socket.id);
    io.to(currentRoom).emit("room-update", getRoomState(currentRoom));
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST, "index.html"));
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "::";
let fallbackTried = false;

server.on("error", (err) => {
  const canFallbackToIPv4 =
    !fallbackTried && HOST === "::" && (err.code === "EADDRNOTAVAIL" || err.code === "EPERM");

  if (canFallbackToIPv4) {
    fallbackTried = true;
    console.warn("IPv6 bind failed, retrying on IPv4 0.0.0.0");
    server.listen(PORT, "0.0.0.0");
    return;
  }

  console.error("Failed to start server:", err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Scrum Poker running on http://localhost:${PORT}`);
});
