import { useTranslation } from 'react-i18next';
import { Moon, Zap, Coffee, HelpCircle } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import type { RecordMetadata } from '../../types/measurements';

interface Props {
    metadata: RecordMetadata;
    onChange: (newMetadata: RecordMetadata) => void;
    notes: string;
    onNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ContextSection = ({ metadata, onChange, notes, onNotesChange }: Props) => {
    const { t } = useTranslation();
    return (
        <div className="form-secondary-inputs">
            <section className="form-section context-section glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0 }}>{t('common.form.physiological_state')}</h3>
                    <Tooltip content="El contexto fisiológico en que tomas la medida explica variaciones temporales en el agua corporal y el bombeo muscular." position="top" width="260px">
                        <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help', color: 'var(--primary-color)' }} />
                    </Tooltip>
                </div>
                <div className="context-grid">
                    <div className="condition-selector">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{t('common.form.current_condition')}</span>
                        </label>
                        <div className="condition-buttons">
                            <Tooltip content="Estándar de oro: Medición matutina en ayunas, sin retención digestiva para máxima precisión basal." position="top" width="220px">
                                <button
                                    type="button"
                                    className={metadata.condition === 'fasted' ? 'active' : ''}
                                    onClick={() => onChange({ ...metadata, condition: 'fasted' })}
                                >
                                    <Coffee size={14} /> {t('common.history.conditions.fasted')}
                                </button>
                            </Tooltip>
                            <Tooltip content="Post-entreno: La congestión sanguínea (pump) aumenta los perímetros de 1 a 2.5 cm temporalmente." position="top" width="220px">
                                <button
                                    type="button"
                                    className={metadata.condition === 'post_workout' ? 'active' : ''}
                                    onClick={() => onChange({ ...metadata, condition: 'post_workout' })}
                                >
                                    <Zap size={14} /> {t('common.history.conditions.post_workout')}
                                </button>
                            </Tooltip>
                            <Tooltip content="Día de descanso: Medición en reposo y recuperación muscular." position="top" width="200px">
                                <button
                                    type="button"
                                    className={metadata.condition === 'rest_day' ? 'active' : ''}
                                    onClick={() => onChange({ ...metadata, condition: 'rest_day' })}
                                >
                                    <Moon size={14} /> {t('common.history.conditions.rest_day')}
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="sleep-input">
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>{t('common.form.sleep_hours')}</span>
                            <Tooltip content="Horas de sueño previo: Un descanso óptimo (7-9 hrs) minimiza la retención de cortisol e inflamación." position="top" width="220px">
                                <HelpCircle size={13} style={{ opacity: 0.6, cursor: 'help', color: 'var(--primary-color)' }} />
                            </Tooltip>
                        </label>
                        <div className="sleep-control">
                            <input
                                type="number"
                                inputMode="decimal"
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
                <label>{t('common.form.observations')}</label>
                <textarea
                    value={notes}
                    onChange={onNotesChange}
                    placeholder={t('common.form.observations_placeholder')}
                />
            </div>
        </div>
    );
};
