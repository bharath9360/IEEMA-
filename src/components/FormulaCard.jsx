import React, { useState, useCallback, useMemo } from 'react';
import { getStatus, validateFormula } from '../engine/formulas.js';

const STATUS_CFG = {
  safe:     { label: 'SAFE',     icon: '✅', cls: 'fc-status--safe'     },
  alert:    { label: 'ALERT',    icon: '⚠️', cls: 'fc-status--alert'    },
  critical: { label: 'CRITICAL', icon: '🔴', cls: 'fc-status--critical' },
  info:     { label: 'INFO',     icon: 'ℹ️', cls: 'fc-status--info'     },
  error:    { label: 'ERROR',    icon: '❌', cls: 'fc-status--error'    },
  pending:  { label: '—',        icon: '⏳', cls: 'fc-status--pending'  },
};

export default function FormulaCard({ formula, onResultChange }) {
  // Build initial values: constants pre-filled, others empty
  const initVals = useMemo(() => {
    const v = {};
    formula.inputs.forEach(inp => {
      v[inp.key] = inp.isConstant && inp.defaultVal !== undefined
        ? String(inp.defaultVal)
        : '';
    });
    return v;
  }, [formula.id]);

  const [vals, setVals]     = useState(initVals);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Live compute on every change
  const { result, status, pct } = useMemo(() => {
    // Check if all required fields have values
    const allFilled = formula.inputs.every(inp => {
      const v = vals[inp.key];
      return v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
    });
    if (!allFilled) return { result: null, status: 'pending', pct: 0 };

    const numVals = {};
    formula.inputs.forEach(inp => { numVals[inp.key] = Number(vals[inp.key]); });

    const r = formula.compute(numVals);
    if (r === null || !isFinite(r)) return { result: null, status: 'error', pct: 0 };

    const s = getStatus(r, formula);
    const p = formula.limit ? Math.min((r / formula.limit) * 100, 100) : 0;

    // Propagate result upward
    if (typeof onResultChange === 'function') onResultChange(formula.outputKey, r);

    return { result: r, status: s, pct: p };
  }, [vals]);

  const handleChange = useCallback((key, value) => {
    setVals(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));

    // Validate the single field
    const num = Number(value);
    if (value === '') {
      setErrors(prev => ({ ...prev, [key]: 'Input Required' }));
    } else if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [key]: 'Invalid — numbers only' }));
    } else if (num < 0) {
      setErrors(prev => ({ ...prev, [key]: 'Must be ≥ 0' }));
    } else {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  }, []);

  const handleReset = useCallback(() => {
    setVals(initVals);
    setErrors({});
    setTouched({});
    if (typeof onResultChange === 'function') onResultChange(formula.outputKey, null);
  }, [initVals]);

  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const hasResult = result !== null && isFinite(result);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={`fc-card${hasResult ? ` fc-card--${status}` : ''}`}>

      {/* ── Card Header ── */}
      <div className="fc-header">
        <div className="fc-header__left">
          <span className="fc-section-badge">{formula.section}</span>
          <div>
            <div className="fc-title">{formula.title}</div>
            <div className="fc-desc">{formula.description}</div>
          </div>
        </div>
        <div className="fc-header__right">
          <code className="fc-formula-text">{formula.formulaText}</code>
          <button className="fc-reset-btn" onClick={handleReset} title="Reset fields">↺</button>
        </div>
      </div>

      {/* ── Input Grid ── */}
      <div className="fc-body">
        <div className="fc-inputs-grid">
          {formula.inputs.map(inp => {
            const err = touched[inp.key] ? errors[inp.key] : null;
            return (
              <div className={`fc-field${err ? ' fc-field--error' : ''}${inp.isConstant ? ' fc-field--constant' : ''}`} key={inp.key}>
                <label className="fc-label" htmlFor={`${formula.id}-${inp.key}`}>
                  {inp.label}
                  {inp.isConstant && <span className="fc-const-tag">CONST</span>}
                  {inp.unit && <span className="fc-unit-inline">{inp.unit}</span>}
                </label>
                <input
                  id={`${formula.id}-${inp.key}`}
                  className="fc-input"
                  type="number"
                  step="any"
                  value={vals[inp.key]}
                  disabled={inp.isConstant}
                  placeholder={inp.isConstant ? 'Constant' : 'Enter value…'}
                  onChange={e => handleChange(inp.key, e.target.value)}
                  title={inp.tooltip}
                />
                {err && <div className="fc-field-error">⚠ {err}</div>}
                {!err && inp.tooltip && (
                  <div className="fc-field-hint">{inp.tooltip}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Output Zone ── */}
        <div className={`fc-output-zone fc-output-zone--${status}`}>

          <div className="fc-output-label">
            {formula.outputLabel} =
          </div>

          <div className="fc-output-value">
            {hasResult
              ? result.toFixed(4)
              : status === 'pending' ? '— awaiting inputs —' : 'Calculation Error'}
            {hasResult && <span className="fc-output-unit"> {formula.outputUnit}</span>}
          </div>

          {/* Progress bar vs limit */}
          {formula.limit && hasResult && (
            <div className="fc-limit-zone">
              <div className="fc-limit-text">
                {formula.limitLabel}
                <span className="fc-pct-text">{pct.toFixed(1)}% used</span>
              </div>
              <div className="fc-bar-track">
                <div
                  className={`fc-bar-fill fc-bar-fill--${status}`}
                  style={{ width: `${pct}%` }}
                />
                <div className="fc-bar-danger-marker" style={{ left: '85%' }} title="Alert zone starts" />
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="fc-status-row">
            <span className={`fc-status-badge ${cfg.cls}`}>
              {cfg.icon} {cfg.label}
            </span>
            {formula.limit && hasResult && (
              <span className="fc-margin-text">
                Safety margin: {(100 - pct).toFixed(1)}%
              </span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
