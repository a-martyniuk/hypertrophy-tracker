import { useState, useEffect } from 'react'
import { useMeasurements } from './hooks/useMeasurements'
import { MeasurementForm } from './components/MeasurementForm'
import { HistoryView } from './components/HistoryView'
import { AnalysisView } from './components/AnalysisView'
import { GoalsView } from './components/GoalsView'
import { VolumeHeatmap } from './components/VolumeHeatmap'
import { SkeletalFrameView } from './components/SkeletalFrameView'
import { PhotoComparisonView } from './components/PhotoComparisonView'
import { MetabolismCalculator } from './components/MetabolismCalculator'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import type { MeasurementRecord } from './types/measurements'
import { LayoutGrid, Plus, History, Activity, LogOut, User, Target, TrendingUp, TrendingDown, Minus, Camera, Calculator, HelpCircle } from 'lucide-react'
import { Tooltip } from './components/Tooltip'

import { ToastProvider } from './components/ui/ToastProvider'
import { AuthView } from './components/AuthView'
import { Skeleton, SkeletonStyles } from './components/ui/Skeleton'
import { DynamicSilhouette } from './components/DynamicSilhouette'


type View = 'dashboard' | 'history' | 'new-entry' | 'analysis' | 'goals' | 'potential' | 'comparison' | 'calculator'

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [isGuest, setIsGuest] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MeasurementRecord | null>(null)

  const { user: authUser, session: authSession, loading: authLoading, signOut } = useAuth()
  const { records, saveRecord, deleteRecord, refresh, loading } = useMeasurements(authUser?.id, authSession)

  // Force data refresh when session updates (e.g. login from stale state)
  useEffect(() => {
    if (authSession?.access_token && authUser?.id) {
      refresh(authUser.id)
    }
  }, [authSession?.access_token, authUser?.id])

  // Ensure Guest Mode is disabled if we have a real user
  useEffect(() => {
    if (authUser) setIsGuest(false)
  }, [authUser])

  const { profile, updateProfile } = useProfile()
  const { goals, addGoal, deleteGoal } = useGoals(authUser?.id)

  const userSex = profile?.sex || 'male'
  const userName = profile?.name || authUser?.email?.split('@')[0] || 'Atleta'

  const handleSave = async (record: MeasurementRecord) => {
    const result = await saveRecord(record)
    if (result.success) {
      setActiveView('history')
      setEditingRecord(null)
    }
    return result
  }

  const handleLogOut = async () => {
    await signOut()
    setIsGuest(false)
  }

  const latestRecord = records[0]
  const previousRecord = records[1]

  const TrendIndicator = ({ current, previous, inverse = false }: { current: number, previous?: number, inverse?: boolean }) => {
    if (previous === undefined || current === previous) return <Minus size={14} className="trend-icon stable" />

    const isIncrease = current > previous
    const isPositive = inverse ? !isIncrease : isIncrease

    if (isIncrease) {
      return <TrendingUp size={14} className={`trend-icon ${isPositive ? 'up' : 'warn'}`} />
    } else {
      return <TrendingDown size={14} className={`trend-icon ${isPositive ? 'down' : 'warn'}`} />
    }
  }

  const Sparkline = ({ data }: { data: number[] }) => {
    if (data.length < 2) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = (max - min) || 1
    const width = 34
    const height = 14

    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} className="sparkline" style={{ marginRight: '8px', opacity: 0.6 }}>
        <polyline
          fill="none"
          stroke="var(--primary-color)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    )
  }

  if (authLoading) return <div className="loading-screen"><Activity className="animate-spin" /></div>;
  if (!authUser && !isGuest) return <AuthView onGuest={() => setIsGuest(true)} />;

  return (
    <ToastProvider>
      <div className="app-container">
        <nav className="sidebar glass">
          <div className="logo">
            <Activity color="var(--primary-color)" size={32} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '0.9', marginLeft: '6px' }}>
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.9 }}>HYPERTROPHY</span>
              <span style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>TRACKER</span>
            </div>
          </div>

          <div className="nav-items">
            <Tooltip content="Vista general y resumen" position="right">
              <button
                className={activeView === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveView('dashboard')}
              >
                <LayoutGrid size={20} /> Dashboard
              </button>
            </Tooltip>
            <Tooltip content="Registrar nuevas medidas corporales" position="right">
              <button
                className={activeView === 'new-entry' ? 'active' : ''}
                onClick={() => setActiveView('new-entry')}
              >
                <Plus size={20} /> Nueva Medida
              </button>
            </Tooltip>
            <Tooltip content="Ver historial de registros" position="right">
              <button
                className={activeView === 'history' ? 'active' : ''}
                onClick={() => setActiveView('history')}
              >
                <History size={20} /> Historial
              </button>
            </Tooltip>
            <Tooltip content="Análisis gráfico de tu progreso" position="right">
              <button
                className={activeView === 'analysis' ? 'active' : ''}
                onClick={() => setActiveView('analysis')}
              >
                <Activity size={20} /> Análisis
              </button>
            </Tooltip>
            <Tooltip content="Análisis de estructura ósea (Casey Butt)" position="right">
              <button
                className={activeView === 'potential' ? 'active' : ''}
                onClick={() => setActiveView('potential')}
              >
                <Target size={20} /> Potencial
              </button>
            </Tooltip>
            <Tooltip content="Comparativa visual de fotos" position="right">
              <button
                className={activeView === 'comparison' ? 'active' : ''}
                onClick={() => setActiveView('comparison')}
              >
                <Camera size={20} /> Comparativa
              </button>
            </Tooltip>
            <Tooltip content="Calculadora de BMR y TDEE" position="right">
              <button
                className={activeView === 'calculator' ? 'active' : ''}
                onClick={() => setActiveView('calculator')}
              >
                <Calculator size={20} /> Calculadora
              </button>
            </Tooltip>
            <Tooltip content="Definir metas de medidas" position="right">
              <button
                className={activeView === 'goals' ? 'active' : ''}
                onClick={() => setActiveView('goals')}
              >
                <Target size={20} /> Objetivos
              </button>
            </Tooltip>
          </div>

          <div className="nav-footer">
            <div className="user-profile">
              <div className={`user-avatar ${userSex}`}>
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="name">{userName}</span>
                <span className="status">{authUser ? 'Online' : 'Invitado'}</span>
              </div>
            </div>
            <div className="gender-toggle">
              <button
                className={userSex === 'male' ? 'active' : ''}
                onClick={() => updateProfile({ sex: 'male' })}
              >M</button>
              <button
                className={userSex === 'female' ? 'active' : ''}
                onClick={() => updateProfile({ sex: 'female' })}
              >F</button>
            </div>
            <button className="btn-logout" onClick={handleLogOut}>
              <LogOut size={20} /> Salir
            </button>
          </div>
        </nav>

        <main className="content">
          {activeView === 'dashboard' && (
            <div className="dashboard-grid animate-fade">
              <header className="dash-header">
                <div className="welcome-text">
                  <h1>Hola, {userName} 👋</h1>
                  <p>Tu evolución física en números reales.</p>
                </div>
                <button className="btn-primary" onClick={() => setActiveView('new-entry')}>
                  <Plus size={18} /> Registrar Medidas
                </button>
              </header>

              <div className="main-dashboard-content">
                <div className="silhouette-card glass">
                  <h3>Tu Silueta Actual</h3>
                  <div className="silhouette-wrapper">
                    <DynamicSilhouette
                      measurements={latestRecord?.measurements || {
                        weight: 0, height: 0, bodyFat: 0, neck: 0, back: 0, pecho: 0, waist: 0, hips: 0,
                        arm: { left: 0, right: 0 }, forearm: { left: 0, right: 0 }, wrist: { left: 0, right: 0 },
                        thigh: { left: 0, right: 0 }, calf: { left: 0, right: 0 }, ankle: { left: 0, right: 0 }
                      }}
                      sex={userSex}
                    />
                  </div>
                </div>

                <div className="side-stats-column">
                  {/* Latest Values List */}
                  <div className="latest-values-card glass">
                    <h3>Últimos Valores</h3>
                    <div className="values-list">
                      <div className="value-row">
                        <span>Altura:</span>
                        <span className="val">{loading ? <Skeleton width={50} height={20} /> : (latestRecord?.measurements.height ? `${latestRecord.measurements.height} cm` : <button className="btn-link-small" onClick={() => setActiveView('new-entry')}>Registrar</button>)}</span>
                      </div>
                      <div className="value-row">
                        <span>Peso:</span>
                        <span className="val">{loading ? <Skeleton width={50} height={20} /> : (latestRecord?.measurements.weight ? `${latestRecord.measurements.weight} kg` : <button className="btn-link-small" onClick={() => setActiveView('new-entry')}>Registrar</button>)}</span>
                      </div>
                      <div className="value-row">
                        <span>Grasa:</span>
                        <span className="val">{loading ? <Skeleton width={50} height={20} /> : (latestRecord?.measurements.bodyFat ? `${latestRecord.measurements.bodyFat} %` : <button className="btn-link-small" onClick={() => setActiveView('new-entry')}>Registrar</button>)}</span>
                      </div>
                      <div className="value-row">
                        <span>Cintura:</span>
                        <span className="val">{loading ? <Skeleton width={50} height={20} /> : (latestRecord?.measurements.waist ? `${latestRecord.measurements.waist} cm` : '--')}</span>
                      </div>
                      <div className="value-row">
                        <span>Pecho:</span>
                        <span className="val">{loading ? <Skeleton width={50} height={20} /> : (latestRecord?.measurements.pecho ? `${latestRecord.measurements.pecho} cm` : '--')}</span>
                      </div>
                      <div className="value-row">
                        <span>Brazos:</span>
                        <span className="val">{loading ? <Skeleton width={50} height={20} /> : (latestRecord?.measurements.arm.right ? `${latestRecord.measurements.arm.right} cm` : '--')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Moved Stats Cards */}
                  <div className="stats-mini-grid">
                    <div className="stat-card glass gold-border">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Último Registro
                        <Tooltip content="Fecha de la última medición registrada." position="top">
                          <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                        </Tooltip>
                      </label>
                      <div className="value">
                        {loading ? <Skeleton width={100} height={24} /> : (latestRecord ? new Date(latestRecord.date).toLocaleDateString() : '--')}
                      </div>
                    </div>
                    <div className="stat-card glass">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Total Registros
                        <Tooltip content="Cantidad total de mediciones guardadas en el historial." position="top">
                          <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                        </Tooltip>
                      </label>
                      <div className="value">
                        {loading ? <Skeleton width={40} height={24} /> : records.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="main-dashboard-content">
                <div className="card silhouette-preview">
                  <h3>Tu Silueta Actual</h3>
                  {latestRecord ? (
                    <VolumeHeatmap
                      currentMeasurements={latestRecord.measurements}
                      referenceMeasurements={records[records.length - 1]?.measurements}
                      sex={userSex}
                      onMarkerClick={() => setActiveView('analysis')}
                    />
                  ) : (
                    <div className="placeholder-silhouette">
                      <p>Registra medidas para ver tu silueta</p>
                    </div>
                  )}
                </div>

                <div className="card latest-summary">
                  <h3>Últimos Valores</h3>
                  {latestRecord ? (
                    <ul className="summary-list">
                      {[
                        { key: 'height', label: 'Altura', unit: 'cm' },
                        { key: 'weight', label: 'Peso', unit: 'kg', inverse: true },
                        { key: 'bodyFat', label: 'Grasa', unit: '%', inverse: true },
                        { key: 'neck', label: 'Cuello', unit: 'cm' },
                        { key: 'back', label: 'Espalda', unit: 'cm' },
                        { key: 'pecho', label: 'Pecho', unit: 'cm' },
                        { key: 'waist', label: 'Cintura', unit: 'cm', inverse: true },
                        { key: 'hips', label: 'Cadera', unit: 'cm', inverse: true },
                        { key: 'arm.right', label: 'Bíceps (D)', unit: 'cm' },
                        { key: 'arm.left', label: 'Bíceps (I)', unit: 'cm' },
                        { key: 'forearm.right', label: 'Antebrazo (D)', unit: 'cm' },
                        { key: 'forearm.left', label: 'Antebrazo (I)', unit: 'cm' },
                        { key: 'thigh.right', label: 'Muslo (D)', unit: 'cm' },
                        { key: 'thigh.left', label: 'Muslo (I)', unit: 'cm' },
                        { key: 'calf.right', label: 'Gemelo (D)', unit: 'cm' },
                        { key: 'calf.left', label: 'Gemelo (I)', unit: 'cm' },
                      ].map(({ key, label, unit, inverse }) => {
                        // Helper to get nested value
                        const getValue = (record: any) => {
                          if (!record) return undefined
                          if (key.includes('.')) {
                            const [k1, k2] = key.split('.')
                            return record.measurements[k1]?.[k2]
                          }
                          return record.measurements[key]
                        }

                        const val = getValue(latestRecord)
                        const prevVal = getValue(previousRecord)
                        const history = records
                          .map(r => getValue(r))
                          .filter(v => typeof v === 'number')
                          .reverse()
                          .slice(-5)

                        const hasValue = val !== undefined && val !== 0;

                        return (
                          <li key={key}>
                            <span>{label}:</span>
                            <div className="summary-val-wrap">
                              {history.length > 1 && <Sparkline data={history} />}
                              {hasValue ? (
                                <>
                                  <strong>{val} {unit}</strong>
                                  <TrendIndicator
                                    current={val}
                                    previous={prevVal}
                                    inverse={inverse}
                                  />
                                </>
                              ) : (
                                <button
                                  className="btn-tiny-action"
                                  onClick={() => setActiveView('new-entry')}
                                >
                                  Registrar
                                </button>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p>No hay datos recientes</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'new-entry' && (
            <MeasurementForm
              onSave={handleSave}
              onCancel={() => {
                setActiveView('dashboard')
                setEditingRecord(null)
              }}
              previousRecord={latestRecord}
              recordToEdit={editingRecord || undefined}
              sex={userSex}
            />
          )}

          {activeView === 'history' && (
            <HistoryView
              records={records}
              onDelete={deleteRecord}
              onSelect={(record) => {
                setEditingRecord(record)
                setActiveView('new-entry')
              }}
            />
          )}

          {activeView === 'analysis' && (
            <AnalysisView records={records} goals={goals} sex={userSex} />
          )}

          {activeView === 'goals' && (
            <GoalsView
              goals={goals}
              onAddGoal={addGoal}
              onDeleteGoal={deleteGoal}
              latestRecord={latestRecord}
              profile={profile}
              records={records}
            />
          )}
          {activeView === 'potential' && (
            <SkeletalFrameView
              baseline={profile?.baseline}
              currentMeasurements={latestRecord?.measurements}
              onSave={(baseline) => updateProfile({ baseline })}
              sex={userSex}
            />
          )}

          {activeView === 'comparison' && (
            <PhotoComparisonView records={records} />
          )}

          {activeView === 'calculator' && (
            <MetabolismCalculator
              sex={userSex}
              currentWeight={latestRecord?.measurements?.weight}
              height={latestRecord?.measurements?.height}
              // Calculate age if birthDate exists
              age={profile?.birthDate ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear() : undefined}
              userId={authUser?.id}
            />
          )}
        </main>

        <nav className="mobile-nav glass">
          <button className={activeView === 'dashboard' ? 'active' : ''} onClick={() => setActiveView('dashboard')}>
            <LayoutGrid size={24} />
            <span>Inicio</span>
          </button>
          <button className={activeView === 'new-entry' ? 'active' : ''} onClick={() => setActiveView('new-entry')}>
            <Plus size={24} />
            <span>Nuevo</span>
          </button>
          <button className={activeView === 'history' ? 'active' : ''} onClick={() => setActiveView('history')}>
            <History size={24} />
            <span>Diario</span>
          </button>
          <button className={activeView === 'analysis' ? 'active' : ''} onClick={() => setActiveView('analysis')}>
            <Activity size={24} />
            <span>Análisis</span>
          </button>
          <button className={activeView === 'potential' ? 'active' : ''} onClick={() => setActiveView('potential')}>
            <Target size={24} />
            <span>Potencial</span>
          </button>
          <button className={activeView === 'comparison' ? 'active' : ''} onClick={() => setActiveView('comparison')}>
            <Camera size={24} />
            <span>Comparar</span>
          </button>
          <button className={activeView === 'calculator' ? 'active' : ''} onClick={() => setActiveView('calculator')}>
            <Calculator size={24} />
            <span>Calc.</span>
          </button>
          <button className={activeView === 'goals' ? 'active' : ''} onClick={() => setActiveView('goals')}>
            <Target size={24} />
            <span>Objetivos</span>
          </button>
          <button className="btn-logout-mobile" onClick={handleLogOut}>
            <LogOut size={24} />
            <span>Salir</span>
          </button>
        </nav>

        <style>{`
        ${SkeletonStyles}
        .app-container {
          display: flex;
          min-height: 100vh;
          background: transparent;
          padding-bottom: 70px;
        }

        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(13, 13, 15, 0.85);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-top: 1px solid var(--border-color);
          z-index: 1000;
          padding: 0 0.5rem;
          justify-content: space-around;
          align-items: center;
        }

        .mobile-nav button, .mobile-nav .btn-logout-mobile {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          transition: var(--transition-smooth);
          flex: 1;
          min-width: 0;
        }

        .mobile-nav .btn-logout-mobile:active {
          color: var(--danger-color);
        }

        .mobile-nav button.active {
          color: var(--primary-color);
        }

        .sidebar {
          width: 280px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 2.5rem 1.8rem;
          border-right: 1px solid var(--border-color);
          z-index: 100;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 3.5rem;
          padding-left: 0.5rem;
          letter-spacing: -0.01em;
        }

        .logo b {
          color: var(--primary-color);
          text-shadow: 0 0 20px var(--primary-glow);
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-items button {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1.2rem;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          border-radius: 14px;
          transition: var(--transition-smooth);
          font-size: 0.95rem;
          text-align: left;
        }

        .nav-items button:hover {
          background: var(--surface-hover);
          color: white;
        }

        .nav-items button.active {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%);
          color: var(--primary-color);
          font-weight: 700;
          border-left: 3px solid var(--primary-color);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
          border-radius: 4px 14px 14px 4px;
        }

        .nav-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--surface-hover);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color);
          border: 1px solid var(--border-color);
          transition: var(--transition-smooth);
        }

        .user-avatar.female {
          color: #ec4899;
          border-color: rgba(236, 72, 153, 0.4);
        }

        .gender-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
        }

        .gender-toggle button {
          flex: 1;
          padding: 0.4rem;
          font-size: 0.75rem;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .gender-toggle button.active {
          background: var(--primary-color);
          color: #1a1a1d;
          border-color: var(--primary-color);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-info .name {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .user-info .status {
          font-size: 0.7rem;
          color: var(--success-color);
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          border-radius: 12px;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-color);
        }

        .content {
          flex: 1;
          padding: 2rem 3rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
        }

        .welcome-text h1 {
          font-size: 2.25rem;
          margin-bottom: 0.25rem;
        }

        .welcome-text p {
          color: var(--text-secondary);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          position: relative;
          z-index: 1;
          transition: transform 0.2s ease, z-index 0s;
        }

        .stat-card:hover {
            z-index: 20;
        }

        .gold-border {
          border-color: rgba(245, 158, 11, 0.4);
          background: linear-gradient(135deg, rgba(13, 13, 15, 0.5), rgba(245, 158, 11, 0.05));
          box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.05);
        }

        .stat-card label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .stat-card .value {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 0.5rem;
        }

        .main-dashboard-content {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
        }

        .silhouette-preview {
          min-height: 500px;
          background: var(--surface-color);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .latest-summary {
          background: var(--surface-color);
        }

        .summary-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .summary-list li {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .summary-list span {
          color: var(--text-secondary);
        }

        .summary-val-wrap {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .trend-icon {
          opacity: 0.8;
          padding: 2px;
          border-radius: 4px;
        }

        .trend-icon.stable { color: #64748b; }
        .trend-icon.up { color: #f59e0b; }
        .trend-icon.down { color: #f59e0b; }
        .trend-icon.warn { color: #ef4444; }

        .btn-tiny-action {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .btn-tiny-action:hover {
          background: rgba(245, 158, 11, 0.2);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.1);
        }

        .placeholder-silhouette {
          flex: 1;
          background: #000;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          border: 1px dashed #222;
        }

        @media (max-width: 1024px) {
          .main-dashboard-content {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .sidebar {
            display: none;
          }
          .mobile-nav {
            display: flex;
          }
          .content {
            padding: 1.5rem;
          }
          .stats-row {
            grid-template-columns: 1fr;
          }
          .dash-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
        ${SkeletonStyles}
      `}</style>
      </div>
    </ToastProvider>
  )
}

export default App
