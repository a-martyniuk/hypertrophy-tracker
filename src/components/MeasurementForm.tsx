import { useState, useEffect, useRef } from 'react';
import type { BodyMeasurements, BilateralMeasurement, MeasurementRecord } from '../types/measurements';
import { Save, X } from 'lucide-react';
import { DynamicSilhouette } from './DynamicSilhouette';

interface Props {
  onSave: (record: MeasurementRecord) => void;
  onCancel: () => void;
  previousRecord?: MeasurementRecord;
  sex?: 'male' | 'female';
}

const TrendIndicator = ({ current, previous }: { current: number; previous?: number }) => {
  if (!previous || current === 0) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return <span className="trend-eq">=</span>;
  return diff > 0 ?
    <span className="trend-up">↑ {diff.toFixed(1)}</span> :
    <span className="trend-down">↓ {Math.abs(diff).toFixed(1)}</span>;
};

const MeasurementInput = ({
  label,
  value,
  onChange,
  id,
  previousValue,
  className
}: {
  label: string;
  value: number | BilateralMeasurement;
  onChange: (val: any) => void;
  id?: string;
  previousValue?: number | BilateralMeasurement;
  className?: string;
}) => {
  const isDouble = typeof value === 'object' && value !== null && 'left' in value;

  if (isDouble) {
    const val = value as BilateralMeasurement;
    const prev = previousValue as BilateralMeasurement | undefined;
    return (
      <div className={`hud-input-group-double ${className || ''}`} id={id}>
        <div className="hud-label-row">
          <label>{label}</label>
          <div className="trends">
            <TrendIndicator current={val.left} previous={prev?.left} />
            <TrendIndicator current={val.right} previous={prev?.right} />
          </div>
        </div>
        <div className="hud-double-inputs">
          <input
            type="number"
            placeholder="Izq"
            className="hud-input-l"
            value={val.left || ''}
            onChange={(e) => onChange({ ...val, left: parseFloat(e.target.value) || 0 })}
          />
          <input
            type="number"
            placeholder="Der"
            className="hud-input-r"
            value={val.right || ''}
            onChange={(e) => onChange({ ...val, right: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`hud-input-group ${className || ''}`} id={id}>
      <div className="hud-label-row">
        <label>{label}</label>
        <TrendIndicator current={value as number} previous={previousValue as number} />
      </div>
      <input
        type="number"
        value={(value as number) || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
};

interface ConnectorLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const MeasurementForm = ({ onSave, onCancel, previousRecord, sex = 'male' }: Props) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const containerRef = useRef<HTMLFormElement>(null);
  const [lines, setLines] = useState<ConnectorLine[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurements>(
    previousRecord?.measurements || {
      weight: 0,
      height: 0,
      bodyFat: 0,
      neck: 0,
      back: 0,
      pecho: 0,
      waist: 0,
      hips: 0,
      arm: { left: 0, right: 0 },
      forearm: { left: 0, right: 0 },
      wrist: { left: 0, right: 0 },
      thigh: { left: 0, right: 0 },
      calf: { left: 0, right: 0 },
      ankle: { left: 0, right: 0 },
    });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let rafId: number;
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: ConnectorLine[] = [];

      const connections = [
        { input: 'input-neck', part: 'junction-neck' },
        { input: 'input-back', part: 'junction-back' },
        { input: 'input-pecho', part: 'junction-pecho' },
        { input: 'input-waist', part: 'junction-waist' },
        { input: 'input-hips', part: 'junction-hips' },
        { input: 'input-arm', part: 'junction-arm-left', side: 'left' },
        { input: 'input-arm', part: 'junction-arm-right', side: 'right' },
        { input: 'input-forearm', part: 'junction-forearm-left', side: 'left' },
        { input: 'input-forearm', part: 'junction-forearm-right', side: 'right' },
        { input: 'input-wrist', part: 'junction-wrist-left', side: 'left' },
        { input: 'input-wrist', part: 'junction-wrist-right', side: 'right' },
        { input: 'input-thigh', part: 'junction-thigh-left', side: 'left' },
        { input: 'input-thigh', part: 'junction-thigh-right', side: 'right' },
        { input: 'input-calf', part: 'junction-calf-left', side: 'left' },
        { input: 'input-calf', part: 'junction-calf-right', side: 'right' },
        { input: 'input-ankle', part: 'junction-ankle-left', side: 'left' },
        { input: 'input-ankle', part: 'junction-ankle-right', side: 'right' },
      ];

      connections.forEach(conn => {
        const inputEl = document.getElementById(conn.input);
        const partEl = document.getElementById(conn.part);

        if (inputEl && partEl) {
          const iRect = inputEl.getBoundingClientRect();
          const pRect = partEl.getBoundingClientRect();

          // Anchor on input box (edge closest to silhouette)
          const isLeft = iRect.left < (containerRect.left + containerRect.width / 2);
          const x1 = isLeft ? iRect.right - containerRect.left : iRect.left - containerRect.left;
          const y1 = iRect.top + iRect.height / 2 - containerRect.top;

          const x2 = pRect.left + pRect.width / 2 - containerRect.left;
          const y2 = pRect.top + pRect.height / 2 - containerRect.top;

          newLines.push({
            id: `${conn.input}-${conn.part}-${conn.side || ''}`,
            x1, y1, x2, y2
          });
        }
      });

      setLines(newLines);
    };

    const debouncedUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateLines);
    };

    const observer = new ResizeObserver(debouncedUpdate);
    if (containerRef.current) {
      observer.observe(containerRef.current);
      // Also observe the SVG specifically if possible
      const svg = document.getElementById('silhouette-svg-root');
      if (svg) observer.observe(svg);
    }

    // Initial triggers
    debouncedUpdate();
    setTimeout(debouncedUpdate, 100);
    setTimeout(debouncedUpdate, 500); // After animations settle

    window.addEventListener('scroll', debouncedUpdate, true);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', debouncedUpdate, true);
    };
  }, [measurements, sex]);


  const updateField = (field: keyof BodyMeasurements, value: any) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: MeasurementRecord = {
      id: crypto.randomUUID(),
      userId: 'default-user',
      date,
      measurements,
      notes,
    };
    onSave(record);
  };
  return (
    <form ref={containerRef} className="measurement-form animate-fade" onSubmit={handleSubmit}>
      <svg className="connector-overlay" style={{ pointerEvents: 'none' }}>
        {lines.map(line => (
          <g key={line.id}>
            <line
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke="#f59e0b"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>

      <header className="form-header glass">
        <div className="header-left">
          <h2>Auditoría Corporal</h2>
          <p className="subtitle">Configura los parámetros del HUD interactivo</p>
        </div>
        <input type="date" className="date-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </header>

      <div className="form-layout-editor">
        <div className="editor-left">
          <section className="form-section">
            <h3>Métricas Core</h3>
            <div className="hud-column">
              <MeasurementInput
                id="input-weight"
                label="PESO"
                value={measurements.weight}
                previousValue={previousRecord?.measurements.weight}
                onChange={(v) => updateField('weight', v)}
              />
              <MeasurementInput
                id="input-height"
                label="TALLA"
                value={measurements.height || 0}
                previousValue={previousRecord?.measurements.height}
                onChange={(v) => updateField('height', v)}
              />
              <MeasurementInput
                id="input-bodyFat"
                label="GRASA%"
                value={measurements.bodyFat || 0}
                previousValue={previousRecord?.measurements.bodyFat}
                onChange={(v) => updateField('bodyFat', v)}
              />
            </div>
          </section>

          <section className="form-section">
            <h3>Tronco</h3>
            <div className="hud-column">
              <MeasurementInput
                id="input-neck"
                label="CUELLO"
                value={measurements.neck}
                previousValue={previousRecord?.measurements.neck}
                onChange={(v) => updateField('neck', v)}
              />
              <MeasurementInput
                id="input-back"
                label="ESPALDA"
                value={measurements.back}
                previousValue={previousRecord?.measurements.back}
                onChange={(v) => updateField('back', v)}
              />
              <MeasurementInput
                id="input-pecho"
                label="PECHO"
                value={measurements.pecho}
                previousValue={previousRecord?.measurements.pecho}
                onChange={(v) => updateField('pecho', v)}
              />
              <MeasurementInput
                id="input-waist"
                label="CINTURA"
                value={measurements.waist}
                previousValue={previousRecord?.measurements.waist}
                onChange={(v) => updateField('waist', v)}
              />
              <MeasurementInput
                id="input-hips"
                label="CADERAS"
                value={measurements.hips}
                previousValue={previousRecord?.measurements.hips}
                onChange={(v) => updateField('hips', v)}
              />
            </div>
          </section>
        </div>

        <div className="editor-center glass">
          <DynamicSilhouette
            measurements={measurements}
            sex={sex}
          />
        </div>

        <div className="editor-right">
          <section className="form-section">
            <h3>Extremidades Sup.</h3>
            <div className="hud-column">
              <MeasurementInput
                id="input-arm"
                label="BRAZO"
                value={measurements.arm}
                previousValue={previousRecord?.measurements.arm}
                onChange={(v) => updateField('arm', v)}
              />
              <MeasurementInput
                id="input-forearm"
                label="ANTEBRAZO"
                value={measurements.forearm}
                previousValue={previousRecord?.measurements.forearm}
                onChange={(v) => updateField('forearm', v)}
              />
              <MeasurementInput
                id="input-wrist"
                label="MUÑECA"
                value={measurements.wrist}
                previousValue={previousRecord?.measurements.wrist}
                onChange={(v) => updateField('wrist', v)}
              />
            </div>
          </section>

          <section className="form-section">
            <h3>Extremidades Inf.</h3>
            <div className="hud-column">
              <MeasurementInput
                id="input-thigh"
                label="MUSLO"
                value={measurements.thigh}
                previousValue={previousRecord?.measurements.thigh}
                onChange={(v) => updateField('thigh', v)}
              />
              <MeasurementInput
                id="input-calf"
                label="PANTORRILLA"
                value={measurements.calf}
                previousValue={previousRecord?.measurements.calf}
                onChange={(v) => updateField('calf', v)}
              />
              <MeasurementInput
                id="input-ankle"
                label="TOBILLO"
                value={measurements.ankle}
                previousValue={previousRecord?.measurements.ankle}
                onChange={(v) => updateField('ankle', v)}
              />
            </div>
          </section>
        </div>
      </div>

      <div className="notes-section">
        <label>System Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Añade observaciones del registro..."></textarea>
      </div>

      <div className="form-actions glass">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          <X size={18} /> Salir
        </button>
        <button type="submit" className="btn-primary">
          <Save size={18} /> Confirmar Registro
        </button>
      </div>

      <style>{`
                .measurement-form {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .connector-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1;
                }
                .form-header {
                    padding: 1.5rem;
                    border-radius: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .subtitle {
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    opacity: 0.8;
                }
                .form-layout-editor {
                    display: grid;
                    grid-template-columns: 280px 1fr 280px;
                    gap: 3rem;
                    align-items: center;
                    z-index: 2;
                }
                .hud-column {
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .hud-input-group, .hud-input-group-double {
                    background: rgba(13, 13, 15, 0.4);
                    border: 1px solid rgba(245, 158, 11, 0.1);
                    border-left: 4px solid #f59e0b;
                    padding: 0.6rem 1rem;
                    border-radius: 4px 12px 12px 4px;
                    transition: var(--transition-smooth);
                    position: relative;
                    z-index: 10;
                    backdrop-filter: blur(5px);
                }
                .hud-input-group:hover, .hud-input-group-double:hover {
                    background: rgba(245, 158, 11, 0.05);
                    border-color: #f59e0b;
                    box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);
                }
                .hud-label-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }
                .hud-label-row label {
                    font-size: 0.65rem;
                    font-weight: bold;
                    color: var(--text-secondary);
                    letter-spacing: 1px;
                }
                .hud-input-group input, .hud-input-group-double input {
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0;
                    padding: 4px 0;
                    font-size: 1.1rem;
                    font-weight: 700;
                    width: 100%;
                    color: white;
                }
                .hud-input-group input:focus, .hud-input-group-double input:focus {
                    outline: none;
                    border-bottom-color: #f59e0b;
                }
                .hud-double-inputs {
                    display: flex;
                    gap: 1rem;
                }
                .hud-input-l { border-bottom-color: rgba(99, 102, 241, 0.3) !important; }
                .hud-input-r { border-bottom-color: rgba(16, 185, 129, 0.3) !important; }

                .trend-up { color: var(--accent-color); font-size: 0.75rem; font-weight: bold; }
                .trend-down { color: #ef4444; font-size: 0.75rem; font-weight: bold; }
                .trend-eq { color: var(--text-secondary); font-size: 0.75rem; }

                .editor-center {
                    padding: 2rem;
                    border-radius: 20px;
                    min-height: 550px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at center, rgba(245, 158, 11, 0.05) 0%, transparent 70%);
                }
                .form-section h3 {
                    font-size: 0.8rem;
                    color: #f59e0b;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    border-bottom: 2px solid rgba(245, 158, 11, 0.2);
                    padding-bottom: 0.5rem;
                    margin-bottom: 0.8rem;
                }

                .date-input {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    padding: 0.6rem 1rem;
                    border-radius: 10px;
                    font-family: inherit;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    outline: none;
                }
                .date-input:focus {
                    border-color: #f59e0b !important;
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
                }
                .date-input::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                    opacity: 0.6;
                }

                .notes-section {
                    margin: 2rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .notes-section label {
                    font-size: 0.7rem;
                    color: #f59e0b;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: bold;
                }
                .notes-section textarea {
                    background: rgba(13, 13, 15, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 1rem;
                    color: white;
                    min-height: 100px;
                    font-family: inherit;
                    resize: vertical;
                    transition: var(--transition-smooth);
                    outline: none;
                    backdrop-filter: blur(5px);
                }
                .notes-section textarea:focus {
                    border-color: #f59e0b;
                    background: rgba(245, 158, 11, 0.03);
                    box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding: 2rem;
                    border-radius: 16px;
                    margin-top: 1rem;
                }
                
                @media (max-width: 1000px) {
                    .form-layout-editor {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }
                    .connector-overlay { display: none; }
                    .editor-center {
                        order: -1;
                        min-height: 300px;
                    }
                }
            `}</style>
    </form>
  );
};
