import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MeasurementRecord } from '../types/measurements';
import { generateTacticalDiagnosis } from './tacticalDiagnosis';
import { computeComprehensiveAnalysis } from './benchmarkAnalysis';

export interface PDFReportOptions {
    latestRecord?: MeasurementRecord;
    previousRecord?: MeasurementRecord;
    userName?: string;
    sex?: 'male' | 'female';
}

export const generateAthletePDFReport = (options: PDFReportOptions) => {
    const {
        latestRecord,
        previousRecord,
        userName = 'Atleta',
        sex = 'male'
    } = options;

    if (!latestRecord) {
        alert('No hay registros de medición para exportar.');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const m = latestRecord.measurements;
    const diagnosis = generateTacticalDiagnosis(latestRecord, previousRecord);
    const analysis = computeComprehensiveAnalysis(m, sex);

    const primaryColor = [245, 158, 11]; // Gold/Amber #f59e0b
    const darkBg = [12, 15, 24];
    const textLight = [248, 250, 252];
    const textMuted = [148, 163, 184];

    // Background
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // Decorative top golden bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 4, 'F');

    // Brand Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('HYPERTROPHY TRACKER PRO', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('AUDITORÍA BIOMÉTRICA & DIAGNÓSTICO TÁCTICO DE HIPERTROFIA', 14, 22);

    // Athlete Info Card Box
    doc.setFillColor(18, 24, 38);
    doc.roundedRect(14, 26, 182, 22, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(`ATLETA: ${userName.toUpperCase()}`, 18, 33);
    doc.text(`FECHA: ${new Date(latestRecord.date).toLocaleDateString('es-ES')}`, 85, 33);
    doc.text(`SEXO: ${sex === 'male' ? 'MASCULINO' : 'FEMENINO'}`, 145, 33);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`PESO: ${m.weight || '--'} kg`, 18, 42);
    doc.text(`ALTURA: ${m.height || '--'} cm`, 85, 42);
    doc.text(`GRASA: ${m.bodyFat ? `${m.bodyFat}%` : '--'}`, 145, 42);

    // Section 1: Tactical Diagnosis
    let currentY = 54;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. DIAGNÓSTICO TÁCTICO BIOMECÁNICO', 14, currentY);

    currentY += 4;
    doc.setFillColor(18, 24, 38);
    doc.roundedRect(14, currentY, 182, 32, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(`ESTADO: ${diagnosis.headline} (${diagnosis.statusText})`, 18, currentY + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const summaryLines = doc.splitTextToSize(diagnosis.summary, 174);
    doc.text(summaryLines, 18, currentY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const adviceText = `DIRECTRIZ: ${diagnosis.actionableAdvice}`;
    const adviceLines = doc.splitTextToSize(adviceText, 174);
    doc.text(adviceLines, 18, currentY + 24);

    // Section 2: Muscle Benchmarks Table
    currentY += 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. MATRIZ DE BENCHMARKS & LÍMITES GENÉTICOS', 14, currentY);

    const benchmarkRows = (analysis?.muscleBenchmarks || []).map((bm) => [
        bm.label,
        `${bm.current} cm`,
        bm.levelLabel,
        `${bm.percentOfMax}%`,
        `${bm.potentialMax} cm`,
        bm.deltaToNextLevel ? `+${bm.deltaToNextLevel} cm` : 'Máximo'
    ]);

    autoTable(doc, {
        startY: currentY + 3,
        head: [['Grupo Muscular', 'Medida Actual', 'Nivel Clasificado', '% Techo Casey Butt', 'Límite Teórico', 'Faltante Nivel']],
        body: benchmarkRows,
        theme: 'plain',
        styles: {
            cellPadding: 2.2,
            fontSize: 8,
            textColor: [248, 250, 252],
            fillColor: [18, 24, 38],
            font: 'helvetica',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', textColor: [251, 191, 36] }
        },
        headStyles: {
            fillColor: [24, 32, 50],
            textColor: [251, 191, 36],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [14, 18, 28]
        }
    });

    // Section 3: Classical & Aesthetic Ratios Table
    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. AUDITORÍA DE RATIOS CLÁSICOS Y SIMETRÍA', 14, currentY);

    const ratioRows = (analysis?.ratioBenchmarks || []).map((rb) => [
        rb.name,
        rb.label,
        rb.statusText,
        rb.scaleDescription
    ]);

    autoTable(doc, {
        startY: currentY + 3,
        head: [['Ratio Anatómico', 'Valor Registrado', 'Calificación', 'Escala de Referencia']],
        body: ratioRows,
        theme: 'plain',
        styles: {
            cellPadding: 2.2,
            fontSize: 8,
            textColor: [248, 250, 252],
            fillColor: [18, 24, 38],
            font: 'helvetica',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', textColor: [251, 191, 36] },
            3: { halign: 'left', textColor: [148, 163, 184] }
        },
        headStyles: {
            fillColor: [24, 32, 50],
            textColor: [251, 191, 36],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [14, 18, 28]
        }
    });

    // Footer
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Generado automáticamente por Hypertrophy Tracker Pro • https://www.alexismartyniuk.com.ar/hypertrophyracker', 14, 290);
    doc.text(`Documento de Telemetría Biomecánica - ${new Date().toISOString()}`, 130, 290);

    // Trigger save
    const sanitizedName = userName.replace(/\s+/g, '_').toLowerCase();
    const dateStr = new Date(latestRecord.date).toISOString().split('T')[0];
    doc.save(`auditoria_hipertrofia_${sanitizedName}_${dateStr}.pdf`);
};
