import React from 'react';
import { LIMITS, getStatus, getPct } from '../engine/engine.js';

const STATUS_CFG = {
  safe:    { label:'SAFE',     icon:'✅', cls:'badge-safe'     },
  alert:   { label:'ALERT',   icon:'⚠️', cls:'badge-alert'    },
  critical:{ label:'CRITICAL',icon:'🔴', cls:'badge-critical' },
  info:    { label:'INFO',    icon:'ℹ️', cls:'badge-info'     },
  pending: { label:'—',       icon:'⏳', cls:'badge-pending'  },
};

const RESULT_GROUPS = [
  {
    section:'§1.1', title:'Short Circuit Peak Current',
    formula:'Isc = K√2 × Iph / ez',
    rows:[
      { label:'Isc — HV', key:'iscHV', lk:'isc', winding:'HV' },
      { label:'Isc — LV', key:'iscLV', lk:'isc', winding:'LV' },
    ]
  },
  {
    section:'§1.2', title:'Asymmetrical Amp-Turns',
    formula:'AT = N × Isc',
    rows:[
      { label:'N×Isc — HV', key:'atHV', lk:'at', winding:'HV' },
      { label:'N×Isc — LV', key:'atLV', lk:'at', winding:'LV' },
    ]
  },
  {
    section:'§2.0', title:'Hoop Stress',
    formula:'σ = K(cu) × Iph² × Rdc / (hw × ez²)',
    rows:[
      { label:'σ_mean — HV', key:'sigmaHV', lk:'sigma', winding:'HV' },
      { label:'σ_mean — LV', key:'sigmaLV', lk:'sigma', winding:'LV' },
    ]
  },
  {
    section:'§3.0', title:'No. of Supports — LV',
    formula:'Ns = Dmi × √(12×σ_LV/E) / bi',
    rows:[
      { label:'Ns — Calculated', key:'Ns', lk:'ns', winding:null },
    ]
  },
  {
    section:'§4.0', title:'Internal Axial Compression',
    formula:'Fc = 34 × Sn / (ez × hw)',
    rows:[
      { label:'Fc', key:'Fc', lk:'fc', winding:null },
    ]
  },
  {
    section:'§5.0', title:'Compressive Stress in Radial Spacers',
    formula:'P = (Fa + Ks×Fc) / A',
    rows:[
      { label:'PHV — HV Spacer', key:'PHV', lk:'phv', winding:'HV' },
      { label:'PLV — LV Spacer', key:'PLV', lk:'plv', winding:'LV' },
    ]
  },
  {
    section:'§6.0', title:'Axial Bending Stress',
    formula:'σ_b = W × L² × Y / (24 × Io)',
    rows:[
      { label:'Max Fibre Stress — HV', key:'bendHV', lk:'bendHV', winding:'HV' },
      { label:'Max Fibre Stress — LV', key:'bendLV', lk:'bendLV', winding:'LV' },
    ]
  },
  {
    section:'§7.0', title:'Tilting of Conductors',
    formula:'F(crit) = FT + FF',
    rows:[
      { label:'F(crit) — HV', key:'FcritHV', lk:'fc', winding:'HV', tiltKey:'tiltSafeHV' },
      { label:'F(crit) — LV', key:'FcritLV', lk:'fc', winding:'LV', tiltKey:'tiltSafeLV' },
    ]
  },
  {
    section:'§8.0', title:'Bending Stress on Clamping Ring',
    formula:'σ_max = 6π × F × D / (8 × br × t² × n²)',
    rows:[
      { label:'σ_max — Clamping Ring', key:'clamp', lk:'clamp', winding:null },
    ]
  },
  {
    section:'§9.0', title:'Radial Bursting Force',
    formula:'Fr = 2π × σ × Iph × N / δ',
    rows:[
      { label:'Fr — HV', key:'frHV', lk:'frHV', winding:'HV' },
      { label:'Fr — LV', key:'frLV', lk:'frLV', winding:'LV' },
    ]
  },
];

function fmt(v, d=4) {
  if (v === null || !isFinite(v)) return '—';
  return Number(v).toFixed(d);
}

