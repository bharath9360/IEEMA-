/**
 * Preset configurations for HV and LV transformer windings.
 * These provide sensible defaults to get engineers started quickly.
 */

export const HV_PRESET = {
  label: 'HV Winding',
  Iph: 125.5,
  ez: 0.08,
  K2: 2.55,
  K: 1.8,
  N: 1200,
  Rdc: 0.45,
  hw: 1.2,
  Dmi: 0.85,
  bi: 0.012,
  E: 120000,
  Sn: 800,
  Ks: 1.2,
  Fa: 5000,
  A: 0.004,
  W: 150,
  L: 0.06,
  Y: 0.008,
  Io: 0.00002,
  FT: 15000,
  FF: 8000,
  r: 0.45,
  d: 0.025,
};

export const LV_PRESET = {
  label: 'LV Winding',
  Iph: 1450,
  ez: 0.06,
  K2: 2.55,
  K: 1.8,
  N: 85,
  Rdc: 0.002,
  hw: 1.1,
  Dmi: 0.55,
  bi: 0.015,
  E: 120000,
  Sn: 1200,
  Ks: 1.4,
  Fa: 8000,
  A: 0.006,
  W: 250,
  L: 0.045,
  Y: 0.012,
  Io: 0.00004,
  FT: 22000,
  FF: 12000,
  r: 0.30,
  d: 0.035,
};

export const INPUT_META = [
  { group: 'Electrical Parameters', fields: [
    { key: 'Iph', label: 'Phase Current (Iph)', unit: 'A', tooltip: 'Rated phase current of the winding' },
    { key: 'ez',  label: 'Impedance Voltage (ez)', unit: 'p.u.', tooltip: 'Per-unit impedance voltage (0 to 1)' },
    { key: 'K2',  label: 'Peak Factor (K√2)', unit: '', tooltip: 'Asymmetry peak factor, typically 2.55' },
    { key: 'K',   label: 'Force Constant (K)', unit: '', tooltip: 'Force multiplication constant' },
    { key: 'N',   label: 'Number of Turns', unit: '', tooltip: 'Total turns in the winding' },
    { key: 'Rdc', label: 'DC Resistance (Rdc)', unit: 'Ω', tooltip: 'DC winding resistance at rated temperature' },
  ]},
  { group: 'Geometric Parameters', fields: [
    { key: 'hw',  label: 'Winding Height (hw)', unit: 'm', tooltip: 'Axial height of the winding' },
    { key: 'Dmi', label: 'Mean Diameter (Dmi)', unit: 'm', tooltip: 'Mean diameter of the inner winding' },
    { key: 'bi',  label: 'Insulation Width (bi)', unit: 'm', tooltip: 'Width of insulation spacer' },
    { key: 'r',   label: 'Mean Radius (r)', unit: 'm', tooltip: 'Mean radius of the winding' },
    { key: 'd',   label: 'Winding Depth (d)', unit: 'm', tooltip: 'Radial depth of the winding' },
  ]},
  { group: 'Material Properties', fields: [
    { key: 'E',   label: "Young's Modulus (E)", unit: 'MPa', tooltip: 'Elastic modulus of conductor material' },
    { key: 'Sn',  label: 'Nominal Stress (Sn)', unit: 'N/m²', tooltip: 'Nominal pre-stress in winding' },
  ]},
  { group: 'Structural Parameters', fields: [
    { key: 'Ks',  label: 'Spacer Factor (Ks)', unit: '', tooltip: 'Spacer stress distribution factor' },
    { key: 'Fa',  label: 'Axial Force (Fa)', unit: 'N', tooltip: 'Pre-existing axial force on spacers' },
    { key: 'A',   label: 'Spacer Area (A)', unit: 'm²', tooltip: 'Total spacer contact area' },
    { key: 'W',   label: 'Force per unit (W)', unit: 'N/m', tooltip: 'Distributed force per unit length' },
    { key: 'L',   label: 'Span Length (L)', unit: 'm', tooltip: 'Unsupported span between supports' },
    { key: 'Y',   label: 'Half-depth (Y)', unit: 'm', tooltip: 'Distance from neutral axis to outer fiber' },
    { key: 'Io',  label: 'Moment of Inertia (Io)', unit: 'm⁴', tooltip: 'Second moment of area of conductor' },
  ]},
  { group: 'Stability Parameters', fields: [
    { key: 'FT',  label: 'Tangential Force (FT)', unit: 'N', tooltip: 'Tangential component of electromagnetic force' },
    { key: 'FF',  label: 'Friction Force (FF)', unit: 'N', tooltip: 'Frictional resistance opposing tilting' },
  ]},
];
