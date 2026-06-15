# ⚡ Kubera Sentinel — Protocolo de Auditoría Elite

> **Misión:** Ejecutar una auditoría completa de seguridad, integridad de datos y detección de bugs sobre la API financiera Kubera Vault.
> **Objetivo:** Producir un reporte profesional con hallazgos priorizados, evidencia concreta y recomendaciones accionables.
> **Modo:** Revisión estática + Análisis dinámico + Simulación de ataque.

---

## 🌐 Fase 0 — Reconocimiento y Contexto

Antes de cualquier análisis, debes entender la arquitectura completa:

1. **Lee** `ARCHITECTURE.md` si existe, o explora `src/`, `css/`, `index.html`
2. **Identifica**:
   - Framework y stack tecnológico
   - Sistema de almacenamiento (IndexedDB + estructura de object stores)
   - Sistema de cifrado (Web Crypto API — PBKDF2, AES-GCM-256)
   - Sistema de autenticación (PIN + auto-lock)
   - Flujo de datos: entrada → validación → persistencia → renderizado
   - Dependencias externas (CDN, librerías)
3. **Documenta** en el reporte: stack, arquitectura, versiones, dependencias

---

## 🔬 Fase 1 — Revisión de Código Fuente (SAST)

Ejecuta UNA POR UNA cada verificación. Para CADA hallazgo, captura:
- **Archivo** y **línea exacta**
- **Código ofensivo** (cita textual)
- **Impacto** y **explotabilidad**
- **Solución propuesta** (con código)

### 1.1 Seguridad en Criptografía
- [ ] Revisa `src/lib/crypto.ts`:
  - ¿El hash de PIN usa salt? → `hashPin()` debe usar PBKDF2, no SHA-256 plano
  - ¿Hay protección contra timing attacks en `verifyPin()`?
  - ¿La derivación de claves usa iteraciones suficientes? (600K PBKDF2)
  - ¿El IV es aleatorio y único por operación?
  - ¿Hay exposición de claves en window global?

- [ ] Revisa `src/main.ts`:
  - ¿Qué funciones criptográficas están expuestas en `window`?
  - ¿El "Forgot PIN" limpia datos cifrados o solo desactiva el PIN?
  - ¿Hay rate limiting en intentos de PIN?
  - ¿El auto-lock es seguro?

### 1.2 Prevención de XSS
- [ ] Revisa `src/lib/utils.ts` — `escapeHtml()`:
  - ¿Cubre todos los caracteres peligrosos?
  - ¿Se usa en TODAS las inserciones de datos de usuario al DOM?

- [ ] Revisa `src/components/modal.ts`:
  - ¿`innerHTML` recibe datos escapados por parte de todos los llamadores?
  - Busca llamadas a `modal.open()` y verifica que usen `escapeHtml()`

- [ ] Revisa `src/components/toast.ts`:
  - ¿`withUndo()` inlinea código de función en el HTML?
  - ¿Hay riesgo de CSP bypass?

### 1.3 Validación de Entrada
- [ ] Revisa `src/lib/db.ts`:
  - ¿`dbAdd()` y `dbPut()` validan tipos antes de persistir?
  - ¿Hay riesgo de polución de prototipos?
  - ¿Los timestamps son confiables?

- [ ] Revisa `src/lib/utils.ts` — `validatePositiveNumber()`:
  - ¿Cubre todos los edge cases? (NaN, Infinity, negativos, strings)

### 1.4 Seguridad en Exportación/Importación
- [ ] Revisa `src/pages/dashboard.ts`:
  - ¿Los CSV exportados previenen inyección de fórmulas? (`, +, -, @`)
  - ¿La importación valida el formato de datos?
  - ¿Hay riesgo de sobrescritura de datos?

### 1.5 Dependencias y Supply Chain
- [ ] Revisa `index.html` y `vite.config.js`:
  - ¿Hay SRI (Subresource Integrity) en scripts CDN?
  - ¿Hay CSP (Content Security Policy)?
  - ¿Hay dependencias con vulnerabilidades conocidas? → `npm audit`

