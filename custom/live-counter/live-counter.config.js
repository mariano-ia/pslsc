/**
 * Configuración por variante del <psl-live-counter>.
 * Misma data, distinto framing según la audiencia (fan vs sponsor).
 * Máximo 4 métricas por variante. "lastJoined" es la métrica de actividad reciente (fan y
 * reservation; sponsor no la usa — ahí las 4 son de volumen/crecimiento).
 *
 * HANDOFF (WP): cada variante trae su `endpoint` (ej. /api/live-counter?scope=home). Ese es el
 * contrato a implementar; hoy los valores salen de _demoData() en live-counter.js.
 */

export const LIVE_COUNTER_CONFIG = {
  // Home · Stats proof band — layout del diseño aprobado: 2 métricas vivas + 2 hitos fijos.
  // 2027 va en acento teal (accent:true). Formato "static" = valor fijo del contrato, no anima.
  stats: {
    endpoint: '/api/live-counter?scope=home',
    updateFrequencyMs: 8000,
    // `rising: true` (SOLO variante stats) marca una métrica "en alza": dibuja una flechita aqua
    // apuntando para arriba al lado del número. fan/reservation/sponsor no la usan.
    // "Days in the making" NO la lleva a propósito: que un contador de días suba es trivial, la
    // flecha ahí sería ruido. Tampoco lleva `accent`: el teal se lo queda el countdown, que es el
    // que mete urgencia. Reemplazó a "Ticket Deposits", que repetía el mismo número que founders
    // (cada founding member hace un solo ticket deposit, así que las dos casillas decían lo mismo).
    metrics: [
      { key: 'founders', label: 'Founding Members', labelEs: 'Miembros Fundadores', format: 'integer', rising: true },
      { key: 'daysInTheMaking', label: 'Days in the making', labelEs: 'Días construyendo', format: 'integer' },
      { key: 'daysToWhistle', label: 'Days to first whistle', labelEs: 'Días para el primer silbato', format: 'integer', accent: true },
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
    showUpdated: true,
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
    showUpdated: true,
  },

  // Bloque P04 (Partners) — para sponsor/inversor: formato tipo pitch deck.
  // Orden pedido por el cliente: gente -> cuántas veces se vio la marca -> a cuánta gente distinta
  // llegó -> la plata que ya entró. Las 4 son fotos de un momento: ninguna necesita serie histórica.
  // (Antes la primera era "Founding Member Growth +23%". Se cambió por el conteo absoluto: el
  //  porcentaje exigía medir el padrón mes a mes para sostenerlo, y bajaba solo en un mes flojo.)
  sponsor: {
    endpoint: '/api/live-counter?scope=partners',
    updateFrequencyMs: 30000,
    metrics: [
      { key: 'founders', label: 'Founding Members', labelEs: 'Miembros Fundadores', format: 'integer' },
      { key: 'monthlyImpressions', label: 'Monthly Impressions', labelEs: 'Impresiones Mensuales', format: 'integer' },
      { key: 'monthlyReach', label: 'Monthly Reach', labelEs: 'Alcance Mensual', format: 'integer' },
      { key: 'depositsCaptured', label: 'Deposits Captured', labelEs: 'Depósitos Captados', format: 'currency' },
    ],
    // sin `note` ni `showUpdated`: el bloque cierra en las métricas (pedido del cliente).
  },
};

/**
 * Contrato de datos esperado del endpoint (a implementar por el developer WordPress).
 * OJO: `daysInTheMaking` NO va acá — es un valor de cliente, igual que `daysToWhistle`. Hoy está
 * fijo en 100 en _demoData() como placeholder: falta la fecha definitiva de nacimiento del club
 * para calcularlo como resta contra hoy. El backend no tiene que devolverlo.
 * GET {endpoint} -> 200 OK
 * {
 *   "founders": 1248,
 *   "deposits2027": 312,
 *   "founderWindow": "Closes 2027",
 *   "lastJoinedSecondsAgo": 720,
 *   "monthlyReach": 240000,
 *   "monthlyImpressions": 1100000,
 *   "depositsCaptured": 46800,
 *   "firstWhistle": "2027",
 *   "league": "USL",
 *   "updatedAt": "2026-06-30T10:40:00Z"
 * }
 * Métrica "Updated in real time" se calcula en cliente a partir de updatedAt, no se hardcodea.
 * `founderGrowthPercent` salió del contrato: ninguna variante lo consume y era el único campo
 * que obligaba a guardar historia. El formatter `growth-percent` queda disponible por si vuelve.
 */