export default function ResultsPage({ results }) {
  const hasAny = Object.values(results).some(v => v !== null && isFinite(v));

  if (!hasAny) return (
    <div className="rp-empty">
      <div className="rp-empty__icon">📋</div>
      <div className="rp-empty__text">No results yet</div>
      <div className="rp-empty__hint">Go to Calculator tab and fill in the inputs</div>
    </div>
  );

  const counts = { safe:0, alert:0, critical:0, info:0, pending:0 };
  RESULT_GROUPS.forEach(g => g.rows.forEach(r => {
    const st = getStatus(results[r.key], r.lk);
    counts[st] = (counts[st]||0)+1;
  }));
  const overall = counts.critical>0?'critical':counts.alert>0?'alert':'safe';

  return (
    <div className="rp-page">
      {/* Overall banner */}
      <div className={`rp-banner rp-banner--${overall}`}>
        <span className="rp-banner__icon">{overall==='critical'?'🔴':overall==='alert'?'⚠️':'✅'}</span>
        <div>
          <div className="rp-banner__label">Overall Design Status</div>
          <div className="rp-banner__status">{overall.toUpperCase()}</div>
        </div>
        <div className="rp-counters">
          <span className="rp-cnt rp-cnt--safe">✅ {counts.safe} Safe</span>
          <span className="rp-cnt rp-cnt--alert">⚠️ {counts.alert} Alert</span>
          <span className="rp-cnt rp-cnt--critical">🔴 {counts.critical} Critical</span>
          <span className="rp-cnt rp-cnt--pending">⏳ {counts.pending} Pending</span>
        </div>
      </div>

      {/* Formula result cards */}
      <div className="rp-grid">
        {RESULT_GROUPS.map((g, gi) => (
          <div className="rp-card" key={gi} style={{animationDelay:`${gi*0.06}s`}}>
            <div className="rp-card__header">
              <span className="rp-card__section">{g.section}</span>
              <div>
                <div className="rp-card__title">{g.title}</div>
                <code className="rp-card__formula">{g.formula}</code>
              </div>
            </div>
            <div className="rp-card__rows">
              {g.rows.map((r, ri) => {
                const val = results[r.key] ?? null;
                const st  = getStatus(val, r.lk);
                const pct = getPct(val, r.lk);
                const cfg = STATUS_CFG[st] ?? STATUS_CFG.pending;
                const m   = LIMITS[r.lk];
                // Special: tilting uses boolean safety
                if (r.tiltKey) {
                  const safe = results[r.tiltKey];
                  const tSt = safe === null ? 'pending' : safe ? 'safe' : 'critical';
                  return (
                    <div key={ri} className={`rp-row rp-row--${tSt}`}>
                      <div className="rp-row__info">
                        {r.winding && <span className={`rp-winding rp-winding--${r.winding.toLowerCase()}`}>{r.winding}</span>}
                        <span className="rp-row__label">{r.label}</span>
                      </div>
                      <div className="rp-row__right">
                        <span className="rp-row__val">{fmt(val,2)} <span className="rp-row__unit">MT</span></span>
                        <span className={`badge ${STATUS_CFG[tSt].cls}`}>{STATUS_CFG[tSt].icon} {STATUS_CFG[tSt].label}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={ri} className={`rp-row rp-row--${st}`}>
                    <div className="rp-row__info">
                      {r.winding && <span className={`rp-winding rp-winding--${r.winding.toLowerCase()}`}>{r.winding}</span>}
                      <span className="rp-row__label">{r.label}</span>
                    </div>
                    <div className="rp-row__right">
                      <span className="rp-row__val">{fmt(val)} <span className="rp-row__unit">{m?.unit||''}</span></span>
                      <span className={`badge ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                    </div>
                    {pct !== null && (
                      <div className="rp-bar-wrap">
                        <div className="rp-bar-track">
                          <div className={`rp-bar-fill rp-bar-fill--${st}`} style={{width:`${pct}%`}}/>
                        </div>
                        <span className="rp-pct">{pct.toFixed(1)}%</span>
                        <span className="rp-limit">/ {m?.limit} {m?.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
