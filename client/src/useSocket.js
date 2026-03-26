import { useEffect, useRef, useState, useCallback } from "react";
import { createSocket, getRoomCodeFromURL } from "./socket";
import { useTranslation } from "./i18n";

const ROOM_ADJECTIVES = [
  "happy", "quick", "brave", "mellow", "witty", "lucky",
  "cosmic", "fancy", "swift", "sunny", "calm", "bright",
];

const ROOM_NOUNS = [
  "panda", "otter", "waffle", "rocket", "wizard", "tiger",
  "falcon", "kiwi", "robot", "nugget", "dolphin", "badger",
];

function generateLocalRoomName() {
  const adj = ROOM_ADJECTIVES[Math.floor(Math.random() * ROOM_ADJECTIVES.length)];
  const noun = ROOM_NOUNS[Math.floor(Math.random() * ROOM_NOUNS.length)];
  return `${adj}-${noun}`;
}

export function useSocket() {
  const { t } = useTranslation();
  const initialStoredNameRef = useRef(localStorage.getItem("scrumpoker_name") || "");
  const initialJoinCodeRef = useRef(getRoomCodeFromURL());
  const [screen, setScreen] = useState("lobby");
  const [userName, setUserName] = useState(initialStoredNameRef.current);
  const [joinCode, setJoinCode] = useState(initialJoinCodeRef.current);
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [error, setError] = useState("");
  const [kickedMessage, setKickedMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");
  const [isBootstrapping, setIsBootstrapping] = useState(
    Boolean(initialStoredNameRef.current.trim() && initialJoinCodeRef.current.trim())
  );
  const autoJoinKeyRef = useRef("");
  const rejoinSocketIdRef = useRef("");
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on("room-update", (state) => {
      setRoomState((prev) => {
        if (prev?.revealed && !state.revealed) {
          setSelectedVote(null);
        }
        return state;
      });
    });

    socket.on("sync-vote", (value) => {
      setSelectedVote(value);
    });

    socket.on("kicked", () => {
      setScreen("lobby");
      setIsBootstrapping(false);
      setRoomCode("");
      setRole("");
      setRoomState(null);
      setSelectedVote(null);
      setJoinCode("");
      setKickedMessage(t("kickedByAdmin"));
      window.history.replaceState({}, "", "/");
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionState("connected");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setConnectionState("disconnected");
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
      setConnectionState(socket.active ? "connecting" : "disconnected");
    });

    const handleReconnectAttempt = () => setConnectionState("connecting");
    const handleReconnectError = () => {
      setConnectionState(socket.active ? "connecting" : "disconnected");
    };
    const handleReconnectFailed = () => setConnectionState("disconnected");
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (socket.connected) return;
      setConnectionState("connecting");
      socket.connect();
    };

    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect_error", handleReconnectError);
    socket.io.on("reconnect_failed", handleReconnectFailed);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect_error", handleReconnectError);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.disconnect();
    };
  }, []);

  const emit = useCallback(
    (event, data, cb) => socketRef.current?.emit(event, data, cb),
    []
  );

  const suggestRoomName = useCallback(() => {
    setRoomNameInput((prev) => prev || generateLocalRoomName());
    socketRef.current?.emit("suggest-room-name", (res) => {
      if (res?.name) setRoomNameInput(res.name);
    });
  }, []);

  useEffect(() => {
    if (!isConnected || joinCode || roomNameInput) return;
    suggestRoomName();
  }, [isConnected, joinCode, roomNameInput, suggestRoomName]);

  const createRoom = useCallback(() => {
    const name = userName.trim();
    if (!name) { setError(t("enterYourName")); return; }
    setError("");
    setKickedMessage("");
    localStorage.setItem("scrumpoker_name", name);
    const roomName = roomNameInput.trim().toLowerCase() || undefined;
    emit("create-room", { userName: name, roomName }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setRole(res.role);
        setScreen("room");
        setIsBootstrapping(false);
        window.history.replaceState({}, "", `/${res.roomCode}`);
      } else {
        setError(res.error);
      }
    });
  }, [userName, roomNameInput, emit]);

  const joinRoom = useCallback((options = {}) => {
    const isAutoJoin = Boolean(options.autoJoin);
    const name = userName.trim();
    if (!name) {
      if (isAutoJoin) setIsBootstrapping(false);
      setError(t("enterYourName"));
      return;
    }
    if (!joinCode.trim()) {
      if (isAutoJoin) setIsBootstrapping(false);
      setError(t("enterRoomCode"));
      return;
    }
    setError("");
    setKickedMessage("");
    localStorage.setItem("scrumpoker_name", name);
    emit("join-room", { roomCode: joinCode.trim(), userName: name }, (res) => {
      setIsBootstrapping(false);
      if (res.success) {
        setRoomCode(res.roomCode);
        setRole(res.role);
        setScreen("room");
        window.history.replaceState({}, "", `/${res.roomCode}`);
        if (res.vote != null) setSelectedVote(res.vote);
      } else {
        setError(res.error);
      }
    });
  }, [userName, joinCode, emit]);

  useEffect(() => {
    if (screen !== "lobby") return;
    if (!initialStoredNameRef.current.trim()) {
      setIsBootstrapping(false);
      return;
    }

    const name = userName.trim();
    const code = joinCode.trim();
    if (!name || !code) {
      setIsBootstrapping(false);
      return;
    }
    if (!isConnected) return;

    const key = `${code}::${name}`;
    if (autoJoinKeyRef.current === key) return;
    autoJoinKeyRef.current = key;
    joinRoom({ autoJoin: true });
  }, [isConnected, screen, userName, joinCode, joinRoom]);

  useEffect(() => {
    if (!isConnected || screen !== "room" || !roomCode || !userName.trim()) return;

    const socketId = socketRef.current?.id || "";
    if (!socketId || rejoinSocketIdRef.current === socketId) return;
    rejoinSocketIdRef.current = socketId;

    emit("join-room", { roomCode, userName: userName.trim() }, (res) => {
      if (res?.success) {
        setRole(res.role);
        if (res.vote != null) setSelectedVote(res.vote);
      } else if (res?.error) {
        setError(res.error);
      }
    });
  }, [isConnected, screen, roomCode, userName, emit]);

  const vote = useCallback(
    (value) => {
      const trimmedUserName = userName.trim();
      if (!roomCode || !trimmedUserName) return;

      const socket = socketRef.current;
      if (socket && !socket.connected) {
        setConnectionState("connecting");
        socket.connect();
      }

      setSelectedVote(value);
      fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomCode, userName: trimmedUserName, value }),
      }).catch(() => {
        // Keep optimistic value locally; room state will sync on next update.
      });
    },
    [roomCode, userName]
  );

  const reveal = useCallback(() => emit("reveal", { roomCode }), [roomCode, emit]);

  const reset = useCallback(() => {
    setSelectedVote(null);
    emit("reset", { roomCode });
  }, [roomCode, emit]);

  const toggleAdmin = useCallback(() => {
    emit("toggle-admin", { roomCode });
  }, [roomCode, emit]);

  const toggleSpectator = useCallback(() => {
    emit("toggle-spectator", { roomCode }, (res) => {
      if (res?.success) {
        setRole(res.role);
        if (res.role === "spectator") setSelectedVote(null);
      }
    });
  }, [roomCode, emit]);

  const kick = useCallback(
    (participantName) => emit("kick", { roomCode, participantName }),
    [roomCode, emit]
  );

  const leaveRoom = useCallback(() => {
    emit("leave-room", { roomCode });
    setScreen("lobby");
    setIsBootstrapping(false);
    setRoomCode("");
    setRole("");
    setRoomState(null);
    setSelectedVote(null);
    setJoinCode("");
    window.history.replaceState({}, "", "/");
  }, [roomCode, emit]);

  const changeName = useCallback(
    (newName) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      emit("change-name", { roomCode, newName: trimmed }, () => {
        setUserName(trimmed);
        localStorage.setItem("scrumpoker_name", trimmed);
      });
    },
    [roomCode, emit]
  );

  const myParticipant = roomState?.participants.find(
    (p) => p.sockets?.includes(socketRef.current?.id)
  );

  return {
    screen,
    userName,
    setUserName,
    joinCode,
    roomCode,
    role,
    roomState,
    selectedVote,
    error,
    kickedMessage,
    isBootstrapping,
    myParticipant,
    isAdmin: myParticipant?.isAdmin || false,
    isSpectator: myParticipant?.role === "spectator",
    connectionState,
    joinCode,
    hasInviteCode: !!joinCode,
    roomNameInput,
    setRoomNameInput,
    suggestRoomName,
    createRoom,
    joinRoom,
    vote,
    reveal,
    reset,
    toggleAdmin,
    toggleSpectator,
    kick,
    leaveRoom,
    changeName,
  };
}
