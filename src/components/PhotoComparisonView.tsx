import { useState, useRef, useEffect } from 'react';
import { Columns, ArrowLeftRight, Calendar, Layers, ScanLine } from 'lucide-react';
import type { MeasurementRecord, PhotoAngle } from '../types/measurements';

interface Props {
  records: MeasurementRecord[];
  userName?: string;
}

type ViewMode = 'side-by-side' | 'slider' | 'ghost';

import { useTranslation } from 'react-i18next';
import { SocialShare } from './SocialShare';

import './PhotoComparisonView.css';

export const PhotoComparisonView = ({ records, userName }: Props) => {
  const { t } = useTranslation();
  const recordsWithPhotos = records.filter(r => r.photos && r.photos.length > 0);

  const [beforeRecordId, setBeforeRecordId] = useState<string>(recordsWithPhotos[recordsWithPhotos.length - 1]?.id || '');
  const [afterRecordId, setAfterRecordId] = useState<string>(recordsWithPhotos[0]?.id || '');
  const [activeAngle, setActiveAngle] = useState<PhotoAngle>('front');
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [ghostOpacity, setGhostOpacity] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  const beforeRecord = recordsWithPhotos.find(r => r.id === beforeRecordId);
  const afterRecord = recordsWithPhotos.find(r => r.id === afterRecordId);

  const getPhoto = (record?: MeasurementRecord, angle?: PhotoAngle) => {
    return record?.photos?.find(p => p.angle === angle);
  };

  const handleSliderDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;

    setSliderPosition(percentage);
  };

  // Global event listener for drag end if mouse leaves container
  const isDragging = useRef(false);

  const startDrag = () => { isDragging.current = true; };
  const stopDrag = () => { isDragging.current = false; };
  const onDrag = (e: any) => {
    if (isDragging.current) handleSliderDrag(e);
  };

  useEffect(() => {
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('touchmove', onDrag);
    }
  }, []);

  if (recordsWithPhotos.length < 1) {
    return (
      <div className="empty-state glass">
        <Columns size={48} className="text-secondary opacity-20" />
        <p>{t('compare.empty')}</p>
      </div>
    );
  }

  const beforePhotoUrl = getPhoto(beforeRecord, activeAngle)?.url;
  const afterPhotoUrl = getPhoto(afterRecord, activeAngle)?.url;

  return (
    <div className="photo-comparison-view animate-fade-in">
      <div className="view-header">
        <div className="title-group">
          <ArrowLeftRight className="text-primary" size={24} />
          <h2>{t('compare.title')}</h2>
        </div>

        <div className="controls-group">
          <div className="angle-selector">
            {(['front', 'side', 'back'] as PhotoAngle[]).map(angle => (
              <button
                key={angle}
                className={activeAngle === angle ? 'active' : ''}
                onClick={() => setActiveAngle(angle)}
              >
                {angle === 'front' ? t('compare.angles.front') : angle === 'side' ? t('compare.angles.side') : t('compare.angles.back')}
              </button>
            ))}
          </div>

          <div className="mode-selector">
            <button
              className={viewMode === 'side-by-side' ? 'active' : ''}
              onClick={() => setViewMode('side-by-side')}
              title={t('compare.mode.side_by_side')}
            >
              <Columns size={16} />
            </button>
            <button
              className={viewMode === 'slider' ? 'active' : ''}
              onClick={() => setViewMode('slider')}
              title={t('compare.mode.slider')}
            >
              <ScanLine size={16} />
            </button>
            <button
              className={viewMode === 'ghost' ? 'active' : ''}
              onClick={() => setViewMode('ghost')}
              title={t('compare.mode.ghost')}
            >
              <Layers size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="selectors-row">
        <div className="record-selector">
          <label><Calendar size={14} /> {t('compare.before')}:</label>
          <select value={beforeRecordId} onChange={e => setBeforeRecordId(e.target.value)}>
            {recordsWithPhotos.map(r => (
              <option key={r.id} value={r.id}>{new Date(r.date).toLocaleDateString()}</option>
            ))}
          </select>
        </div>
        <div className="record-selector">
          <label><Calendar size={14} /> {t('compare.after')}:</label>
          <select value={afterRecordId} onChange={e => setAfterRecordId(e.target.value)}>
            {recordsWithPhotos.map(r => (
              <option key={r.id} value={r.id}>{new Date(r.date).toLocaleDateString()}</option>
            ))}
          </select>
        </div>
        <div className="share-action-wrap">
          <SocialShare beforeRecord={beforeRecord} afterRecord={afterRecord} userName={userName} />
        </div>
      </div>

      {/* Slider / Ghost Control Bar */}
      {viewMode === 'ghost' && (
        <div className="slider-control-bar glass">
          <span className="text-xs text-secondary">{t('compare.opacity')}: {ghostOpacity}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={ghostOpacity}
            onChange={(e) => setGhostOpacity(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      <div className={`comparison-container mode-${viewMode}`}>

        {/* SIDE BY SIDE MODE */}
        {viewMode === 'side-by-side' && (
          <div className="comparison-grid">
            <div className="photo-card glass">
              <div className="card-label">
                {beforeRecord ? new Date(beforeRecord.date).toLocaleDateString() : t('compare.no_date')}
                <span className="weight">{beforeRecord?.measurements.weight} kg</span>
              </div>
              <div className="photo-wrap">
                {beforePhotoUrl ? (
                  <img src={beforePhotoUrl} alt="Before" />
                ) : (
                  <div className="no-photo">{t('compare.no_photo', { angle: activeAngle })}</div>
                )}
              </div>
            </div>

            <div className="photo-card glass after">
              <div className="card-label">
                {afterRecord ? new Date(afterRecord.date).toLocaleDateString() : t('compare.no_date')}
                <span className="weight">{afterRecord?.measurements.weight} kg</span>
              </div>
              <div className="photo-wrap">
                {afterPhotoUrl ? (
                  <img src={afterPhotoUrl} alt="After" />
                ) : (
                  <div className="no-photo">{t('compare.no_photo', { angle: activeAngle })}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SLIDER & GHOST MODES (Unified Wrapper) */}
        {(viewMode === 'slider' || viewMode === 'ghost') && (
          <div
            className="interactive-viewer glass"
            ref={sliderRef}
            onMouseDown={viewMode === 'slider' ? startDrag : undefined}
            onTouchStart={viewMode === 'slider' ? startDrag : undefined}
          >
            {!beforePhotoUrl || !afterPhotoUrl ? (
              <div className="p-8 text-center text-secondary">
                {t('compare.two_photos_required')}
              </div>
            ) : (
              <div className="viewer-stack">
                {/* Base Layer (Before) */}
                <img src={beforePhotoUrl} className="img-base" alt="Before" />

                {/* Overlay Layer (After) */}
                <div
                  className="img-overlay-container"
                  style={{
                    clipPath: viewMode === 'slider' ? `inset(0 0 0 ${sliderPosition}%)` : 'none',
                    opacity: viewMode === 'ghost' ? ghostOpacity / 100 : 1
                  }}
                >
                  <img src={afterPhotoUrl} className="img-overlay" alt="After" />
                </div>

                {/* Slider Handle */}
                {viewMode === 'slider' && (
                  <div
                    className="slider-handle"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="handle-line"></div>
                    <div className="handle-circle">
                      <ArrowLeftRight size={14} color="black" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        .photo-comparison-view {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .view-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .title-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .controls-group {
            display: flex;
            gap: 1rem;
        }

        /* Selectors */
        .angle-selector, .mode-selector {
          display: flex;
          gap: 0.25rem;
          background: rgba(0, 0, 0, 0.4);
          padding: 4px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .angle-selector button, .mode-selector button {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .angle-selector button.active, .mode-selector button.active {
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
        .record-selector label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-bottom: 4px;
            display: block;
        }
        .record-selector select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          outline: none;
        }

        /* --- Side by Side Mode --- */
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
        .photo-card.after { border-color: rgba(245, 158, 11, 0.3); }
        .card-label {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .card-label .weight { color: var(--primary-color); }
        .photo-wrap {
          aspect-ratio: 3/4;
          background: #000;
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

        /* --- Interactive Modes (Slider & Ghost) --- */
        .interactive-viewer {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            aspect-ratio: 3/4;
            border-radius: 16px;
            overflow: hidden;
            background: #000;
            border: 1px solid rgba(245, 158, 11, 0.3);
            user-select: none;
            touch-action: none;
        }
        .viewer-stack {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .img-base, .img-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .img-overlay-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none; /* Let clicks pass through to container */
        }
        
        /* Slider Handle */
        .slider-handle {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--primary-color);
            transform: translateX(-50%);
            cursor: ew-resize;
            pointer-events: none; /* Container handles drag logic */
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            z-index: 10;
        }
        .handle-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 32px;
            height: 32px;
            background: var(--primary-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }

        .slider-control-bar {
            max-width: 400px;
            margin: 0 auto 1.5rem auto;
            padding: 1rem;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
        }

        @media (max-width: 768px) {
          .comparison-grid { grid-template-columns: 1fr; }
          .selectors-row { flex-direction: column; gap: 1rem; }
          .view-header { flex-direction: column; align-items: stretch; gap: 1rem; }
          .title-group, .controls-group { justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};
