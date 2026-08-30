import type { MeasurementRecord, MeasurementCondition } from '../types/measurements';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronRight, Trash2, Moon, TestTube, Zap, Coffee, Scale, Activity } from 'lucide-react';

interface Props {
  records: MeasurementRecord[];
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSelect: (record: MeasurementRecord) => void;
}

import './HistoryView.css';

export const HistoryView = ({ records, onDelete, onSelect }: Props) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const CONDITION_MAP: Record<MeasurementCondition, { label: string; icon: React.ReactNode; color: string }> = {
    fasted: { label: t('common.history.conditions.fasted'), icon: <TestTube size={14} />, color: '#60a5fa' },
    post_workout: { label: t('common.history.conditions.post_workout'), icon: <Zap size={14} />, color: '#fbbf24' },
    rest_day: { label: t('common.history.conditions.rest_day'), icon: <Coffee size={14} />, color: '#a3a3a3' }
  };

  if (records.length === 0) {
    return (
      <div className="history-view animate-fade">
        <div className="view-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
              <Calendar size={24} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('common.history.title')}</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Registro cronológico y trazabilidad de todas tus auditorías antropométricas.
            </p>
          </div>
        </div>

        <div className="empty-history">
          <Activity size={40} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
            {t('common.history.empty')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Registra tu primera medición en "Nueva Medida" para comenzar tu historial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-view animate-fade">
      <div className="view-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
            <Calendar size={24} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('common.history.title')}</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Registro cronológico y trazabilidad de todas tus auditorías antropométricas.
          </p>
        </div>
        <span className="record-count">{records.length} {t('common.history.records_count')}</span>
      </div>

      <div className="records-list">
        {records.map((record) => (
          <div key={record.id} className="record-card" onClick={() => onSelect(record)}>
            <div className="record-info">
              <div className="record-date">
                <Calendar size={16} />
                <span>{new Date(record.date).toLocaleDateString()}</span>
              </div>

              <div className="record-metrics-row">
                <span className="record-metric-chip">
                  <Scale size={13} style={{ color: 'var(--primary-color)' }} />
                  <span>{t('common.history.weight')}: <strong>{record.measurements.weight || '--'} kg</strong></span>
                </span>
                <span className="record-metric-chip">
                  <span>{t('common.history.waist')}: <strong>{record.measurements.waist || '--'} cm</strong></span>
                </span>
                {record.measurements.pecho && (
                  <span className="record-metric-chip">
                    <span>{t('common.form.chest')}: <strong>{record.measurements.pecho} cm</strong></span>
                  </span>
                )}
                {Math.max(record.measurements.arm?.right || 0, record.measurements.arm?.left || 0) > 0 && (
                  <span className="record-metric-chip">
                    <span>{t('common.form.arm')}: <strong>{Math.max(record.measurements.arm?.right || 0, record.measurements.arm?.left || 0)} cm</strong></span>
                  </span>
                )}
              </div>

              <div className="record-tags">
                {record.metadata?.condition && CONDITION_MAP[record.metadata.condition] && (
                  <span className="tag" style={{ color: CONDITION_MAP[record.metadata.condition].color, borderColor: `${CONDITION_MAP[record.metadata.condition].color}50` }}>
                    {CONDITION_MAP[record.metadata.condition].icon}
                    {CONDITION_MAP[record.metadata.condition].label}
                  </span>
                )}
                {record.metadata?.sleepHours && (
                  <span className="tag sleep">
                    <Moon size={13} />
                    {record.metadata.sleepHours}h {t('common.history.sleep')}
                  </span>
                )}
              </div>
            </div>

            <div className="record-actions">
              <button
                className={`btn-icon-del ${isDeleting === record.id ? 'loading' : ''}`}
                disabled={!!isDeleting}
                title="Eliminar Registro"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm(t('common.history.confirm_delete'))) return;

                  setIsDeleting(record.id);
                  try {
                    const result = await onDelete(record.id);
                    // @ts-ignore
                    if (result && !result.success) {
                      alert(`${t('common.history.delete_error')}: ${result.error || 'ERROR'}`);
                    }
                  } catch (err) {
                    console.error('Delete error', err);
                    alert(t('common.error'));
                  } finally {
                    setIsDeleting(null);
                  }
                }}
              >
                {isDeleting === record.id ? <div className="spinner-mini" /> : <Trash2 size={18} />}
              </button>
              <ChevronRight size={20} className="arrow" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
