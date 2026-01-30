import type { MeasurementRecord } from '../types/measurements';
import { Calendar, ChevronRight, Trash2 } from 'lucide-react';

interface Props {
    records: MeasurementRecord[];
    onDelete: (id: string) => void;
    onSelect: (record: MeasurementRecord) => void;
}

export const HistoryView = ({ records, onDelete, onSelect }: Props) => {
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
                        </div>

                        <div className="record-actions">
                            <button
                                className="btn-icon delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(record.id);
                                }}
                            >
                                <Trash2 size={18} />
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
          background: rgba(99, 102, 241, 0.1);
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
      `}</style>
        </div>
    );
};
