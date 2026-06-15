# 🎯 PROMPT CONSTRUCTOR RECONSTRUIDO

## Contexto del Proyecto

Kubera Vault es una aplicación web offline-first de gestión financiera personal. Reemplaza hojas de cálculo y apps propietarias permitiendo al usuario registrar ingresos, gastos, deudas, tarjetas de crédito, inversiones y cuentas bancarias en un solo lugar. Todo se almacena localmente en IndexedDB del navegador sin necesidad de backend. Soporta importación desde Money Manager (.mmbackup) y exportación en múltiples formatos.

**Target user:** Profesionales hispanohablantes que quieren control total de sus finanzas sin compartir datos con terceros.
**Problema resuelto:** Tracking financiero completo offline, sin dependencia de servidores, con precisión contable (2 decimales), dashboards con KPIs, y reportes exportables.

---

## Stack Tecnológico Especificado

| Componente | Versión | Justificación |
|-----------|---------|---------------|
| **HTML5** | Living Standard | SPA shell con semantic markup, Web Manifest para PWA |
| **CSS3** | Custom Properties | Design system con variables, dark mode via `data-theme`, responsive via grid/flex |
| **JavaScript** | ES2020+ | Vanilla JS sin frameworks — módulos IIFE, clases ES6, async/await |
| **IndexedDB** | Browser native | Almacenamiento offline de 9 object stores sin límite práctico |
| **Chart.js** | 4.4.1 (CDN) | Visualización de datos financieros: doughnut, bar, line, horizontal bar |
| **Google Fonts** | Raleway + Space Mono | Raleway para UI, Space Mono para números (monoespaciado financiero) |
| **sql.js** | WASM build | Parseo de SQLite para importar .mmbackup de Money Manager |
| **JSZip** | Minified | Descompresión de archivos .mmbackup (ZIP con SQLite embebido) |
| **Service Worker** | Navegador | Instalabilidad PWA, mínimo (skipWaiting + claim, sin cache agresivo) |

---

## Requisitos Funcionales Detallados

### 1. Dashboard (Página Principal)
- **KPIs financieros:** Balance neto, Ingresos totales, Gastos totales, Tasa de ahorro (%), Patrimonio neto, Deuda total, Cuentas totales, Inversiones totales
- **Resumen de deudas:** Interés anual acumulado de todas las deudas
- **Resumen de tarjetas:** Deuda total en tarjetas, cuotas anuales
- **Resumen de cuotas:** Cantidad de gastos en cuotas, promedio por cuota, gastos recurrentes
- **Gráficos:** Doughnut de gastos por categoría + Bar chart de ingresos vs gastos (6 meses)
- **Transacciones recientes:** Últimas 8 transacciones (entradas + salidas) con iconos de categoría
- **Botones rápidos:** Nueva Entrada, Nuevo Gasto
- **Exportación:** JSON, CSV por página vía menú dropdown en el header
- **Navegación temporal:** Botones `<` `>` para cambiar mes/año, selector de vista (semana/mes/año)

### 2. Entradas (Ingresos)
- **CRUD completo:** Crear, leer, actualizar, eliminar ingresos
- **Formulario:** Título, nomenclatura (manual/auto-siglas/híbrido), monto, fecha, categoría, cuenta, deuda vinculada (reduce balance), notas, recurrente (frecuencia)
- **Nomenclatura:** Modo manual = código libre; modo auto-siglas = genera siglas del título; modo híbrido = siglas + código manual — genera código único `[SIGLAS]-[YY]-[MM]-[N°]`
- **Tabla:** Código nomenclatura, título, categoría, cuenta, monto, fecha, acciones (editar/eliminar)
- **KPIs:** Total entradas, N° transacciones, Promedio, Máximo, Categorías únicas, Cuentas usadas, Mes actual
- **Precisión IRS:** `preciseRound(num, 2)` = `Math.round(num * 100) / 100`
- **Gráficos:** Doughnut por categoría + Línea de evolución 6 meses
- **Validación:** Campo título y monto requeridos, formulario HTML5 validation (`checkValidity`)

