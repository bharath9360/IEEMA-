import React, { useState, useCallback } from 'react';
import { calculateSequential, validateInputs } from './engine/calculations.js';
import { HV_PRESET, LV_PRESET } from './engine/presets.js';
import InputPanel from './components/InputPanel.jsx';
import ResultCard from './components/ResultCard.jsx';
import StressChart from './components/StressChart.jsx';
import VerdictPanel from './components/VerdictPanel.jsx';
import { exportPDF } from './utils/pdfExport.js';

const TABS = [
  { id: 'input',   label: '⚡ Input Engine'  },
  { id: 'results', label: '📊 Results'        },
  { id: 'chart',   label: '📈 Visualization'  },
  { id: 'verdict', label: '🛡️ Final Verdict'  },
];

const RESULT_ORDER = ['Isc', 'AT', 'hoopStress', 'Ns', 'Fc', 'spacerStress', 'bendingStress', 'Fcrit', 'Fr'];

export default function App() {
  const [mode, setMode]         = useState('HV');
  const [inputs, setInputs]     = useState({ ...HV_PRESET });
  const [results, setResults]   = useState(null);       // only set on Submit
  const [errors, setErrors]     = useState([]);         // validation errors
  const [activeTab, setActiveTab] = useState('input');

  // ── HV / LV preset switch ──
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setInputs(newMode === 'HV' ? { ...HV_PRESET } : { ...LV_PRESET });
    setResults(null);
    setErrors([]);
  }, []);

  // ── Field change — store raw string, no calculation ──
  const handleInputChange = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    // Clear errors on edit so user isn't shown stale messages
    setErrors([]);
  }, []);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setInputs(mode === 'HV' ? { ...HV_PRESET } : { ...LV_PRESET });
    setResults(null);
    setErrors([]);
  }, [mode]);

  // ── Submit: validate → calculate sequentially ──
  const handleSubmit = useCallback(() => {
    const validationErrors = validateInputs(inputs);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResults(null);         // clear any previous results
      return;
    }
    setErrors([]);
    const computed = calculateSequential(inputs);
    setResults(computed);
    setActiveTab('results');    // auto-navigate to results
  }, [inputs]);

  // ── PDF export ──
  const handleExport = useCallback(() => {
    if (results) exportPDF(results, inputs, mode);
  }, [results, inputs, mode]);

  const hasResults = results !== null;

  return (
    <div className="app-shell">

      {/* ── Header ── */}
      <header className="header">
        <div className="header__brand">
          <div className="header__icon">⚡</div>
          <div>
            <div className="header__title">Transformer SC Intelligence</div>
            <div className="header__subtitle">9-Layer Physics Engine</div>
          </div>
        </div>
        <div className="header__controls">
          <div className="toggle-group">
            <button id="toggle-hv" className={`toggle-btn ${mode === 'HV' ? 'active' : ''}`} onClick={() => handleModeChange('HV')}>HV</button>
            <button id="toggle-lv" className={`toggle-btn ${mode === 'LV' ? 'active' : ''}`} onClick={() => handleModeChange('LV')}>LV</button>
          </div>
          <button id="btn-reset"  className="btn btn--danger"  onClick={handleReset}>↺ Reset</button>
          <button id="btn-export" className="btn btn--primary" onClick={handleExport} disabled={!hasResults}>📄 Export PDF</button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content" id="pdf-export-target">

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Tab: Input ── */}
        {activeTab === 'input' && (
          <div className="panel">
            <div className="panel__header">
              <span className="panel__title">⚡ Transformer Parameters — {mode} Winding</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                Fill all fields, then click Submit
              </span>
            </div>
            <div className="panel__body">

              {/* Validation error box */}
              {errors.length > 0 && (
                <div id="validation-errors" style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--danger-color)',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                  }}>
                    ❌ VALIDATION ERRORS — Fix before submitting:
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {errors.map((e, i) => (
                      <li key={i} style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        color: 'var(--danger-color)',
                      }}>
                        • {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <InputPanel inputs={inputs} onChange={handleInputChange} />

              {/* Submit Button */}
              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                <button id="btn-submit" className="btn btn--primary" onClick={handleSubmit}
                  style={{ padding: '12px 36px', fontSize: '0.75rem', letterSpacing: '2px' }}>
                  ⚙️ SUBMIT &amp; CALCULATE
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Tab: Results ── */}
        {activeTab === 'results' && (
          <div>
            {hasResults ? (
              <div className="results-grid">
                {RESULT_ORDER.map((key) => (
                  <ResultCard key={key} resultKey={key} value={results[key]} />
                ))}
              </div>
            ) : (
              <div className="panel">
                <div className="empty-state">
                  <div className="empty-state__icon">📊</div>
                  <div className="empty-state__text">No results yet</div>
                  <div className="empty-state__hint">Go to Input Engine and click Submit to run the analysis</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Chart ── */}
        {activeTab === 'chart' && (
          <div className="panel">
            <div className="panel__header">
              <span className="panel__title">📈 Stress vs Permissible Limits</span>
            </div>
            <div className="panel__body">
              {hasResults ? (
                <StressChart results={results} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state__icon">📈</div>
                  <div className="empty-state__text">No data to visualize</div>
                  <div className="empty-state__hint">Submit the analysis first</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Verdict ── */}
        {activeTab === 'verdict' && (
          <div>
            {hasResults ? (
              <VerdictPanel results={results} />
            ) : (
              <div className="panel">
                <div className="empty-state">
                  <div className="empty-state__icon">🛡️</div>
                  <div className="empty-state__text">Verdict not available yet</div>
                  <div className="empty-state__hint">Submit the analysis to see the final verdict</div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <span>Transformer SC Intelligence System</span> — IEEMA Standards · 9-Layer Physics Engine · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
