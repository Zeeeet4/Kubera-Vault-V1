# 📘 KUBERA VAULT — Manual de Usuario y Troubleshooting

## 💻 Desarrollo

### Requisitos
- Node.js 20+
- npm 9+

### Ejecutar en desarrollo
```powershell
cd C:\Users\zaraj\MisProyectos\Kubera
npm install
npm run dev
# Abre http://localhost:3000 automáticamente
```

### Comandos disponibles
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con hot-reload |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run typecheck` | Verifica tipos TypeScript sin emitir |
| `npm run lint` | Ejecuta ESLint sobre `src/` |
| `npm run format` | Formatea código con Prettier |

### Build de producción
```powershell
npm run build
# Genera dist/ con todos los assets minificados
# Incluye: index.html, js/css optimizados, manifest.json,
#          sw.js, icons PWA, sourcemaps
```

El build incluye copia automática de los archivos PWA (`manifest.json`, `sw.js`, `assets/icons/`) al directorio `dist/`.

---

## 🚀 Instalación y Ejecución (usuario final)

### Requisitos
- Navegador moderno (Chrome 90+, Edge 90+, Firefox 88+)
- Python 3 (para servidor local) o Node.js con `npx serve`
- 5MB libres para datos (típico)

### Servir la aplicación
```powershell
cd C:\Users\zaraj\MisProyectos\financeflow
python -m http.server 9000
```
Luego abrir: **http://localhost:9000**

**⚠️ NUNCA abras index.html directamente (file://)** — los navegadores bloquean IndexedDB y Service Workers en file://.

### Cambiar de puerto si está ocupado
```powershell
python -m http.server 9090   # Puerto alternativo
```

---

## 🏠 Navegación General

### Sidebar
- **Dashboard:** Resumen financiero general
- **Entradas:** Gestión de ingresos
- **Salidas:** Gestión de gastos
- **Cuentas:** Gestión de cuentas bancarias
- **Deudas:** Gestión de préstamos y deudas
- **Tarjetas:** Gestión de tarjetas de crédito
- **Inversiones:** Gestión de portafolio
- **Reportes:** Análisis y exportación
- **Ajustes:** Configuración general

### Header
- **Flechas `<` `>`:** Navegar entre períodos (mes/semana/año)
- **Selector de vista:** Semana | Mes | Año — cambia granularidad
- **🌙 Toggle:** Dark/light mode
- **Exportar:** Dropdown JSON/CSV para página actual

---

## 📊 Dashboard

### KPIs Disponibles
| KPI | Fórmula |
|-----|---------|
| Balance Neto | Ingresos - Gastos |
| Ingresos Totales | Suma entradas del período |
| Gastos Totales | Suma gastos del período |
| Tasa de Ahorro | (Ingresos - Gastos) / Ingresos × 100 |
| Patrimonio Neto | Cuentas + Inversiones - Deudas |
| Deuda Total | Suma balances de deudas |

### Gráficos
- **Doughnut:** Distribución de gastos por categoría
- **Barras:** Ingresos vs Gastos (últimos 6 meses)

### Acciones Rápidas
- Botones "Entrada" y "Gasto" abren modales de creación

---

## 💰 Entradas (Ingresos)

### Crear Entrada
1. Click **Nueva Entrada** o botón "+ Entrada" en Dashboard
2. Llenar formulario:
   - **Título:** Descripción del ingreso
   - **Nomenclatura:** Manual (escribes código), Auto-siglas (genera del título), Híbrido (siglas + código)
   - **Monto:** Valor numérico positivo
   - **Fecha:** Día del ingreso
   - **Categoría:** Tipo de ingreso (Salario, Freelance, etc.)
   - **Cuenta:** Dónde se depositó
   - **Deuda vinculada:** Si este ingreso reduce una deuda
   - **Notas:** Opcional
   - **Recurrente:** Marcar si es ingreso periódico

### Editar / Eliminar
- Click en ícono ✏️ (editar) o 🗑️ (eliminar) en la tabla

### Exportar
- Dropdown en header → JSON o CSV

---

## 💸 Salidas (Gastos)

### Crear Gasto
- Similar a Entradas, con campos adicionales:
  - **Beneficiario:** A quién se pagó
  - **Cuotas:** Cantidad total y número actual (para pagos en cuotas)
  - **Deuda vinculada:** Si este gasto reduce el balance de una deuda

### Agrupación por Categoría
- Los gastos se agrupan en accordions por categoría
- Click en la categoría para expandir/colapsar

---

## 🏦 Cuentas

### Crear Cuenta
1. **Nombre:** Ej: "BCP Ahorros"
2. **Tipo:** Efectivo, Corriente, Ahorros, Inversión, Billetera Digital, Otra
3. **Banco:** Seleccionar de la lista o "Otro" + escribir nombre
4. **Moneda:** La moneda global por defecto
5. **Balance base:** Saldo inicial
6. **Color:** Identificador visual

### Balance Automático
El balance de cada cuenta se calcula automáticamente:
```
Balance = Balance Base + SUM(Entradas con esta cuenta) - SUM(Gastos con esta cuenta)
```
Se actualiza cada vez que creas/editas/eliminas una transacción.

---

## 💳 Deudas

### Crear Deuda
1. **Título:** "Préstamo Hipotecario BBVA"
2. **Tipo:** Personal, Hipoteca, Auto, Tarjeta, Familiar, Otro
3. **Monto Original:** Total del préstamo
4. **Balance Actual:** Lo que falta pagar
5. **Tasa de Interés:** % anual
6. **Pago Periódico:** Cuota mensual/quincenal
7. **Fechas:** Inicio y fin estimado

### Cálculos
- **Interés anual:** `balance actual × tasa / 100`
- **Progreso:** `(original - actual) / original × 100`

### Vincular Gastos a Deuda
Al crear un gasto, selecciona la deuda en "Deuda vinculada". El balance de la deuda se reduce automáticamente.

---

## 💳 Tarjetas de Crédito

### Campos Especiales
- **¿Tiene cuota mensual fija?:** Activar + ingresar monto si tienes un pago fijo mensual (aparte de intereses)
- **Cargo automático mensual:** Anualidad, seguro, etc.
- **Día de corte:** Día en que cierra el período
- **Día de pago:** Día límite para pagar

### Display Visual
- Tarjeta con gradiente del color seleccionado
- Últimos 4 dígitos
- Barra de uso del crédito (verde <50%, amarillo 50-80%, rojo >80%)
- Alerta ⚠️ si faltan ≤10 días para el pago

### Cálculos Clave
| Métrica | Fórmula |
|---------|---------|
| Interés mensual | `(deuda × tasa% / 100) / 12` |
| Costo mensual total | `deuda + interés mensual + cargo fijo + cuota fija` |
| Disponible | `límite - deuda` |
| % Uso | `(deuda / límite) × 100` |

---

## 📈 Inversiones

### Crear Inversión
1. **Monto invertido:** Capital inicial
2. **Valor actual:** Valor presente de mercado
3. **Tipo:** Depósito, Fondos Mutuos, Acciones, Bonos, Cripto, etc.
4. **Fechas:** Inversión y vencimiento

### KPIs
- **Ganancia/Pérdida:** Valor actual - Monto invertido
- **Rentabilidad:** (Ganancia / Invertido) × 100

---

## 📋 Reportes

### Períodos Disponibles
- **6 meses:** Último semestre
- **12 meses:** Último año
- **Año actual:** YTD (enero → hoy)

### Exportación
| Formato | Uso |
|---------|-----|
| **JSON** | Backup completo estructurado |
| **CSV** | Abrir en Excel / Google Sheets |
| **PDF** | Imprimir reporte estilizado |

### Tabla Resumen por Mes
Columnas: Período, Ingresos, Gastos, Flujo Neto, Ahorro %, Deuda, Cuentas, Inversiones, Patrimonio

---

## ⚙️ Ajustes

### Apariencia
- **Modo Oscuro:** Toggle que persiste entre sesiones

### Colores de Números
- 4 paletas independientes: Ingresos, Gastos, Deudas, Inversiones
- Click en color → animación pulse → click "Guardar Colores"

### Monedas
- 12 predefinidas (USD, EUR, MXN, COP, ARS, CLP, PEN, BRL, GBP, JPY, CNY, CHF)
- Agregar moneda: código 3 letras, símbolo, nombre

### Categorías

#### Categorías Built-in (21)
- 8 de ingreso: Salario, Freelance, Dividendos, Intereses, Venta, Regalo, Reembolso, Otro
- 13 de gasto: Alimentación, Transporte, Vivienda, Servicios, Salud, Educación, Entretenimiento, Shopping, Suscripciones, Impuestos, Seguros, Donaciones, Otro
- **NO se pueden eliminar**
- **SÍ se pueden renombrar y cambiar color**

#### Categorías Custom
- **Agregar:** "Nueva Categoría" → nombre + color → Guardar
- **Editar:** Click ✏️ → cambiar nombre/color → Guardar
- **Eliminar:** Click 🗑️ → confirmar (solo custom, no built-in)

### Datos
- **Exportar Backup:** Descarga JSON con todos los datos
- **Importar:** Restaura desde backup JSON o convierte .mmbackup (Money Manager)
- **Migrar desde FinanceFlowDB:** Si usaste la versión anterior, migra los datos automáticamente

---

## 🛠️ Troubleshooting

### Error: "setupFormListeners: Maximum call stack size exceeded"
**Causa:** Archivo JS cacheado en el navegador.

**Solución:**
1. F12 → Application → Service Workers → **Unregister**
2. F12 → Application → Storage → **Clear site data**
3. Cerrar navegador completamente
4. Reabrir → `Ctrl + Shift + R`

### Error: "DB is not defined"
**Causa:** Error de sintaxis en db.js o store.js que impide que se carguen.

**Solución:**
1. Verificar que el servidor esté corriendo (el archivo debe servirse, no abrirse con file://)
2. Abrir `http://localhost:9000` (con el puerto correcto)
3. Si persiste, revisar consola para errores de sintaxis específicos

