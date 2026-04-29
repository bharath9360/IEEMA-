/**
 * IEEMA Short Circuit Force Calculation Engine
 * Verified against reference: Tesla Transformers 50/60 MVA 110/33 KV
 *
 * Reference checks:
 *  ISC_HV  = 2.55 × 314.92 / 0.1          = 8030.46 A ✓
 *  σ_HV   = 0.03 × 314.92² × 0.314 / (171 × 0.01) = 546.1 kg/cm² ✓
 *  Fc     = 34 × 60000 / (0.1 × 171)       = 119298.2 kg ✓
 *  PLV    = 0.67 × Fc / 495.6              = 161.28 kg/cm² ✓
 *  PHV    = 0.33 × Fc / 1128              =  34.90 kg/cm² ✓
 */

// ── Status thresholds ─────────────────────────────────────────────────────
export const LIMITS = {
  isc:      { label: 'Short Circuit Current',         unit: 'A',      limit: null  },
  at:       { label: 'Ampere Turns',                  unit: 'A·T',    limit: null  },
  sigma:    { label: 'Hoop Stress',                   unit: 'kg/cm²', limit: 1250, warnPct: 0.80 },
  ns:       { label: 'No. of Supports',               unit: 'nos.',   limit: null  },
  fc:       { label: 'Axial Compression',             unit: 'kg',     limit: null  },
  plv:      { label: 'LV Compressive Stress',         unit: 'kg/cm²', limit: 500,  warnPct: 0.80 },
  phv:      { label: 'HV Compressive Stress',         unit: 'kg/cm²', limit: 500,  warnPct: 0.80 },
  bendHV:   { label: 'HV Axial Bending Stress',      unit: 'kg/cm²', limit: 1250, warnPct: 0.80 },
  bendLV:   { label: 'LV Axial Bending Stress',      unit: 'kg/cm²', limit: 1250, warnPct: 0.80 },
  clamp:    { label: 'Clamping Ring Bending Stress',  unit: 'kg/cm²', limit: 1150, warnPct: 0.80 },
  frHV:     { label: 'HV Radial Bursting Force',      unit: 'kg',     limit: null  },
  frLV:     { label: 'LV Radial Bursting Force',      unit: 'kg',     limit: null  },
};

export function getStatus(value, key) {
  if (value === null || !isFinite(value)) return 'pending';
  const m = LIMITS[key];
  if (!m || !m.limit) return 'info';
  const pct = value / m.limit;
  if (pct >= 1.0)          return 'critical';
  if (pct >= (m.warnPct ?? 0.85)) return 'alert';
  return 'safe';
}

export function getPct(value, key) {
  const m = LIMITS[key];
  if (!m || !m.limit || value === null) return null;
  return Math.min((value / m.limit) * 100, 100);
}

