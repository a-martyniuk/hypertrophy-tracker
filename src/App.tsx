import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useMeasurements } from './hooks/useMeasurements'
import { MeasurementForm } from './components/MeasurementForm'
import { HistoryView } from './components/HistoryView'
import { AnalysisView } from './components/AnalysisView'
import { GoalsView } from './components/GoalsView'
import { SkeletalFrameView } from './components/SkeletalFrameView'
import { PhotoComparisonView } from './components/PhotoComparisonView'
import { MetabolismCalculator } from './components/MetabolismCalculator'
import { DashboardView } from './components/DashboardView'
import { SettingsView } from './components/SettingsView'
import { Layout } from './components/Layout'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { AuthView } from './components/AuthView'
import type { MeasurementRecord } from './types/measurements'
import { Activity } from 'lucide-react'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

function App() {
  const [isGuest, setIsGuest] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MeasurementRecord | null>(null)
  const navigate = useNavigate()

  const { user: authUser, session: authSession, loading: authLoading } = useAuth()
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
      setEditingRecord(null)
      navigate('/history')
    }
    return result
  }

  // If loading auth, show spinner
  if (authLoading) return <div className="loading-screen"><Activity className="animate-spin" /></div>;

  // If not authenticated and not guest, show Auth View
  if (!authUser && !isGuest) return <AuthView onGuest={() => setIsGuest(true)} />;

  return (
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
            sex={userSex}
            onSave={(baseline) => updateProfile({ baseline })}
          />
        } />

        <Route path="/comparison" element={
          <PhotoComparisonView records={records} />
        } />

        <Route path="/calculator" element={
          <MetabolismCalculator
            sex={userSex}
            currentWeight={records[0]?.measurements.weight}
            height={records[0]?.measurements.height}
            age={undefined} // Let calculator use storage or default
            userId={authUser?.id}
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
  )
}

export default App
