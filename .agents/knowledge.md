# FinanceFlow — Knowledge Base

## Money Manager → FinanceFlow Import

### Archivo .mmbackup
Estructura: 8 bytes cabecera (`08 08 08 08 08 08 08 08`) + ZIP con `MyFinance.db` (SQLite) + `backup_meta`.

### Tablas SQLite relevantes
| Tabla | Campos clave |
|-------|-------------|
| `transaction` | uid, type (Income/Expense), amountInDefaultCurrency, date, comment |
| `account` | uid, title, currencyCode, color |
| `category` | uid, title, type, color |
| `tag` | uid, name |
| `sync_link` | entityType, entityUid, otherType, otherUid |
| `account_balance` | uid, value |
| `syncable_settings` | uid (defaultCurrencyCode), value |

### Reglas de conversion
1. Montos: dividir por 100 (Money Manager usa enteros x100)
2. Categorias: Income → income, Expense → expense
3. IDs de cuenta: usar numeros enteros (1, 2, ...) no strings
4. Relaciones via `sync_link`: entityType=Transaction, otherType=Account/Category/Tag
5. Colores: entero ARGB → extraer RGB con `(color >> 16) & 0xFF`, etc.

### Mapeo de categorias por defecto
| Money Manager | FinanceFlow |
|--------------|-------------|
| DefaultHome | Hogar |
| DefaultCafe | Cafe |
| DefaultFamily | Familia |
| DefaultEducation | Educacion |
| DefaultSport | Deporte |
| DefaultTransport | Transporte |
| DefaultLeisure | Ocio |
| DefaultProducts | Productos |
| DefaultPresents | Regalos |
| DefaultHealth | Salud |
| DefaultPercents | Intereses |
| DefaultPresent | Regalo |
| DefaultSalary | Salario |
| other_expense | Otro Gasto |
| other_income | Otro Ingreso |

### Requisitos para importacion en navegador
- La app DEBE servirse via HTTP (no `file://`). Usar `python -m http.server 8080`.
- Librerias en `vendor/`: jszip.min.js, sql-wasm.js, sql-wasm.wasm (~760 KB total).
- Service Worker en `sw.js` cachea los archivos vendor.

### Archivos del proyecto
- `tools/convert_mmbackup.py` — Script Python offline para convertir .mmbackup → JSON
- `js/importers/mmbackup.js` — Conversor en navegador usando sql.js + JSZip
- `js/pages/settings.js:460` — Funcion importData() maneja .mmbackup y .json
- `js/db.js:414` — clearAllData() incluye 'settings' store
- `vendor/` — sql.js y JSZip locales (offline)
