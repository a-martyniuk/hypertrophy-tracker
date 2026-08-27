import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useMeasurements } from './hooks/useMeasurements'
import { Layout } from './components/Layout'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { AuthView } from './components/AuthView'
import type { MeasurementRecord } from './types/measurements'
import { Activity } from 'lucide-react'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Lazy-loaded Views for ultra-fast initial bundle
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const MeasurementForm = lazy(() => import('./components/MeasurementForm').then(m => ({ default: m.MeasurementForm })));
const HistoryView = lazy(() => import('./components/HistoryView').then(m => ({ default: m.HistoryView })));
const AnalysisView = lazy(() => import('./components/AnalysisView').then(m => ({ default: m.AnalysisView })));
const SkeletalFrameView = lazy(() => import('./components/SkeletalFrameView').then(m => ({ default: m.SkeletalFrameView })));
const MetabolismCalculator = lazy(() => import('./components/MetabolismCalculator').then(m => ({ default: m.MetabolismCalculator })));
const GoalsView = lazy(() => import('./components/GoalsView').then(m => ({ default: m.GoalsView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const PublicReportView = lazy(() => import('./components/share/PublicReportView').then(m => ({ default: m.PublicReportView })));
import { ScrollToTop } from './components/ScrollToTop'
import { Analytics } from '@vercel/analytics/react'

function App() {
  const [isGuest, setIsGuestState] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('hypertrophy_is_guest') === 'true'
  })

  const setIsGuest = (val: boolean) => {
    if (typeof window !== 'undefined') {
      if (val) {
        localStorage.setItem('hypertrophy_is_guest', 'true')
      } else {
        localStorage.removeItem('hypertrophy_is_guest')
      }
    }
    setIsGuestState(val)
  }

  const [editingRecord, setEditingRecord] = useState<MeasurementRecord | null>(null)
  const navigate = useNavigate()

  const { user: authUser, loading: authLoading } = useAuth()
  const { records, saveRecord, deleteRecord, refresh, loading } = useMeasurements(authUser?.uid)

  // Force data refresh when authUser updates
  useEffect(() => {
    if (authUser?.uid) {
      refresh(authUser.uid)
    }
  }, [authUser?.uid, refresh])

  // Ensure Guest Mode is disabled if we have a real user
  useEffect(() => {
    if (authUser) {
      setIsGuest(false)
    }
  }, [authUser])

  const { profile, updateProfile } = useProfile()
  const { goals, addGoal, deleteGoal } = useGoals(authUser?.uid)

  const userSex = profile?.sex || 'male'
  const userName = profile?.name || authUser?.displayName || authUser?.email?.split('@')[0] || 'Atleta'

  const handleSave = async (record: MeasurementRecord) => {
    const result = await saveRecord(record)
    if (result.success) {
      setEditingRecord(null)
      navigate('/history')
    }
    return result
  }

  const location = useLocation()

  // Reset editingRecord if navigating anywhere away from /new-entry
  useEffect(() => {
    if (location.pathname !== '/new-entry') {
      setEditingRecord(null)
    }
  }, [location.pathname])

  // Public Trainer Share View (No auth required)
  if (location.pathname === '/share') {
    return (
      <Suspense fallback={<div className="loading-screen"><Activity className="animate-spin" /></div>}>
        <PublicReportView />
      </Suspense>
    );
  }

  // If loading auth, show spinner
  if (authLoading) return <div className="loading-screen"><Activity className="animate-spin" /></div>;

  // If not authenticated and not guest, show Auth View
  if (!authUser && !isGuest) return <AuthView onGuest={() => setIsGuest(true)} />;

  return (
    <Suspense fallback={<div className="loading-screen"><Activity className="animate-spin" /></div>}>
      <ScrollToTop />
      <Analytics />
      <Routes>
        <Route element={<Layout isGuest={isGuest} setIsGuest={setIsGuest} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ErrorBoundary>
            <DashboardView
              userName={userName}
              sex={userSex}
              records={records}
              loading={loading}
            />
          </ErrorBoundary>
        } />

        <Route path="/new-entry" element={
          <ErrorBoundary>
            <MeasurementForm
              onSave={handleSave}
              previousRecord={records[0]}
              recordToEdit={editingRecord || undefined}
              onCancel={() => {
                setEditingRecord(null)
                navigate('/history')
              }}
              sex={userSex}
            />
          </ErrorBoundary>
        } />

        <Route path="/history" element={
          <ErrorBoundary>
            <HistoryView
              records={records}
              onDelete={deleteRecord}
              onSelect={(record) => {
                setEditingRecord(record)
                navigate('/new-entry')
              }}
            />
          </ErrorBoundary>
        } />

        <Route path="/analysis" element={
          <ErrorBoundary>
            <AnalysisView
              records={records}
              goals={goals}
              sex={userSex}
            />
          </ErrorBoundary>
        } />

        <Route path="/potential" element={
          <SkeletalFrameView
            baseline={profile?.baseline}
            currentMeasurements={records[0]?.measurements}
            profile={profile}
            sex={userSex}
            onSave={(baseline) => updateProfile({ baseline })}
          />
        } />

        <Route path="/calculator" element={
          <MetabolismCalculator
            sex={userSex}
            currentWeight={records[0]?.measurements.weight || 104}
            height={records[0]?.measurements.height || profile?.height || 191}
            age={profile?.age || 38}
            userId={authUser?.uid}
          />
        } />

        <Route path="/goals" element={
          <GoalsView
            goals={goals}
            onAddGoal={addGoal}
            onDeleteGoal={deleteGoal}
            latestRecord={records[0]}
            profile={profile}
            records={records}
          />
        } />

        <Route path="/settings" element={
          <SettingsView
            records={records}
            goals={goals}
            profile={profile}
          />
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    </Suspense>
  )
}

export default App
