import type { MeasurementRecord, MeasurementCondition } from '../types/measurements';
import React from 'react';
import { Calendar, ChevronRight, Trash2, Moon, TestTube, Zap, Coffee } from 'lucide-react';

interface Props {
  records: MeasurementRecord[];
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSelect: (record: MeasurementRecord) => void;
}

const CONDITION_MAP: Record<MeasurementCondition, { label: string; icon: React.ReactNode; color: string }> = {
  fasted: { label: 'Ayunas', icon: <TestTube size={14} />, color: '#60a5fa' },
  post_workout: { label: 'Post-Entreno', icon: <Zap size={14} />, color: '#fbbf24' },
  rest_day: { label: 'Descanso', icon: <Coffee size={14} />, color: '#a3a3a3' }
};

export const HistoryView = ({ records, onDelete, onSelect }: Props) => {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="empty-history animate-fade">
        <p>No hay registros aún. ¡Comienza cargando tus primeras medidas!</p>
      </div>
    );
  }

  return (
    <div className="history-view animate-fade">
      <header className="view-header">
        <h2>Historial de Medidas</h2>
        <span className="record-count">{records.length} registros</span>
      </header>

      <div className="records-list">
        {records.map((record) => (
          <div key={record.id} className="record-card glass" onClick={() => onSelect(record)}>
            <div className="record-info">
              <div className="record-date">
                <Calendar size={16} />
                <span>{new Date(record.date).toLocaleDateString()}</span>
              </div>
              <p className="record-summary">
                Peso: <span className="highlighted">{record.measurements.weight || '--'} kg</span> |
                Cintura: <span className="highlighted">{record.measurements.waist} cm</span>
              </p>
              <div className="record-tags">
                {record.metadata?.condition && CONDITION_MAP[record.metadata.condition] && (
                  <span className="tag" style={{ color: CONDITION_MAP[record.metadata.condition].color, borderColor: CONDITION_MAP[record.metadata.condition].color }}>
                    {CONDITION_MAP[record.metadata.condition].icon}
                    {CONDITION_MAP[record.metadata.condition].label}
                  </span>
                )}
                {record.metadata?.sleepHours && (
                  <span className="tag sleep">
                    <Moon size={14} />
                    {record.metadata.sleepHours}h sueño
                  </span>
                )}
              </div>
            </div>

            <div className="record-actions">
              <button
                className={`btn-icon delete ${isDeleting === record.id ? 'loading' : ''}`}
                disabled={!!isDeleting}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm('¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.')) return;

                  setIsDeleting(record.id);
                  try {
                    const result = await onDelete(record.id);
                    // @ts-ignore
                    if (result && !result.success) {
                      alert(`Error al eliminar: ${result.error || 'Inténtalo de nuevo'}`);
                    }
                  } catch (err) {
                    console.error('Delete error', err);
                    alert('Error inesperado al eliminar el registro.');
                  } finally {
                    setIsDeleting(null);
                  }
                }}
              >
                {isDeleting === record.id ? <div className="spinner-mini" /> : <Trash2 size={18} />}
              </button>
              <ChevronRight size={20} className="arrow" />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .history-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .record-count {
          color: var(--text-secondary);
          font-size: 0.9rem;
          background: var(--surface-hover);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }
        .empty-history {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--surface-color);
          border-radius: 16px;
          border: 1px dashed var(--border-color);
          color: var(--text-secondary);
        }
        .records-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .record-card {
          padding: 1.25rem;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .record-card:hover {
          background: var(--primary-glow);
          border-color: var(--primary-color);
        }
        .record-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .record-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          font-weight: 600;
        }
        .record-summary {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .highlighted {
          color: var(--text-primary);
          font-weight: 500;
        }
        .record-tags {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.25rem;
        }
        .tag {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.03);
            color: var(--text-secondary);
        }
        .tag.sleep {
            color: #c084fc;
            border-color: rgba(192, 132, 252, 0.3);
        }
        .record-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .btn-icon {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: 8px;
          transition: var(--transition-smooth);
        }
        .btn-icon.delete:hover {
          color: var(--danger-color);
          background: rgba(239, 68, 68, 0.1);
        }
        .arrow {
          color: var(--text-secondary);
          transition: transform 0.3s ease;
        }
        .record-card:hover .arrow {
          transform: translateX(5px);
          color: var(--primary-color);
        }
        .spinner-mini {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: var(--danger-color);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .history-view {
            padding: 0 1rem;
          }
          .view-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .record-count {
            align-self: flex-start;
          }
          .record-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .record-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};