### 3. Salidas (Gastos)
- **CRUD completo** con todas las validaciones de entradas
- **Vincular a deuda:** Si se selecciona una deuda, el gasto reduce `currentBalance` de la deuda
- **Campos adicionales:** Beneficiario, cuotas (cantidad total + número actual), recurrente
- **Agrupación por categoría:** Accordion que expande/colapsa gastos por categoría
- **KPIs:** Total gastos, N° transacciones, Promedio, Máximo, Categorías únicas, Mes actual, Total cuotas activas, Gastos con deuda vinculada
- **Gráficos:** Doughnut por categoría (top 8) + Bar chart de evolución 6 meses

### 4. Cuentas Bancarias
- **CRUD completo** con tipos: Efectivo, Corriente, Ahorros, Inversión, Billetera Digital, Otra
- **Selector de banco:** 21 bancos predefinidos + opción "Personalizado" con campo de texto libre
- **Balance automático:** `baseBalance + SUM(entradas) - SUM(gastos)` — se recalcula cada vez que se agrega/modifica una transacción
- **Moneda por cuenta:** Hereda la moneda global o permite moneda propia
- **Color personalizado:** Selector de color visual con 15 colores predefinidos + color picker nativo
- **KPIs:** Total cuentas, Balance total, Cuentas positivas, Cuentas negativas, Promedio, Moneda
- **Gráficos:** Bar horizontal por balance + Doughnut por tipo de cuenta

### 5. Deudas
- **CRUD completo** con tipos: Personal, Hipoteca, Auto, Tarjeta, Familiar, Otro
- **Campos:** Título, tipo, monto original, balance actual, tasa de interés (%), pago periódico, frecuencia (mensual/quincenal/semanal/anual), fechas inicio/fin estimado, acreedor, cuenta vinculada, notas
- **Cálculo de interés anual:** `currentBalance * interestRate / 100`
- **Cálculo de costo total:** `currentBalance + SUM(interestYears * remainingYears)`
- **Progreso de pago:** Barra visual `(originalAmount - currentBalance) / originalAmount * 100`
- **KPIs:** Total pendiente, Con interés, Pagado, Pagos mensuales, Tasa promedio
- **Gráficos:** Doughnut por tipo + Stacked bar (pagado vs pendiente por deuda)

### 6. Tarjetas de Crédito
- **CRUD completo** con entidades: Visa, Mastercard, American Express, Otra
- **Campos:** Nombre, entidad, últimos 4 dígitos, límite de crédito, deuda actual, tasa de interés (% anual), cargo automático mensual, **checkbox "¿Tiene cuota mensual fija?" + monto de cuota**, día de corte (1-31), día de pago (1-31), cuenta de pago automático, color de tarjeta
- **Display visual:** Tarjeta con gradiente del color elegido, dígitos enmascarados, deuda/límite/día de pago
- **Cálculos:**
  - Interés mensual = `(debt * interestRate / 100) / 12`
  - Interés anual = `debt * interestRate / 100`
  - Cargo fijo mensual = `autoFee`
  - Cuota mensual fija = `monthlyPayment` (si `hasMonthlyPayment`)
  - Costo mensual total = `deuda + interés mensual + cargo fijo + cuota mensual`
  - Costo anual total = `deuda + interés anual + (cargo fijo × 12) + (cuota mensual × 12)`
  - Disponible = `límite - deuda`
  - Uso = `(deuda / límite) * 100`
- **Alerta visual:** Badge warning si faltan ≤10 días para el pago
- **KPIs:** Límite total, Deuda total, Total pagado, Disponible restante, Cuotas mensuales fijas, Intereses anuales, Cuotas anuales, Costo mensual total
- **Gráficos:** Stacked bar (disponible vs utilizado) + Doughnut de distribución de deuda

### 7. Inversiones
- **CRUD completo** con tipos: Depósito, Fondos Mutuos, Acciones, Bonos, Cripto, Bienes Raíces, Seguro de Vida, Pensión/AFORE, Otro
- **Campos:** Nombre, tipo, monto invertido, valor actual, fecha inversión, fecha vencimiento, proveedor, cuenta vinculada, notas
- **Cálculos:** Ganancia/Pérdida = `valor actual - monto invertido`, Rentabilidad = `(ganancia / invertido) * 100`
- **KPIs:** Total invertido, Valor actual, Ganancia/Pérdida, Rentabilidad %, Cuentas vinculadas
- **Gráfico:** Doughnut por tipo de inversión

