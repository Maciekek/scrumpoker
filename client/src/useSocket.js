import { useEffect, useRef, useState, useCallback } from "react";
import { createSocket, getRoomCodeFromURL } from "./socket";
import { useTranslation } from "./i18n";

export function useSocket() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState("lobby");
  const [userName, setUserName] = useState(
    () => localStorage.getItem("scrumpoker_name") || ""
  );
  const [joinCode, setJoinCode] = useState(getRoomCodeFromURL);
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [error, setError] = useState("");
  const [kickedMessage, setKickedMessage] = useState("");
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
      setRoomCode("");
      setRole("");
      setRoomState(null);
      setSelectedVote(null);
      setJoinCode("");
      setKickedMessage(t("kickedByAdmin"));
      window.history.replaceState({}, "", "/");
    });

    socket.on("connect", () => {
    });
    });

    return () => socket.disconnect();
  }, []);

  const emit = useCallback(
    (event, data, cb) => socketRef.current?.emit(event, data, cb),
    []
  );

  const createRoom = useCallback(() => {
    const name = userName.trim();
    if (!name) { setError(t("enterYourName")); return; }
    setError("");
    setKickedMessage("");
    localStorage.setItem("scrumpoker_name", name);
    emit("create-room", { userName: name }, (res) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setRole(res.role);
        setScreen("room");
        window.history.replaceState({}, "", `/${res.roomCode}`);
      } else {
        setError(res.error);
      }
    });
  }, [userName, emit]);

  const joinRoom = useCallback(() => {
    const name = userName.trim();
    if (!name) { setError(t("enterYourName")); return; }
    if (!joinCode.trim()) { setError(t("enterRoomCode")); return; }
    setError("");
    setKickedMessage("");
    localStorage.setItem("scrumpoker_name", name);
    emit("join-room", { roomCode: joinCode.trim(), userName: name }, (res) => {
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

  const vote = useCallback(
    (value) => {
      setSelectedVote(value);
      emit("vote", { roomCode, value });
    },
    [roomCode, emit]
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
    myParticipant,
    isAdmin: myParticipant?.isAdmin || false,
    isSpectator: myParticipant?.role === "spectator",
    hasInviteCode: !!joinCode,
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
