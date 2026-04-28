import React from 'react';
import { LIMITS, getStatus, getMargin, fmt4 } from '../engine/calculations.js';

const LAYER_NAMES = {
  Isc:           'Layer 1 — Electrical Shock',
  AT:            'Layer 2 — Magnetic Force',
  hoopStress:    'Layer 3 — Hoop Stress',
  Ns:            'Layer 4 — Support Design',
  Fc:            'Layer 5 — Axial Compression',
  spacerStress:  'Layer 6 — Spacer Stress',
  bendingStress: 'Layer 7 — Bending Stress',
  Fcrit:         'Layer 8 — Tilting Stability',
  Fr:            'Layer 9 — Radial Burst',
};

const STATUS_ICONS  = { safe: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
const STATUS_LABELS = { safe: 'Safe', warning: 'Warning', danger: 'Danger', info: 'Info' };

export default function ResultCard({ resultKey, value }) {
  const meta = LIMITS[resultKey];
  if (!meta) return null;

  const status = getStatus(resultKey, value);
  const margin = getMargin(resultKey, value);
  const pct    = meta.limit ? Math.min((value / meta.limit) * 100, 100) : 0;

  return (
    <div className={`result-card result-card--${status}`}>

      {/* Layer label */}
      <div className="result-card__layer">{LAYER_NAMES[resultKey]}</div>

      {/* Parameter name */}
      <div className="result-card__label">{meta.label}</div>

      {/* Calculated value — exactly 4 decimal places */}
      <div className="result-card__value-row">
        <span className="result-card__value">{fmt4(value)}</span>
        <span className="result-card__unit">{meta.unit}</span>
      </div>

      {/* Permissible limit */}
      {meta.limit !== null && (
        <div className="result-card__limit">
          Limit: {fmt4(meta.limit)} {meta.unit}
        </div>
      )}

      {/* Progress bar */}
      {meta.limit !== null && (
        <div className="result-card__bar">
          <div
            className={`result-card__bar-fill result-card__bar-fill--${status}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Status badge + safety margin */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={`result-card__status result-card__status--${status}`}>
          {STATUS_ICONS[status]} {STATUS_LABELS[status]}
        </span>
        {margin !== null && (
          <span className="result-card__margin">Margin: {margin}%</span>
        )}
      </div>

    </div>
  );
}
