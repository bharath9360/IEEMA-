import React from 'react';
import { getOverallVerdict, generateSuggestions, getStatus, LIMITS } from '../engine/calculations.js';

const VERDICT_META = {
  SAFE: { icon: '🛡️', desc: 'All parameters are within safe operating limits. The transformer winding design is structurally sound for short circuit conditions.' },
  RISK: { icon: '⚠️', desc: 'Some parameters are approaching permissible limits. Review flagged values and consider design adjustments before proceeding.' },
  FAIL: { icon: '🚨', desc: 'Critical failure detected. One or more parameters exceed permissible limits. Immediate design revision required.' },
};

const SEV_ICONS = { critical: '🔴', warning: '🟡', safe: '🟢' };

export default function VerdictPanel({ results }) {
  if (!results) return null;

  const verdict = getOverallVerdict(results);
  const meta = VERDICT_META[verdict];
  const suggestions = generateSuggestions(results);

  const statuses = Object.entries(results).map(([k, v]) => getStatus(k, v));
  const safeCount = statuses.filter((s) => s === 'safe').length;
  const warnCount = statuses.filter((s) => s === 'warning').length;
  const dangerCount = statuses.filter((s) => s === 'danger').length;
  const infoCount = statuses.filter((s) => s === 'info').length;

  return (
    <div>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__value stat-card__value--safe">{safeCount}</div>
          <div className="stat-card__label">Safe</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value stat-card__value--warning">{warnCount}</div>
          <div className="stat-card__label">Warning</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value stat-card__value--danger">{dangerCount}</div>
          <div className="stat-card__label">Danger</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value stat-card__value--info">{infoCount}</div>
          <div className="stat-card__label">Info</div>
        </div>
      </div>

      {/* Verdict */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="verdict-panel">
          <div className="verdict__icon">{meta.icon}</div>
          <div className={`verdict__status verdict__status--${verdict}`}>{verdict}</div>
          <div className="verdict__desc">{meta.desc}</div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="panel">
        <div className="panel__header">
          <span className="panel__title">🤖 AI Recommendations</span>
        </div>
        <div className="panel__body">
          <ul className="suggestions-list">
            {suggestions.map((s, i) => (
              <li key={i} className={`suggestion-item suggestion-item--${s.severity}`}
                  style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="suggestion-item__icon">{SEV_ICONS[s.severity]}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
