/**
 * Transformer Short Circuit Mechanical Stress Analysis Engine
 *
 * 9-Layer Physics Engine — Sequential Calculation:
 *   Layer 1: Short Circuit Peak Current (Isc)
 *   Layer 2: Ampere Turns (AT)              ← uses Isc
 *   Layer 3: Hoop Stress (σ_hoop)           ← uses ez
 *   Layer 4: Number of Supports (Ns)        ← uses hoopStress
 *   Layer 5: Axial Compression (Fc)
 *   Layer 6: Spacer Stress (P)              ← uses Fc
 *   Layer 7: Bending Stress (σ_b)
 *   Layer 8: Tilting Stability (Fcrit)
 *   Layer 9: Radial Bursting Force (Fr)     ← uses N (turns)
 */

// ─── Precision Formatter (exactly 4 decimal places) ───
export function fmt4(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.0000';
  return Number(value).toFixed(4);
}

// ─── Input Validator ───
export function validateInputs(data) {
  const required = ['Iph','ez','K2','K','N','Rdc','hw','Dmi','bi','E','Sn','Ks','Fa','A','W','L','Y','Io','FT','FF','r','d'];
  const errors = [];

  for (const key of required) {
    const val = data[key];
    if (val === '' || val === null || val === undefined) {
      errors.push(`Field "${key}" is empty.`);
      continue;
    }
    const num = Number(val);
    if (isNaN(num)) {
      errors.push(`Field "${key}" has a non-numeric value.`);
      continue;
    }
    if (num < 0) {
      errors.push(`Field "${key}" cannot be negative.`);
    }
  }

  return errors;
}

// ─── Sequential Master Calculator ───
// Each step uses outputs from previous steps where applicable.
export function calculateSequential(data) {
  const n = (key) => Number(data[key]);

  // Layer 1 — Short Circuit Peak Current
  // Isc = (K√2 × Iph) / ez
  const Isc = n('ez') === 0 ? 0 : (n('K2') * n('Iph')) / n('ez');

  // Layer 2 — Ampere Turns  [uses Isc from Layer 1]
  // AT = N × Isc
  const AT = n('N') * Isc;

  // Layer 3 — Hoop Stress  [uses ez from inputs]
  // σ = (K × Iph² × Rdc) / (hw × ez²)
  const hoopStress =
    n('hw') === 0 || n('ez') === 0
      ? 0
      : (n('K') * n('Iph') * n('Iph') * n('Rdc')) / (n('hw') * n('ez') * n('ez'));

  // Layer 4 — Number of Supports  [uses hoopStress from Layer 3]
  // Ns = (Dmi / bi) × √(12σ / E)
  const Ns =
    n('bi') === 0 || n('E') === 0
      ? 0
      : (n('Dmi') / n('bi')) * Math.sqrt((12 * hoopStress) / n('E'));

  // Layer 5 — Axial Compression
  // Fc = (34 × Sn) / (ez × hw)
  const Fc =
    n('ez') === 0 || n('hw') === 0
      ? 0
      : (34 * n('Sn')) / (n('ez') * n('hw'));

  // Layer 6 — Spacer Stress  [uses Fc from Layer 5]
  // P = (Fa + Ks × Fc) / A
  const spacerStress =
    n('A') === 0 ? 0 : (n('Fa') + n('Ks') * Fc) / n('A');

  // Layer 7 — Bending Stress
  // σ_b = (W × L² × Y) / (12 × Io)
  const bendingStress =
    n('Io') === 0
      ? 0
      : (n('W') * n('L') * n('L') * n('Y')) / (12 * n('Io'));

  // Layer 8 — Tilting Stability
  // Fcrit = FT + FF
  const Fcrit = n('FT') + n('FF');

  // Layer 9 — Radial Bursting Force  [uses N (turns) from inputs, shares N with Layer 2]
  // Fr = (2π × r × Iph × N) / d
  const Fr =
    n('d') === 0
      ? 0
      : (2 * Math.PI * n('r') * n('Iph') * n('N')) / n('d');

  return { Isc, AT, hoopStress, Ns, Fc, spacerStress, bendingStress, Fcrit, Fr };
}

