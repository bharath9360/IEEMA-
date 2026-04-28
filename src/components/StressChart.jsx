import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { LIMITS, getStatus } from '../engine/calculations.js';

Chart.register(...registerables);

const CHART_KEYS = ['Isc', 'hoopStress', 'Fc', 'spacerStress', 'bendingStress', 'Fr'];

const STATUS_COLORS = {
  safe: 'rgba(0, 230, 118, 0.8)',
  warning: 'rgba(255, 234, 0, 0.8)',
  danger: 'rgba(255, 23, 68, 0.8)',
  info: 'rgba(41, 121, 255, 0.8)',
};

export default function StressChart({ results }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!results || !canvasRef.current) return;

    const labels = [];
    const values = [];
    const limits = [];
    const bgColors = [];

    CHART_KEYS.forEach((key) => {
      const meta = LIMITS[key];
      if (!meta || meta.limit === null) return;
      labels.push(meta.label);
      const pct = Math.min((results[key] / meta.limit) * 100, 150);
      values.push(pct);
      limits.push(100);
      bgColors.push(STATUS_COLORS[getStatus(key, results[key])]);
    });

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Calculated (% of Limit)',
            data: values,
            backgroundColor: bgColors,
            borderColor: bgColors.map((c) => c.replace('0.8', '1')),
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Permissible Limit (100%)',
            data: limits,
            type: 'line',
            borderColor: 'rgba(255, 23, 68, 0.6)',
            borderDash: [8, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#7b8fa3',
              font: { family: "'Share Tech Mono', monospace", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#0d1b2a',
            titleColor: '#00e5ff',
            bodyColor: '#e0e6ed',
            borderColor: '#1a3050',
            borderWidth: 1,
            titleFont: { family: "'Orbitron', sans-serif", size: 11 },
            bodyFont: { family: "'Share Tech Mono', monospace", size: 12 },
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#7b8fa3', font: { family: "'Rajdhani', sans-serif", size: 11 }, maxRotation: 30 },
            grid: { color: 'rgba(26, 48, 80, 0.4)' },
          },
          y: {
            ticks: { color: '#7b8fa3', font: { family: "'Share Tech Mono', monospace", size: 11 }, callback: (v) => v + '%' },
            grid: { color: 'rgba(26, 48, 80, 0.4)' },
            max: 150,
          },
        },
      },
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [results]);

  return (
    <div className="chart-container" style={{ height: '380px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
