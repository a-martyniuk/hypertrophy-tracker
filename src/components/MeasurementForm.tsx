import { useState, useRef, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Activity } from 'lucide-react';
import { DynamicSilhouette } from './DynamicSilhouette';
import { useAuth } from '../hooks/useAuth';
import type { MeasurementRecord, RecordMetadata, BodyMeasurements } from '../types/measurements';
import { measurementRecordSchema, type MeasurementFormValues } from '../schemas/measurements';
import { MeasurementInput } from './measurement/MeasurementInput';
import { MeasurementSection } from './measurement/MeasurementSection';
import { FormActions } from './measurement/FormActions';
import { ContextSection } from './measurement/ContextSection';
import { useToast } from './ui/ToastProvider';
import { useMeasurementLines } from '../hooks/useMeasurementLines';
import { MapModal } from './measurement/MapModal';
import { BodyFatCalculatorModal } from './measurement/BodyFatCalculatorModal';
import { MobileTapMeasure } from './measurement/MobileTapMeasure';
import { Tooltip } from './Tooltip';
import { Map as MapIcon, Calculator, Info } from 'lucide-react';
import './MeasurementForm.css';

interface Props {
  onSave: (record: MeasurementRecord) => Promise<{ success: boolean; error?: any }>;
  onCancel: () => void;
  previousRecord?: MeasurementRecord;
  recordToEdit?: MeasurementRecord;
  sex?: 'male' | 'female';
}

const DEFAULT_MEASUREMENTS = {
  weight: 0, height: 0, bodyFat: 0, neck: 0, back: 0, pecho: 0, waist: 0, hips: 0,
  arm: { left: 0, right: 0 }, forearm: { left: 0, right: 0 }, wrist: { left: 0, right: 0 },
  thigh: { left: 0, right: 0 }, calf: { left: 0, right: 0 }, ankle: { left: 0, right: 0 },
};