// ─── Permissible Limits (IEC/Industry Standards) ───
export const LIMITS = {
  Isc:           { unit: 'A',   label: 'Short Circuit Current',  limit: 50000,   warningPct: 0.75 },
  AT:            { unit: 'AT',  label: 'Ampere Turns',           limit: 5000000, warningPct: 0.75 },
  hoopStress:    { unit: 'MPa', label: 'Hoop Stress',            limit: 120,     warningPct: 0.70 },
  Ns:            { unit: '',    label: 'Supports Required',      limit: null,    warningPct: null  },
  Fc:            { unit: 'N',   label: 'Axial Compression',      limit: 50000,   warningPct: 0.75 },
  spacerStress:  { unit: 'MPa', label: 'Spacer Stress',          limit: 40,      warningPct: 0.70 },
  bendingStress: { unit: 'MPa', label: 'Bending Stress',         limit: 80,      warningPct: 0.70 },
  Fcrit:         { unit: 'N',   label: 'Tilting Stability',      limit: null,    warningPct: null  },
  Fr:            { unit: 'N',   label: 'Radial Bursting Force',  limit: 100000,  warningPct: 0.75 },
};

// ─── Status Evaluator ───
export function getStatus(key, value) {
  const meta = LIMITS[key];
  if (!meta || meta.limit === null) return 'info';
  const ratio = value / meta.limit;
  if (ratio >= 1) return 'danger';
  if (ratio >= meta.warningPct) return 'warning';
  return 'safe';
}

// ─── Safety Margin % ───
export function getMargin(key, value) {
  const meta = LIMITS[key];
  if (!meta || meta.limit === null || meta.limit === 0) return null;
  return ((1 - value / meta.limit) * 100).toFixed(1);
}

// ─── AI Suggestions Engine ───
export function generateSuggestions(results) {
  const suggestions = [];

  Object.entries(results).forEach(([key, value]) => {
    const status = getStatus(key, value);
    const meta = LIMITS[key];
    if (!meta) return;

    if (status === 'danger') {
      switch (key) {
        case 'Isc':
          suggestions.push({ severity: 'critical', text: 'Short circuit current exceeds limit. Increase impedance (ez) or reduce phase current.' });
          break;
        case 'hoopStress':
          suggestions.push({ severity: 'critical', text: 'Hoop stress exceeds permissible limit. Consider increasing winding height or using higher-grade copper.' });
          break;
        case 'spacerStress':
          suggestions.push({ severity: 'critical', text: 'Spacer stress is critical. Increase spacer contact area or add more spacers.' });
          break;
        case 'bendingStress':
          suggestions.push({ severity: 'critical', text: 'Bending stress exceeds limit. Reduce span between supports or increase conductor moment of inertia.' });
          break;
        case 'Fr':
          suggestions.push({ severity: 'critical', text: 'Radial bursting force is excessive. Increase winding depth or reduce mean radius.' });
          break;
        case 'Fc':
          suggestions.push({ severity: 'critical', text: 'Axial compression is too high. Improve clamping pressure or increase winding window.' });
          break;
        default:
          suggestions.push({ severity: 'critical', text: `${meta.label} exceeds permissible limit. Review design parameters.` });
      }
    } else if (status === 'warning') {
      suggestions.push({ severity: 'warning', text: `${meta.label} is at ${((value / meta.limit) * 100).toFixed(0)}% of limit. Monitor closely.` });
    }
  });

  if (suggestions.length === 0) {
    suggestions.push({ severity: 'safe', text: 'All parameters within safe operating limits. Design is structurally sound.' });
  }

  return suggestions;
}

// ─── Overall Verdict ───
export function getOverallVerdict(results) {
  const statuses = Object.entries(results).map(([key, val]) => getStatus(key, val));
  if (statuses.includes('danger')) return 'FAIL';
  if (statuses.includes('warning')) return 'RISK';
  return 'SAFE';
}