### Categorías no aparecen
**Solución:**
1. Ir a Ajustes → Debug → **"Test DB Read"**
2. Verificar que `--- STORE STATE ---` muestre categorías
3. Si `store.state.categories` = 0 pero `Custom categories` > 0: problema de merge → recargar página
4. Si `customCategories` está vacío: las categorías no se guardaron → checkear consola

### No se pueden renombrar categorías built-in
**Solución:**
1. Asegurarse de que `updateBuiltInCategory` existe en db.js
2. Verificar que `saveEditCategory` detecta `!category.isCustom` y llama a `DB.updateBuiltInCategory()`
3. Recargar con cache limpia

### Modal se cierra solo (click fuera / ESC)
**Verificar:**
- `modal.js` debe tener `closeOnOverlay: false` como default
- `app.js` no debe tener `if (e.key === 'Escape') modal.close()`
- Si persiste, es una versión cacheada del archivo

### Datos incorrectos al cambiar de año/mes
**Causa:** Los gráficos no se destruyen antes de recrear.

**Solución:** Ya implementado — variables de instancia de Chart se destruyen con `.destroy()` antes de cada `new Chart()`. Si persiste, verificar que la página esté usando la versión actualizada del JS.

### Gráficos vacíos o sin datos
**Verificar:**
1. Abrir consola (F12)
2. ¿Hay error `Cannot read property 'getContext' of null`? → El canvas no existe en el DOM — verificar IDs
3. ¿El período seleccionado tiene datos? Una categoría sin transacciones no genera gráfico

