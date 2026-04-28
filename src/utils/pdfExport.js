import jsPDF from 'jspdf';
import { LIMITS, getStatus, getMargin, getOverallVerdict, generateSuggestions, fmt4 } from '../engine/calculations.js';

const LAYER_NAMES = {
  Isc:           'Layer 1 — Short Circuit Current',
  AT:            'Layer 2 — Ampere Turns',
  hoopStress:    'Layer 3 — Hoop Stress',
  Ns:            'Layer 4 — Supports Required',
  Fc:            'Layer 5 — Axial Compression',
  spacerStress:  'Layer 6 — Spacer Stress',
  bendingStress: 'Layer 7 — Bending Stress',
  Fcrit:         'Layer 8 — Tilting Stability',
  Fr:            'Layer 9 — Radial Bursting Force',
};

// Use shared fmt4 for consistent 4-decimal output
const fmt = (v) => fmt4(v);

export function exportPDF(results, inputs, mode) {
  const doc = new jsPDF();
  const verdict = getOverallVerdict(results);
  const suggestions = generateSuggestions(results);
  let y = 15;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 150, 200);
  doc.text('Transformer SC Intelligence Report', 14, y);
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Mode: ${mode}`, 14, y);
  y += 12;

  // Verdict
  doc.setFontSize(14);
  const vc = verdict === 'SAFE' ? [0, 180, 100] : verdict === 'RISK' ? [200, 180, 0] : [220, 20, 60];
  doc.setTextColor(...vc);
  doc.text(`OVERALL VERDICT: ${verdict}`, 14, y);
  y += 12;

  // Results table
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('Analysis Results', 14, y);
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Layer', 14, y);
  doc.text('Value', 85, y);
  doc.text('Limit', 115, y);
  doc.text('Margin', 145, y);
  doc.text('Status', 170, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 5;

  Object.entries(results).forEach(([key, value]) => {
    const meta = LIMITS[key];
    if (!meta) return;
    const status = getStatus(key, value);
    const margin = getMargin(key, value);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(7.5);
    doc.text(LAYER_NAMES[key] || key, 14, y);
    doc.text(`${fmt(value)} ${meta.unit}`, 85, y);
    doc.text(meta.limit !== null ? `${fmt(meta.limit)} ${meta.unit}` : 'N/A', 115, y);
    doc.text(margin !== null ? `${margin}%` : '—', 145, y);

    const sc = status === 'safe' ? [0, 180, 100] : status === 'warning' ? [200, 180, 0] : status === 'danger' ? [220, 20, 60] : [50, 100, 200];
    doc.setTextColor(...sc);
    doc.text(status.toUpperCase(), 170, y);
    y += 7;
  });

  y += 6;

  // Suggestions
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.text('AI Recommendations', 14, y);
  y += 8;

  doc.setFontSize(8);
  suggestions.forEach((s) => {
    const ic = s.severity === 'critical' ? [220, 20, 60] : s.severity === 'warning' ? [200, 180, 0] : [0, 180, 100];
    doc.setTextColor(...ic);
    const lines = doc.splitTextToSize(`• ${s.text}`, 175);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 2;
  });

  // Footer
  y += 10;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Transformer Short Circuit Intelligence System — IEEMA Standards Compliance', 14, y);

  doc.save(`SC_Report_${mode}_${Date.now()}.pdf`);
}
