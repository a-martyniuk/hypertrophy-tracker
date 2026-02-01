import { useState, useEffect, useRef } from 'react';
import type { BodyMeasurements, MeasurementRecord, RecordMetadata } from '../types/measurements';
import { Save, X, Moon, Zap, Coffee, Activity } from 'lucide-react';
import { DynamicSilhouette } from './DynamicSilhouette';
import { PhotoUpload } from './PhotoUpload';
import { useAuth } from '../hooks/useAuth';
import type { BodyPhoto } from '../types/measurements';
import { MeasurementInput } from './measurement/MeasurementInput';
import { MeasurementSection } from './measurement/MeasurementSection';
import { useToast } from './ui/ToastProvider';
import { useMeasurementLines } from '../hooks/useMeasurementLines';

interface Props {
  onSave: (record: MeasurementRecord) => Promise<{ success: boolean; error?: any }>;
  onCancel: () => void;
  previousRecord?: MeasurementRecord; // For trends/comparison only
  recordToEdit?: MeasurementRecord;   // For editing mode
  sex?: 'male' | 'female';
}

interface ConnectorLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const MeasurementForm = ({ onSave, onCancel, previousRecord, recordToEdit, sex = 'male' }: Props) => {
  // DATE: Use edit record date if available, else today (Local Time)
  const [date, setDate] = useState(() => {
    if (recordToEdit?.date) {
      return new Date(recordToEdit.date).toLocaleDateString('en-CA');
    }
    return new Date().toLocaleDateString('en-CA');
  });

  const containerRef = useRef<HTMLFormElement>(null);


