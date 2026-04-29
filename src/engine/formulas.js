/**
 * IEEMA Formula Definitions
 * Each formula is self-contained: inputs, constants, formula fn, limits, labels.
 */

// ─── Formula Registry ──────────────────────────────────────────────────────
export const FORMULAS = [
  {
    id: 'F1',
    title: 'Formula 1 — Short Circuit Peak Current (Isc)',
    section: '§1.1',
    description: 'First peak value of short circuit current',
    formulaText: 'Isc = (K√2 × Iph) / ez',
    outputKey: 'Isc',
    outputLabel: 'ISC',
    outputUnit: 'A',
    limit: null,
    inputs: [
      { key: 'Iph', label: 'Phase Current (Iph)', unit: 'A',   tooltip: 'Rated phase current of the winding', isConstant: false },
      { key: 'ez',  label: 'Impedance (ez)',       unit: 'p.u.',tooltip: 'Per-unit impedance voltage',        isConstant: false },
      { key: 'K2',  label: 'Peak Factor (K√2)',    unit: '',    tooltip: 'Asymmetry peak factor — typically 2.55', isConstant: true, defaultVal: 2.55 },
    ],
    compute(vals) {
      const ez = vals.ez;
      if (!ez || ez === 0) return null;
      return (vals.K2 * vals.Iph) / ez;
    },
  },
  {
    id: 'F2',
    title: 'Formula 2 — Ampere Turns (AT)',
    section: '§1.2',
    description: 'Asymmetrical short circuit amp-turns',
    formulaText: 'AT = N × Isc',
    outputKey: 'AT',
    outputLabel: 'N × ISC',
    outputUnit: 'A·turns',
    limit: null,
    inputs: [
      { key: 'N',  label: 'Turns per Phase (N)', unit: '',  tooltip: 'Number of turns per phase in circuit', isConstant: false },
      { key: 'Isc_in', label: 'Isc (from F1)',   unit: 'A', tooltip: 'Short circuit current — auto-filled from F1', isConstant: false },
    ],
    compute(vals) {
      return vals.N * vals.Isc_in;
    },
  },
  {
    id: 'F3',
    title: 'Formula 3 — Hoop Stress (σ_mean)',
    section: '§2.0',
    description: 'Electromagnetic hoop stress in winding conductor',
    formulaText: 'σ = K(cu) × Iph² × Rdc / hw',
    outputKey: 'hoopStress',
    outputLabel: 'σ_mean',
    outputUnit: 'kg/cm²',
    limit: 1250,
    limitLabel: 'Max Permissible: 1250 kg/cm²',
    warningPct: 0.80,
    inputs: [
      { key: 'Kcu', label: 'Force Constant K(cu)', unit: '',     tooltip: 'Material-dependent factor = (K√2)²×0.03/ez²', isConstant: true, defaultVal: 0.03 },
      { key: 'Iph', label: 'Phase Current (Iph)',  unit: 'A',    tooltip: 'Rated phase current of the winding', isConstant: false },
      { key: 'Rdc', label: 'DC Resistance (Rdc)',  unit: 'Ω',    tooltip: 'DC winding resistance at 75°C', isConstant: false },
      { key: 'hw',  label: 'Winding Height (hw)',  unit: 'cm',   tooltip: 'Axial height of winding in cm', isConstant: false },
    ],
    compute(vals) {
      if (!vals.hw || vals.hw === 0) return null;
      return (vals.Kcu * vals.Iph * vals.Iph * vals.Rdc) / vals.hw;
    },
  },
  {
    id: 'F4',
    title: 'Formula 4 — Number of Supports (Ns)',
    section: '§3.0',
    description: 'Number of axial supports required for LV winding',
    formulaText: 'Ns = (Dmi / bi) × √(12 × σ / E)',
    outputKey: 'Ns',
    outputLabel: 'Ns',
    outputUnit: 'nos.',
    limit: null,
    inputs: [
      { key: 'Dmi',      label: 'Mean Dia LV (Dmi)',     unit: 'cm',    tooltip: 'Mean diameter of LV winding in cm', isConstant: false },
      { key: 'bi',       label: 'Insul. Thickness (bi)', unit: 'cm',    tooltip: 'Thickness of inside winding conductor', isConstant: false },
      { key: 'sigma_in', label: 'Hoop Stress σ (F3)',    unit: 'kg/cm²',tooltip: 'Auto-filled from Formula 3', isConstant: false },
      { key: 'E',        label: "Young's Modulus (E)",   unit: 'kg/cm²',tooltip: 'Modulus of elasticity — 1.13×10⁶ for Cu', isConstant: true, defaultVal: 1130000 },
    ],
    compute(vals) {
      if (!vals.bi || vals.bi === 0 || !vals.E || vals.E === 0) return null;
      return (vals.Dmi / vals.bi) * Math.sqrt((12 * vals.sigma_in) / vals.E);
    },
  },
  {
    id: 'F5',
    title: 'Formula 5 — Internal Axial Compression (Fc)',
    section: '§4.0',
    description: 'Internal axial compressive force in winding',
    formulaText: 'Fc = (34 × Sn) / (ez × hw)',
    outputKey: 'Fc',
    outputLabel: 'Fc',
    outputUnit: 'kg',
    limit: null,
    inputs: [
      { key: 'Sn', label: 'Equiv. kVA (Sn)',      unit: 'kVA', tooltip: 'Equivalent kVA (3-phase)', isConstant: false },
      { key: 'ez', label: 'Impedance (ez)',        unit: 'p.u.',tooltip: 'Per-unit impedance voltage', isConstant: false },
      { key: 'hw', label: 'Winding Height (hw)',   unit: 'cm',  tooltip: 'Axial height of winding in cm', isConstant: false },
    ],
    compute(vals) {
      if (!vals.ez || vals.ez === 0 || !vals.hw || vals.hw === 0) return null;
      return (34 * vals.Sn) / (vals.ez * vals.hw);
    },
  },
  {
    id: 'F6',
    title: 'Formula 6 — Compressive Stress in Radial Spacers',
    section: '§5.0',
    description: 'Compressive pressure on radial spacer supports',
    formulaText: 'P = (Fa + Ks × Fc) / A',
    outputKey: 'spacerStress',
    outputLabel: 'P (Stress)',
    outputUnit: 'kg/cm²',
    limit: 500,
    limitLabel: 'Max Permissible: 500 kg/cm²',
    warningPct: 0.80,
    inputs: [
      { key: 'Fa',    label: 'Axial Force (Fa)',     unit: 'kg',    tooltip: 'Total axial force on winding', isConstant: false },
      { key: 'Ks',    label: 'Sharing Factor (Ks)',  unit: '',      tooltip: '% sharing of internal axial compression', isConstant: false },
      { key: 'Fc_in', label: 'Axial Comp. Fc (F5)',  unit: 'kg',    tooltip: 'Auto-filled from Formula 5', isConstant: false },
      { key: 'A',     label: 'Spacer Area (A)',       unit: 'cm²',   tooltip: 'Total support area of radial spacer', isConstant: false },
    ],
    compute(vals) {
      if (!vals.A || vals.A === 0) return null;
      return (vals.Fa + vals.Ks * vals.Fc_in) / vals.A;
    },
  },
  {
    id: 'F7',
    title: 'Formula 7 — Axial Bending Stress in Conductor',
    section: '§6.0',
    description: 'Maximum conductor fibre stress between spacers',
    formulaText: 'σ_b = W × L² × Y / (12 × Io)',
    outputKey: 'bendingStress',
    outputLabel: 'Max Fibre Stress',
    outputUnit: 'kg/cm²',
    limit: 1250,
    limitLabel: 'Max Permissible: 1250 kg/cm²',
    warningPct: 0.80,
    inputs: [
      { key: 'W',  label: 'Axial Bending Force (W)', unit: 'kg',    tooltip: 'Maximum axial bending force', isConstant: false },
      { key: 'L',  label: 'Span Length (L)',          unit: 'cm',    tooltip: 'Span between spacers in cm', isConstant: false },
      { key: 'Y',  label: 'Neutral Axis Dist. (Y)',   unit: 'cm',    tooltip: 'Max distance from neutral axis', isConstant: false },
      { key: 'Io', label: 'Moment of Inertia (Io)',   unit: 'cm⁴',   tooltip: 'Moment of inertia of the coil = m×b×d³/12', isConstant: false },
    ],
    compute(vals) {
      if (!vals.Io || vals.Io === 0) return null;
      return (vals.W * vals.L * vals.L * vals.Y) / (12 * vals.Io);
    },
  },
  {
    id: 'F8',
    title: 'Formula 8 — Tilting of Conductors (F_crit)',
    section: '§7.0',
    description: 'Critical load against conductor tilting (twisting + friction)',
    formulaText: 'F(crit) = FT + FF',
    outputKey: 'Fcrit',
    outputLabel: 'F(crit)',
    outputUnit: 'MT',
    limit: null,
    inputs: [
      { key: 'FT', label: 'Axial Strength — Twisting (FT)', unit: 'MT', tooltip: 'FT = π²×E×m×ac×d×10³/(6R)', isConstant: false },
      { key: 'FF', label: 'Axial Strength — Friction (FF)', unit: 'MT', tooltip: 'FF = ns×bs×m×c×b²×10⁻³/(6d)', isConstant: false },
    ],
    compute(vals) {
      return vals.FT + vals.FF;
    },
  },
  {
    id: 'F9',
    title: 'Formula 9 — Bending Stress on Clamping Ring',
    section: '§8.0',
    description: 'Bending stress in the clamping ring under axial load',
    formulaText: 'σ_max = 6 × F × D / (8 × br × t² × n²)',
    outputKey: 'clampStress',
    outputLabel: 'σ_max',
    outputUnit: 'kg/cm²',
    limit: 1150,
    limitLabel: 'Max Permissible: 1150 kg/cm²',
    warningPct: 0.80,
    inputs: [
      { key: 'F_c',  label: 'Total Axial Force (F)', unit: 'kg',  tooltip: 'Total axial force on clamping ring', isConstant: false },
      { key: 'D_c',  label: 'Mean Diameter (D)',      unit: 'cm',  tooltip: 'Mean diameter of clamping ring', isConstant: false },
      { key: 'br_c', label: 'Ring Width (br)',        unit: 'cm',  tooltip: 'Width of clamping ring', isConstant: false },
      { key: 't_c',  label: 'Ring Thickness (t)',     unit: 'cm',  tooltip: 'Thickness of clamping ring', isConstant: false },
      { key: 'n_c',  label: 'Clamping Points (n)',    unit: '',    tooltip: 'Number of clamping points', isConstant: false },
    ],
    compute(vals) {
      const denom = 8 * vals.br_c * vals.t_c * vals.t_c * vals.n_c * vals.n_c;
      if (!denom || denom === 0) return null;
      return (6 * vals.F_c * vals.D_c) / denom;
    },
  },
  {
    id: 'F10',
    title: 'Formula 10 — Radial Bursting Force (Fr)',
    section: '§9.0',
    description: 'Radial bursting force on winding due to electromagnetic pressure',
    formulaText: 'Fr = 2π × σ × Iph × N / δ',
    outputKey: 'Fr',
    outputLabel: 'Fr',
    outputUnit: 'kg',
    limit: null,
    inputs: [
      { key: 'sigma_r', label: 'Hoop Stress σ (F3)', unit: 'kg/cm²',  tooltip: 'Auto-filled from Formula 3', isConstant: false },
      { key: 'Iph_r',   label: 'Phase Current (Iph)', unit: 'A',       tooltip: 'Rated phase current', isConstant: false },
      { key: 'N_r',     label: 'Turns per Phase (N)', unit: '',         tooltip: 'Turns/phase in circuit', isConstant: false },
      { key: 'delta',   label: 'Current Density (δ)', unit: 'A/cm²',   tooltip: 'Rated current density', isConstant: false },
    ],
    compute(vals) {
      if (!vals.delta || vals.delta === 0) return null;
      return (2 * Math.PI * vals.sigma_r * vals.Iph_r * vals.N_r) / vals.delta;
    },
  },
];

// ─── Get status from value vs limit ────────────────────────────────────────
export function getStatus(value, formula) {
  if (value === null || !isFinite(value)) return 'error';
  if (!formula.limit) return 'info';
  const pct = value / formula.limit;
  if (pct >= 1.0) return 'critical';
  if (pct >= (formula.warningPct ?? 0.85)) return 'alert';
  return 'safe';
}

// ─── Validate a single formula's input set ─────────────────────────────────
export function validateFormula(formulaDef, vals) {
  const errors = {};
  for (const inp of formulaDef.inputs) {
    const v = vals[inp.key];
    if (v === '' || v === null || v === undefined) {
      errors[inp.key] = 'Input Required';
    } else if (isNaN(Number(v))) {
      errors[inp.key] = 'Invalid Value — numbers only';
    } else if (Number(v) < 0) {
      errors[inp.key] = 'Must be ≥ 0';
    }
  }
  return errors;
}
