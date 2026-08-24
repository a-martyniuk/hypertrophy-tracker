import React, { useState } from 'react';
import { Trophy, X, Sparkles, CheckCircle2, Lock, Shield } from 'lucide-react';
import type { MeasurementRecord } from '../../types/measurements';
import { evaluateAthleteBadges, type AthleteBadge } from '../../utils/athleteBadges';
import './TrophyRoomModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: MeasurementRecord[];
  sex?: 'male' | 'female';
}

export const TrophyRoomModal: React.FC<Props> = ({ isOpen, onClose, records, sex = 'male' }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const badges: AthleteBadge[] = evaluateAthleteBadges(records, sex);
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const totalCount = badges.length;
  const globalProgress = Math.round((unlockedCount / totalCount) * 100);

  const categories = [
    { id: 'all', label: 'Todos los Trofeos' },
    { id: 'Aesthetic', label: '✨ Estética & Ratios' },
    { id: 'Genetic', label: '🧬 Techo Genético' },
    { id: 'Strength', label: '⚡ Hipertrofia & Masa' },
    { id: 'Consistency', label: '📈 Disciplina' }
  ];

  const filteredBadges = activeCategory === 'all'
    ? badges
    : badges.filter((b) => b.category === activeCategory);

  return (
    <div className="trophy-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="trophy-modal-content glass animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="trophy-modal-header">
          <div className="header-badge-title">
            <div className="trophy-main-icon">
              <Trophy size={26} className="text-amber-400" />
            </div>
            <div>
              <div className="title-subtitle-row">
                <span className="trophy-subtitle">Salón de la Fama Antropométrico</span>
                <span className="trophy-status-pill">
                  <Sparkles size={11} /> {unlockedCount} / {totalCount} Conquistados
                </span>
              </div>
              <h2 className="trophy-title">Vitrina de Logros & Medallas</h2>
            </div>
          </div>
          <button type="button" className="trophy-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Global Progress Strip */}
        <div className="trophy-global-progress-card glass-darker">
          <div className="progress-text-row">
            <span className="pg-lbl">Nivel de Maestría Biométrica</span>
            <span className="pg-val">{globalProgress}% Completado</span>
          </div>
          <div className="global-progress-bar-bg">
            <div 
              className="global-progress-bar-fill" 
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="trophy-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="trophy-badges-grid">
          {filteredBadges.map((badge) => {
            return (
              <div
                key={badge.id}
                className={`trophy-badge-card glass ${badge.isUnlocked ? 'unlocked' : 'locked'}`}
                style={{
                  borderColor: badge.isUnlocked ? `${badge.rarityColor}60` : undefined,
                  boxShadow: badge.isUnlocked ? `0 0 25px ${badge.rarityColor}20` : undefined
                }}
              >
                <div className="badge-card-top">
                  <div 
                    className="badge-icon-wrapper"
                    style={{ 
                      backgroundColor: badge.isUnlocked ? `${badge.rarityColor}18` : 'rgba(255,255,255,0.03)',
                      borderColor: badge.isUnlocked ? badge.rarityColor : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <span className="badge-emoji">{badge.icon}</span>
                    {badge.isUnlocked ? (
                      <div className="badge-unlocked-tick">
                        <CheckCircle2 size={13} />
                      </div>
                    ) : (
                      <div className="badge-locked-icon">
                        <Lock size={12} />
                      </div>
                    )}
                  </div>

                  <div className="badge-rarity-pill" style={{ color: badge.rarityColor, borderColor: `${badge.rarityColor}40` }}>
                    <Shield size={10} />
                    <span>{badge.rarity}</span>
                  </div>
                </div>

                <div className="badge-info">
                  <h4 className="badge-name">{badge.title}</h4>
                  <p className="badge-desc">{badge.description}</p>
                </div>

                {/* Progress or Unlocked Banner */}
                <div className="badge-footer">
                  {badge.isUnlocked ? (
                    <div className="badge-unlocked-banner">
                      <Sparkles size={13} style={{ color: badge.rarityColor }} />
                      <span>¡Logro Desbloqueado! ({badge.currentValueText})</span>
                    </div>
                  ) : (
                    <div className="badge-progress-container">
                      <div className="badge-progress-text">
                        <span>{badge.currentValueText}</span>
                        <small>Meta: {badge.targetValueText}</small>
                      </div>
                      <div className="badge-progress-bar-bg">
                        <div
                          className="badge-progress-bar-fill"
                          style={{ width: `${badge.progressPercent}%`, backgroundColor: badge.rarityColor }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