  // MEASUREMENTS: Initialize from recordToEdit (Edit Mode) OR previousRecord (Prefill Mode) OR Zeros (Fresh)
  const sourceRecord = recordToEdit || previousRecord;
  const [measurements, setMeasurements] = useState<BodyMeasurements>(
    sourceRecord?.measurements || {
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

  const [notes, setNotes] = useState(recordToEdit?.notes || '');
  const { user } = useAuth();
  const [photos, setPhotos] = useState<BodyPhoto[]>(recordToEdit?.photos || []);
  const [metadata, setMetadata] = useState<RecordMetadata>(recordToEdit?.metadata || {
    condition: 'fasted',
    sleepHours: 8
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    let rafId: number;
    const updateLines = () => {
      if (!containerRef.current) return;

      // Feature Flag: Disable arrows on mobile (<1000px) to prevent clutter
      if (window.innerWidth < 1000) {
        setLines([]);
        return;
      }

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
    window.addEventListener('resize', debouncedUpdate, true); // Added resize listener

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', debouncedUpdate, true);
      window.removeEventListener('resize', debouncedUpdate, true);
    };
  }, [measurements, sex]);


  const updateField = (field: keyof BodyMeasurements, value: any) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: Ensure no negative values
    const flattenedMeasurements = Object.values(measurements).flatMap(v =>
      typeof v === 'object' ? Object.values(v) : [v]
    );

    if (flattenedMeasurements.some(v => typeof v === 'number' && v < 0)) {
      setError("No se admiten valores negativos en las medidas.");
      addToast("No se admiten valores negativos.", "error");
      return;
    }

    setIsSaving(true);
    // CRITICAL FIX: Only use ID if explicitly editing. Otherwise generate NEW ID.
    const record: MeasurementRecord = {
      id: recordToEdit?.id || crypto.randomUUID(),
      userId: user?.id || 'default-user',
      // Convert Local YYYY-MM-DD to ISO string at Local Midnight to preserve day correctness
      date: new Date(`${date}T00:00:00`).toISOString(),
      measurements,
      notes,
      metadata,
      photos,
    };

    try {
      const result = await onSave(record);
      if (!result.success) {
        setError(result.error?.message || "Error al guardar el registro. Inténtalo de nuevo.");
        addToast(result.error?.message || "Error al guardar el registro.", "error");
      } else {
        addToast("Registro guardado correctamente.", "success");
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      const msg = err.message || "Ocurrió un error inesperado al procesar el guardado.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
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
          <MeasurementSection title="Métricas Core">
            <MeasurementInput
              id="input-weight"
              label="PESO"
              value={measurements.weight}
              previousValue={sourceRecord?.measurements.weight}
              onChange={(v) => updateField('weight', v)}
            />
            <MeasurementInput
              id="input-height"
              label="ALTURA"
              value={measurements.height || 0}
              previousValue={sourceRecord?.measurements.height}
              onChange={(v) => updateField('height', v)}
            />
            <MeasurementInput
              id="input-bodyFat"
              label="GRASA%"
              value={measurements.bodyFat || 0}
              previousValue={sourceRecord?.measurements.bodyFat}
              onChange={(v) => updateField('bodyFat', v)}
            />
          </MeasurementSection>

          <MeasurementSection title="Tronco">
            <MeasurementInput
              id="input-neck"
              label="CUELLO"
              value={measurements.neck}
              previousValue={sourceRecord?.measurements.neck}
              onChange={(v) => updateField('neck', v)}
            />
            <MeasurementInput
              id="input-back"
              label="ESPALDA"
              value={measurements.back}
              previousValue={sourceRecord?.measurements.back}
              onChange={(v) => updateField('back', v)}
            />
            <MeasurementInput
              id="input-pecho"
              label="PECHO"
              value={measurements.pecho}
              previousValue={sourceRecord?.measurements.pecho}
              onChange={(v) => updateField('pecho', v)}
            />
            <MeasurementInput
              id="input-waist"
              label="CINTURA"
              value={measurements.waist}
              previousValue={sourceRecord?.measurements.waist}
              onChange={(v) => updateField('waist', v)}
            />
            <MeasurementInput
              id="input-hips"
              label="CADERAS"
              value={measurements.hips}
              previousValue={sourceRecord?.measurements.hips}
              onChange={(v) => updateField('hips', v)}
            />
          </MeasurementSection>
        </div>

        <div className="editor-center glass">
          <DynamicSilhouette
            measurements={measurements}
            sex={sex}
          />
        </div>

        <div className="editor-right">
          <MeasurementSection title="Extremidades Sup.">
            <MeasurementInput
              id="input-arm"
              label="BRAZO"
              value={measurements.arm}
              previousValue={sourceRecord?.measurements.arm}
              onChange={(v) => updateField('arm', v)}
            />
            <MeasurementInput
              id="input-forearm"
              label="ANTEBRAZO"
              value={measurements.forearm}
              previousValue={sourceRecord?.measurements.forearm}
              onChange={(v) => updateField('forearm', v)}
            />
            <MeasurementInput
              id="input-wrist"
              label="MUÑECA"
              value={measurements.wrist}
              previousValue={sourceRecord?.measurements.wrist}
              onChange={(v) => updateField('wrist', v)}
            />
          </MeasurementSection>

          <MeasurementSection title="Extremidades Inf.">
            <MeasurementInput
              id="input-thigh"
              label="MUSLO"
              value={measurements.thigh}
              previousValue={sourceRecord?.measurements.thigh}
              onChange={(v) => updateField('thigh', v)}
            />
            <MeasurementInput
              id="input-calf"
              label="PANTORRILLA"
              value={measurements.calf}
              previousValue={sourceRecord?.measurements.calf}
              onChange={(v) => updateField('calf', v)}
            />
            <MeasurementInput
              id="input-ankle"
              label="TOBILLO"
              value={measurements.ankle}
              previousValue={sourceRecord?.measurements.ankle}
              onChange={(v) => updateField('ankle', v)}
            />
          </MeasurementSection>
        </div>
      </div>

      <div className="form-secondary-inputs">
        <section className="form-section context-section glass">
          <h3>Estado Fisiológico</h3>
          <div className="context-grid">
            <div className="condition-selector">
              <label>Condición Actual</label>
              <div className="condition-buttons">
                <button
                  type="button"
                  className={metadata.condition === 'fasted' ? 'active' : ''}
                  onClick={() => setMetadata(prev => ({ ...prev, condition: 'fasted' }))}
                >
                  <Coffee size={14} /> Ayunas
                </button>
                <button
                  type="button"
                  className={metadata.condition === 'post_workout' ? 'active' : ''}
                  onClick={() => setMetadata(prev => ({ ...prev, condition: 'post_workout' }))}
                >
                  <Zap size={14} /> Post-Entreno
                </button>
                <button
                  type="button"
                  className={metadata.condition === 'rest_day' ? 'active' : ''}
                  onClick={() => setMetadata(prev => ({ ...prev, condition: 'rest_day' }))}
                >
                  <Moon size={14} /> Descanso
                </button>
              </div>
            </div>

            <div className="sleep-input">
              <label>Horas de Sueño</label>
              <div className="sleep-control">
                <input
                  type="number"
                  step="0.5"
                  value={metadata.sleepHours || ''}
                  onChange={(e) => setMetadata(prev => ({ ...prev, sleepHours: parseFloat(e.target.value) || 0 }))}
                />
                <span>hrs</span>
              </div>
            </div>
          </div>
        </section>

        <div className="notes-section">
          <label>Observaciones</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Añade observaciones del registro..."></textarea>
        </div>
      </div>

      <section className="form-section photos-section glass">
        <h3>Fotos de Progreso</h3>
        <PhotoUpload
          userId={user?.id || 'guest'}
          recordId={recordToEdit?.id && recordToEdit.id !== 'new-record' ? recordToEdit.id : (previousRecord?.id || 'new-record')}
          existingPhotos={photos}
          onPhotosUpdated={setPhotos}
        />
      </section>

      {error && (
        <div className="form-error-banner glass animate-fade">
          <Activity size={18} className="text-danger" />
          <span>{error}</span>
        </div>
      )}

      <div className="form-actions glass">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
          <X size={18} /> Salir
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? (
            <>
              <Activity size={18} className="animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save size={18} /> Confirmar Registro
            </>
          )}
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
                    z-index: 5;
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

                .form-secondary-inputs {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 2rem;
                  margin: 1rem 0;
                  z-index: 2;
                }
                .context-section {
                  padding: 1.5rem;
                  border-radius: 16px;
                }
                .context-grid {
                  display: grid;
                  grid-template-columns: 1fr auto;
                  gap: 2rem;
                  align-items: flex-end;
                }
                .condition-selector label, .sleep-input label {
                  display: block;
                  font-size: 0.7rem;
                  color: var(--text-secondary);
                  margin-bottom: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .condition-buttons {
                  display: flex;
                  gap: 0.5rem;
                }
                .condition-buttons button {
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.5rem;
                  padding: 0.6rem 0.8rem;
                  background: rgba(255, 255, 255, 0.05);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 8px;
                  color: var(--text-secondary);
                  font-size: 0.8rem;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }
                .condition-buttons button.active {
                  background: rgba(245, 158, 11, 0.1);
                  border-color: #f59e0b;
                  color: #f59e0b;
                  box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
                }
                .sleep-control {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  background: rgba(255, 255, 255, 0.05);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  padding: 0.2rem 0.75rem;
                  border-radius: 8px;
                }
                .sleep-control input {
                  width: 50px;
                  background: transparent;
                  border: none;
                  color: white;
                  font-weight: bold;
                  text-align: right;
                }
                .sleep-control span {
                   color: var(--text-secondary);
                   font-size: 0.8rem;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding: 2rem;
                    border-radius: 16px;
                    margin-top: 1rem;
                }
                
                .form-error-banner {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-left: 4px solid #ef4444;
                    border-radius: 12px;
                    color: white;
                    margin-bottom: 1rem;
                }
                .text-danger { color: #ef4444; }

                @media (max-width: 1000px) {
                    .form-layout-editor {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }
                    .connector-overlay { display: none; }
                    .editor-center {
                        order: -1;
                        min-height: auto;
                        padding: 1rem;
                        margin-bottom: 1rem;
                    }
                    .hud-column {
                        gap: 1rem;
                    }
                    .form-section {
                        background: rgba(255, 255, 255, 0.03);
                        padding: 1rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .form-actions {
                        justify-content: center;
                        padding: 1.5rem;
                        gap: 1rem;
                    }
                    .form-actions button {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `}</style>
    </form >
  );
};
