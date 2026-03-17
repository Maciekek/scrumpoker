import { useTranslation } from "../i18n";

export default function ParticipantList({
  participants,
  myId,
  isAdmin,
  revealed,
  onKick,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-label">
        {t("participants")} ({participants.length})
      </div>
      <ul className="participant-list">
        {participants.map((p) => (
          <li
            key={p.id}
            className={`participant ${p.id === myId ? "participant--me" : ""}`}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                className={`status-dot ${p.hasVoted ? "status-dot--voted" : "status-dot--pending"}`}
              />
              <span className="participant-name">{p.name}</span>
              {p.isAdmin && <span className="badge badge--admin">{t("admin")}</span>}
              {p.role === "spectator" && (
                <span className="badge badge--spectator">{t("spectatorBadge")}</span>
              )}
              {revealed && p.vote !== null && (
                <span className="revealed-vote">{p.vote}</span>
              )}
            </div>
            {isAdmin && p.id !== myId && (
              <button
                className="btn-small btn-danger"
                onClick={() => onKick(p.id)}
              >
                {t("kick")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
