import { useSocket } from "./useSocket";
import Lobby from "./components/Lobby";
import Room from "./components/Room";
import "./styles.css";

export default function App() {
  const s = useSocket();

  if (s.screen === "lobby") {
    return (
      <Lobby
        userName={s.userName}
        onUserNameChange={s.setUserName}
        hasInviteCode={s.hasInviteCode}
        onJoin={s.joinRoom}
        onCreate={s.createRoom}
        error={s.error}
        kickedMessage={s.kickedMessage}
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
      myId={s.myParticipant?.id}
      onVote={s.vote}
      onReveal={s.reveal}
      onReset={s.reset}
      onKick={s.kick}
      onChangeName={s.changeName}
      onToggleAdmin={s.toggleAdmin}
      onToggleSpectator={s.toggleSpectator}
      onLeave={s.leaveRoom}
    />
  );
}