### 1.6 Calidad General del Código
- [ ] Ejecuta `npx tsc --noEmit` — reporta TODOS los errores de tipos
- [ ] Ejecuta `npm run lint` o `npx eslint src/ --ext .ts` — reporta TODAS las violaciones
- [ ] Ejecuta `npm test` o `npx vitest run` — reporta fallos y cobertura
- [ ] Busca `console.log`, `debugger`, `TODO`, `FIXME`, `any`, `@ts-ignore`, `!` non-null assertions

---

## 💣 Fase 2 — Detección de Bugs en Tiempo Real

### 2.1 Arranca el Servidor
```bash
npx vite --port 3000
```

### 2.2 Pruebas de Integridad de Datos (conexión a IndexedDB)
Crea y ejecuta un script Node.js o HTML que se conecte a `KuberaVaultDB` y verifique:

- [ ] **Balance de Cuentas**: Para cada cuenta, `baseBalance + Σ entries - Σ expenses === balance`
- [ ] **Huérfanos**: ¿Hay transacciones que referencien `accountId` o `category` que ya no existen?
- [ ] **Duplicados**: ¿Hay transacciones con mismo `title + amount + date + accountId`?
- [ ] **Montos Cero**: ¿Hay transacciones con `amount === 0`?
- [ ] **Fechas Inválidas**: ¿Hay fechas futuras (>1 año), pre-2000, o mal formadas?
- [ ] **Outliers**: Detecta montos atípicos por desviación estadística (IQR)
- [ ] **Campos Faltantes**: ¿Hay registros sin `title`, `amount`, `date` obligatorios?
- [ ] **Cuotas**: ¿Hay `isInstallment` sin `installmentTotal`? ¿Cuota actual > total?
- [ ] **Tarjetas**: ¿Hay `currentDebt > creditLimit`? ¿Utilización > 90%?
- [ ] **Deudas Vinculadas**: ¿Hay transacciones con `linkedDebtId` a deuda eliminada?
- [ ] **Inversiones Vencidas**: ¿Hay inversiones con `maturityDate` vencida hace >3 meses sin actualizar?
- [ ] **Saldos Negativos**: ¿Cuentas de tipo cash/checking con saldo negativo?

### 2.3 Pruebas de UI/UX
- [ ] **Modo oscuro**: Alterna tema, verifica contraste y legibilidad
- [ ] **Responsive**: Verifica layouts en 375px, 768px, 1024px+
- [ ] **PIN**: Prueba flujo completo: activar, bloquear, desbloquear, forgot PIN
- [ ] **Exportación**: Exporta JSON y CSV, verifica contenido y sanitización
- [ ] **Importación**: Importa datos, verifica integridad post-importación
- [ ] **Nomenclatura**: Prueba auto-siglas, híbrido y manual
- [ ] **Transiciones**: Verifica que las animaciones no afecten usabilidad

---

## 🗡️ Fase 3 — Simulación de Ataque

### 3.1 Ataque al PIN
- [ ] **Fuerza bruta**: ¿Cuántos intentos de PIN puedes hacer antes de bloqueo? (refresca la página)
- [ ] **Hash de PIN offline**: Extrae `pinHash` de IndexedDB y evalúa si es crackeable con hashcat
- [ ] **Forgot PIN abuse**: ¿Qué pasa si usas "Forgot PIN" repetidamente?

### 3.2 Ataque al Cifrado
- [ ] **Clave expuesta**: Intenta acceder a `window.decryptData()` desde DevTools
- [ ] **Datos cifrados**: ¿Puedes descifrar `enc_*` settings si conoces el PIN?
- [ ] **Manipulación**: ¿Puedes modificar datos cifrados en IndexedDB directamente?

### 3.3 Ataque de Inyección
- [ ] **XSS almacenado**: Crea una transacción con `<script>alert(1)</script>` en el título. ¿Se ejecuta?
- [ ] **Inyección CSV**: Exporta datos con título `=CMD()` o `+FORMULA()`. ¿El CSV está sanitizado?
- [ ] **Prototype pollution**: Intenta `__proto__` o `constructor` en campos de formulario

### 3.4 Ataque a la Integridad
- [ ] **Manipulación de balances**: Modifica `balance` directamente en IndexedDB. ¿El sistema lo detecta?
- [ ] **Deudas negativas**: Crea una deuda con `originalAmount < 0`. ¿Pasa la validación?
- [ ] **Fechas inconsistentes**: Crea pagos de deuda antes de la fecha de inicio de la deuda
- [ ] **IDs manipulados**: Asigna manualmente IDs conflictivos en IndexedDB

