import { useTranslation } from "../i18n";

const CARDS = [1, 2, 3, 5, 8, 13, 21, "?"];

export default function VoteCards({ selectedVote, onVote }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="section-label">{t("yourVote")}</div>
      <div className="cards-grid">
        {CARDS.map((n) => (
          <div
            key={n}
            className={`vote-card ${selectedVote === n ? "vote-card--selected" : ""}`}
            onClick={() => onVote(selectedVote === n ? null : n)}
          >
            {n}
          </div>
        ))}
      </div>
    </>
  );
}