### Errores de "Maximum call stack size exceeded"
**Causa más común:** Función que se llama a sí misma recursivamente.

**Ubicación más común:** `dashboard.js` — buscar `setupFormListeners` vs `setupNomenclatureListeners`

### IndexedDB no funciona
**Verificar:**
1. ¿Estás en file://? → DEBES usar http://localhost
2. ¿Navegador en modo incógnito? → Algunos bloquean IndexedDB en incógnito
3. F12 → Application → IndexedDB → ¿Existe `KuberaVaultDB`?

### Migrar datos desde FinanceFlow
1. Ir a Ajustes → sección Datos
2. Click **"🔄 Migrar Datos"**
3. Confirmar
4. Los datos de FinanceFlowDB se copian a KuberaVaultDB
5. Si no encuentra FinanceFlowDB, primero exporta un backup desde la versión antigua e impórtalo manualmente

### Exportar para usar en otro dispositivo
1. Ajustes → **Exportar Backup** → descarga `kubera-vault-backup-[fecha].json`
2. En el otro dispositivo: Ajustes → Importar → seleccionar el archivo
3. ⚠️ Los datos existentes serán reemplazados

---

## 🧹 Mantenimiento

### Limpiar todos los datos
```javascript
// En consola (F12):
indexedDB.deleteDatabase('KuberaVaultDB');
```
Luego recargar la página.

