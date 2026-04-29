import React, { useState, useMemo, useCallback } from 'react';
import { computeAll, DEFAULT_INPUTS, getStatus, getPct, LIMITS } from './engine/engine.js';
import ResultsPage from './components/ResultsPage.jsx';
import Dashboard from './components/Dashboard.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────
const STATUS_CFG = {
  safe:    { label:'SAFE',     cls:'badge-safe',    bar:'bar-safe'     },
  alert:   { label:'ALERT',    cls:'badge-alert',   bar:'bar-alert'    },
  critical:{ label:'CRITICAL', cls:'badge-critical',bar:'bar-critical' },
  info:    { label:'INFO',     cls:'badge-info',    bar:'bar-info'     },
  pending: { label:'—',        cls:'badge-pending', bar:''             },
};

function InputBox({ id, label, value, unit, disabled, onChange, error }) {
  return (
    <div className={`ib-wrap${error?' ib-error':''}${disabled?' ib-const':''}`}>
      <label htmlFor={id} className="ib-label">
        {label}
        {disabled && <span className="tag-const">CONST</span>}
        {unit && <span className="ib-unit">{unit}</span>}
      </label>
      <input id={id} type="number" step="any" className="ib-input"
        value={value??''} disabled={disabled}
        placeholder={disabled?'Constant':'Enter…'}
        onChange={e=>onChange&&onChange(e.target.value)}/>
      {error && <div className="ib-err-msg">⚠ {error}</div>}
    </div>
  );
}

function OutputRow({ label, value, unit, statusKey, limitLabel, winding }) {
  const st  = getStatus(value, statusKey);
  const pct = getPct(value, statusKey);
  const cfg = STATUS_CFG[st]??STATUS_CFG.pending;
  return (
    <div className={`out-row${value!==null?` out-row--${st}`:''}`}>
      <div className="out-row__left">
        {winding && <span className={`out-winding out-winding--${winding.toLowerCase()}`}>{winding}</span>}
        <span className="out-label">{label}</span>
      </div>
      <div className="out-row__right">
        <span className="out-val">{value!==null&&isFinite(value)?Number(value).toFixed(4):'—'} <span className="out-unit">{unit}</span></span>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
      </div>
      {pct!==null&&(
        <div className="out-bar-wrap">
          <div className="out-bar-track">
            <div className={`out-bar-fill ${cfg.bar}`} style={{width:`${pct}%`}}/>
            <div className="out-bar-warn-mark"/>
          </div>
          <span className="out-pct">{pct.toFixed(1)}%</span>
          {limitLabel&&<span className="out-limit">{limitLabel}</span>}
        </div>
      )}
    </div>
  );
}

