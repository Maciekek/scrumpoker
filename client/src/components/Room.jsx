import { useEffect, useRef } from "react";
import RoomHeader from "./RoomHeader";
import VoteCards from "./VoteCards";
import Results from "./Results";
import ParticipantList from "./ParticipantList";
import { fireConfetti } from "../confetti";
import { useTranslation } from "../i18n";

export default function Room({
  roomCode,
  userName,
  roomState,
  selectedVote,
  isAdmin,
  isSpectator,
  onVote,
  onReveal,
  onReset,
  onKick,
  onChangeName,
  onToggleAdmin,
  onToggleSpectator,
  onLeave,
  connectionState,
}) {
  const prevRevealedRef = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!roomState) return;
    const was = prevRevealedRef.current;
    prevRevealedRef.current = roomState.revealed;

    if (!was && roomState.revealed) {
      const votes = roomState.participants
        .filter((p) => p.vote !== null)
        .map((p) => p.vote);
      if (votes.length > 0 && votes.every((v) => v === votes[0])) {
        fireConfetti();
      }
    }
  }, [roomState]);

  const participants = roomState?.participants || [];
  const revealed = roomState?.revealed || false;
  const hasAnyEstimation = participants.some((p) => p.hasVoted);

  return (
    <div className="app room-layout">
      <RoomHeader
        roomCode={roomCode}
        userName={userName}
        isAdmin={isAdmin}
        isSpectator={isSpectator}
        onChangeName={onChangeName}
        onToggleAdmin={onToggleAdmin}
        onToggleSpectator={onToggleSpectator}
        onLeave={onLeave}
        connectionState={connectionState}
      />

      <div className="two-columns">
        <div className="col-main">
          {!isSpectator && (
            <VoteCards selectedVote={selectedVote} onVote={onVote} />
          )}

          {isAdmin && (
            <div className="admin-actions">
              {!revealed ? (
                <button
                  className="btn-primary"
                  onClick={onReveal}
                  disabled={!hasAnyEstimation}
                >
                  {t("revealCards")}
                </button>
              ) : (
                <button className="btn-secondary" onClick={onReset}>
                  {t("newRound")}
                </button>
              )}
            </div>
          )}

          {revealed && <Results participants={participants} />}
        </div>

        <div className="col-side">
          <ParticipantList
            participants={participants}
            myName={userName}
            isAdmin={isAdmin}
            revealed={revealed}
            onKick={onKick}
          />
        </div>
      </div>
    </div>
  );
}