### 8. Reportes Financieros
- **Selector de período:** 6 meses, 12 meses, Año actual (YTD)
- **Gráficos:** P&L mensual (bar), Cashflow (line), Gastos por categoría (doughnut — top 8)
- **Tabla resumen:** Ingresos, Gastos, Flujo neto, Ahorro %, Deuda total, Cuentas, Inversiones, Patrimonio por mes
- **Exportación:** JSON (todos los datos), CSV (UTF-8 BOM para Excel), PDF (vía window.print con template estilizado), Excel (redirige a CSV)

### 9. Ajustes (Settings)
- **Tema:** Toggle dark/light mode con persistencia en IndexedDB
- **Colores de números:** 4 paletas de color independientes para ingresos, gastos, deudas, inversiones — selector visual con 5 colores cada una + botón guardar
- **Colores de cuentas:** 15 colores predefinidos + agregar color personalizado vía color picker nativo
- **Monedas:** 12 monedas predefinidas + agregar moneda personalizada (código 3 letras, símbolo, nombre) — persistencia en settings store
- **Categorías de Ingreso y Gasto:**
  - **Built-in (21):** 8 income + 13 expense — NO se pueden eliminar, SÍ se pueden renombrar y cambiar color
  - **Custom:** Agregar/editar/eliminar categorías personalizadas — se guardan en `settings.customCategories` como JSON
  - **Color picker:** 8 colores predefinidos + animación pulse al seleccionar
- **Datos:** Exportar backup JSON, Importar backup JSON/.mmbackup, Migrar desde FinanceFlowDB (base de datos antigua)
- **Almacenamiento:** Indicador de espacio usado (KB/MB)

### 10. Sistema de Toast
- **Tipos:** success (verde), error (rojo), warning (naranja), info (azul)
- **Comportamiento:** Auto-dismiss 3s (configurable), slide-in desde arriba-derecha, máximo 3 visibles simultáneos
- **XSS protection:** Todo mensaje pasado por `escapeHtml()` antes de insertar en DOM

### 11. Sistema de Modal
- **Tamaños:** small, medium (default), large, xlarge
- **Cierre:** Solo vía botón X o botón Cancelar/Guardar — **NO cierra** al click fuera (closeOnOverlay: false)
- **ESC:** NO cierra modales (deshabilitado)
- **Foco automático:** Primer input del modal recibe foco tras 100ms
- **Overflow:** Body scroll bloqueado mientras modal está abierto

---

## Requisitos No Funcionales

### Performance
- Carga inicial < 2s con IndexedDB vacío
- Transiciones de página con animación `fadeInUp` (300ms)
- Gráficos con destrucción de instancias previas antes de recrear (evita memory leaks)
- Sin dependencia de servidor — 100% offline después de cargar HTML+JS+CSS

### Seguridad
- **XSS:** Toda inserción de datos de usuario en innerHTML pasa por `escapeHtml()` (crea div, setea textContent, retorna innerHTML)
- **ID mismatch:** IDs de cuenta en IndexedDB son números (autoIncrement), en formularios son strings — siempre `parseInt()` para comparaciones
- **Service Worker:** Mínimo — solo skipWaiting + claim, sin cache de archivos (evita servir versiones obsoletas)
- **Validación de formularios:** HTML5 `checkValidity()` + `reportValidity()` antes de submit
- **Sanitización de IDs en categorías:** `name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()`

### UX/UI
- **Diseño responsive:** 3 breakpoints — 1024px (sidebar colapsa), 768px (grid 1 columna), 480px (fuentes reducidas)
- **Dark mode:** Persistente en settings, toggle en header, CSS custom properties
- **Animaciones:** `fadeInUp` (staggered 0.05s), `slideDown`, `fadeIn`, `colorSelectPulse` (escala 1→1.35→1.25), spring bounce en modales
- **Tipografía:** Raleway (UI), Space Mono (números financieros)
- **Espaciado:** 24px gap en grid de tarjetas, 16-20px padding interno, min-height en stat-cards
- **Números:** `overflow: visible`, `text-overflow: clip`, `letter-spacing: -0.5px` — nunca se cortan ni hacen wrap
- **Color:** Verde para ingresos/positivo, Rojo para gastos/deuda/negativo, Púrpura para inversiones

### Calidad
- **Precisión IRS:** `preciseRound(num, 2)` para todas las operaciones aritméticas financieras — evita errores de punto flotante
- **Cobertura de tests:** No implementada (⚠️ deuda técnica crítica)
- **Sin linting:** No configurado (⚠️ deuda técnica)

