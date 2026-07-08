/**
 * Configuración por variante del <psl-live-counter>.
 * Fuente: benchmark Piezas Diferenciales, Pieza C — mismos datos, framing distinto por audiencia
 * (decisión #9 del ranking de 9: "presentación diferente de los mismos números para fan vs sponsor").
 *
 * Máximo 4 métricas por variante (límite Kickstarter, benchmark Pieza C).
 * "lastJoined" es la 4ª métrica recomendada — prueba de actividad reciente honesta.
 */

export const LIVE_COUNTER_CONFIG = {
  // Home · Stats proof band — layout del diseño aprobado: 2 métricas vivas + 2 hitos fijos.
  // 2027 va en acento teal (accent:true). Formato "static" = valor fijo del contrato, no anima.
  stats: {
    endpoint: '/api/live-counter?scope=home',
    updateFrequencyMs: 8000,
    // `trend` (SOLO variante stats): datos demo de tendencia para la micro-visualización ascendente
    // (mini-barras aqua). Valores relativos, se normalizan al máximo en el componente. Actúa además
    // como flag de gating: fan/reservation/sponsor no llevan `trend` -> no dibujan sparkline.
    metrics: [
      { key: 'founders', label: 'Founding Members', labelEs: 'Miembros Fundadores', format: 'integer', trend: [8, 9, 11, 12, 15, 18, 22, 27] },
      { key: 'deposits2027', label: 'Ticket Deposits', labelEs: 'Depósitos de Entradas', format: 'integer', trend: [4, 5, 5, 7, 8, 11, 14, 18] },
      { key: 'firstWhistle', label: 'First Whistle', labelEs: 'Primer Silbato', format: 'static', accent: true },
      { key: 'league', label: 'League One · Pro', labelEs: 'League One · Pro', format: 'static' },
    ],
  },

  // Bloque 02 (Home) — para Marco: número grande + label simple = prueba social.
  fan: {
    endpoint: '/api/live-counter?scope=home',  // contrato esperado más abajo
    updateFrequencyMs: 30000, // espaciado -> usa highlight+fade, no odometer continuo
    metrics: [
      { key: 'founders', label: 'Founding Members', format: 'integer' },
      { key: 'deposits2027', label: '2027 Deposits', format: 'integer' },
      { key: 'founderWindow', label: 'Founder Window', format: 'text' },
      { key: 'lastJoined', label: 'Last Joined', format: 'relative-time' },
    ],
    note: 'Founder Window closes with the first match in 2027',
  },

  // Bloques 06 / S03 (Reservá tu lugar / Cómo sumarte) — mismo dato, foco en la acción de reservar.
  reservation: {
    endpoint: '/api/live-counter?scope=reservations',
    updateFrequencyMs: 30000,
    metrics: [
      { key: 'deposits2027', label: '2027 Deposits', format: 'integer' },
      { key: 'lastJoined', label: 'Last Reserved', format: 'relative-time' },
    ],
    note: 'Refundable deposit — Founder Window closes with the first match in 2027',
  },

  // Bloque P04 (Partners) — para sponsor/inversor: formato tipo pitch deck, growth framing.
  sponsor: {
    endpoint: '/api/live-counter?scope=partners',
    updateFrequencyMs: 30000,
    metrics: [
      { key: 'founderGrowthPercent', label: 'Founding Member Growth', labelEs: 'Crecimiento de Fundadores', format: 'growth-percent' },
      { key: 'monthlyReach', label: 'Monthly Reach', labelEs: 'Alcance Mensual', format: 'integer' },
      { key: 'depositsCaptured', label: 'Deposits Captured', labelEs: 'Depósitos Captados', format: 'currency' },
      { key: 'lastJoined', label: 'Last Joined', labelEs: 'Último Ingreso', format: 'relative-time' },
    ],
    note: 'Founding member growth, month-over-month',
    noteEs: 'Crecimiento de miembros fundadores, mes a mes',
  },
};

/**
 * Contrato de datos esperado del endpoint (a implementar por el developer WordPress).
 * GET {endpoint} -> 200 OK
 * {
 *   "founders": 1248,
 *   "deposits2027": 312,
 *   "founderWindow": "Closes 2027",
 *   "lastJoinedSecondsAgo": 720,
 *   "monthlyReach": 18400,
 *   "depositsCaptured": 46800,
 *   "founderGrowthPercent": 23,
 *   "firstWhistle": "2027",
 *   "league": "USL",
 *   "updatedAt": "2026-06-30T10:40:00Z"
 * }
 * Métrica "Updated in real time" se calcula en cliente a partir de updatedAt, no se hardcodea.
 */
