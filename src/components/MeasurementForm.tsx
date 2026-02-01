import { useState, useRef, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Activity } from 'lucide-react';
import { DynamicSilhouette } from './DynamicSilhouette';
import { useAuth } from '../hooks/useAuth';
import type { BodyPhoto, MeasurementRecord, RecordMetadata, BodyMeasurements } from '../types/measurements';
import { measurementRecordSchema, type MeasurementFormValues } from '../schemas/measurements';
import { MeasurementInput } from './measurement/MeasurementInput';
import { MeasurementSection } from './measurement/MeasurementSection';
import { FormActions } from './measurement/FormActions';
import { PhotoUploadSection } from './measurement/PhotoUploadSection';
import { ContextSection } from './measurement/ContextSection';
import { useToast } from './ui/ToastProvider';
import { useMeasurementLines } from '../hooks/useMeasurementLines';
import { MapModal } from './measurement/MapModal';
import { Tooltip } from './Tooltip';
import { Map as MapIcon } from 'lucide-react';
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

  // Initialize default date
  const defaultDate = (() => {
    if (recordToEdit?.date) return new Date(recordToEdit.date).toLocaleDateString('en-CA');
    if (!recordToEdit) {
      const saved = localStorage.getItem('measurement_draft_date');
      if (saved) return saved;
    }
    return new Date().toLocaleDateString('en-CA');
  })();

  const [date, setDate] = useState(defaultDate);

  // Initialize draft values if not editing
  const defaultValues = (() => {
    if (recordToEdit) return recordToEdit.measurements;
    const saved = localStorage.getItem('measurement_draft_values');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return previousRecord?.measurements || DEFAULT_MEASUREMENTS;
  })();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<MeasurementFormValues['measurements']>({
    // @ts-ignore - resolver types mismatch with deep nested objects sometimes, but runtime is fine
    resolver: zodResolver(measurementRecordSchema.shape.measurements),
    defaultValues
  });

  const measurements = useWatch({ control });

  // Persist draft
  useEffect(() => {
    if (!recordToEdit) {
      localStorage.setItem('measurement_draft_values', JSON.stringify(measurements));
      localStorage.setItem('measurement_draft_date', date);
    }
  }, [measurements, date, recordToEdit]);

  const [notes, setNotes] = useState(recordToEdit?.notes || '');
  const [photos, setPhotos] = useState<BodyPhoto[]>(recordToEdit?.photos || []);
  const [metadata, setMetadata] = useState<RecordMetadata>(recordToEdit?.metadata || {
    condition: 'fasted',
    sleepHours: 8
  });

  const lines = useMeasurementLines(containerRef as React.RefObject<HTMLElement>, measurements as unknown as BodyMeasurements, sex);

  const [isMapOpen, setIsMapOpen] = useState(false);

  const onSubmit = async (data: MeasurementFormValues['measurements']) => {
    const record: MeasurementRecord = {
      id: recordToEdit?.id || crypto.randomUUID(),
      userId: user?.id || 'default-user',
      date: new Date(`${date}T00:00:00`).toISOString(),
      measurements: data,
      notes,
      metadata,
      photos,
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
        />
      )}
    />
  );

  return (
    <form ref={containerRef} className="measurement-form animate-fade" onSubmit={handleSubmit(onSubmit)}>
      <svg className="connector-overlay" style={{ pointerEvents: 'none' }}>
        {lines.map(line => (
          <g key={line.id}>
            <line
              x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
              stroke="#f59e0b" strokeWidth="2"
            />
          </g>
        ))}
      </svg>

      <header className="form-header glass">
        <div className="header-left">
          <h2>{t('common.form.title')}</h2>
          <p className="subtitle">{t('common.form.subtitle')}</p>
        </div>
        <input type="date" className="date-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </header>

      <div className="form-layout-editor">
        <div className="editor-left">
          <MeasurementSection title={t('common.form.core_metrics')}>
            {renderInput('weight', t('common.form.weight'))}
            {renderInput('height', t('common.form.height'))}
            {renderInput('bodyFat', t('common.form.body_fat'))}
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

      <ContextSection
        metadata={metadata}
        onChange={setMetadata}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
      />

      <PhotoUploadSection
        userId={user?.id || 'guest'}
        recordId={recordToEdit?.id && recordToEdit.id !== 'new-record' ? recordToEdit.id : (previousRecord?.id || 'new-record')}
        existingPhotos={photos}
        onPhotosUpdated={setPhotos}
      />

      {hasErrors && (
        <div className="form-error-banner glass animate-fade">
          <Activity size={18} className="text-danger" />
          <span>{t('common.form.errors_banner')}</span>
        </div>
      )}

      <FormActions isSaving={isSubmitting} onCancel={onCancel} />
    </form >
  );
};
