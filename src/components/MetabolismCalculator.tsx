import { useState, useEffect } from 'react'
import {
    Activity,
    Flame,
    Zap,
    Scale,
    Dumbbell,
    Waves,
    TrendingDown,
    TrendingUp,
    Minus
} from 'lucide-react'
import {
    calculateBMR,
    calculateBasalCalories,
    calculateSessionCalories,
    calculateDailyActiveCalories,
    calculateTargets,
    ACTIVITY_FACTORS,
    type Sex,
    type TrainingType,
    type TrainingIntensity
} from '../utils/metabolism'

interface MetabolismCalculatorProps {
    sex: Sex
    age?: number
    currentWeight?: number
    height?: number
}

export function MetabolismCalculator({ sex, age: initialAge, currentWeight, height: initialHeight }: MetabolismCalculatorProps) {
    // Physical Stats
    const [age, setAge] = useState<number>(initialAge || 25)
    const [weight, setWeight] = useState<number>(currentWeight || 70)
    const [height, setHeight] = useState<number>(initialHeight || 175)

    // Activity Stats
    const [neatLevel, setNeatLevel] = useState<number>(ACTIVITY_FACTORS.SEDENTARY)

    // Training Stats
    const [trainingType, setTrainingType] = useState<TrainingType>('strength')
    const [trainingFreq, setTrainingFreq] = useState<number>(4)
    const [sessionDuration, setSessionDuration] = useState<number>(1.5) // hours
    const [intensity, setIntensity] = useState<TrainingIntensity>('medium')

    // Results State
    const [bmr, setBmr] = useState(0)
    const [basalTotal, setBasalTotal] = useState(0)
    const [activeCalories, setActiveCalories] = useState(0)
    const [totalTDEE, setTotalTDEE] = useState(0)
    const [targets, setTargets] = useState<ReturnType<typeof calculateTargets> | null>(null)

    useEffect(() => {
        // 1. Calculate BMR
        const calculatedBMR = calculateBMR(weight, height, age, sex)
        setBmr(Math.round(calculatedBMR))

        // 2. Calculate Basal (BMR + NEAT)
        const calculatedBasal = calculateBasalCalories(calculatedBMR, neatLevel)
        setBasalTotal(calculatedBasal)

        // 3. Calculate Active Calories (Training)
        const sessionCals = calculateSessionCalories(weight, sessionDuration, intensity, trainingType)
        const dailyActiveCals = calculateDailyActiveCalories(sessionCals, trainingFreq)
        setActiveCalories(dailyActiveCals)

        // 4. Total TDEE
        const tdee = calculatedBasal + dailyActiveCals
        setTotalTDEE(tdee)

        // 5. Targets
        setTargets(calculateTargets(tdee))

    }, [weight, height, age, sex, neatLevel, trainingType, trainingFreq, sessionDuration, intensity])

    const InfoCard = ({ title, value, unit, icon: Icon, subtext, color = 'var(--text-primary)' }: any) => (
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Icon size={16} />
                {title}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: color }}>
                {value} <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{unit}</span>
            </div>
            {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subtext}</div>}
        </div>
    )

    const TargetRow = ({ title, calories, diff, type }: any) => {
        let color = 'var(--text-primary)'
        let Icon = Minus
        if (type === 'deficit') { color = 'var(--danger-color)'; Icon = TrendingDown }
        if (type === 'surplus') { color = 'var(--success-color)'; Icon = TrendingUp }

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: `color-mix(in srgb, ${color} 10%, transparent)`,
                        color: color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600' }}>{title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{diff}</div>
                    </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: color }}>
                    {calories}
                </div>
            </div>
        )
    }

    return (
        <div className="calculator-container animate-fade">
            <div className="input-section">
                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scale size={24} color="var(--primary-color)" /> Datos Físicos
                </h2>

                <div className="input-grid">
                    <div className="input-group">
                        <label>Edad</label>
                        <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label>Peso (kg)</label>
                        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label>Altura (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} />
                    </div>
                </div>

                <h2 style={{ margin: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={24} color="var(--primary-color)" /> Nivel de Actividad (NEAT)
                </h2>

                <div className="selector-group">
                    {Object.entries(ACTIVITY_FACTORS).map(([key, val]) => (
                        <button
                            key={key}
                            className={`select-btn ${neatLevel === val ? 'active' : ''}`}
                            onClick={() => setNeatLevel(val)}
                        >
                            <div className="val">x{val}</div>
                            <div className="desc">
                                {key === 'SEDENTARY' && 'Sedentario (Oficina)'}
                                {key === 'LIGHTLY_ACTIVE' && 'Poco Activo (De pie)'}
                                {key === 'MODERATELY_ACTIVE' && 'Activo (Movimiento const.)'}
                                {key === 'VERY_ACTIVE' && 'Muy Activo (Físico)'}
                            </div>
                        </button>
                    ))}
                </div>

                <h2 style={{ margin: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={24} color="var(--primary-color)" /> Entrenamiento
                </h2>

                <div className="input-grid">
                    <div className="input-group">
                        <label>Tipo</label>
                        <select value={trainingType} onChange={(e: any) => setTrainingType(e.target.value)}>
                            <option value="strength">Fuerza / Pesas</option>
                            <option value="cardio">Cardio / Resistencia</option>
                            <option value="mixed">Híbrido</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Sesiones / Semana</label>
                        <input type="number" value={trainingFreq} onChange={e => setTrainingFreq(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label>Duración (horas)</label>
                        <input type="number" step="0.5" value={sessionDuration} onChange={e => setSessionDuration(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label>Intensidad</label>
                        <select value={intensity} onChange={(e: any) => setIntensity(e.target.value)}>
                            <option value="low">Baja (RPE 1-4)</option>
                            <option value="medium">Media (RPE 5-7)</option>
                            <option value="high">Alta (RPE 8-10)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="results-section">
                <h2 style={{ marginBottom: '1.5rem' }}>Resultados Estimados</h2>

                <div className="results-grid">
                    <InfoCard
                        title="Metabolismo Basal (BMR)"
                        value={bmr}
                        unit="kcal"
                        icon={Flame}
                        subtext="Gasto en reposo absoluto"
                    />
                    <InfoCard
                        title="Gasto Diario (NEAT)"
                        value={basalTotal}
                        unit="kcal"
                        icon={Activity}
                        subtext="BMR + Actividad diaria"
                    />
                    <InfoCard
                        title="Gasto Entrenamiento"
                        value={activeCalories}
                        unit="kcal"
                        icon={Zap}
                        subtext="Promedio diario extra"
                        color="var(--primary-color)"
                    />
                    <InfoCard
                        title="TDEE Total"
                        value={totalTDEE}
                        unit="kcal"
                        icon={Waves}
                        subtext="Mantenimiento real"
                        color="#fff" // Clean white for main contrast
                    />
                </div>

                <div className="targets-wrapper card glass" style={{ marginTop: '2rem', padding: '0' }}>
                    <div className="target-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h3>Objetivos Calóricos</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Basado en tu TDEE de {totalTDEE} kcal</p>
                    </div>

                    {targets && (
                        <div className="targets-list">
                            <TargetRow
                                title="Definición Agresiva"
                                calories={targets.deficit.aggressive.calories}
                                diff="-20%"
                                type="deficit"
                            />
                            <TargetRow
                                title="Definición Sostenible"
                                calories={targets.deficit.mild.calories}
                                diff="-10%"
                                type="deficit"
                            />
                            <TargetRow
                                title="Mantenimiento"
                                calories={targets.maintenance}
                                diff="0%"
                                type="maintenance"
                            />
                            <TargetRow
                                title="Volumen Limpio"
                                calories={targets.surplus.lean.calories}
                                diff="+5%"
                                type="surplus"
                            />
                            <TargetRow
                                title="Volumen Agresivo"
                                calories={targets.surplus.aggressive.calories}
                                diff="+15%"
                                type="surplus"
                            />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .calculator-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding-bottom: 4rem;
        }

        @media (max-width: 1024px) {
          .calculator-container {
            grid-template-columns: 1fr;
          }
        }

        .input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .input-group input, .input-group select {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          padding: 0.8rem;
          border-radius: 12px;
          color: white;
          font-family: var(--font-main);
          font-size: 1rem;
        }

        .input-group input:focus, .input-group select:focus {
          border-color: var(--primary-color);
          outline: none;
        }

        .selector-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem;
        }

        .select-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          padding: 1rem;
          border-radius: 12px;
          text-align: left;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .select-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .select-btn.active {
          background: rgba(245, 158, 11, 0.15);
          border-color: var(--primary-color);
        }

        .select-btn .val {
          font-weight: 700;
          color: var(--primary-color);
        }

        .select-btn .desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
      `}</style>
        </div>
    )
}