### Ver espacio usado
Ajustes → sección Datos → "Almacenamiento Usado"

### Actualizar la app
1. Reemplazar archivos en la carpeta `financeflow`
2. Si el Service Worker está activo: F12 → Application → Service Workers → Unregister
3. Recargar con `Ctrl + Shift + R`

---

## 📁 Estructura de Archivos

```
financeflow/
├── index.html              ← Shell de la aplicación
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker
├── css/
│   ├── variables.css       ← Design tokens (colores, fuentes, espaciado)
│   ├── base.css            ← Layout, sidebar, header, responsive
│   ├── components.css      ← Botones, inputs, cards, modales, toasts
│   └── pages.css           ← Estilos específicos por página
├── js/
│   ├── db.js               ← IndexedDB (9 stores, CRUD, defaults)
│   ├── store.js            ← Estado central + cálculos
│   ├── router.js           ← Navegación SPA
│   ├── app.js              ← Inicialización + utilidades
│   ├── components/
│   │   ├── modal.js        ← Sistema de modales
│   │   ├── toast.js        ← Notificaciones
│   │   └── forms.js        ← Formularios HTML
│   ├── pages/
│   │   ├── dashboard.js    ← Página principal
│   │   ├── entries.js      ← Ingresos
│   │   ├── expenses.js     ← Gastos
│   │   ├── accounts.js     ← Cuentas
│   │   ├── debts.js        ← Deudas
│   │   ├── cards.js        ← Tarjetas
│   │   ├── investments.js  ← Inversiones
│   │   ├── reports.js      ← Reportes
│   │   └── settings.js     ← Ajustes
│   └── importers/
│       └── mmbackup.js     ← Conversor Money Manager
├── vendor/
│   ├── jszip.min.js        ← ZIP decompression
│   ├── sql-wasm.js         ← SQLite parser
│   └── sql-wasm.wasm       ← WebAssembly binary
├── tools/
│   ├── convert_mmbackup.py ← Python offline converter
│   └── financeflow-import.json ← Sample data
└── assets/
    └── icons/              ← PWA icons (192x192, 512x512)
```

---

## 🔑 Atajos y Tips

| Acción | Cómo |
|--------|------|
| Cerrar cualquier modal | Click en ❌ o botón Cancelar |
| Cambiar período | Flechas `<` `>` en header |
| Ir a hoy | Cambiar vista (semana→mes→año) |
| Ver datos sin filtro | Seleccionar vista "Año" |
| Debug DB | Ajustes → Debug section |
| Exportar todo | Ajustes → Exportar Backup |
| Forzar recarga sin cache | `Ctrl + Shift + R` |
| Ver datos crudos | F12 → Application → IndexedDB → KuberaVaultDB |
