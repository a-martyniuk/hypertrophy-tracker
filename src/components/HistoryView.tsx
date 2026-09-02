import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Trash2, Moon, TestTube, Zap, Coffee, Scale, Activity, Plus } from 'lucide-react';
import type { MeasurementRecord, MeasurementCondition } from '../types/measurements';
import { useToast } from './ui/ToastProvider';
import { formatDateSafe } from '../utils/dateUtils';
import './HistoryView.css';

interface Props {
  records: MeasurementRecord[];
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSelect: (record: MeasurementRecord) => void;
}

export const HistoryView = ({ records, onDelete, onSelect }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();
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

        <div className="empty-history" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={40} style={{ color: 'var(--primary-color)', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', margin: 0 }}>
            {t('common.history.empty')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px', textAlign: 'center' }}>
            Registra tu primera medición antropométrica para comenzar el seguimiento de tu evolución.
          </p>
          <button
            onClick={() => navigate('/new-entry')}
            className="btn-primary"
            style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            <span>Registrar Primera Medida</span>
          </button>
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
                <span>{formatDateSafe(record.date)}</span>
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
                {(() => {
                  const arm = record.measurements.arm;
                  const armVal = typeof arm === 'number' ? arm : Math.max(arm?.right || 0, arm?.left || 0);
                  return armVal > 0 ? (
                    <span className="record-metric-chip">
                      <span>{t('common.form.arm')}: <strong>{armVal} cm</strong></span>
                    </span>
                  ) : null;
                })()}
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
                      addToast(`${t('common.history.delete_error')}: ${result.error || 'ERROR'}`, 'error');
                    } else {
                      addToast('Registro eliminado del historial', 'info');
                    }
                  } catch (err) {
                    console.error('Delete error', err);
                    addToast(t('common.error'), 'error');
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
