# Hypertrophy Tracker - Premium Body Analytics 🏋️‍♂️

[![Live Demo](https://img.shields.io/badge/demo-live-amber.svg?style=for-the-badge&logo=vercel)](https://hypertrophyracker.alexismartyniuk.com.ar/)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Storage-Supabase-green.svg?style=flat&logo=supabase)](https://supabase.com/)

**Hypertrophy Tracker** es una plataforma de análisis corporal de alto rendimiento diseñada para entusiastas del fitness y culturistas naturales. No es solo un log de medidas; es un centro de inteligencia táctica para monitorear cada milímetro de tu progreso físico.

---

## 🌟 Características Destacadas

### 1. Mapa de Calor Visceral (Heatmap)
Visualiza tu progreso al instante. La silueta principal se tiñe dinámicamente comparando tu registro actual con el anterior.
- **Rojo:** Hipertrofia significativa (>2.5%).
- **Amarillo:** Crecimiento constante (>1%).
- **Azul:** Pérdida o definición (< -1%).
- **Gris:** Estabilidad perfecta.

### 2. Análisis del Potencial Genético
Implementa el modelo científico de **Casey Butt** para calcular tus límites naturales basados en tu estructura ósea (tobillos y muñecas). 
- Cálculo del **IEO (Índice de Estructura Ósea)**.
- Estimaciones de peso máximo por porcentaje de grasa corporal.

### 3. Mapa de Medición Muscular (Guía In-App)
Incluye un mapa anatómico detallado que indica los puntos precisos para colocar la cinta métrica, asegurando que tus registros sean consistentes a lo largo de los meses.

### 4. Cloud Sync & PWA
- **Sincronización Total:** Gracias a la integración con **Supabase**, tus fotos y medidas están seguras en la nube.
- **Instalación Nativa:** Funciona como una **PWA** (Progressive Web App), permitiéndote instalarla en tu iPhone o Android y usarla como una aplicación nativa en el gimnasio.

### 5. Comparativa Fotográfica Avanzada
Módulo de comparación lado a lado con previsualización instantánea (Local Preview) y carga inteligente en segundo plano.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura moderna enfocada en la velocidad y la experiencia de usuario:

- **Frontend:** [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) para un tipado robusto.
- **Build Tool:** [Vite](https://vitejs.dev/) para un desarrollo ultra-rápido.
- **Backend/Storage:** [Supabase](https://supabase.com/) (PostgreSQL + Bucket Storage).
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/) para micro-interacciones fluidas.
- **Estado y Formularios:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) para validaciones.
- **Internacionalización:** [i18next](https://www.i18next.com/) (Soporte completo ES/EN).
- **Visualización:** [Recharts](https://recharts.org/) y SVG dinámicos generados a medida.

---

## 📸 Galería (Capturas Reales)

*Nota: Para una exposición auténtica, captura pantallas reales de tu app corriendo en local o en el demo live y guárdalas en la carpeta `promo/` con estos nombres:*

| Dashboard & Heatmap | Registro de Medidas | Potencial Genético |
| :---: | :---: | :---: |
| ![Dashboard](promo/dashboard.png) | ![Formulario](promo/formulario.png) | ![Potencial](promo/potencial.png) |

> [!TIP]
> Te recomiendo tomar las capturas desde un dispositivo móvil para resaltar el diseño **Mobile-First** y el acabado **HUD**.

---

## 🚀 Instalación y Desarrollo

1. **Clonar y Entrar:**
   ```bash
   git clone https://github.com/a-martyniuk/hypertrophy-tracker.git
   cd hypertrophy-tracker
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Variables de Entorno:**
   Crea un archivo `.env` con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_key
   ```

4. **Correr en local:**
   ```bash
   npm run dev
   ```

---

## 🎨 Filosofía de Diseño: "Premium Amber HUD"
La interfaz está inspirada en los *Head-Up Displays* de tecnología táctica, utilizando una paleta de colores **Amber/Dark** con efectos de **Glassmorphism**, desenfoque de fondo y líneas de escaneo para dar una sensación de herramienta profesional y avanzada.

---

Desarrollado con ❤️ por [Alexis Martyniuk](https://github.com/a-martyniuk)
