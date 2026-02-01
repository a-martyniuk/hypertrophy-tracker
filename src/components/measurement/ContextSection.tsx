import { Moon, Zap, Coffee } from 'lucide-react';
import type { RecordMetadata } from '../../types/measurements';

interface Props {
    metadata: RecordMetadata;
    onChange: (newMetadata: RecordMetadata) => void;
    notes: string;
    onNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ContextSection = ({ metadata, onChange, notes, onNotesChange }: Props) => {
    return (
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
                                onClick={() => onChange({ ...metadata, condition: 'fasted' })}
                            >
                                <Coffee size={14} /> Ayunas
                            </button>
                            <button
                                type="button"
                                className={metadata.condition === 'post_workout' ? 'active' : ''}
                                onClick={() => onChange({ ...metadata, condition: 'post_workout' })}
                            >
                                <Zap size={14} /> Post-Entreno
                            </button>
                            <button
                                type="button"
                                className={metadata.condition === 'rest_day' ? 'active' : ''}
                                onClick={() => onChange({ ...metadata, condition: 'rest_day' })}
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
                                onChange={(e) => onChange({ ...metadata, sleepHours: parseFloat(e.target.value) || 0 })}
                            />
                            <span>hrs</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="notes-section">
                <label>Observaciones</label>
                <textarea
                    value={notes}
                    onChange={onNotesChange}
                    placeholder="Añade observaciones del registro..."
                />
            </div>
        </div>
    );
};
