# KUBERA VAULT — Manual de Escalamiento, Pitch y Hoja de Ruta

> Documento complementario al Prompt Constructor. Lectura obligatoria antes de tocar código.

---

## 1. MAPA VISUAL DE LA APLICACIÓN

### Estructura de pantalla (shell persistente)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER (h-16, sticky top, glass-bg 85%, backdrop-blur)   │
│ [········] [$KUBERA] [Dashboard] [Sem|Mes|Año] [←período→] [☀] [↓Imp] [↑Exp] │
├──────────────────────────────────────────────────────────┤
│ NAV-BAR (h-12, sticky top-16, glass-bg 30%, blur)        │
│ [Dashboard] [Entradas] [Salidas] [Cuentas] [Deudas]      │
│ [Tarjetas] [Inversiones] [Reportes] [Configuración]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CONTENT-AREA (flex-1, padding: 24px, max-w: 1400px)     │
│  ┌─ page-header: título + descripción + botones ───────┐ │
│  │                                                      │ │
│  │  ┌─ kpi-cards (.page-section, gap 32px) ──────────┐ │ │
│  │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │ │ │
│  │  │ │stat  │ │stat  │ │stat  │ │stat  │   ← 24px  │ │ │
│  │  │ │card  │ │card  │ │card  │ │card  │    gap    │ │ │
│  │  │ └──────┘ └──────┘ └──────┘ └──────┘           │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  ┌─ grid/cards principal (.page-section) ──────────┐ │ │
│  │  │ (account-cards, debt-cards, credit-card-skins)  │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  ┌─ charts-grid 2-col (.page-section) ────────────┐ │ │
│  │  │ ┌──────────┐ ┌──────────┐                       │ │ │
│  │  │ │ Chart 1  │ │ Chart 2  │                       │ │ │
│  │  │ └──────────┘ └──────────┘                       │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  ┌─ card: tabla/listado (.page-section, last) ────┐ │ │
│  │  │ (transactions table, grouped categories)        │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ TOAST-CONTAINER (fixed, bottom-right)                     │
└──────────────────────────────────────────────────────────┘
│ MODAL-OVERLAY (fixed, fullscreen, z-50)                   │
│   ┌─ modal (max-w: 500px, centered) ──────────────────┐  │
│   │ modal-header → modal-body → modal-footer           │  │
│   └────────────────────────────────────────────────────┘  │
│ PIN-OVERLAY (fixed, fullscreen, z-60)                     │
└──────────────────────────────────────────────────────────┘
```

### Jerarquía CSS (orden de carga = orden de cascada)

```
 1. css/tailwind.css          ← @tailwind base/components/utilities
 2. css/variables.css         ← :root { --tokens }, [data-theme="dark"] { }
 3. css/base.css              ← reset, body, .sidebar, .nav-bar, .content-area, .fade-in
 4. css/components.css        ← .btn, .input, .select, .card, .stat-card, .stat-label,
                                  .stat-value, .modal, .toast, .badge, .table,
                                  utilidades: .page-section, .grid-2, .text-income...
 5. css/pages.css             ← .dashboard-grid, .kpi-cards, .charts-grid,
                                  DUPLICADOS ELIMINADOS (antes tenía account/debt/investment cards)
 6. css/pages/accounts.css    ← .account-card, .account-color, .account-info...
 7. css/pages/debts.css       ← .debt-card, .debt-header, .debt-progress...
 8. css/pages/cards.css       ← .credit-card-display, .credit-card-header...
 9. css/pages/investments.css ← .investment-card...
