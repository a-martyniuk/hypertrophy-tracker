import { z } from 'zod';

const positiveNumber = z.number().min(0, "El valor no puede ser negativo");

const bodyMeasurementsSchema = z.object({
    weight: positiveNumber,
    height: positiveNumber.optional(),
    bodyFat: positiveNumber.optional(),
    neck: positiveNumber,
    back: positiveNumber,
    pecho: positiveNumber,
    waist: positiveNumber,
    hips: positiveNumber,
    arm: z.object({
        left: positiveNumber,
        right: positiveNumber,
    }),
    forearm: z.object({
        left: positiveNumber,
        right: positiveNumber,
    }),
    wrist: z.object({
        left: positiveNumber,
        right: positiveNumber,
    }),
    thigh: z.object({
        left: positiveNumber,
        right: positiveNumber,
    }),
    calf: z.object({
        left: positiveNumber,
        right: positiveNumber,
    }),
    ankle: z.object({
        left: positiveNumber,
        right: positiveNumber,
    }),
});

export const conditionSchema = z.union([
    z.literal('fasted'),
    z.literal('post_workout'),
    z.literal('rest_day')
]);

export const recordMetadataSchema = z.object({
    condition: conditionSchema,
    sleepHours: positiveNumber.max(24, "Máximo 24 horas").optional(),
});

export const measurementRecordSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
    measurements: bodyMeasurementsSchema,
    notes: z.string().optional(),
    metadata: recordMetadataSchema,
});

export type MeasurementFormValues = z.infer<typeof measurementRecordSchema>;
