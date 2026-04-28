import React from 'react';
import { INPUT_META } from '../engine/presets.js';

export default function InputPanel({ inputs, onChange }) {
  return (
    <div className="input-section">
      {INPUT_META.map((group) => (
        <div className="input-group" key={group.group}>
          <div className="input-group__title">{group.group}</div>
          <div className="input-grid">
            {group.fields.map((field) => (
              <div className="input-field" key={field.key}>
                <label htmlFor={`input-${field.key}`}>{field.label}</label>
                <div className="input-field__wrapper">
                  <input
                    id={`input-${field.key}`}
                    type="number"
                    step="any"
                    name={field.key}
                    value={inputs[field.key] ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                  />
                  {field.unit && <span className="input-field__unit">{field.unit}</span>}
                </div>
                {field.tooltip && (
                  <div className="input-field__tooltip">{field.tooltip}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
