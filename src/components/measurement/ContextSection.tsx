import { Moon, Zap, Coffee } from 'lucide-react';
import type { RecordMetadata } from '../../types/measurements';

interface Props {
    metadata: RecordMetadata;
    onChange: (newMetadata: RecordMetadata) => void;
    notes: string;
    onNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

import { useTranslation } from 'react-i18next';

export const ContextSection = ({ metadata, onChange, notes, onNotesChange }: Props) => {
    const { t } = useTranslation();
    return (
        <div className="form-secondary-inputs">
            <section className="form-section context-section glass">
                <h3>{t('common.form.physiological_state')}</h3>
                <div className="context-grid">
                    <div className="condition-selector">
                        <label>{t('common.form.current_condition')}</label>
                        <div className="condition-buttons">
                            <button
                                type="button"
                                className={metadata.condition === 'fasted' ? 'active' : ''}
                                onClick={() => onChange({ ...metadata, condition: 'fasted' })}
                            >
                                <Coffee size={14} /> {t('common.history.conditions.fasted')}
                            </button>
                            <button
                                type="button"
                                className={metadata.condition === 'post_workout' ? 'active' : ''}
                                onClick={() => onChange({ ...metadata, condition: 'post_workout' })}
                            >
                                <Zap size={14} /> {t('common.history.conditions.post_workout')}
                            </button>
                            <button
                                type="button"
                                className={metadata.condition === 'rest_day' ? 'active' : ''}
                                onClick={() => onChange({ ...metadata, condition: 'rest_day' })}
                            >
                                <Moon size={14} /> {t('common.history.conditions.rest_day')}
                            </button>
                        </div>
                    </div>

                    <div className="sleep-input">
                        <label>{t('common.form.sleep_hours')}</label>
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