function SectionCard({ id, section, title, formulaText, description, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="sc-card" id={id}>
      <div className="sc-header" onClick={()=>setCollapsed(c=>!c)}>
        <div className="sc-header__left">
          <span className="sc-badge">{section}</span>
          <div>
            <div className="sc-title">{title}</div>
            <code className="sc-formula">{formulaText}</code>
          </div>
        </div>
        <div className="sc-header__right">
          <span className="sc-desc">{description}</span>
          <span className="sc-chevron">{collapsed?'▶':'▼'}</span>
        </div>
      </div>
      {!collapsed&&<div className="sc-body">{children}</div>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [inp, setInp]       = useState({...DEFAULT_INPUTS});
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('calc');

  const set = useCallback((key)=>(val)=>{
    setInp(prev=>({...prev,[key]:val===''?'':val}));
    const num=Number(val);
    if(val==='') setErrors(p=>({...p,[key]:'Required'}));
    else if(isNaN(num)) setErrors(p=>({...p,[key]:'Numbers only'}));
    else setErrors(p=>{const n={...p};delete n[key];return n;});
  },[]);

  const numInp = useMemo(()=>{
    const o={};
    Object.entries(inp).forEach(([k,v])=>{o[k]=v===''?null:Number(v);});
    return o;
  },[inp]);

  const R = useMemo(()=>computeAll(numInp),[numInp]);

  const fld=(key,label,unit,disabled=false)=>(
    <InputBox id={`inp-${key}`} label={label} unit={unit}
      value={inp[key]} disabled={disabled}
      onChange={set(key)} error={errors[key]}/>
  );

  const checkedKeys=[
    {k:'sigmaHV',lk:'sigma'},{k:'sigmaLV',lk:'sigma'},
    {k:'PHV',lk:'phv'},{k:'PLV',lk:'plv'},
    {k:'bendHV',lk:'bendHV'},{k:'bendLV',lk:'bendLV'},
    {k:'clamp',lk:'clamp'}
  ];
  const overall = checkedKeys.map(({k,lk})=>getStatus(R[k],lk)).includes('critical')
    ? 'critical' : checkedKeys.map(({k,lk})=>getStatus(R[k],lk)).includes('alert')
    ? 'alert' : 'safe';

  const TABS=[{id:'calc',label:'⚡ Calculator'},{id:'results',label:'📋 Results'},{id:'dashboard',label:'📊 Dashboard'}];

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header__brand">
          <div className="header__icon">⚡</div>
          <div>
            <div className="header__title">IEEMA Short Circuit Force Calculator</div>
            <div className="header__subtitle">Tesla Transformers (India) Ltd · 50/60 MVA · 110/33 KV · 9-Formula Real-Time Engine</div>
          </div>
        </div>
        <div className="header__right">
          <nav className="header-tabs">
            {TABS.map(t=>(
              <button key={t.id} className={`header-tab${activeTab===t.id?' header-tab--active':''}`}
                onClick={()=>setActiveTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div className={`overall-badge overall-badge--${overall}`}>
            {overall==='critical'?'🔴':overall==='alert'?'⚠️':'✅'} {overall.toUpperCase()}
          </div>
        </div>
      </header>

      <main className="main-content">

        {/* ═══ RESULTS PAGE ═══ */}
        {activeTab==='results' && <ResultsPage results={R}/>}

        {/* ═══ DASHBOARD ═══ */}
        {activeTab==='dashboard' && <Dashboard results={R}/>}

        {/* ═══ CALCULATOR ═══ */}
        {activeTab==='calc' && (
        <div className="calc-page">
          <div className="calc-intro">
            <span className="intro-tag">🔬 Real-Time Calculation — Both HV &amp; LV shown</span>
            <span>Constants are pre-filled and locked. Outputs update instantly as you type.</span>
          </div>

          {/* §1.1 ISC */}
          <SectionCard id="sec11" section="§1.1" title="Short Circuit Peak Current"
            formulaText="Isc = K√2 × Iph / ez" description="HV & LV first peak current (A)">
            <div className="input-grid">
              {fld('iphHV','Phase Current HV (Iph)','A')}
              {fld('iphLV','Phase Current LV (Iph)','A')}
              {fld('K2','Peak Factor K√2','',true)}
              {fld('ez','Impedance (ez)','p.u.',true)}
            </div>
            <OutputRow label="Isc — HV" value={R.iscHV} unit="A" statusKey="isc" winding="HV"/>
            <OutputRow label="Isc — LV" value={R.iscLV} unit="A" statusKey="isc" winding="LV"/>
          </SectionCard>

          {/* §1.2 AT */}
          <SectionCard id="sec12" section="§1.2" title="Asymmetrical Short Circuit Amp-Turns"
            formulaText="AT = N × Isc  ← auto-linked from §1.1" description="A·turns HV & LV">
            <div className="input-grid">
              {fld('nHV','Turns HV (N','')}
              {fld('nLV','Turns LV (N)','')}
            </div>
            <div className="autofill-note">⚡ Isc auto-linked from §1.1</div>
            <OutputRow label="N×Isc — HV" value={R.atHV} unit="A·turns" statusKey="at" winding="HV"/>
            <OutputRow label="N×Isc — LV" value={R.atLV} unit="A·turns" statusKey="at" winding="LV"/>
          </SectionCard>

          {/* §2.0 Hoop Stress */}
          <SectionCard id="sec20" section="§2.0" title="Hoop Stress (σ_mean)"
            formulaText="σ = K(cu) × Iph² × Rdc / (hw × ez²)" description="Limit: 1250 kg/cm²">
            <div className="input-grid">
              {fld('Kcu','Material Factor K(cu)','',true)}
              {fld('hw','Winding Height hw','cm')}
              {fld('rdcHV','Rdc HV @ 75°C','Ω')}
              {fld('rdcLV','Rdc LV @ 75°C','Ω')}
            </div>
            <div className="autofill-note">⚡ Iph & ez auto-linked from §1.1</div>
            <OutputRow label="σ_mean — HV" value={R.sigmaHV} unit="kg/cm²" statusKey="sigma" limitLabel="Limit: 1250" winding="HV"/>
            <OutputRow label="σ_mean — LV" value={R.sigmaLV} unit="kg/cm²" statusKey="sigma" limitLabel="Limit: 1250" winding="LV"/>
          </SectionCard>

          {/* §3.0 Supports */}
          <SectionCard id="sec30" section="§3.0" title="No. of Supports — LV Winding"
            formulaText="Ns = Dmi × √(12×σ_LV/E) / bi" description="σ_LV auto-linked from §2.0">
            <div className="input-grid">
              {fld('Dmi','Mean Diameter LV Dmi','cm')}
              {fld('bi','Insul. Thickness bi','cm')}
              {fld('Emod',"Young's Modulus E",'kg/cm²',true)}
            </div>
            <div className="autofill-note">⚡ σ_LV auto-linked from §2.0</div>
            <OutputRow label="Ns — Required Supports (LV)" value={R.Ns} unit="nos." statusKey="ns"/>
          </SectionCard>

          {/* §4.0 Axial Compression */}
          <SectionCard id="sec40" section="§4.0" title="Internal Axial Compression (Fc)"
            formulaText="Fc = 34 × Sn / (ez × hw)" description="ez & hw auto-linked">
            <div className="input-grid">
              {fld('Sn','Equiv. kVA — 3-phase (Sn)','kVA')}
            </div>
            <div className="autofill-note">⚡ ez & hw auto-linked from §1.1, §2.0</div>
            <OutputRow label="Fc — Axial Compression" value={R.Fc} unit="kg" statusKey="fc"/>
            {R.Fc&&<div className="out-note">= {(R.Fc/1000).toFixed(3)} MT</div>}
          </SectionCard>

          {/* §5.0 Spacer Stress */}
          <SectionCard id="sec50" section="§5.0" title="Compressive Stress in Radial Spacers"
            formulaText="P = (Fa + Ks×Fc) / A" description="Limit: 500 kg/cm²">
            <div className="input-grid">
              {fld('ksHV','Sharing Factor HV (Ks)','')}
              {fld('ksLV','Sharing Factor LV (Ks)','')}
              {fld('Fa','Pre-stress Force Fa','kg')}
              {fld('AHV','HV Spacer Area AHV','cm²')}
              {fld('ALV','LV Spacer Area ALV','cm²')}
            </div>
            <div className="autofill-note">⚡ Fc auto-linked from §4.0</div>
            <OutputRow label="PHV — HV Radial Spacer" value={R.PHV} unit="kg/cm²" statusKey="phv" limitLabel="Limit: 500" winding="HV"/>
            <OutputRow label="PLV — LV Radial Spacer" value={R.PLV} unit="kg/cm²" statusKey="plv" limitLabel="Limit: 500" winding="LV"/>
          </SectionCard>

          {/* §6.0 Axial Bending */}
          <SectionCard id="sec60" section="§6.0" title="Axial Bending Stress in Conductor"
            formulaText="σ_b = W × L² × Y / (24 × Io)  [CORRECTED]" description="Limit: 1250 kg/cm²">
            <div className="input-grid">
              {fld('W_hv','Bending Force W (HV)','kg')}
              {fld('W_lv','Bending Force W (LV)','kg')}
              {fld('L_hv','Span Length L (HV)','cm')}
              {fld('L_lv','Span Length L (LV)','cm')}
              {fld('Y_hv','Neutral Axis Y (HV)','cm')}
              {fld('Y_lv','Neutral Axis Y (LV)','cm')}
              {fld('Io_hv','Moment of Inertia Io (HV)','cm⁴')}
              {fld('Io_lv','Moment of Inertia Io (LV)','cm⁴')}
            </div>
            <OutputRow label="Max Fibre Stress — HV" value={R.bendHV} unit="kg/cm²" statusKey="bendHV" limitLabel="Limit: 1250" winding="HV"/>
            <OutputRow label="Max Fibre Stress — LV" value={R.bendLV} unit="kg/cm²" statusKey="bendLV" limitLabel="Limit: 1250" winding="LV"/>
          </SectionCard>

          {/* §7.0 Tilting */}
          <SectionCard id="sec70" section="§7.0" title="Tilting of Conductors — F(crit)"
            formulaText="F(crit) = FT + FF  [Safety: F(crit) > Ks×Fc]" description="Resistance to tilting">
            <div className="input-grid">
              {fld('FT_hv','Axial Strength FT (HV)','MT')}
              {fld('FF_hv','Friction Force FF (HV)','MT')}
              {fld('FT_lv','Axial Strength FT (LV)','MT')}
              {fld('FF_lv','Friction Force FF (LV)','MT')}
            </div>
            <div className="autofill-note">⚡ Ks & Fc auto-linked from §4.0–§5.0</div>
            <div className="out-row">
              <div className="out-row__left"><span className="out-winding out-winding--hv">HV</span><span className="out-label">F(crit) — HV</span></div>
              <div className="out-row__right">
                <span className="out-val">{R.FcritHV!==null?R.FcritHV.toFixed(2):'—'} <span className="out-unit">MT</span></span>
                <span className={`badge ${R.tiltSafeHV===null?'badge-pending':R.tiltSafeHV?'badge-safe':'badge-critical'}`}>
                  {R.tiltSafeHV===null?'—':R.tiltSafeHV?'SAFE':'CRITICAL'}
                </span>
              </div>
            </div>
            <div className="out-row">
              <div className="out-row__left"><span className="out-winding out-winding--lv">LV</span><span className="out-label">F(crit) — LV</span></div>
              <div className="out-row__right">
                <span className="out-val">{R.FcritLV!==null?R.FcritLV.toFixed(2):'—'} <span className="out-unit">MT</span></span>
                <span className={`badge ${R.tiltSafeLV===null?'badge-pending':R.tiltSafeLV?'badge-safe':'badge-critical'}`}>
                  {R.tiltSafeLV===null?'—':R.tiltSafeLV?'SAFE':'CRITICAL'}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* §8.0 Clamping Ring */}
          <SectionCard id="sec80" section="§8.0" title="Bending Stress on Clamping Ring"
            formulaText="σ_max = 6π × F × D / (8 × br × t² × n²)  [CORRECTED]" description="Limit: 1150 kg/cm²">
            <div className="input-grid">
              {fld('Fclamp','Total Axial Force F','kg')}
              {fld('Dclamp','Mean Diameter D','cm')}
              {fld('brClamp','Ring Width br','cm')}
              {fld('tClamp','Ring Thickness t','cm')}
              {fld('nClamp','Clamping Points n','')}
            </div>
            <OutputRow label="σ_max — Clamping Ring" value={R.clamp} unit="kg/cm²" statusKey="clamp" limitLabel="Limit: 1150"/>
          </SectionCard>

          {/* §9.0 Radial Bursting */}
          <SectionCard id="sec90" section="§9.0" title="Radial Bursting Force (Fr)"
            formulaText="Fr = 2π × σ_mean × Iph × N / δ" description="σ, Iph, N auto-linked">
            <div className="input-grid">
              {fld('deltaHV','Current Density δ (HV)','A/cm²')}
              {fld('deltaLV','Current Density δ (LV)','A/cm²')}
            </div>
            <div className="autofill-note">⚡ σ, Iph, N auto-linked from §1.1, §2.0</div>
            <OutputRow label="Fr — HV" value={R.frHV} unit="kg" statusKey="frHV" winding="HV"/>
            {R.frHV&&<div className="out-note">HV: {(R.frHV/1000).toFixed(3)} MT</div>}
            <OutputRow label="Fr — LV" value={R.frLV} unit="kg" statusKey="frLV" winding="LV"/>
            {R.frLV&&<div className="out-note">LV: {(R.frLV/1000).toFixed(3)} MT</div>}
          </SectionCard>

        </div>
        )}
      </main>

      <footer className="footer">
        <span>IEEMA Short Circuit Force Calculator</span> — Tesla Transformers (India) Ltd · 9-Formula Engine · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
