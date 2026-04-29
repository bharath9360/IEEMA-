import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { LIMITS, getStatus, getPct } from '../engine/engine.js';

Chart.register(...registerables);

// Stressed results that have limits (for chart)
const CHART_ITEMS = [
  { key:'sigmaHV', lk:'sigma',  label:'Hoop HV'      },
  { key:'sigmaLV', lk:'sigma',  label:'Hoop LV'      },
  { key:'PHV',     lk:'phv',    label:'Spacer HV'    },
  { key:'PLV',     lk:'plv',    label:'Spacer LV'    },
  { key:'bendHV',  lk:'bendHV', label:'Bending HV'   },
  { key:'bendLV',  lk:'bendLV', label:'Bending LV'   },
  { key:'clamp',   lk:'clamp',  label:'Clamp Ring'   },
];

const COLOR = { safe:'rgba(0,230,118,0.75)', alert:'rgba(255,234,0,0.75)', critical:'rgba(255,23,68,0.75)', pending:'rgba(100,130,160,0.4)' };

function GaugeCard({ label, value, limitKey, unit }) {
  const st  = getStatus(value, limitKey);
  const pct = getPct(value, limitKey) ?? 0;
  const m   = LIMITS[limitKey];
  const color = st === 'safe' ? '#00e676' : st === 'alert' ? '#ffea00' : st === 'critical' ? '#ff1744' : '#445566';
  const arc = pct * 1.8;  // 180° arc maps to 100%

  return (
    <div className={`gauge-card gauge-card--${st}`}>
      <div className="gauge-title">{label}</div>
      <svg viewBox="0 0 120 70" width="120" height="70">
        <path d="M10 65 A55 55 0 0 1 110 65" fill="none" stroke="#1a3050" strokeWidth="10" strokeLinecap="round"/>
        <path d="M10 65 A55 55 0 0 1 110 65" fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${Math.min(arc,180)} 180`} opacity="0.85"/>
        <text x="60" y="62" textAnchor="middle" fill={color}
          fontSize="13" fontFamily="JetBrains Mono" fontWeight="700">{pct.toFixed(0)}%</text>
      </svg>
      <div className="gauge-val" style={{color}}>{value !== null && isFinite(value) ? value.toFixed(2) : '—'}</div>
      <div className="gauge-unit">{unit}</div>
      {m?.limit && <div className="gauge-limit">Limit: {m.limit}</div>}
    </div>
  );
}

export default function Dashboard({ results }) {
  const barRef = useRef(null);
  const doughRef = useRef(null);
  const barChart = useRef(null);
  const doughChart = useRef(null);

  const hasAny = Object.values(results).some(v => v !== null && isFinite(v));

  useEffect(() => {
    if (!hasAny) return;

    const items = CHART_ITEMS.filter(i => results[i.key] !== null && isFinite(results[i.key]));
    const labels    = items.map(i => i.label);
    const pcts      = items.map(i => getPct(results[i.key], i.lk) ?? 0);
    const bgColors  = items.map(i => COLOR[getStatus(results[i.key], i.lk)]);

    // Bar chart
    if (barRef.current) {
      if (barChart.current) barChart.current.destroy();
      barChart.current = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '% of Limit',
              data: pcts,
              backgroundColor: bgColors,
              borderRadius: 4,
              barPercentage: 0.6,
            },
            {
              label: 'Limit (100%)',
              data: new Array(items.length).fill(100),
              type: 'line',
              borderColor: 'rgba(255,23,68,0.5)',
              borderDash: [6,4],
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color:'#7b92a8', font:{family:'Inter',size:11} } },
            tooltip: {
              backgroundColor:'#0d1a2d',
              titleColor:'#00e5ff',
              bodyColor:'#dde6f0',
              callbacks: { label: c => ` ${c.dataset.label}: ${typeof c.raw === 'number' ? c.raw.toFixed(1) : c.raw}%` }
            }
          },
          scales: {
            x: { ticks:{color:'#7b92a8'}, grid:{color:'rgba(26,48,80,0.4)'} },
            y: { max:120, ticks:{color:'#7b92a8', callback:v=>v+'%'}, grid:{color:'rgba(26,48,80,0.4)'} }
          }
        }
      });
    }

    // Doughnut chart
    const counts = { safe:0, alert:0, critical:0 };
    CHART_ITEMS.forEach(i => {
      const st = getStatus(results[i.key], i.lk);
      if (st in counts) counts[st]++;
    });
    if (doughRef.current) {
      if (doughChart.current) doughChart.current.destroy();
      doughChart.current = new Chart(doughRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Safe','Alert','Critical'],
          datasets: [{
            data: [counts.safe, counts.alert, counts.critical],
            backgroundColor: ['rgba(0,230,118,0.8)','rgba(255,234,0,0.8)','rgba(255,23,68,0.8)'],
            borderColor: ['#00e676','#ffea00','#ff1744'],
            borderWidth: 2,
          }]
        },
        options: {
          responsive:true, cutout:'68%',
          plugins: {
            legend:{position:'bottom', labels:{color:'#7b92a8', font:{family:'Inter',size:11}}},
          }
        }
      });
    }

    return () => {
      barChart.current?.destroy();
      doughChart.current?.destroy();
    };
  }, [results, hasAny]);

  if (!hasAny) return (
    <div className="rp-empty">
      <div className="rp-empty__icon">📊</div>
      <div className="rp-empty__text">No data yet</div>
      <div className="rp-empty__hint">Fill in formulas on the Calculator tab first</div>
    </div>
  );

  // Summary stat cards
  const stats = [
    { label:'Safe',     val: CHART_ITEMS.filter(i=>getStatus(results[i.key],i.lk)==='safe').length,     cls:'stat--safe'     },
    { label:'Alert',    val: CHART_ITEMS.filter(i=>getStatus(results[i.key],i.lk)==='alert').length,    cls:'stat--alert'    },
    { label:'Critical', val: CHART_ITEMS.filter(i=>getStatus(results[i.key],i.lk)==='critical').length, cls:'stat--critical' },
    { label:'Total Checked', val: CHART_ITEMS.length, cls:'stat--info' },
  ];

  return (
    <div className="dash-page">
      {/* Stat row */}
      <div className="dash-stats">
        {stats.map((s,i) => (
          <div key={i} className={`dash-stat ${s.cls}`}>
            <div className="dash-stat__val">{s.val}</div>
            <div className="dash-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="dash-charts">
        <div className="dash-chart-card">
          <div className="dash-chart-title">Stress Utilization (% of Permissible Limit)</div>
          <div style={{height:'280px', position:'relative'}}>
            <canvas ref={barRef}/>
          </div>
        </div>
        <div className="dash-chart-card">
          <div className="dash-chart-title">Status Distribution</div>
          <div style={{height:'280px', position:'relative'}}>
            <canvas ref={doughRef}/>
          </div>
        </div>
      </div>

      {/* Gauge row */}
      <div className="dash-gauges">
        {CHART_ITEMS.map(i => (
          <GaugeCard
            key={i.key}
            label={i.label}
            value={results[i.key] ?? null}
            limitKey={i.lk}
            unit={LIMITS[i.lk]?.unit || ''}
          />
        ))}
      </div>

      {/* HV vs LV comparison */}
      <div className="dash-compare">
        <div className="dash-compare__title">HV vs LV Comparison</div>
        <div className="dash-compare__grid">
          {[
            { label:'ISC',         hv:results.iscHV,   lv:results.iscLV,   unit:'A'      },
            { label:'Amp-Turns',   hv:results.atHV,    lv:results.atLV,    unit:'A·T'    },
            { label:'Hoop Stress', hv:results.sigmaHV, lv:results.sigmaLV, unit:'kg/cm²' },
            { label:'Spacer Stress',hv:results.PHV,    lv:results.PLV,     unit:'kg/cm²' },
            { label:'Bending',     hv:results.bendHV,  lv:results.bendLV,  unit:'kg/cm²' },
            { label:'Fr (kN)',     hv:results.frHV ? results.frHV/1000 : null, lv:results.frLV ? results.frLV/1000 : null, unit:'kN' },
          ].map((r,i) => (
            <div key={i} className="cmp-row">
              <span className="cmp-label">{r.label}</span>
              <span className="cmp-hv">HV: {r.hv !== null && isFinite(r.hv) ? r.hv.toFixed(2) : '—'}</span>
              <div className="cmp-bar-wrap">
                {r.hv !== null && r.lv !== null && isFinite(r.hv) && isFinite(r.lv) ? (() => {
                  const max = Math.max(r.hv, r.lv, 1);
                  return <>
                    <div className="cmp-bar cmp-bar--hv" style={{width:`${(r.hv/max)*100}%`}}/>
                    <div className="cmp-bar cmp-bar--lv" style={{width:`${(r.lv/max)*100}%`}}/>
                  </>;
                })() : <div className="cmp-bar-empty">No data</div>}
              </div>
              <span className="cmp-lv">LV: {r.lv !== null && isFinite(r.lv) ? r.lv.toFixed(2) : '—'}</span>
              <span className="cmp-unit">{r.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
