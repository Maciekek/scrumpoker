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
  const path = window.location.pathname.toLowerCase().trim();
  const code = path.replace(/^\/+|\/+$/g, "");
  if (!code || code.includes("/")) return "";
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(code) ? code : "";
}