---

## Especificaciones Técnicas Profundas

### Arquitectura
**Patrón:** SPA (Single Page Application) con Router propio + Store central (Observer Pattern)

```
index.html (shell)
├── js/db.js         ← IndexedDB CRUD + default data
├── js/store.js      ← Estado central reactivo (Observer pattern)
├── js/router.js     ← Navegación SPA (register + navigate)
├── js/app.js        ← Init, event listeners, theme, utility functions
├── js/components/
│   ├── modal.js     ← Sistema de modales
│   ├── toast.js     ← Notificaciones toast
│   └── forms.js     ← Generadores de formularios HTML
├── js/pages/
│   ├── dashboard.js  ← Página principal
│   ├── entries.js    ← Ingresos
│   ├── expenses.js   ← Gastos
│   ├── accounts.js   ← Cuentas
│   ├── debts.js      ← Deudas
│   ├── cards.js      ← Tarjetas
│   ├── investments.js← Inversiones
│   ├── reports.js    ← Reportes
│   └── settings.js   ← Ajustes
└── js/importers/
    └── mmbackup.js   ← Conversor Money Manager
```

**Justificación:** Sin framework = sin build step, deploy inmediato (cualquier hosting estático), máxima compatibilidad offline. El Observer pattern permite reactividad sin librerías externas.

### Flujo de Inicialización
```
DOMContentLoaded
  → DB.initDB()           // Abre IndexedDB v1
  → DB.initDefaultData()  // Popula categorías, settings si están vacíos
  → store.loadAllData()   // Carga todos los stores + merge custom categories
  → setupEventListeners() // Nav items, theme toggle, period navigation, export
  → router.navigate('dashboard')  // Render inicial
  → Unregister old Service Workers
```

### Estado Global (Store)
- Clase `Store` con `this.state` y `this.listeners`
- `setState(updates)` mergea y notifica a todos los listeners
- Métodos `refresh*()` recargan desde IndexedDB
- `getFilteredData(data, period)` filtra array por rango de fechas
- `calculateTotals(period)` retorna objeto con 9 métricas financieras
- `formatCurrency(amount, currency)` usa `toLocaleString('en-US', {minimumFractionDigits: 2})`

### Modelo de Datos (9 Object Stores)

| Store | KeyPath | AutoIncrement | Uso |
|-------|---------|---------------|-----|
| `accounts` | `id` | true | Cuentas bancarias |
| `entries` | `id` | true | Ingresos |
| `expenses` | `id` | true | Gastos |
| `debts` | `id` | true | Deudas |
| `creditCards` | `id` | true | Tarjetas de crédito |
| `investments` | `id` | true | Inversiones |
| `categories` | `id` | false | Categorías built-in (string keys: 'salary', 'food', etc.) |
| `reminders` | `id` | true | Recordatorios |
| `settings` | `key` | false | Configuración clave-valor |

### Manejo de Categorías Custom
- Built-in: 21 categorías con IDs string ('salary', 'food', etc.) en store `categories`
- Custom: Array JSON en `settings.customCategories` con IDs compuestos (`'nombre-' + timestamp`)
- Merge: `store.refreshCategories()` = `[...dbGetAll('categories'), ...getCustomCategories()]`
- Renombrar built-in: `updateBuiltInCategory(id, {name, color})` → `dbGet('categories', id)` → merge → `dbPut`
- Renombrar custom: `updateCustomCategory(id, {name, color})` → modifica array en settings JSON
- Eliminar: Solo categorías custom (built-in bloqueadas con toast error)

### Gráficos — Gestión de Ciclo de Vida
```javascript
let chartInstance = null;  // Variable en scope del módulo

function initCharts() {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    chartInstance = new Chart(canvas, config);
}

// Se llama con setTimeout de 100ms post-render para asegurar DOM listo
```

### Chart Types por Página

| Página | Chart 1 | Chart 2 |
|--------|---------|---------|
| Dashboard | Doughnut (gastos) | Bar (ingresos vs gastos 6m) |
| Entries | Doughnut (por categoría) | Line (tendencia 6m) |
| Expenses | Doughnut (por categoría, top 8) | Bar (tendencia 6m) |
| Accounts | Horizontal Bar (por balance) | Doughnut (por tipo) |
| Debts | Doughnut (por tipo) | Stacked Bar (pagado/pendiente) |
| Cards | Stacked Bar (uso/disponible) | Doughnut (distribución deuda) |
| Investments | Doughnut (por tipo) | — |
| Reports | Bar (P&L mensual) | Line (cashflow) | Doughnut (categorías) |

