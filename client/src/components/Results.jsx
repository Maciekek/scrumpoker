import { useTranslation } from "../i18n";

function computeResults(participants) {
  const allVotes = participants.filter((p) => p.vote !== null).map((p) => p.vote);
  if (allVotes.length === 0) {
    return { winner: null, consensus: false, distribution: [], total: 0 };
  }

  const counts = {};
  allVotes.forEach((v) => (counts[v] = (counts[v] || 0) + 1));

  const distribution = Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  const top = distribution[0].count;
  const tied = distribution.filter((d) => d.count === top).length > 1;

  return {
    winner: tied ? null : distribution[0].value,
    consensus: !tied,
    distribution,
    total: allVotes.length,
  };
}

export default function Results({ participants }) {
  const { t } = useTranslation();
  const results = computeResults(participants);
  if (results.total === 0) return null;

  return (
    <div className="results-panel">
      <div className="section-label">{t("result")}</div>
      <div
        className={`result-headline ${
          results.consensus ? "result-headline--consensus" : "result-headline--no-consensus"
        }`}
      >
        {results.consensus ? results.winner : t("noConsensus")}
      </div>

      {results.distribution.map((d) => {
        const voters = participants
          .filter((p) => String(p.vote) === String(d.value))
          .map((p) => p.name);

        return (
          <div key={d.value} style={{ marginBottom: 10 }}>
            <div className="result-row">
              <span style={{ fontWeight: 600 }}>
                {d.value}
                {d.value !== "?" && ` ${t("points")}`}
              </span>
              <span style={{ color: "#9ca3af" }}>
                {d.count} {t("person", d.count)}
              </span>
            </div>
            <div className="result-bar-track">
              <div
                className="result-bar-fill"
                style={{ width: `${(d.count / results.total) * 100}%` }}
              />
            </div>
            <div className="result-voters">{voters.join(", ")}</div>
          </div>
        );
      })}
    </div>
  );
}

Results.computeResults = computeResults;
