import { useState } from 'react';
import { Columns, ArrowLeftRight, Calendar } from 'lucide-react';
import type { MeasurementRecord, PhotoAngle } from '../types/measurements';

interface Props {
    records: MeasurementRecord[];
}

export const PhotoComparisonView = ({ records }: Props) => {
    const recordsWithPhotos = records.filter(r => r.photos && r.photos.length > 0);

    const [beforeRecordId, setBeforeRecordId] = useState<string>(recordsWithPhotos[recordsWithPhotos.length - 1]?.id || '');
    const [afterRecordId, setAfterRecordId] = useState<string>(recordsWithPhotos[0]?.id || '');
    const [activeAngle, setActiveAngle] = useState<PhotoAngle>('front');

    const beforeRecord = recordsWithPhotos.find(r => r.id === beforeRecordId);
    const afterRecord = recordsWithPhotos.find(r => r.id === afterRecordId);

    const getPhoto = (record?: MeasurementRecord, angle?: PhotoAngle) => {
        return record?.photos?.find(p => p.angle === angle);
    };

    if (recordsWithPhotos.length < 1) {
        return (
            <div className="empty-state glass">
                <Columns size={48} className="text-secondary opacity-20" />
                <p>Sube fotos en tus registros para usar la comparación visual.</p>
            </div>
        );
    }

    return (
        <div className="photo-comparison-view animate-fade-in">
            <div className="view-header">
                <div className="title-group">
                    <ArrowLeftRight className="text-primary" size={24} />
                    <h2>Comparativa Visual</h2>
                </div>
                <div className="angle-selector">
                    {(['front', 'side', 'back'] as PhotoAngle[]).map(angle => (
                        <button
                            key={angle}
                            className={activeAngle === angle ? 'active' : ''}
                            onClick={() => setActiveAngle(angle)}
                        >
                            {angle === 'front' ? 'Frente' : angle === 'side' ? 'Perfil' : 'Espalda'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="selectors-row">
                <div className="record-selector">
                    <label><Calendar size={14} /> Antes:</label>
                    <select value={beforeRecordId} onChange={e => setBeforeRecordId(e.target.value)}>
                        {recordsWithPhotos.map(r => (
                            <option key={r.id} value={r.id}>{new Date(r.date).toLocaleDateString()}</option>
                        ))}
                    </select>
                </div>
                <div className="record-selector">
                    <label><Calendar size={14} /> Después:</label>
                    <select value={afterRecordId} onChange={e => setAfterRecordId(e.target.value)}>
                        {recordsWithPhotos.map(r => (
                            <option key={r.id} value={r.id}>{new Date(r.date).toLocaleDateString()}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="comparison-grid">
                <div className="photo-card glass">
                    <div className="card-label">
                        {beforeRecord ? new Date(beforeRecord.date).toLocaleDateString() : 'Sin fecha'}
                        <span className="weight">{beforeRecord?.measurements.weight} kg</span>
                    </div>
                    <div className="photo-wrap">
                        {getPhoto(beforeRecord, activeAngle) ? (
                            <img src={getPhoto(beforeRecord, activeAngle)?.url} alt="Before" />
                        ) : (
                            <div className="no-photo">No hay foto {activeAngle}</div>
                        )}
                    </div>
                </div>

                <div className="photo-card glass after">
                    <div className="card-label">
                        {afterRecord ? new Date(afterRecord.date).toLocaleDateString() : 'Sin fecha'}
                        <span className="weight">{afterRecord?.measurements.weight} kg</span>
                    </div>
                    <div className="photo-wrap">
                        {getPhoto(afterRecord, activeAngle) ? (
                            <img src={getPhoto(afterRecord, activeAngle)?.url} alt="After" />
                        ) : (
                            <div className="no-photo">No hay foto {activeAngle}</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .photo-comparison-view {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .angle-selector {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
        }
        .angle-selector button {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 6px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .angle-selector button.active {
          background: var(--primary-color);
          color: black;
          font-weight: bold;
          box-shadow: 0 0 10px var(--primary-glow);
        }
        .selectors-row {
          display: flex;
          gap: 2rem;
          margin: 1.5rem 0;
          justify-content: center;
        }
        .record-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .record-selector label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .record-selector select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          outline: none;
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .photo-card {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
        }
        .photo-card.after {
          border-color: rgba(245, 158, 11, 0.3);
        }
        .card-label {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .card-label .weight {
          color: var(--primary-color);
        }
        .photo-wrap {
          aspect-ratio: 3/4;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .photo-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .no-photo {
          color: var(--text-secondary);
          font-style: italic;
          font-size: 0.9rem;
        }
        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
          margin-top: 2rem;
        }
        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr;
          }
          .selectors-row {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
        </div>
    );
};
