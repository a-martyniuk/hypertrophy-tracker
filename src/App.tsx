import { useState } from 'react'
import { useMeasurements } from './hooks/useMeasurements'
import { MeasurementForm } from './components/MeasurementForm'
import { HistoryView } from './components/HistoryView'
import { AnalysisView } from './components/AnalysisView'
import { GoalsView } from './components/GoalsView'
import { DynamicSilhouette } from './components/DynamicSilhouette'
import { useUser } from './hooks/useUser'
import { useGoals } from './hooks/useGoals'
import type { MeasurementRecord } from './types/measurements'
import { LayoutGrid, Plus, History, Activity, LogOut, User, Target } from 'lucide-react'

type View = 'dashboard' | 'history' | 'new-entry' | 'analysis' | 'goals'

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const { records, saveRecord, deleteRecord } = useMeasurements()
  const { user, updateUser } = useUser()
  const { goals, addGoal, deleteGoal } = useGoals()

  const handleSave = (record: MeasurementRecord) => {
    saveRecord(record)
    setActiveView('history')
  }

  const latestRecord = records[0]

  return (
    <div className="app-container">
      <nav className="sidebar glass">
        <div className="logo">
          <Activity color="var(--primary-color)" size={32} />
          <span>HYPER<b>FIT</b></span>
        </div>

        <div className="nav-items">
          <button
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutGrid size={20} /> Dashboard
          </button>
          <button
            className={activeView === 'new-entry' ? 'active' : ''}
            onClick={() => setActiveView('new-entry')}
          >
            <Plus size={20} /> Nueva Medida
          </button>
          <button
            className={activeView === 'history' ? 'active' : ''}
            onClick={() => setActiveView('history')}
          >
            <History size={20} /> Historial
          </button>
          <button
            className={activeView === 'analysis' ? 'active' : ''}
            onClick={() => setActiveView('analysis')}
          >
            <Activity size={20} /> Análisis
          </button>
        </div>

        <div className="nav-footer">
          <div className="user-profile">
            <div className={`user-avatar ${user.sex}`}>
              <User size={20} />
            </div>
            <div className="user-info">
              <span className="name">Atleta Pro</span>
              <span className="status">Online</span>
            </div>
          </div>
          <div className="gender-toggle">
            <button
              className={user.sex === 'male' ? 'active' : ''}
              onClick={() => updateUser({ sex: 'male' })}
            >M</button>
            <button
              className={user.sex === 'female' ? 'active' : ''}
              onClick={() => updateUser({ sex: 'female' })}
            >F</button>
          </div>
          <button className="btn-logout">
            <LogOut size={20} /> Salir
          </button>
        </div>
      </nav>

      <main className="content">
        {activeView === 'dashboard' && (
          <div className="dashboard-grid animate-fade">
            <header className="dash-header">
              <div className="welcome-text">
                <h1>Hola, Atleta 👋</h1>
                <p>Tu evolución física en números reales.</p>
              </div>
              <button className="btn-primary" onClick={() => setActiveView('new-entry')}>
                <Plus size={18} /> Registrar Medidas
              </button>
            </header>

            <div className="stats-row">
              <div className="stat-card glass gold-border">
                <label>Último Registro</label>
                <div className="value">
                  {latestRecord ? new Date(latestRecord.date).toLocaleDateString() : '--'}
                </div>
              </div>
              <div className="stat-card glass">
                <label>Total Registros</label>
                <div className="value">{records.length}</div>
              </div>
              <div className="stat-card glass">
                <label>Ratio Cintura/Pecho</label>
                <div className="value">
                  {latestRecord?.measurements.pecho ? (latestRecord.measurements.waist / latestRecord.measurements.pecho).toFixed(2) : '--'}
                </div>
              </div>
            </div>

            <div className="main-dashboard-content">
              <div className="card silhouette-preview">
                <h3>Tu Silueta Actual</h3>
                {latestRecord ? (
                  <DynamicSilhouette
                    measurements={latestRecord.measurements}
                    sex={user.sex}
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
                    <li><span>Peso:</span> <strong>{latestRecord.measurements.weight} kg</strong></li>
                    <li><span>Cintura:</span> <strong>{latestRecord.measurements.waist} cm</strong></li>
                    <li><span>Bíceps (D):</span> <strong>{latestRecord.measurements.arm.right} cm</strong></li>
                    <li><span>Bíceps (I):</span> <strong>{latestRecord.measurements.arm.left} cm</strong></li>
                    <li><span>Muslo (D):</span> <strong>{latestRecord.measurements.thigh.right} cm</strong></li>
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
            onCancel={() => setActiveView('dashboard')}
            previousRecord={latestRecord}
            sex={user.sex}
          />
        )}

        {activeView === 'history' && (
          <HistoryView
            records={records}
            onDelete={deleteRecord}
            onSelect={() => { }}
          />
        )}

        {activeView === 'analysis' && (
          <AnalysisView records={records} goals={goals} />
        )}

        {activeView === 'goals' && (
          <GoalsView
            goals={goals}
            onAddGoal={addGoal}
            onDeleteGoal={deleteGoal}
            latestRecord={latestRecord}
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
        <button className={activeView === 'goals' ? 'active' : ''} onClick={() => setActiveView('goals')}>
          <Target size={24} />
          <span>Objetivos</span>
        </button>
      </nav>

      <style>{`
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
          padding: 0 1.5rem;
          justify-content: space-around;
          align-items: center;
        }

        .mobile-nav button {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          transition: var(--transition-smooth);
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
          background: var(--primary-color);
          color: #1a1a1d;
          font-weight: 700;
          box-shadow: 0 4px 15px var(--primary-glow);
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
          border_radius: 8px;
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
      `}</style>
    </div>
  )
}

export default App
