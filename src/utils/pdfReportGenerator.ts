import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { MeasurementRecord } from '../types/measurements';
import { generateTacticalDiagnosis } from './tacticalDiagnosis';
import { computeComprehensiveAnalysis } from './benchmarkAnalysis';
import { calculateFFMI, calculateBerkhanLimit, calculateIEO, calculateHelmsGainRates } from './skeletal';
import { analyzeProportions } from './proportions';
import { encodeAthleteData, getPublicShareBaseUrl } from './shareEncoder';
import maleSilhouette from '../assets/clean_red_silhouette.png';
import femaleSilhouette from '../assets/silhouette_female.png';

export interface PDFReportOptions {
    latestRecord?: MeasurementRecord;
    previousRecord?: MeasurementRecord;
    records?: MeasurementRecord[];
    userName?: string;
    sex?: 'male' | 'female';
}

const loadImageAsDataUrl = (src: string): Promise<string> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve('');
            return;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    resolve('');
                }
            } catch {
                resolve('');
            }
        };
        img.onerror = () => resolve('');
        img.src = src;
    });
};

const getAvg = (val: number | { left: number; right: number } | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const l = val.left || 0;
    const r = val.right || 0;
    if (l > 0 && r > 0) return parseFloat(((l + r) / 2).toFixed(1));
    return l || r || 0;
};

