import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Activity,
    Flame,
    Zap,
    Scale,
    Dumbbell,
    Waves,
    TrendingDown,
    TrendingUp,
    Minus,
    HelpCircle
} from 'lucide-react'
import { Tooltip } from './Tooltip'
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
    userId?: string
}

export function MetabolismCalculator({ sex, age: initialAge, currentWeight, height: initialHeight, userId }: MetabolismCalculatorProps) {
    const { t } = useTranslation();
    const loadSetting = <T,>(key: string, defaultVal: T): T => {
        if (!userId) return defaultVal
        try {
            const saved = localStorage.getItem(`calc_settings_${userId}_${key}`)
            return saved ? JSON.parse(saved) : defaultVal
        } catch (e) {
            return defaultVal
        }
    }

    const saveSetting = (key: string, val: any) => {
        if (userId) localStorage.setItem(`calc_settings_${userId}_${key}`, JSON.stringify(val))
    }

    // Physical Stats
    const [age, setAge] = useState<number>(() => loadSetting('age', initialAge || 25))
    const [weight, setWeight] = useState<number>(() => loadSetting('weight', currentWeight || 70))
    const [height, setHeight] = useState<number>(() => loadSetting('height', initialHeight || 175))

    // Sync props if they update (and aren't just defaults)
    // Sync props only if we explicitly want to reset (omitted to prefer user persistence)
    // useEffect(() => { if (initialAge) { setAge(initialAge); saveSetting('age', initialAge) } }, [initialAge])
    // useEffect(() => { if (currentWeight) { setWeight(currentWeight); saveSetting('weight', currentWeight) } }, [currentWeight])
    // useEffect(() => { if (initialHeight) { setHeight(initialHeight); saveSetting('height', initialHeight) } }, [initialHeight])

    // Activity Stats
    const [neatLevel, setNeatLevel] = useState<number>(() => loadSetting('neatLevel', ACTIVITY_FACTORS.SEDENTARY))

    // Training Stats
    const [trainingType, setTrainingType] = useState<TrainingType>(() => loadSetting('trainingType', 'strength'))
    const [trainingFreq, setTrainingFreq] = useState<number>(() => loadSetting('trainingFreq', 4))
    const [sessionDuration, setSessionDuration] = useState<number>(() => loadSetting('sessionDuration', 1.5))
    const [intensity, setIntensity] = useState<TrainingIntensity>(() => loadSetting('intensity', 'medium'))

    // Persistence Effects
    useEffect(() => saveSetting('neatLevel', neatLevel), [neatLevel, userId])
    useEffect(() => saveSetting('trainingType', trainingType), [trainingType, userId])
    useEffect(() => saveSetting('trainingFreq', trainingFreq), [trainingFreq, userId])
    useEffect(() => saveSetting('sessionDuration', sessionDuration), [sessionDuration, userId])
    useEffect(() => saveSetting('intensity', intensity), [intensity, userId])
    // Also persist manual physical changes
    useEffect(() => saveSetting('age', age), [age, userId])
    useEffect(() => saveSetting('weight', weight), [weight, userId])
    useEffect(() => saveSetting('height', height), [height, userId])

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

    const InfoCard = ({ title, value, unit, icon: Icon, subtext, color = 'var(--text-primary)', tooltip }: any) => (
        <div className="card glass info-card-interactive">
            <div className="card-header">
                <Icon size={16} />
                {title}
                {tooltip && (
                    <Tooltip content={tooltip} position="top">
                        <HelpCircle size={14} className="help-icon" />
                    </Tooltip>
                )}
            </div>
            <div className="card-value" style={{ color: color }}>
                {value} <span className="unit">{unit}</span>
            </div>
            {subtext && <div className="card-subtext">{subtext}</div>}
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
                    <Scale size={24} color="var(--primary-color)" /> {t('common.metabolism.physical_stats')}
                </h2>

                <div className="input-grid">
                    <div className="input-group">
                        <label>{t('common.metabolism.age')}</label>
                        <input type="number" value={age || ''} onChange={e => setAge(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label>{t('common.metabolism.weight')}</label>
                        <input type="number" value={weight || ''} onChange={e => setWeight(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label>{t('common.metabolism.height')}</label>
                        <input type="number" value={height || ''} onChange={e => setHeight(Number(e.target.value))} />
                    </div>
                </div>

                <h2 style={{ margin: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={24} color="var(--primary-color)" /> {t('common.metabolism.neat_title')}
                    <Tooltip content={t('common.metabolism.neat_tooltip')} position="right">
                        <HelpCircle size={18} style={{ color: 'var(--text-secondary)', cursor: 'help' }} />
                    </Tooltip>
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
                                {key === 'SEDENTARY' && t('common.metabolism.activity_levels.sedentary')}
                                {key === 'LIGHTLY_ACTIVE' && t('common.metabolism.activity_levels.lightly_active')}
                                {key === 'MODERATELY_ACTIVE' && t('common.metabolism.activity_levels.moderately_active')}
                                {key === 'VERY_ACTIVE' && t('common.metabolism.activity_levels.very_active')}
                            </div>
                        </button>
                    ))}
                </div>

                <h2 style={{ margin: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={24} color="var(--primary-color)" /> {t('common.metabolism.training_title')}
                </h2>

                <div className="input-grid">
                    <div className="input-group">
                        <label className="flex items-center gap-2">
                            {t('common.metabolism.type')}
                            <Tooltip content={t('common.metabolism.training_expenditure_tooltip')} position="top">
                                <HelpCircle size={14} className="text-secondary opacity-60 cursor-help" />
                            </Tooltip>
                        </label>
                        <select value={trainingType} onChange={(e: any) => setTrainingType(e.target.value)}>
                            <option value="strength">{t('common.metabolism.training_types.strength')}</option>
                            <option value="cardio">{t('common.metabolism.training_types.cardio')}</option>
                            <option value="mixed">{t('common.metabolism.training_types.mixed')}</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="flex items-center gap-2">
                            {t('common.metabolism.frequency')}
                            <Tooltip content="Número de días que entrenas a la semana." position="top">
                                <HelpCircle size={14} className="text-secondary opacity-60 cursor-help" />
                            </Tooltip>
                        </label>
                        <input type="number" value={trainingFreq || ''} onChange={e => setTrainingFreq(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label className="flex items-center gap-2">
                            {t('common.metabolism.duration')}
                            <Tooltip content="Duración promedio de una sesión (sin contar vestuario/ducha)." position="top">
                                <HelpCircle size={14} className="text-secondary opacity-60 cursor-help" />
                            </Tooltip>
                        </label>
                        <input type="number" step="0.5" value={sessionDuration || ''} onChange={e => setSessionDuration(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                        <label className="flex items-center gap-2">
                            {t('common.metabolism.intensity')}
                            <Tooltip content="RPE (Esfuerzo Percibido). Baja (paseo), Media (gym normal), Alta (Crossfit/HIIT real)." position="top">
                                <HelpCircle size={14} className="text-secondary opacity-60 cursor-help" />
                            </Tooltip>
                        </label>
                        <select value={intensity} onChange={(e: any) => setIntensity(e.target.value)}>
                            <option value="low">{t('common.metabolism.intensities.low')}</option>
                            <option value="medium">{t('common.metabolism.intensities.medium')}</option>
                            <option value="high">{t('common.metabolism.intensities.high')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="results-section">
                <h2 style={{ marginBottom: '1.5rem' }}>{t('common.metabolism.results_title')}</h2>

                <div className="results-grid">
                    <InfoCard
                        title={t('common.metabolism.bmr')}
                        value={bmr}
                        unit="kcal"
                        icon={Flame}
                        subtext={t('common.metabolism.bmr_sub')}
                        tooltip={t('common.metabolism.bmr_tooltip')}
                    />
                    <InfoCard
                        title={t('common.metabolism.daily_expenditure')}
                        value={basalTotal}
                        unit="kcal"
                        icon={Activity}
                        subtext={t('common.metabolism.daily_expenditure_sub')}
                        tooltip={t('common.metabolism.daily_expenditure_tooltip')}
                    />
                    <InfoCard
                        title={t('common.metabolism.training_expenditure')}
                        value={activeCalories}
                        unit="kcal"
                        icon={Zap}
                        subtext={t('common.metabolism.training_expenditure_sub')}
                        color="var(--primary-color)"
                        tooltip={t('common.metabolism.training_expenditure_tooltip')}
                    />
                    <InfoCard
                        title={t('common.metabolism.tdee')}
                        value={totalTDEE}
                        unit="kcal"
                        icon={Waves}
                        subtext={t('common.metabolism.tdee_sub')}
                        color="#fff" // Clean white for main contrast
                        tooltip={t('common.metabolism.tdee_tooltip')}
                    />
                </div>

                <div className="targets-wrapper card glass" style={{ marginTop: '2rem', padding: '0' }}>
                    <div className="target-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h3>{t('common.metabolism.targets_title')}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('common.metabolism.tdee_sub')} {totalTDEE} kcal</p>
                    </div>

                    {targets && (
                        <div className="targets-list">
                            <TargetRow
                                title={t('common.metabolism.targets.cut_aggressive')}
                                calories={targets.deficit.aggressive.calories}
                                diff="-20%"
                                type="deficit"
                            />
                            <TargetRow
                                title={t('common.metabolism.targets.cut_sustainable')}
                                calories={targets.deficit.mild.calories}
                                diff="-10%"
                                type="deficit"
                            />
                            <TargetRow
                                title={t('common.metabolism.targets.maintenance')}
                                calories={targets.maintenance}
                                diff="0%"
                                type="maintenance"
                            />
                            <TargetRow
                                title={t('common.metabolism.targets.bulk_lean')}
                                calories={targets.surplus.lean.calories}
                                diff="+5%"
                                type="surplus"
                            />
                            <TargetRow
                                title={t('common.metabolism.targets.bulk_aggressive')}
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
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .info-card-interactive {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            position: relative;
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .help-icon {
            cursor: help;
            opacity: 0.6;
        }

        .card-value {
            font-size: 1.8rem;
            font-weight: 700;
        }

        .unit {
            font-size: 1rem;
            font-weight: 500;
            color: var(--text-secondary);
        }

        .card-subtext {
            font-size: 0.8rem;
            color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .calculator-container {
             grid-template-columns: 1fr;
             padding: 0 1rem 4rem 1rem;
             gap: 1.5rem;
          }
          .input-grid {
            grid-template-columns: 1fr;
          }
          .selector-group {
            grid-template-columns: 1fr;
          }
          .results-grid {
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

        .info-card-interactive {
          transition: transform 0.2s, background 0.2s, z-index 0s;
          z-index: 1;
        }

        .info-card-interactive:hover {
          z-index: 10;
          transform: translateY(-2px);
          background: var(--surface-hover);
        }
      `}</style>
        </div>
    )
}
