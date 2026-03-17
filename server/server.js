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

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const participants = room.participants
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      isAdmin: isAdmin(p),
      hasVoted: p.vote !== null,
      vote: room.revealed ? p.vote : null,
    }));
  return {
    roomCode,
    participants,
    revealed: room.revealed,
  };
}

function isAdmin(participant) {
  return participant.role === "admin" || participant.prevRole === "admin";
}

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("create-room", ({ userName }, callback) => {
    const roomCode = generateRoomCode();
    const participant = {
      id: socket.id,
      name: userName,
      role: "admin",
      vote: null,
    };
    rooms.set(roomCode, {
      participants: [participant],
      revealed: false,
    });
    currentRoom = roomCode;
    socket.join(roomCode);
    callback({ success: true, roomCode, role: "admin" });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("join-room", ({ roomCode, userName }, callback) => {
    const code = roomCode.toUpperCase().trim();
    let room = rooms.get(code);
    if (!room) {
      room = { participants: [], revealed: false };
      rooms.set(code, room);
    }
    const existing = room.participants.find(
      (p) => p.id === socket.id && !p.disconnected
    );
    if (existing) {
      callback({ success: false, error: "Już jesteś w tym pokoju" });
      return;
    }
    const disconnected = room.participants.find(
      (p) => p.name === userName && p.disconnected
    );
    let role;
    if (disconnected) {
      disconnected.id = socket.id;
      disconnected.disconnected = false;
      role = disconnected.role;
    } else {
      const hasAdmin = room.participants.some(
        (p) => isAdmin(p)
      );
      role = hasAdmin ? "participant" : "admin";
      room.participants.push({
        id: socket.id,
        name: userName,
        role,
        vote: null,
      });
    }
    currentRoom = code;
    socket.join(code);
    callback({ success: true, roomCode: code, role });
    io.to(code).emit("room-update", getRoomState(code));
  });

  socket.on("change-name", ({ roomCode, newName }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = room.participants.find((p) => p.id === socket.id);
    if (!participant) return;
    participant.name = newName;
    if (callback) callback({ success: true });
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("toggle-admin", ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const participant = room.participants.find((p) => p.id === socket.id);
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
    const participant = room.participants.find((p) => p.id === socket.id);
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
    const participant = room.participants.find((p) => p.id === socket.id);
    if (!participant || participant.role === "spectator") return;
    participant.vote = value;
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("reveal", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const requester = room.participants.find((p) => p.id === socket.id);
    if (!requester || !isAdmin(requester)) return;
    room.revealed = true;
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("reset", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const requester = room.participants.find((p) => p.id === socket.id);
    if (!requester || !isAdmin(requester)) return;
    room.revealed = false;
    room.participants.forEach((p) => (p.vote = null));
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("kick", ({ roomCode, participantId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const requester = room.participants.find((p) => p.id === socket.id);
    if (!requester || !isAdmin(requester)) return;
    if (participantId === socket.id) return;
    room.participants = room.participants.filter(
      (p) => p.id !== participantId
    );
    io.to(participantId).emit("kicked");
    const kickedSocket = io.sockets.sockets.get(participantId);
    if (kickedSocket) {
      kickedSocket.leave(roomCode);
    }
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("leave-room", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.participants = room.participants.filter((p) => p.id !== socket.id);
    socket.leave(roomCode);
    currentRoom = null;
    io.to(roomCode).emit("room-update", getRoomState(roomCode));
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const participant = room.participants.find((p) => p.id === socket.id);
    if (!participant) return;
    participant.disconnected = true;
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
