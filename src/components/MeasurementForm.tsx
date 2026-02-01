import { useState, useRef, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
        addToast("Registro guardado correctamente.", "success");
      } else {
        addToast(result.error?.message || "Error al guardar.", "error");
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      addToast("Ocurrió un error inesperado.", "error");
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
          <h2>Auditoría Corporal</h2>
          <p className="subtitle">Configura los parámetros del HUD interactivo</p>
        </div>
        <input type="date" className="date-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </header>

      <div className="form-layout-editor">
        <div className="editor-left">
          <MeasurementSection title="Métricas Core">
            {renderInput('weight', 'PESO')}
            {renderInput('height', 'ALTURA')}
            {renderInput('bodyFat', 'GRASA%')}
          </MeasurementSection>

          <MeasurementSection title="Tronco">
            {renderInput('neck', 'CUELLO')}
            {renderInput('back', 'ESPALDA')}
            {renderInput('pecho', 'PECHO')}
            {renderInput('waist', 'CINTURA')}
            {renderInput('hips', 'CADERAS')}
          </MeasurementSection>
        </div>

        <div className="editor-center glass">
          <DynamicSilhouette
            measurements={measurements as unknown as BodyMeasurements}
            sex={sex}
          />
        </div>

        <div className="editor-right">
          <MeasurementSection title="Extremidades Sup.">
            {renderInput('arm', 'BRAZO')}
            {renderInput('forearm', 'ANTEBRAZO')}
            {renderInput('wrist', 'MUÑECA')}
          </MeasurementSection>

          <MeasurementSection title="Extremidades Inf.">
            {renderInput('thigh', 'MUSLO')}
            {renderInput('calf', 'PANTORRILLA')}
            {renderInput('ankle', 'TOBILLO')}
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
          <span>Por favor corrige los errores (valores negativos o inválidos).</span>
        </div>
      )}

      <FormActions isSaving={isSubmitting} onCancel={onCancel} />
    </form >
  );
};
