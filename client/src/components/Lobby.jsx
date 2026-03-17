import { useTranslation } from "../i18n";

export default function Lobby({
  userName,
  onUserNameChange,
  hasInviteCode,
  onJoin,
  onCreate,
  error,
  kickedMessage,
}) {
  const { t } = useTranslation();
  const handleSubmit = hasInviteCode ? onJoin : onCreate;

  return (
    <div className="app">
      <h1 className="heading">Scrum Poker</h1>
      <div className="lobby-card">
        {kickedMessage && <div className="alert">{kickedMessage}</div>}
        {error && <div className="alert">{error}</div>}
        <input
          className="input"
          placeholder={t("yourName")}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button className="btn-primary" onClick={handleSubmit}>
          {hasInviteCode ? t("joinRoom") : t("createRoom")}
        </button>
      </div>
    </div>
  );
}
