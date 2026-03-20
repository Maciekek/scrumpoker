import { useEffect } from "react";
import { useTranslation } from "../i18n";

export default function Lobby({
  userName,
  onUserNameChange,
  hasInviteCode,
  joinCode,
  onJoin,
  onCreate,
  error,
  kickedMessage,
  roomNameInput,
  onRoomNameChange,
  onSuggestRoomName,
}) {
  const { t } = useTranslation();
  const handleSubmit = hasInviteCode ? onJoin : onCreate;

  useEffect(() => {
    if (!hasInviteCode && onSuggestRoomName) {
      onSuggestRoomName();
    }
  }, [hasInviteCode]);

  return (
    <div className="app">
      <h1 className="heading">Scrum Poker</h1>
      <div className="lobby-card">
        {kickedMessage && <div className="alert">{kickedMessage}</div>}
        {error && <div className="alert">{error}</div>}
        {hasInviteCode && (
          <div style={{
            textAlign: "center",
            marginBottom: 16,
            fontSize: 14,
            color: "#6b7280",
          }}>
            {t("joiningRoom")}{" "}
            <strong style={{ color: "#111827" }}>{joinCode}</strong>
          </div>
        )}
        <input
          className="input"
          placeholder={t("yourName")}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {!hasInviteCode && (
          <input
            className="input"
            placeholder={t("roomName")}
            value={roomNameInput || ""}
            onChange={(e) => onRoomNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        )}
        <button className="btn-primary" onClick={handleSubmit}>
          {hasInviteCode ? t("joinRoom") : t("createRoom")}
        </button>
      </div>
    </div>
  );
}
