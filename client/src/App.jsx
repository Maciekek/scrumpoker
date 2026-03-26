import { useCallback, useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import Lobby from "./components/Lobby";
import Room from "./components/Room";
import "./styles.css";

const THEME_STORAGE_KEY = "scrumpoker-theme";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch {
    // ignore localStorage access issues
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const s = useSocket();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore localStorage access issues
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  if (s.screen === "lobby") {
    return (
      <Lobby
        userName={s.userName}
        onUserNameChange={s.setUserName}
        hasInviteCode={s.hasInviteCode}
        joinCode={s.joinCode}
        onJoin={s.joinRoom}
        onCreate={s.createRoom}
        error={s.error}
        kickedMessage={s.kickedMessage}
        roomNameInput={s.roomNameInput}
        onRoomNameChange={s.setRoomNameInput}
        onSuggestRoomName={s.suggestRoomName}
      />
    );
  }

  return (
    <Room
      roomCode={s.roomCode}
      userName={s.userName}
      roomState={s.roomState}
      selectedVote={s.selectedVote}
      isAdmin={s.isAdmin}
      isSpectator={s.isSpectator}
      onVote={s.vote}
      onReveal={s.reveal}
      onReset={s.reset}
      onKick={s.kick}
      onChangeName={s.changeName}
      onToggleAdmin={s.toggleAdmin}
      onToggleSpectator={s.toggleSpectator}
      onLeave={s.leaveRoom}
      connectionState={s.connectionState}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    />
  );
}