export const generateAthletePDFReport = async (options: PDFReportOptions) => {
    const {
        latestRecord,
        previousRecord,
        records = [],
        userName = 'Atleta',
        sex = 'male'
    } = options;

    if (!latestRecord) {
        if (typeof window !== 'undefined') {
            alert('No hay registros de medición para exportar.');
        }
        return;
    }

    const m = latestRecord.measurements;
    const prevM = previousRecord?.measurements;
    const diagnosis = generateTacticalDiagnosis(latestRecord, previousRecord);
    const analysis = computeComprehensiveAnalysis(m, sex);
    const proportions = analyzeProportions(m);

    const height = m.height || (sex === 'female' ? 165 : 180);
    const weight = m.weight || 75;
    const athleteAge = m.age || (sex === 'female' ? 26 : 28);
    const bodyFat = m.bodyFat || 15;
    const wristAvg = getAvg(m.wrist) || (sex === 'female' ? 15.5 : 18);
    const ankleAvg = getAvg(m.ankle) || (sex === 'female' ? 20.5 : 23);

    const ffmi = calculateFFMI(weight, height, bodyFat, sex);
    const berkhan = calculateBerkhanLimit(height, sex, bodyFat);
    const ieo = calculateIEO(wristAvg, ankleAvg, sex);
    const helms = calculateHelmsGainRates(weight);

    const primaryColor: [number, number, number] = [245, 158, 11]; // Amber #f59e0b
    const darkBg: [number, number, number] = [7, 10, 19];
    const cardBg: [number, number, number] = [14, 19, 32];
    const cardBorder: [number, number, number] = [30, 41, 59];
    const textLight: [number, number, number] = [248, 250, 252];
    const textMuted: [number, number, number] = [148, 163, 184];
    const textCyan: [number, number, number] = [34, 211, 238];
    const textGreen: [number, number, number] = [16, 185, 129];
    const textRed: [number, number, number] = [239, 68, 68];

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const silhouetteSrc = sex === 'female' ? femaleSilhouette : maleSilhouette;
    const silhouetteDataUrl = await loadImageAsDataUrl(silhouetteSrc);

    let qrDataUrl = '';
    try {
        const shareData = encodeAthleteData(userName, latestRecord, sex, records.length ? records : [latestRecord]);
        const baseUrl = getPublicShareBaseUrl();
        const shareUrl = `${baseUrl}#/share?data=${shareData}`;
        qrDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 140,
            margin: 1,
            color: { dark: '#f59e0b', light: '#070a13' }
        });
    } catch {
        qrDataUrl = '';
    }

    // ==========================================
    // PAGE 1: FICHA TACTICA & MAPA ANATOMICO
    // ==========================================
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // Top Amber Accent Strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 3.5, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('HYPERTROPHY TRACKER', 14, 13);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('DOSSIER DE TELEMETRIA BIOMETRICA & DIAGNOSTICO TACTICO DE HIPERTROFIA', 14, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
    doc.text('AUDITORIA CLINICA // PAG. 1 DE 2', 148, 13);

    // Athlete Bio Card Box (Y: 22 to 38)
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(14, 22, 182, 16, 2.5, 2.5, 'F');
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 22, 182, 16, 2.5, 2.5, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text('ATLETA: ' + userName.toUpperCase(), 18, 28);
    doc.text('FECHA: ' + new Date(latestRecord.date).toLocaleDateString('es-ES'), 85, 28);
    doc.text('SEXO: ' + (sex === 'female' ? 'FEMENINO' : 'MASCULINO'), 150, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PESO: ' + weight + ' kg', 18, 34.5);
    doc.text('ALTURA: ' + height + ' cm', 55, 34.5);
    doc.text('EDAD: ' + athleteAge + ' a', 92, 34.5);
    doc.text('GRASA: ' + bodyFat + '%', 124, 34.5);
    doc.text('MAGRA: ' + (ffmi?.leanMassKg || (weight * (1 - bodyFat / 100)).toFixed(1)) + ' kg', 155, 34.5);

    // --- THREE COLUMN MAIN GRID (Y: 41 to 198) ---
    // 1. LEFT COLUMN: GENETICS & METABOLISM (X=14, Width=52)
    // Box 1: Potencial Genético (Y: 41 to 117, H=76)
    let leftY = 41;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(14, leftY, 52, 76, 2, 2, 'F');
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, leftY, 52, 76, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('POTENCIAL GENETICO', 18, leftY + 6);

    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('FFMI Normalizado (Kouri):', 18, leftY + 13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text((ffmi?.normalizedFFMI || 21.0) + ' / 25.0 (' + (ffmi?.categoryKey || 'Avanzado') + ')', 18, leftY + 18);

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(18, leftY + 21, 44, 2.5, 1, 1, 'F');
    const ffmiPercent = Math.min(100, Math.max(0, ((ffmi?.normalizedFFMI || 20) - 15) / 10 * 100));
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(18, leftY + 21, (44 * ffmiPercent) / 100, 2.5, 1, 1, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Techo Competicion (Berkhan):', 18, leftY + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
    doc.text(berkhan.maxWeightAtCompBf + ' kg (@5% BF)', 18, leftY + 35);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Estructura Osea (IEO):', 18, leftY + 44);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(ieo.value + ' cm (' + ieo.label.toUpperCase() + ')', 18, leftY + 49);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Ritmo Helms Recomendado:', 18, leftY + 58);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
    doc.text('+' + helms.intermediate.minKgMonth + ' a ' + helms.intermediate.maxKgMonth + ' kg/mes', 18, leftY + 63);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Basado en nivel de entrenamiento', 18, leftY + 69);

    // Box 2: Balance Metabólico (Y: 120 to 198, H=78)
    leftY = 120;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(14, leftY, 52, 78, 2, 2, 'F');
    doc.roundedRect(14, leftY, 52, 78, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('BALANCE METABOLICO', 18, leftY + 6);

    const bmr = Math.round(sex === 'female' ? 10 * weight + 6.25 * height - 5 * athleteAge - 161 : 10 * weight + 6.25 * height - 5 * athleteAge + 5);
    const tdee = Math.round(bmr * 1.45);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Tasa Basal (BMR Mifflin):', 18, leftY + 13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text(bmr.toLocaleString() + ' kcal/dia', 18, leftY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Gasto Diario (TDEE Activo):', 18, leftY + 26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
    doc.text(tdee.toLocaleString() + ' kcal/dia', 18, leftY + 31);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Objetivo Volumen Limpio:', 18, leftY + 39);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
    doc.text((tdee + 250).toLocaleString() + ' kcal/dia (+250)', 18, leftY + 44);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Distribucion Macros Estimada:', 18, leftY + 52);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text((weight * 2.0).toFixed(0) + 'g Prot | ' + (weight * 0.9).toFixed(0) + 'g Gras', 18, leftY + 57);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Resto en Carbohidratos complejos', 18, leftY + 63);

    // 2. CENTER COLUMN: SILHOUETTE & ANATOMICAL MEASUREMENTS (X=69, Width=72, H=157)
    const centerX = 69;
    const centerY = 41;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(centerX, centerY, 72, 157, 2, 2, 'F');
    doc.roundedRect(centerX, centerY, 72, 157, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MAPA CORPORAL HUD', centerX + 18, centerY + 6);

    if (silhouetteDataUrl) {
        try {
            doc.addImage(silhouetteDataUrl, 'PNG', centerX + 12, centerY + 9, 48, 108);
        } catch {
            // fallback
        }
    }

    const drawBadge = (label: string, val: number, prev: number | undefined, x: number, y: number) => {
        doc.setFillColor(7, 10, 19);
        doc.roundedRect(x, y, 21, 8.5, 1.2, 1.2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, 21, 8.5, 1.2, 1.2, 'S');

        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(label.toUpperCase(), x + 2, y + 2.8);

        doc.setFontSize(6.8);
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        const diff = prev && val ? val - prev : 0;
        doc.text((val || '--') + ' cm', x + 2, y + 6.8);

        if (diff !== 0) {
            doc.setFontSize(5);
            if (diff > 0) {
                doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
            } else {
                doc.setTextColor(textRed[0], textRed[1], textRed[2]);
            }
            doc.text((diff > 0 ? '+' : '') + diff.toFixed(1), x + 13, y + 6.8);
        }
    };

    const neckVal = m.neck || 0;
    const chestVal = m.pecho || 0;
    const armVal = getAvg(m.arm);
    const waistVal = m.waist || 0;
    const thighVal = getAvg(m.thigh);
    const calfVal = getAvg(m.calf);

    drawBadge('Cuello', neckVal, prevM?.neck, centerX + 2, centerY + 16);
    drawBadge('Pecho', chestVal, prevM?.pecho, centerX + 49, centerY + 28);
    drawBadge('Brazos', armVal, getAvg(prevM?.arm), centerX + 2, centerY + 43);
    drawBadge('Cintura', waistVal, prevM?.waist, centerX + 49, centerY + 58);
    drawBadge('Muslos', thighVal, getAvg(prevM?.thigh), centerX + 2, centerY + 85);
    drawBadge('Gemelos', calfVal, getAvg(prevM?.calf), centerX + 49, centerY + 102);

    // Mini Bottom Strip in Center Column (Y: 161 to 195, H=34)
    doc.setFillColor(18, 24, 38);
    doc.roundedRect(centerX + 3, centerY + 120, 66, 34, 2, 2, 'F');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CANONES DE PROPORCION:', centerX + 5, centerY + 125);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text('• Triada Steve Reeves: ' + (proportions?.reevesTriad.symmetryScore || 95) + '%', centerX + 5, centerY + 131);
    doc.text('• Ratio Adonis (V-Taper): ' + (proportions?.adonisIndex.chestWaistRatio || 1.45) + 'x', centerX + 5, centerY + 137);
    doc.text('• Ratio Cintura/Altura: ' + (proportions?.adonisIndex.waistHeightRatio || 0.46), centerX + 5, centerY + 143);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
    doc.text('• Score Aureo: ' + (proportions?.overallGoldenScore || 90) + '% Armonico', centerX + 5, centerY + 149);

    // 3. RIGHT COLUMN: TACTICAL DIAGNOSIS & ASYMMETRY (X=144, Width=52)
    // Box 1: Diagnóstico Táctico (Y: 41 to 129, H=88) - DYNAMIC AND WRAPPED
    let rightY = 41;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(144, rightY, 52, 88, 2, 2, 'F');
    doc.roundedRect(144, rightY, 52, 88, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('DIAGNOSTICO TACTICO', 148, rightY + 6);

    let curDiagY = rightY + 12;
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ESTADO:', 148, curDiagY);

    curDiagY += 4;
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    const headlineLines = doc.splitTextToSize(diagnosis.headline.toUpperCase(), 44);
    doc.text(headlineLines, 148, curDiagY);
    curDiagY += (headlineLines.length * 3.5) + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const diagSummary = doc.splitTextToSize(diagnosis.summary, 44);
    doc.text(diagSummary, 148, curDiagY);
    curDiagY += (diagSummary.length * 3.2) + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('DIRECTRIZ DE ACCION:', 148, curDiagY);

    curDiagY += 3.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    const diagAdvice = doc.splitTextToSize(diagnosis.actionableAdvice, 44);
    doc.text(diagAdvice, 148, curDiagY);

    // Box 2: Simetría Bilateral (Y: 132 to 198, H=66)
    rightY = 132;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(144, rightY, 52, 66, 2, 2, 'F');
    doc.roundedRect(144, rightY, 52, 66, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SIMETRIA BILATERAL', 148, rightY + 6);

    const armL = typeof m.arm === 'object' ? m.arm.left : m.arm;
    const armR = typeof m.arm === 'object' ? m.arm.right : m.arm;
    const armDiff = Math.abs((armL || 0) - (armR || 0)).toFixed(1);

    const thighL = typeof m.thigh === 'object' ? m.thigh.left : m.thigh;
    const thighR = typeof m.thigh === 'object' ? m.thigh.right : m.thigh;
    const thighDiff = Math.abs((thighL || 0) - (thighR || 0)).toFixed(1);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Brazos (Izq vs Der):', 148, rightY + 13);
    doc.setFont('helvetica', 'bold');
    if (Number(armDiff) > 1.0) {
        doc.setTextColor(textRed[0], textRed[1], textRed[2]);
    } else {
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    }
    doc.text((armL || '--') + 'cm / ' + (armR || '--') + 'cm (Var. ' + armDiff + 'cm)', 148, rightY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Muslos (Izq vs Der):', 148, rightY + 26);
    doc.setFont('helvetica', 'bold');
    if (Number(thighDiff) > 1.2) {
        doc.setTextColor(textRed[0], textRed[1], textRed[2]);
    } else {
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    }
    doc.text((thighL || '--') + 'cm / ' + (thighR || '--') + 'cm (Var. ' + thighDiff + 'cm)', 148, rightY + 31);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Evaluacion Simetrica:', 148, rightY + 39);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
    doc.text(Number(armDiff) < 1.0 && Number(thighDiff) < 1.2 ? 'Excelente Simetria' : 'Revisar Unilaterales', 148, rightY + 44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Tolerancia recomendada < 1.0 cm', 148, rightY + 50);

    // --- BOTTOM SECTION: TABLA RESUMEN LONGITUDINAL (Y: 202 to 286, H=84) ---
    const bottomY = 202;
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(14, bottomY, 182, 84, 2.5, 2.5, 'F');
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, bottomY, 182, 84, 2.5, 2.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TABLA RESUMEN DE MEDIDAS LONGITUDINALES', 18, bottomY + 6);

    const summaryPerimeters = [
        ['Cuello', neckVal + ' cm', prevM?.neck ? ((neckVal - prevM.neck) > 0 ? '+' : '') + (neckVal - prevM.neck).toFixed(1) + ' cm' : '--'],
        ['Pecho', chestVal + ' cm', prevM?.pecho ? ((chestVal - prevM.pecho) > 0 ? '+' : '') + (chestVal - prevM.pecho).toFixed(1) + ' cm' : '--'],
        ['Espalda', (m.back || '--') + ' cm', prevM?.back ? (((m.back || 0) - prevM.back) > 0 ? '+' : '') + ((m.back || 0) - prevM.back).toFixed(1) + ' cm' : '--'],
        ['Cintura', waistVal + ' cm', prevM?.waist ? ((waistVal - prevM.waist) > 0 ? '+' : '') + (waistVal - prevM.waist).toFixed(1) + ' cm' : '--'],
        ['Brazos', armVal + ' cm', prevM?.arm ? ((armVal - getAvg(prevM.arm)) > 0 ? '+' : '') + (armVal - getAvg(prevM.arm)).toFixed(1) + ' cm' : '--'],
        ['Muslos', thighVal + ' cm', prevM?.thigh ? ((thighVal - getAvg(prevM.thigh)) > 0 ? '+' : '') + (thighVal - getAvg(prevM.thigh)).toFixed(1) + ' cm' : '--'],
        ['Gemelos', calfVal + ' cm', prevM?.calf ? ((calfVal - getAvg(prevM.calf)) > 0 ? '+' : '') + (calfVal - getAvg(prevM.calf)).toFixed(1) + ' cm' : '--'],
        ['Antebrazo', getAvg(m.forearm) + ' cm', prevM?.forearm ? ((getAvg(m.forearm) - getAvg(prevM.forearm)) > 0 ? '+' : '') + (getAvg(m.forearm) - getAvg(prevM.forearm)).toFixed(1) + ' cm' : '--']
    ];

    autoTable(doc, {
        startY: bottomY + 8.5,
        margin: { left: 18, right: 18 },
        head: [['Grupo Anatomico', 'Medida Actual', 'Variacion (vs Anterior)']],
        body: summaryPerimeters,
        theme: 'plain',
        styles: {
            cellPadding: 1.6,
            fontSize: 7.2,
            textColor: [248, 250, 252],
            fillColor: [18, 24, 38],
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', textColor: [251, 191, 36] },
            2: { textColor: [34, 211, 238] }
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

    // Page 1 Footer (Y: 292)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Hypertrophy Tracker • Documento de Telemetria Biomecanica • https://www.alexismartyniuk.com.ar/hypertrophyracker', 14, 292);
    doc.text('Pagina 1 de 2', 185, 292);

    // =========================================================================
    // PAGE 2: AUDITORIA DE PROPORCIONES, LIMITES CASEY BUTT & PRESCRIPCION
    // =========================================================================
    doc.addPage();

    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // Top Accent Strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 3.5, 'F');

    // Page 2 Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. PROPORCIONES, BENCHMARKS & PRESCRIPCION', 14, 13);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('ANALISIS ESTETICO AUREO, TECHO CASEY BUTT Y DOSIFICACION DE VOLUMEN', 14, 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
    doc.text('AUDITORIA CLINICA // PAG. 2 DE 2', 196, 13, { align: 'right' });

    // Section 1: Classical Ratios & Aesthetics Summary Box (Y: 22 to 58, H=36)
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(14, 22, 182, 36, 2.5, 2.5, 'F');
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 22, 182, 36, 2.5, 2.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CANONES ESTETICOS CLASICOS & PROPORCIONES AUREAS', 18, 28);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text('• Triada de Steve Reeves (1:1:1): Brazo ' + armVal + 'cm | Cuello ' + neckVal + 'cm | Gemelo ' + calfVal + 'cm', 18, 34);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
    doc.text('Simetria: ' + (proportions?.reevesTriad.symmetryScore || 96) + ' / 100', 192, 34, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.text('• Indice Adonis (V-Taper): Ratio Pecho / Cintura = ' + (proportions?.adonisIndex.chestWaistRatio || 1.45) + 'x (Ideal Aureo 1.618x)', 18, 41);
    doc.text('• Ratio Cintura / Altura (WHtR): ' + (proportions?.adonisIndex.waistHeightRatio || 0.46) + ' (' + ((proportions?.adonisIndex.waistHeightRatio || 0.46) <= 0.45 ? 'Optimo' : 'Saludable') + ')', 18, 48);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
    doc.text('Puntuacion Aurea Global: ' + (proportions?.overallGoldenScore || 90) + '% (Fisico Clasico Armonico)', 18, 54);

    // Section 2: Casey Butt Benchmarks Matrix Table (Y: 62)
    let currentY = 62;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3. MATRIZ DE BENCHMARKS Y LIMITES GENETICOS (CASEY BUTT)', 14, currentY);

    const benchmarkRows = (analysis?.muscleBenchmarks || []).map((bm) => [
        bm.label,
        bm.current + ' cm',
        bm.levelLabel,
        bm.percentOfMax + '%',
        bm.potentialMax + ' cm',
        bm.deltaToNextLevel ? '+' + bm.deltaToNextLevel + ' cm' : 'Alcanzado'
    ]);

    autoTable(doc, {
        startY: currentY + 3,
        margin: { left: 14, right: 14 },
        head: [['Grupo Muscular', 'Medida Actual', 'Nivel Clasificado', '% Techo Casey Butt', 'Limite Teorico', 'Faltante Nivel']],
        body: benchmarkRows,
        theme: 'plain',
        styles: {
            cellPadding: 1.8,
            fontSize: 7.2,
            textColor: [248, 250, 252],
            fillColor: [18, 24, 38],
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', textColor: [251, 191, 36] },
            3: { textColor: [34, 211, 238] }
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

    // Section 3: Training Prescription & Weekly Volume Table
    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 145;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('4. PRESCRIPCION DE ENTRENAMIENTO & VOLUMEN SEMANAL RECOMENDADO', 14, currentY);

    const prescriptionRows = [
        ['Pectoral (Torso Superior)', '14 - 16 series', 'Prioridad Sobrecarga', 'Press Inclinado Pesado, Cruces en Polea'],
        ['Dorsal / Espalda (V-Taper)', '16 - 18 series', 'Prioridad Ancho & Densidad', 'Jalon al Pecho Agarre Neutro, Remo en T'],
        ['Deltoides Lateral & Posterior', '14 - 18 series', 'Hipertrofia en Estiramiento', 'Elevaciones Laterales en Polea, Facepulls'],
        ['Brazos (Biceps / Triceps)', '10 - 12 series', 'Mantenimiento / Calidad', 'Curl Inclinado Mancuerna, Fondos / Extensiones'],
        ['Cuadriceps & Cadena Posterior', '12 - 16 series', 'Sobrecarga Mecanica', 'Sentadilla Hack, Prensa Inclinada, Peso Muerto Rumano'],
        ['Gemelos & Antebrazos', '8 - 10 series', 'Frecuencia Alta (2-3x/sem)', 'Elevacion de Talones de Pie (Pausa 2s)']
    ];

    autoTable(doc, {
        startY: currentY + 3,
        margin: { left: 14, right: 14 },
        head: [['Grupo Muscular', 'Volumen Semanal Efectivo', 'Foco Tactico', 'Ejercicios Clave Recomendados']],
        body: prescriptionRows,
        theme: 'plain',
        styles: {
            cellPadding: 1.8,
            fontSize: 7.2,
            textColor: [248, 250, 252],
            fillColor: [18, 24, 38],
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', textColor: [251, 191, 36] },
            1: { textColor: [34, 211, 238] },
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

    // Section 4: Live Verification QR Code Box (Y: 236 to 284, H=48)
    const qrBoxY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 5 : 236;
    if (qrBoxY < 282) {
        const qrBoxHeight = Math.min(48, 286 - qrBoxY);
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.roundedRect(14, qrBoxY, 182, qrBoxHeight, 2, 2, 'F');
        doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, qrBoxY, 182, qrBoxHeight, 2, 2, 'S');

        if (qrDataUrl && qrBoxHeight >= 30) {
            try {
                doc.addImage(qrDataUrl, 'PNG', 18, qrBoxY + 3, 30, 30);
            } catch {
                // fallback
            }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('AUDITORIA ONLINE EN VIVO & VERIFICACION COACH', 54, qrBoxY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(textLight[0], textLight[1], textLight[2]);
        doc.text('Escanea este codigo QR con la camara de tu smartphone para abrir la ficha tactica', 54, qrBoxY + 14);
        doc.text('interactiva, verificar el historial longitudinal completo y contrastar duelos Versus.', 54, qrBoxY + 19);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textCyan[0], textCyan[1], textCyan[2]);
        doc.text('URL Cifrada en Base64 // Sin requerir credenciales ni contrasena de acceso.', 54, qrBoxY + 26);
    }

    // Page 2 Footer (Y: 292)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Hypertrophy Tracker • Verificado por Modelos Casey Butt / Reeves / Kouri', 14, 292);
    doc.text('Pagina 2 de 2', 185, 292);

    const sanitizedName = userName.replace(/\s+/g, '_').toLowerCase();
    const dateStr = new Date(latestRecord.date).toISOString().split('T')[0];
    doc.save('dossier_hipertrofia_' + sanitizedName + '_' + dateStr + '.pdf');
};
