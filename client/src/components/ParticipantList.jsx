import { useTranslation } from "../i18n";

export default function ParticipantList({
  participants,
  myName,
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
            key={p.name}
            className={`participant ${p.name === myName ? "participant--me" : ""}`}
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
                <span className="revealed-vote">
                  {p.voteHistory?.length > 0 && (
                    <span className="vote-history">
                      {p.voteHistory.join(" → ")} →{" "}
                    </span>
                  )}
                  {p.vote}
                </span>
              )}
            </div>
            {isAdmin && p.name !== myName && (
              <button
                className="btn-small btn-danger"
                onClick={() => onKick(p.name)}
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