export const MeasurementForm = ({ onSave, onCancel, previousRecord, recordToEdit, sex = 'male' }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToast } = useToast();
  const containerRef = useRef<HTMLFormElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1000);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTodayDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize date: if editing an existing record, use that date. For any new entry, ALWAYS default to TODAY.
  const [date, setDate] = useState(() => {
    if (recordToEdit?.date) return new Date(recordToEdit.date).toLocaleDateString('en-CA');
    return getTodayDateStr();
  });

  // Sync date when recordToEdit prop changes
  useEffect(() => {
    if (recordToEdit?.date) {
      setDate(new Date(recordToEdit.date).toLocaleDateString('en-CA'));
    } else {
      setDate(getTodayDateStr());
    }
  }, [recordToEdit]);

  // Initialize draft values if not editing
  const defaultValues = (() => {
    if (recordToEdit) return recordToEdit.measurements;
    return previousRecord?.measurements || DEFAULT_MEASUREMENTS;
  })();

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<MeasurementFormValues['measurements']>({
    // @ts-ignore - resolver types mismatch with deep nested objects sometimes, but runtime is fine
    resolver: zodResolver(measurementRecordSchema.shape.measurements),
    defaultValues
  });

  const measurements = useWatch({ control });

  // Persist draft for new entries
  useEffect(() => {
    if (!recordToEdit) {
      localStorage.setItem('measurement_draft_values', JSON.stringify(measurements));
    }
  }, [measurements, recordToEdit]);

  const [notes, setNotes] = useState(recordToEdit?.notes || '');
  const [metadata, setMetadata] = useState<RecordMetadata>(recordToEdit?.metadata || {
    condition: 'fasted',
    sleepHours: 8
  });

  const lines = useMeasurementLines(containerRef as React.RefObject<HTMLElement>, measurements as unknown as BodyMeasurements, sex);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isBfCalcOpen, setIsBfCalcOpen] = useState(false);

  const onSubmit = async (data: MeasurementFormValues['measurements']) => {
    const isEditing = Boolean(recordToEdit?.id);
    const record: MeasurementRecord = {
      id: isEditing ? recordToEdit!.id : crypto.randomUUID(),
      userId: user?.uid || 'default-user',
      date: new Date(`${date}T00:00:00`).toISOString(),
      measurements: data,
      notes,
      metadata,
    };

    try {
      const result = await onSave(record);
      if (result.success) {
        localStorage.removeItem('measurement_draft_values');
        localStorage.removeItem('measurement_draft_date');
        addToast(t('common.save') + " " + t('common.success', { defaultValue: 'Success' }), "success");
      } else {
        addToast(result.error?.message || t('common.error'), "error");
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      addToast(t('common.error'), "error");
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const sourceRecord = recordToEdit || previousRecord;
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);

  // Helper for rendering controlled inputs
  const renderInput = (name: keyof MeasurementFormValues['measurements'], label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <MeasurementInput
          id={`input-${name}`}
          label={label}
          // @ts-ignore - field.value can be complex union, but we safeguard via defaultValues
          value={field.value ?? 0}
          onChange={field.onChange}
          previousValue={sourceRecord?.measurements[name]}
          // @ts-ignore
          className={errors[name] ? 'input-error' : ''}
          onFocus={() => setActiveMuscle(name)}
          onBlur={() => setActiveMuscle(null)}
          onMouseEnter={() => setActiveMuscle(name)}
          onMouseLeave={() => setActiveMuscle(null)}
        />
      )}
    />
  );

  return (
    <form ref={containerRef} className="measurement-form animate-fade" onSubmit={handleSubmit(onSubmit)}>
      {isMobile ? (
        <MobileTapMeasure
          measurements={measurements as unknown as BodyMeasurements}
          activeMuscle={activeMuscle || 'pecho'}
          setActiveMuscle={(m) => setActiveMuscle(m)}
          setValue={setValue}
          previousRecord={previousRecord}
          sex={sex}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenBfCalc={() => setIsBfCalcOpen(true)}
          date={date}
          setDate={setDate}
          errors={errors}
        />
      ) : (
        <>
          <svg className="connector-overlay" style={{ pointerEvents: 'none' }}>
            <defs>
              <filter id="activeLineGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {lines.map(line => {
              const isActive = activeMuscle && line.id.startsWith(`input-${activeMuscle}`);
              return (
                <g key={line.id}>
                  <line
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke={isActive ? '#38bdf8' : '#f59e0b'}
                    strokeWidth={isActive ? '3.5' : '1.8'}
                    opacity={isActive ? 1 : activeMuscle ? 0.25 : 0.75}
                    filter={isActive ? 'url(#activeLineGlow)' : undefined}
                    style={{ transition: 'all 0.25s ease' }}
                  />
                  {isActive && (
                    <circle
                      cx={line.x2} cy={line.y2} r="5"
                      fill="#38bdf8"
                      filter="url(#activeLineGlow)"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Unified Page Header */}
          <div className="view-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
                <Activity size={24} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('common.form.title')}</h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{t('common.form.subtitle')}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {recordToEdit ? (
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.3)', fontWeight: 700 }}>
                  MODO EDICIÓN
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                  NUEVO REGISTRO
                </span>
              )}
              <input type="date" className="date-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {/* Anatomical Perspective Banner */}
          <div className="anatomical-guide-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Info size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>Perspectiva Anatómica Propia (Vista de Frente):</strong> Los campos <strong>IZQ (L)</strong> y <strong>DER (R)</strong> corresponden a <strong>tu propio brazo/pierna izquierda y derecha</strong>.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
                👈 TU IZQUIERDA (L)
              </span>
              <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                TU DERECHA (R) 👉
              </span>
            </div>
          </div>

          <div className="form-layout-editor">
            <div className="editor-left">
              <MeasurementSection title={t('common.form.core_metrics')}>
                {renderInput('weight', t('common.form.weight'))}
                {renderInput('height', t('common.form.height'))}
                <div style={{ position: 'relative' }}>
                  {renderInput('bodyFat', t('common.form.body_fat'))}
                  <button
                    type="button"
                    onClick={() => setIsBfCalcOpen(true)}
                    style={{
                      marginTop: '0.35rem',
                      width: '100%',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px dashed rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      color: 'var(--primary-color)',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Calculator size={13} />
                    <span>Calcular con Fórmula US Navy</span>
                  </button>
                </div>
              </MeasurementSection>

              <MeasurementSection title={t('common.form.torso')}>
                {renderInput('neck', t('common.form.neck'))}
                {renderInput('back', t('common.form.back'))}
                {renderInput('pecho', t('common.form.chest'))}
                {renderInput('waist', t('common.form.waist'))}
                {renderInput('hips', t('common.form.hips'))}
              </MeasurementSection>
            </div>

            <div className="editor-center glass">
              <div className="map-link-container">
                <Tooltip content={t('common.form.muscle_map.tooltip')} position="bottom">
                  <button
                    type="button"
                    className="btn-map-link"
                    onClick={() => setIsMapOpen(true)}
                  >
                    <MapIcon size={16} />
                    <span>{t('common.form.muscle_map.label')}</span>
                  </button>
                </Tooltip>
              </div>

              <DynamicSilhouette
                measurements={measurements as unknown as BodyMeasurements}
                sex={sex}
                activeMuscle={activeMuscle}
              />

              <MapModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                title={t('common.form.muscle_map.label')}
              />
            </div>

            <div className="editor-right">
              <MeasurementSection title={t('common.form.upper_limbs')}>
                {renderInput('arm', t('common.form.arm'))}
                {renderInput('forearm', t('common.form.forearm'))}
                {renderInput('wrist', t('common.form.wrist'))}
              </MeasurementSection>

              <MeasurementSection title={t('common.form.lower_limbs')}>
                {renderInput('thigh', t('common.form.thigh'))}
                {renderInput('calf', t('common.form.calf'))}
                {renderInput('ankle', t('common.form.ankle'))}
              </MeasurementSection>
            </div>
          </div>
        </>
      )}

      <ContextSection
        metadata={metadata}
        onChange={setMetadata}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
      />

      {hasErrors && (
        <div className="form-error-banner glass animate-fade">
          <Activity size={18} className="text-danger" />
          <span>{t('common.form.errors_banner')}</span>
        </div>
      )}

      <BodyFatCalculatorModal
        isOpen={isBfCalcOpen}
        onClose={() => setIsBfCalcOpen(false)}
        onApply={(bfVal) => {
          setValue('bodyFat', bfVal, { shouldValidate: true, shouldDirty: true });
        }}
        sex={sex}
        initialHeight={measurements.height}
        initialWeight={measurements.weight}
        initialNeck={measurements.neck}
        initialWaist={measurements.waist}
        initialHips={measurements.hips}
      />

      <FormActions isSaving={isSubmitting} onCancel={onCancel} />
    </form >
  );
};