10. css/pages/reports.css     ← reportes específicos
11. css/pages/settings.css    ← settings específicos
```

**⚠️ REGLA DE ORO**: Los archivos `pages/*.css` deben tener prioridad sobre `pages.css`. Si hay conflicto, `pages.css` gana porque carga después. Por eso se eliminaron los duplicados de `pages.css`. Toda regla nueva de página va en su `pages/*.css` correspondiente, NUNCA en `pages.css`.

---

## 2. MAPA DE CÓDIGO — NOMENCLATURA EXACTA

### Archivos que SÍ se ejecutan en runtime

| Archivo servido desde | Cargado por | Qué hace |
|----------------------|-------------|----------|
| `index.html` | Navegador directamente | Shell HTML estático + carga de CSS + `<script type="module" src="/src/main.ts">` |
| `css/variables.css` | `<link>` en index.html | Design tokens y theming |
| `css/base.css` | `<link>` en index.html | Reset, sidebar, nav-bar, content-area |
| `css/components.css` | `<link>` en index.html | Componentes reutilizables + utilidades de layout |
| `css/pages.css` | `<link>` en index.html | Layouts de página (grids, KPI area) |
| `css/pages/*.css` | `<link>` en index.html | Estilos específicos por entidad |
| `src/main.ts` | `<script type="module">` | Entry point TS. Inicializa todo, carga legacy scripts |
| `src/pages/dashboard.ts` | `import` en main.ts | **ÚNICA página en TypeScript**. Se registra con `registerDashboard()` |
| `public/legacy/pages/*.js` | `loadLegacyScripts()` en main.ts | **7 páginas legacy**. Funciones globales que generan HTML |
| `public/legacy/app.js` | `loadLegacyScripts()` | Handlers globales: import/export, navegación, setup de eventos |
| `public/legacy/importers/mmbackup.js` | `loadLegacyScripts()` | Importador de backups de MoneyManager |

### Archivos que NO se ejecutan directamente (son compilados o son copias de trabajo)

| Archivo | Relación con runtime |
|---------|---------------------|
| `src/lib/*.ts` (db, store, router, crypto, utils, types) | Importados por `main.ts` y compilados por Vite en el bundle |
| `src/components/*.ts` (forms, modal, toast) | Ídem. `Forms` se expone como `window.Forms` |
| `js/pages/*.js` | **Copia de trabajo**. Al editar, sincronizar a `public/legacy/pages/*.js` |
| `js/components/forms.js` | **NO se usa en runtime**. El runtime usa `src/components/forms.ts` |
| `js/store.js` | **NO se usa en runtime**. El runtime usa `src/lib/store.ts` |
| `js/db.js` | **NO se usa en runtime**. El runtime usa `src/lib/db.ts` |

### Funciones globales expuestas en `window.*`

Estas son las que las páginas legacy y los onclick del HTML pueden llamar:

```
window.escapeHtml(str)           → string sanitizada
window.preciseRound(n, d)        → número redondeado
window.preciseSum(arr)           → suma precisa
window.generateSiglas(title)     → siglas para nomenclatura
window.generateAutoCode()        → código secuencial
window.validatePositiveNumber(v) → número validado o null
window.DB                         → instancia de base de datos
window.store                      → singleton del store
window.router                     → router SPA
window.modal                      → sistema de modales
window.toast                      → sistema de notificaciones
window.Forms                      → funciones generadoras de formularios
window.confirmDialog(msg, fn)     → diálogo de confirmación
window.preventSubmit()            → bloquea doble submit
window.releaseSubmit()            → libera bloqueo
window.registerChart(key, inst)   → registra chart para cleanup
window.destroyAllCharts()         → destruye todos los charts
window.hashPin(pin)               → PBKDF2 hash
window.verifyPin(pin, hash)       → verifica PIN
window.encryptData(key, data)     → AES-GCM encrypt
window.decryptData(key, enc)      → AES-GCM decrypt
window.setupFormListeners()       → re-registra event listeners
window.toggleTheme()              → cambia light/dark
```

---

## 3. GUÍA DE ESCALAMIENTO — QUÉ HACER Y QUÉ NO HACER

### ✅ ZONAS SEGURAS (cambios de bajo riesgo)

| Zona | Qué puedes hacer | Archivos |
|------|-----------------|----------|
| CSS de páginas | Agregar/editar estilos | `css/pages/*.css` |
| Utilidades CSS | Nuevas clases de layout/color | `css/components.css` (sección utilidades) |
| Tokens de diseño | Nuevas variables | `css/variables.css` (:root y [data-theme="dark"]) |
| HTML de páginas legacy | Cambiar estructura, clases | `js/pages/*.js` → sincronizar a `public/legacy/pages/*.js` |
| Formularios | Agregar/quitar campos | `src/components/forms.ts` |
| Página dashboard | Cualquier cambio | `src/pages/dashboard.ts` |

### ⚠️ ZONAS DE PRECAUCIÓN (requieren verificar dependencias)

| Zona | Riesgo | Qué verificar antes de commit |
|------|--------|------------------------------|
| `src/lib/store.ts` | El store lo usan TODAS las páginas | Correr `npm run test`, probar 3 páginas mínimo |
| `src/lib/db.ts` | Cambiar schema rompe datos existentes | Probar con datos reales, verificar migración |
| `src/lib/utils.ts` | `preciseRound` y `preciseSum` son críticos para IRS | Todos los tests de utils deben pasar |
| `src/main.ts` | Entry point. Romper = app no carga | Hacer build, probar en incógnito |
| `css/components.css` | `.card`, `.stat-card`, `.stat-value` son ubicuos | Verificar dashboard + 2 páginas legacy |
| `index.html` | Cambiar orden de CSS rompe la cascada | Verificar visualmente light + dark mode |

### 🚫 ZONAS PROHIBIDAS (no tocar sin plan de migración)

| Zona | Por qué |
|------|--------|
| Cambiar `overflow: visible` en `.card` | Rompe dropdowns, tooltips, modales, gráficos |
| Cambiar nombres de stores en IndexedDB | Datos existentes se pierden (no hay migración automática) |
| Cambiar `keyPath` de stores | IndexedDB no permite alterar schema sin borrar la DB |
| Eliminar `window.*` globales | Las páginas legacy dependen de ellos |
| Cambiar la arquitectura de carga (TS → legacy) | Todo el sistema de páginas depende de este orden |
| Agregar un framework (React, Vue, Svelte) | Reescribir 100% del código. Solo si se planea v2 completa |
| Quitar `public/legacy/pages/*.js` | Son la fuente de verdad para 7/8 páginas |

### 📋 Protocolo para agregar una feature nueva

1. **Feature simple** (nuevo KPI, nuevo campo en formulario, nueva columna en tabla):
   - Editar `js/pages/NOMBRE.js` → copiar a `public/legacy/pages/NOMBRE.js`
   - Si es formulario: editar `src/components/forms.ts`
   - Si es CSS: editar `css/pages/NOMBRE.css` o `css/components.css`
   - Probar build + test + visual

2. **Feature media** (nueva página, nuevo tipo de entidad):
   - Crear `js/pages/nueva.js` + `public/legacy/pages/nueva.js`
   - Crear `css/pages/nueva.css`
   - Agregar link CSS en `index.html`
   - Agregar script en `LEGACY_FILES` en `src/main.ts`
   - Registrar ruta en el nav del `index.html`
   - Agregar form en `src/components/forms.ts`
   - Agregar store en `src/lib/db.ts` y `src/lib/store.ts`
   - Probar build + test + visual

3. **Feature grande** (migrar página legacy a TypeScript, nuevo módulo crypto, PWA avanzado):
   - Crear spec en papel primero
   - Migrar UNA página a la vez
   - Mantener ambas versiones funcionales durante la migración
   - Hacer build + test después de cada paso

### 🔒 Reglas de seguridad para producción

1. **NUNCA** uses `innerHTML` sin `escapeHtml()` en datos de usuario
2. **NUNCA** almacenes el PIN en texto plano (ya se usa PBKDF2, mantener)
3. **NUNCA** expongas `cryptoKey` en console.log o exports
4. **SIEMPRE** valida montos con `validatePositiveNumber()`
5. **SIEMPRE** verifica denominador ≠ 0 antes de división
6. **SIEMPRE** usa `preciseRound()` para outputs financieros, nunca `toFixed()` directo

---

## 4. HOJA DE RUTA — FEATURES FUTURAS (en orden)

### Fase 1: Estabilidad (siguiente sprint)
| # | Feature | Cómo | Archivos afectados |
|---|---------|------|-------------------|
| 1.1 | Tests E2E con Playwright | Crear `e2e/` con tests para flujos críticos (crear cuenta → transacción → borrar) | Nuevo dir `e2e/` |
| 1.2 | Skeleton loaders | CSS animation de pulso en cards mientras carga datos | `css/components.css` |
| 1.3 | Error boundaries globales | `window.onerror` + `unhandledrejection` → toast genérico en vez de crash | `src/main.ts` |
| 1.4 | Límite de almacenamiento | Verificar `navigator.storage.estimate()` antes de escribir, alertar si > 80% | `src/lib/db.ts` |
| 1.5 | Debounce en charts | `resize` observer con 200ms debounce para redibujar charts | `src/main.ts` |

### Fase 2: Funcionalidad (2-3 sprints)
| # | Feature | Cómo | Archivos afectados |
|---|---------|------|-------------------|
| 2.1 | Presupuestos mensuales | Nueva entidad `budgets`: categoría, monto, mes. Alerta visual si gasto > presupuesto | `forms.ts`, `db.ts`, nueva página |
| 2.2 | Metas de ahorro | Nueva entidad `goals`: nombre, monto objetivo, fecha, progreso | `forms.ts`, `db.ts`, dashboard |
| 2.3 | Recordatorios de pago | Basado en `cutoffDay`/`paymentDay` de tarjetas y `endDate` de deudas. Badge en dashboard "3 pagos próximos" | Dashboard, store |
| 2.4 | Cálculo de impuestos estimados | Suma de income por categoría taxable × tasa configurable. Nueva sección en reportes | Reports, store |
| 2.5 | Exportar a PDF | Usar `jspdf` + `html2canvas` para generar reporte PDF del dashboard/reportes | Nuevo módulo |

### Fase 3: Experiencia (3-4 sprints)
| # | Feature | Cómo | Archivos afectados |
|---|---------|------|-------------------|
| 3.1 | Temas personalizados | 5+ temas predefinidos (Nord, Dracula, Solarized, Monokai, GitHub) + editor de tema | `variables.css`, settings |
| 3.2 | Atajos de teclado | `Ctrl+N` nueva transacción, `Ctrl+1-8` navegar páginas, `Esc` cerrar modal | `src/main.ts` |
| 3.3 | Drag & drop en orden de cuentas/tarjetas | Reordenar manualmente con SortableJS | `js/pages/accounts.js`, `cards.js` |
| 3.4 | Notificaciones del sistema | Notification API para recordatorios de pago (incluso con app cerrada, vía service worker) | `sw.js`, service worker |
| 3.5 | Modo multi-moneda avanzado | Tasa de cambio configurable, conversión automática en dashboard, gráfico de forex | Store, dashboard |

### Fase 4: Escala (cuando haya >100 usuarios)
| # | Feature | Cómo | Archivos afectados |
|---|---------|------|-------------------|
| 4.1 | Sincronización entre dispositivos | WebRTC peer-to-peer o sync via archivo cifrado compartido (Dropbox/Drive) | Nuevo módulo |
| 4.2 | Multi-usuario en mismo dispositivo | Perfiles con PIN independiente, selector de perfil al iniciar | `db.ts`, PIN overlay |
| 4.3 | API de plugins | Sistema de extensiones: hooks antes/después de save, widgets custom en dashboard | Nueva arquitectura |
| 4.4 | Modo colaborativo | Compartir presupuesto familiar: múltiples dispositivos, mismos datos, merge CRDT | Investigación previa |
| 4.5 | App nativa móvil | Envolver con Tauri/Capacitor para acceso a filesystem, biometric auth, notificaciones push | Nuevo repo |

---

## 5. LO QUE FALTA PARA 100 USUARIOS

### Crítico (sin esto no lanzar)
- [ ] **Manejo de errores de storage lleno**: IndexedDB tiene cuota. Sin manejo, la app falla silenciosamente al no poder escribir
- [ ] **Tests de integración**: 68 tests unitarios no cubren flujos completos (crear cuenta → crear transacción → ver dashboard → editar → eliminar → verificar totales)
- [ ] **Feedback de carga**: Sin spinners ni skeletons, el usuario no sabe si la app está procesando o crasheó
- [ ] **Validación de import**: El JSON importado debe validarse estructuralmente antes de escribirse. Actualmente es frágil
- [ ] **Manejo de versiones de datos**: Si cambia el schema en futuras versiones, los datos antiguos deben migrarse. Agregar `version` en el export

### Importante (primeras 2 semanas post-lanzamiento)
- [ ] **Log de errores**: Capturar errores en un array en localStorage para debug remoto. Sin esto, bugs de usuarios son invisibles
- [ ] **Política de privacidad**: Documentar qué datos se almacenan, dónde, cómo se cifran. Requisito legal en muchas jurisdicciones
- [ ] **Términos de uso**: Disclaimer de que la app no reemplaza un contador profesional
- [ ] **Onboarding**: 3-4 tooltips/pasos guiados la primera vez que se abre la app (crear cuenta → registrar ingreso → ver dashboard)
- [ ] **Mecanismo de feedback**: Botón "Reportar error" que capture estado + screenshot + logs y genere un issue pre-formateado
- [ ] **Changelog**: Archivo `CHANGELOG.md` mantenido. Los usuarios necesitan saber qué cambió

### Deseable (primer mes)
- [ ] **Documentación de usuario**: Más allá del README técnico. Guía visual con screenshots de cada página
- [ ] **FAQ**: 10-15 preguntas frecuentes (¿cómo agrego un banco nuevo?, ¿qué pasa si olvido mi PIN?)
- [ ] **Landing page**: Página web simple para dirigir tráfico, con screenshots y CTA de descarga
- [ ] **Analytics anónimos**: Conteo de usuarios activos, features más usadas. Solo si el usuario opt-in
- [ ] **Internacionalización**: Al menos inglés + español. La UI ya está principalmente en español

---

## 6. PITCH PARA INVERSIONISTAS / STAKEHOLDERS

### 🪙 Kubera Vault — Finanzas personales sin servidor, sin suscripción, sin riesgos

**El Problema:**
85 millones de personas en EE.UU. usan apps de finanzas personales. El 100% de las apps líderes (Mint, YNAB, Copilot) requieren:
- Conexión a internet permanente
- Almacenar datos financieros en servidores de terceros
- Suscripción mensual ($8-$15/mes)
- Vincular cuentas bancarias (riesgo de seguridad)

Una brecha de datos en cualquiera de estas apps expone el historial financiero completo de millones de usuarios. En 2024, Intuit (Mint) reportó 2.4 millones de cuentas comprometidas.

**La Solución:**
Kubera Vault es una PWA offline-first que almacena **todo** localmente en el navegador del usuario. Cero servidores. Cero suscripciones. Cero riesgo de fuga de datos. Cifrado AES-GCM de grado militar con PIN personal.

**Tracción Actual (MVP funcional):**
- 8 módulos financieros completos: dashboard, ingresos, gastos, cuentas, deudas, tarjetas, inversiones, reportes
- 68 tests unitarios automatizados
- PWA instalable (funciona offline, como app nativa)
- Sistema de cifrado extremo-a-extremo con PIN
- Arquitectura híbrida TypeScript/JavaScript — 100% vanilla, 0 frameworks pesados
- Bundle total: 75 KB JS + 44 KB CSS (Mint pesa 4.2 MB)

**Modelo de Negocio (freemium):**
| Tier | Precio | Incluye |
|------|--------|---------|
| Free | $0 | Todas las features actuales, ilimitado |
| Pro | $4/mes o $36/año | Multi-dispositivo sync, temas premium, reportes PDF, presupuestos |
| Business | $12/mes | Multi-usuario, colaborativo, API export contable, white label |

**Mercado:**
- TAM: 85M usuarios de apps financieras personales (solo EE.UU.)
- SAM: 12M usuarios offline-first/privacidad-consciente
- SOM: 50K usuarios en año 1 (0.4% del SAM, conservador)
- ARPU estimado: $18/año (mix free/pro)
- Revenue potencial año 1: $900K

**Por qué ahora:**
1. **Regulaciones de privacidad**: GDPR, CCPA, LGPD empujan a usuarios hacia soluciones locales
2. **Fatiga de suscripciones**: El usuario promedio paga $273/mes en suscripciones. "Sin suscripción" es el diferenciador #1 en 2026
3. **PWAs maduras**: iOS 17.4+ y Android 14+ soportan PWAs con capacidades nativas completas (notificaciones, filesystem, biometric auth)
4. **IndexedDB ubicuo**: 98.7% de navegadores soportan IndexedDB. El storage local creció 10x en 5 años

**Equipo (perfil del fundador):**
- Full-stack developer con experiencia en fintech y criptografía
- Conocimiento profundo de Web Crypto API, IndexedDB, y arquitectura offline-first
- Objetivo: bootstrapped, profitable desde día 1, sin VC hasta validar product-market fit

**Próximos hitos (12 meses):**
- Mes 1-2: Landing page + lanzamiento en Product Hunt + Hacker News
- Mes 3-4: 1,000 usuarios activos, implementar feedback loop
- Mes 5-6: Versión Pro con sync + presupuestos + PDF reports
- Mes 7-9: 10,000 usuarios, contratar 1 dev, preparar mobile apps (Tauri/Capacitor)
- Mes 10-12: 50,000 usuarios, break-even, evaluar ronda seed

**Lo que buscamos:**
$0. Nada. Kubera es bootstrapped. Si eres inversionista y llegaste hasta aquí: la app es gratuita y open-core. El valor está en la comunidad. Si quieres ayudar, compártela con 3 personas que necesiten ordenar sus finanzas sin vender su privacidad.

---

## 7. GLOSARIO DE NOMENCLATURA TÉCNICA

| Término en código | Significado | Ubicación |
|-------------------|-------------|-----------|
| `entries` | Ingresos (income transactions) | Store IndexedDB, `js/pages/entries.js`, `src/lib/types.ts` |
| `expenses` | Salidas/Gastos (expense transactions) | Store IndexedDB, `js/pages/expenses.js` |
| `accounts` | Cuentas bancarias/efectivo | Store IndexedDB, `js/pages/accounts.js` |
| `debts` | Deudas/préstamos | Store IndexedDB, `js/pages/debts.js` |
| `creditCards` | Tarjetas de crédito | Store IndexedDB, `js/pages/cards.js` |
| `investments` | Inversiones/portafolio | Store IndexedDB, `js/pages/investments.js` |
| `nomenclatureCode` | Código alfanumérico único por transacción (ej: SAL-01A) | Campo en entries/expenses |
| `baseBalance` | Balance inicial de una cuenta (antes de transacciones) | Campo en accounts |
| `hasMonthlyPayment` | Booleano: ¿la tarjeta tiene cuota mensual fija? | Campo en creditCards |
| `cutoffDay` / `paymentDay` | Día de corte y día de pago de tarjeta (1-31) | Campos en creditCards |
| `autoFee` | Cargo automático mensual de tarjeta (anualidad, seguro) | Campo en creditCards |
| `linkedDebtId` | FK opcional: transacción vinculada a una deuda | Campo en entries/expenses |
| `recurring` | Booleano: ¿transacción recurrente? | Campo en entries/expenses |
| `viewPeriod` | Período activo: 'week', 'month', 'year' | Campo en store.state |
| `periodOffset` | Desplazamiento desde período actual (0 = actual, -1 = anterior) | Campo en store.state |
| `glass-bg` | CSS variable: fondo glassmorphism del header/nav | Definido en `variables.css` |
| `page-section` | Clase CSS: margen inferior de 32px entre secciones | Definido en `components.css` |
| `kpi-cards` | Grid de tarjetas de indicadores clave (auto-fit) | Clase en `pages.css` |
| `kpi-cards-3col` | Variante forzada a 3 columnas para KPI de 6 items | Clase en `components.css` |
| `stat-card` | Tarjeta individual de estadística (label + value) | Clase en `components.css` |

---

## 8. COMANDOS RÁPIDOS

```bash
# Desarrollo
npm run dev              # Vite dev server (puerto 3000 por defecto)
npm run dev -- --port 8888  # Puerto personalizado

# Calidad
npm run lint             # ESLint en src/
npm run test             # Vitest (68 tests)
npm run build            # tsc --noEmit + vite build (producción)

# Servir producción localmente
npx serve dist           # Servir carpeta dist/ en puerto 3000

# Despliegue estático (Netlify, Vercel, GitHub Pages)
# Subir carpeta dist/ como raíz. Configurar SPA fallback a index.html

# Sincronizar JS de trabajo a legacy (IMPORTANTE después de editar js/pages/)
# Desde PowerShell en la raíz del proyecto:
Get-ChildItem js/pages/*.js | ForEach-Object { Copy-Item $_.FullName "public/legacy/pages/" -Force }
```

---

*Documento generado como companion del Prompt Constructor Reconstruido. Versión 1.0 — Junio 2026.*
