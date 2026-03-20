import { io } from "socket.io-client";

export function createSocket() {
  return io({
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });
}

export function getRoomCodeFromURL() {
  const path = window.location.pathname.replace(/^\//, "").toLowerCase().trim();
  return /^[a-z]+-[a-z]+(-\d+)?$/.test(path) ? path : "";
}
