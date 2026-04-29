import React from 'react';
import { FORMULAS, getStatus } from '../engine/formulas.js';

const STATUS_CFG = {
  safe:     { label: 'SAFE',     icon: '✅', cls: 'sum-badge--safe'     },
  alert:    { label: 'ALERT',    icon: '⚠️', cls: 'sum-badge--alert'    },
  critical: { label: 'CRITICAL', icon: '🔴', cls: 'sum-badge--critical' },
  info:     { label: 'INFO',     icon: 'ℹ️', cls: 'sum-badge--info'     },
  error:    { label: 'ERROR',    icon: '❌', cls: 'sum-badge--error'    },
  pending:  { label: 'PENDING',  icon: '⏳', cls: 'sum-badge--pending'  },
};

export default function SummaryPage({ results }) {
  const entries = FORMULAS.map(f => {
    const val = results[f.outputKey] ?? null;
    const st  = val !== null && isFinite(val) ? getStatus(val, f) : 'pending';
    const pct = (f.limit && val !== null) ? Math.min((val / f.limit) * 100, 100) : null;
    return { f, val, st, pct };
  });

  const counts = { safe: 0, alert: 0, critical: 0, info: 0, pending: 0 };
  entries.forEach(e => { counts[e.st] = (counts[e.st] || 0) + 1; });

  const overallStatus =
    counts.critical > 0 ? 'critical' :
    counts.alert    > 0 ? 'alert'    :
    counts.pending  === entries.length ? 'pending' : 'safe';

  return (
    <div className="sum-page">

      {/* Overall banner */}
      <div className={`sum-overall sum-overall--${overallStatus}`}>
        <div className="sum-overall__icon">
          {overallStatus === 'critical' ? '🔴' : overallStatus === 'alert' ? '⚠️' : overallStatus === 'pending' ? '⏳' : '✅'}
        </div>
        <div>
          <div className="sum-overall__label">Overall Design Status</div>
          <div className="sum-overall__status">{overallStatus.toUpperCase()}</div>
        </div>
        <div className="sum-counters">
          <span className="sum-counter sum-counter--safe">✅ {counts.safe} Safe</span>
          <span className="sum-counter sum-counter--alert">⚠️ {counts.alert} Alert</span>
          <span className="sum-counter sum-counter--critical">🔴 {counts.critical} Critical</span>
          <span className="sum-counter sum-counter--pending">⏳ {counts.pending} Pending</span>
        </div>
      </div>

      {/* Results table */}
      <div className="sum-table-wrap">
        <table className="sum-table">
          <thead>
            <tr>
              <th>§</th>
              <th>Formula</th>
              <th>Output</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Limit</th>
              <th>Usage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ f, val, st, pct }) => {
              const cfg = STATUS_CFG[st] ?? STATUS_CFG.pending;
              return (
                <tr key={f.id} className={`sum-row sum-row--${st}`}>
                  <td className="sum-section">{f.section}</td>
                  <td className="sum-fname">{f.title.replace(/Formula \d+ — /, '')}</td>
                  <td className="sum-outkey">{f.outputLabel}</td>
                  <td className="sum-val">
                    {val !== null && isFinite(val) ? val.toFixed(4) : '—'}
                  </td>
                  <td className="sum-unit">{f.outputUnit}</td>
                  <td className="sum-limit">{f.limit ?? '—'}</td>
                  <td className="sum-pct">
                    {pct !== null ? (
                      <div className="sum-mini-bar">
                        <div className="sum-mini-bar__track">
                          <div className={`sum-mini-bar__fill sum-mini-bar__fill--${st}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`sum-badge ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