---

## Constraints y Preferencias

### Limitaciones Técnicas
- Sin backend — todo es client-side IndexedDB
- Sin autenticación de usuarios
- Sin sincronización multi-dispositivo
- IndexedDB tiene límites por navegador (50MB-2GB según browser)

### Preferencias del Desarrollador
- **Vanilla JS** sin frameworks ni build tools
- **Español** como idioma de la UI (labels, placeholders, toasts)
- **PEN (Sol Peruano)** como moneda default implícita (aunque USD configurado)
- **Símbolo de dólar $** como icono del logo
- **Nombres en inglés** para funciones internas, español para UI
- **Módulos como funciones globales** (window.xxx = xxx) en vez de ES modules — compatibilidad file://
- **CSS separado:** variables.css → base.css → components.css → pages.css (cascada)

### Decisiones de Diseño
- **closeOnOverlay: false** (default) — los modales no cierran al click fuera
- **ESC deshabilitado** para cerrar modales
- **Números nunca truncados** — `overflow: visible`, `text-overflow: clip`
- **Sin Service Worker cache** — solo lifecycle mínimo para PWA installabilidad
- **DB_VERSION = 1** — sin migraciones de schema (evita complejidad)

---

## Debug y Correcciones Previstas

### Errores Conocidos (⚠️ Deuda Técnica)
1. **Recursión en setupFormListeners:** Si una página define `function setupFormListeners()` y llama `window.setupFormListeners()`, la función local sombrea la global → loop infinito. Solución: nombrar distinto (ej: `setupNomenclatureListeners`)
2. **dbPut retorna undefined en updates:** `store.put()` retorna undefined para registros existentes. No usar el valor de retorno como indicador de éxito.
3. **Account ID type mismatch:** autoIncrement genera números, formularios devuelven strings → usar parseInt()
4. **Fusión de categorías custom:** Si `refreshCategories()` no mergea custom categories, no aparecen en UI
5. **Service Worker cache agresivo:** Si el SW cachea JS sin query params, los cambios no se reflejan hasta limpiar cache

### Validaciones Críticas
- `preciseRound()` en TODAS las sumas y cálculos financieros
- `escapeHtml()` en TODO innerHTML con datos de usuario
- `parseFloat() || 0` en todo valor numérico de formulario
- `parseInt()` para IDs de cuenta en comparaciones
- HTML5 `checkValidity()` + `reportValidity()` antes de cada submit

### Edge Cases
- Categoría no encontrada → fallback `{ name: categoryId, color: '#6B7280' }`
- Cuenta no encontrada → fallback `{ name: 'Desconocida' }`
- División por cero en savings rate → `totalIncome > 0 ? ... : 0`
- Fecha inválida → `new Date(item.date)` sin validación adicional
- Índice fuera de rango en días de pago → `(30 - currentDay) + paymentDay`

---

## Criterios de Aceptación

- [ ] App carga offline sin errores de consola
- [ ] 9 páginas navegables con datos persistentes en IndexedDB
- [ ] CRUD funcional en las 7 entidades (cuentas, entradas, gastos, deudas, tarjetas, inversiones, categorías)
- [ ] 16 gráficos Chart.js renderizan con datos correctos
- [ ] Dark/light mode toggle funcional y persistente
- [ ] Exportación JSON, CSV, PDF funcional
- [ ] Importación .mmbackup y .json funcional
- [ ] Balance de cuentas se recalcula automáticamente
- [ ] Nomenclatura auto-siglas genera códigos únicos
- [ ] Categorías built-in se pueden renombrar y cambiar color
- [ ] Categorías custom CRUD completo
- [ ] Modales no cierran al click fuera ni con ESC
- [ ] Números se muestran completos sin truncamiento
- [ ] Precisión 2 decimales en todos los cálculos financieros
- [ ] Sin errores XSS (escapeHtml en toda inserción de datos)
- [ ] Responsive: 1024px, 768px, 480px breakpoints
- [ ] Service Worker no interfiere con actualizaciones de código