// ── Master compute — takes all inputs, returns all results ────────────────
export function computeAll(inp) {
  const n = (k) => {
    const v = Number(inp[k]);
    return isNaN(v) ? null : v;
  };

  const safe = (v) => (v === null || !isFinite(v) ? null : v);

  // §1.1 — ISC = K2 × Iph / ez
  const ez  = n('ez');   // constant 0.1
  const K2  = n('K2');   // constant 2.55
  const iphHV = n('iphHV');
  const iphLV = n('iphLV');

  const iscHV = safe(ez && ez !== 0 ? (K2 * iphHV) / ez : null);
  const iscLV = safe(ez && ez !== 0 ? (K2 * iphLV) / ez : null);

  // §1.2 — AT = N × ISC
  const nHV = n('nHV');
  const nLV = n('nLV');
  const atHV = safe(nHV !== null && iscHV !== null ? nHV * iscHV : null);
  const atLV = safe(nLV !== null && iscLV !== null ? nLV * iscLV : null);

  // §2.0 — σ_mean = Kcu × Iph² × Rdc / (hw × ez²)
  // Kcu = 0.03 (constant), verified: gives 546.4 HV, 455.0 LV
  const Kcu  = n('Kcu');   // 0.03
  const hw   = n('hw');    // winding height cm
  const rdcHV = n('rdcHV');
  const rdcLV = n('rdcLV');
  const ez2  = ez !== null ? ez * ez : null;

  const sigmaHV = safe(hw && hw !== 0 && ez2 && ez2 !== 0
    ? (Kcu * iphHV * iphHV * rdcHV) / (hw * ez2)
    : null);
  const sigmaLV = safe(hw && hw !== 0 && ez2 && ez2 !== 0
    ? (Kcu * iphLV * iphLV * rdcLV) / (hw * ez2)
    : null);

  // §3.0 — Ns = Dmi × √(12 × σ_LV / E) / bi
  const Dmi  = n('Dmi');
  const bi   = n('bi');
  const Emod = n('Emod');  // 1.13×10⁶ for Cu
  const Ns = safe(bi && bi !== 0 && Emod && Emod !== 0 && sigmaLV !== null
    ? (Dmi / bi) * Math.sqrt((12 * sigmaLV) / Emod)
    : null);

  // §4.0 — Fc = 34 × Sn / (ez × hw)   [magnitude, compressive]
  const Sn = n('Sn');
  const Fc = safe(ez && ez !== 0 && hw && hw !== 0
    ? (34 * Sn) / (ez * hw)
    : null);

  // §5.0 — PLV = Ks_lv × Fc / ALV,  PHV = Ks_hv × Fc / AHV
  const ksHV = n('ksHV');   // sharing factor HV (e.g. 0.33)
  const ksLV = n('ksLV');   // sharing factor LV (e.g. 0.67)
  const ALV  = n('ALV');
  const AHV  = n('AHV');
  const Fa   = n('Fa');     // additional pre-stress (default 0)

  const PLV = safe(ALV && ALV !== 0 && Fc !== null
    ? ((Fa ?? 0) + ksLV * Fc) / ALV
    : null);
  const PHV = safe(AHV && AHV !== 0 && Fc !== null
    ? ((Fa ?? 0) + ksHV * Fc) / AHV
    : null);

  // §6.0 — Axial Bending Stress: σ_b = W × L² × Y / (24 × Io)
  // CORRECTED: denominator=24 (fixed-end beam). Verified: 274.830 HV ✓, 347.858 LV ✓
  const W_hv = n('W_hv'), L_hv = n('L_hv'), Y_hv = n('Y_hv'), Io_hv = n('Io_hv');
  const bendHV = safe(Io_hv && Io_hv !== 0
    ? (W_hv * L_hv * L_hv * Y_hv) / (24 * Io_hv)
    : null);
  // LV values
  const W_lv = n('W_lv'), L_lv = n('L_lv'), Y_lv = n('Y_lv'), Io_lv = n('Io_lv');
  const bendLV = safe(Io_lv && Io_lv !== 0
    ? (W_lv * L_lv * L_lv * Y_lv) / (24 * Io_lv)
    : null);

  // §7.0 — Tilting: F_crit = FT + FF (HV & LV)
  const FT_hv = n('FT_hv'), FF_hv = n('FF_hv');
  const FT_lv = n('FT_lv'), FF_lv = n('FF_lv');
  const FcritHV = safe(FT_hv !== null && FF_hv !== null ? FT_hv + FF_hv : null);
  const FcritLV = safe(FT_lv !== null && FF_lv !== null ? FT_lv + FF_lv : null);
  // Safety check: F_crit > Ks × Fc
  const tiltSafeHV = FcritHV !== null && Fc !== null ? FcritHV > ksHV * Fc : null;
  const tiltSafeLV = FcritLV !== null && Fc !== null ? FcritLV > ksLV * Fc : null;

  // §8.0 — Clamping Ring: σ_max = 6π × F × D / (8 × br × t² × n²)
  // CORRECTED: π in numerator. Verified: 6π×39368.42×94.5/(8×21.5×25×64)=254.819 ✓
  const Fclamp = n('Fclamp');
  const Dclamp = n('Dclamp');
  const brClamp = n('brClamp');
  const tClamp  = n('tClamp');
  const nClamp  = n('nClamp');
  const denom8  = brClamp !== null && tClamp !== null && nClamp !== null
    ? 8 * brClamp * tClamp * tClamp * nClamp * nClamp
    : null;
  const clamp = safe(denom8 && denom8 !== 0 && Fclamp !== null && Dclamp !== null
    ? (6 * Math.PI * Fclamp * Dclamp) / denom8
    : null);

  // §9.0 — Radial Bursting: Fr = 2π × σ × Iph × N / δ
  const deltaHV = n('deltaHV');
  const deltaLV = n('deltaLV');
  const frHV = safe(deltaHV && deltaHV !== 0 && sigmaHV !== null
    ? (2 * Math.PI * sigmaHV * iphHV * nHV) / deltaHV
    : null);
  const frLV = safe(deltaLV && deltaLV !== 0 && sigmaLV !== null
    ? (2 * Math.PI * sigmaLV * iphLV * nLV) / deltaLV
    : null);

  return {
    iscHV, iscLV,
    atHV, atLV,
    sigmaHV, sigmaLV,
    Ns,
    Fc,
    PLV, PHV,
    bendHV, bendLV,
    FcritHV, FcritLV, tiltSafeHV, tiltSafeLV,
    clamp,
    frHV, frLV,
  };
}

// ── Default input values (reference transformer) ──────────────────────────
export const DEFAULT_INPUTS = {
  // §1.1 — §1.2
  iphHV: 314.92, iphLV: 1049.73,
  ez: 0.100,     K2: 2.55,
  nHV: 507,      nLV: 152,
  // §2.0
  Kcu: 0.03,     hw: 171.0,
  rdcHV: 0.3140, rdcLV: 0.02353,
  // §3.0
  Dmi: 78.9,     bi: 1.25,   Emod: 1130000,
  // §4.0
  Sn: 60000,
  // §5.0
  ksHV: 0.33,    ksLV: 0.67,
  Fa: 0,
  ALV: 495.6,    AHV: 1128,
  // §6.0 HV
  W_hv: 117.55,  L_hv: 8.954, Y_hv: 0.61,  Io_hv: 0.872,
  // §6.0 LV
  W_lv: 322.46,  L_lv: 6.828, Y_lv: 0.735, Io_lv: 1.32,
  // §7.0
  FT_hv: 74990.49,  FF_hv: 33.99,
  FT_lv: 300512.38, FF_lv: 18.60,
  // §8.0
  Fclamp: 39368.42, Dclamp: 94.5, brClamp: 21.5, tClamp: 5, nClamp: 8,
  // §9.0
  deltaHV: 280, deltaLV: 310,
};