---

## 📊 Fase 4 — Generación del Reporte de Élite

Genera un archivo `SENTINEL-REPORT.md` en la raíz del proyecto con la siguiente estructura EXACTA:

```markdown
# ⚡ Kubera Sentinel — Reporte de Auditoría

> **Fecha:** {fecha}
> **Duración:** {tiempo}
> **Analista:** Claude Code

---

## 📋 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Archivos analizados | {n} |
| Líneas de código | {n} |
| Checks ejecutados | {n} |
| ✅ Pasaron | {n} |
| ⚠️ Advertencias | {n} |
| ❌ Críticos | {n} |
| 🛡️ Salud general | {🟢/🟡/🔴} |

### Hallazgos Críticos (Top 3)
1. **{título}** — {impacto} → {archivo:línea}
2. **{título}** — {impacto} → {archivo:línea}
3. **{título}** — {impacto} → {archivo:línea}

---

## 🏗️ Arquitectura

{descripción del stack, dependencias, flujo de datos}

---

## 🚨 Hallazgos por Severidad

### 🔴 CRÍTICOS

<details>
<summary><strong>{n}. {título}</strong> — {archivo:línea}</summary>

**Tipo:** {tipo}
**CVSS Estimado:** {puntaje}/10
**Explotabilidad:** {fácil/media/difícil}

```typescript
// Código vulnerable
{código}
```

**Impacto:**
{descripción del impacto}

**Solución:**
```typescript
// Código corregido
{código}
```

</details>

### 🟡 ADVERTENCIAS

{misma estructura}

### 🔵 INFORMATIVOS

{misma estructura}

---

## ✅ Verificaciones Superadas

- [x] {check 1}
- [x] {check 2}
- ...

---

## 📈 Métricas de Código

| Métrica | Valor |
|---------|-------|
| Errores TypeScript | {n} |
| Violaciones ESLint | {n} |
| Tests fallando | {n} |
| Cobertura | {n}% |
| console.log | {n} |
| TODO/FIXME | {n} |
| @ts-ignore | {n} |
| Non-null assertions | {n} |

---

## 🎯 Recomendaciones Priorizadas

### Inmediatas (Alta Prioridad)
1. **[Título]** — {acción} — {archivo}

### Corto Plazo (Media Prioridad)
1. **[Título]** — {acción} — {archivo}

### Largo Plazo (Baja Prioridad)
1. **[Título]** — {acción} — {archivo}

---

## 📁 Archivos Analizados

```
src/lib/crypto.ts      → {hallazgos} hallazgos
src/lib/db.ts          → {hallazgos} hallazgos
src/lib/utils.ts       → {hallazgos} hallazgos
src/main.ts            → {hallazgos} hallazgos
src/components/*.ts    → {hallazgos} hallazgos
index.html             → {hallazgos} hallazgos
...
```

---

*Reporte generado por Kubera Sentinel v1.0 — {fecha}*
```

---

## 🎯 Reglas de Ejecución

1. **NO** modifiques ningún archivo del proyecto sin preguntar primero
2. **NO** ejecutes `npm install` sin verificar primero si `node_modules` existe
3. **SÍ** ejecuta todos los comandos de análisis: `tsc`, `lint`, `test`, `audit`
4. **SÍ** captura evidencia concreta: líneas de código, stack traces, screenshots de ser posible
5. **SÍ** prioriza hallazgos por severidad e impacto real
6. **SÍ** genera el reporte como `SENTINEL-REPORT.md` al finalizar
7. **SI** encuentras un bug crítico, **DETENTE** y repórtalo antes de continuar

---

## ✅ Checklist de Finalización

Al terminar, verifica que:

- [ ] Reporte `SENTINEL-REPORT.md` generado con TODAS las secciones completas
- [ ] Cada hallazgo crítico tiene: archivo, línea, código ofensivo, impacto, solución
- [ ] Las verificaciones pasadas están documentadas
- [ ] Las recomendaciones están priorizadas y son accionables
- [ ] El resumen ejecutivo es entendible por no-técnicos
- [ ] No quedaron archivos temporales ni modificaciones accidentales

---

*Kubera Sentinel v1.0 — Este prompt es un producto de élite. Ejecútalo con excelencia.*
