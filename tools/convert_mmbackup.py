#!/usr/bin/env python3
"""
Convierte un archivo .mmbackup (Money Manager) al formato JSON de FinanceFlow.

Uso:
    python convert_mmbackup.py <archivo.mmbackup> [salida.json]

Si no se especifica salida, genera: financeflow-import-YYYY-MM-DD.json
"""

import json
import sqlite3
import sys
import zipfile
import os
import tempfile
import shutil
from datetime import datetime

# ── Mapeo de categorías por defecto de Money Manager ────────────────────────
DEFAULT_CATEGORY_NAMES = {
    "DefaultHome": ("Hogar", "home"),
    "DefaultCafe": ("Cafe", "coffee"),
    "DefaultFamily": ("Familia", "users"),
    "DefaultEducation": ("Educación", "book"),
    "DefaultSport": ("Deporte", "activity"),
    "DefaultTransport": ("Transporte", "car"),
    "DefaultLeisure": ("Ocio", "film"),
    "DefaultProducts": ("Productos", "shopping-cart"),
    "DefaultPresents": ("Regalos", "gift"),
    "DefaultHealth": ("Salud", "heart"),
    "DefaultPercents": ("Intereses", "percent"),
    "DefaultPresent": ("Regalo", "gift"),
    "DefaultSalary": ("Salario", "briefcase"),
    "other_expense": ("Otro Gasto", "plus"),
    "other_income": ("Otro Ingreso", "plus"),
}

# ── Iconos por defecto de FinanceFlow ───────────────────────────────────────
DEFAULT_ICONS = {
    "income": {
        "briefcase": "briefcase", "laptop": "laptop", "trending-up": "trending-up",
        "percent": "percent", "shopping-bag": "shopping-bag", "gift": "gift",
        "rotate-ccw": "rotate-ccw", "plus": "plus", "users": "users",
        "coffee": "coffee", "book": "book", "activity": "activity",
        "car": "car", "film": "film", "shopping-cart": "shopping-cart",
        "heart": "heart", "home": "home",
    },
    "expense": {
        "utensils": "utensils", "car": "car", "home": "home", "zap": "zap",
        "heart": "heart", "book": "book", "film": "film", "shopping-cart": "shopping-cart",
        "repeat": "repeat", "file-text": "file-text", "shield": "shield",
        "plus": "plus", "briefcase": "briefcase", "users": "users",
        "coffee": "coffee", "activity": "activity", "gift": "gift",
        "percent": "percent",
    },
}


def int_color_to_hex(color_int):
    """Convierte un color entero de Money Manager a hex (#RRGGBB)."""
    if color_int is None:
        return "#6B7280"
    r = (color_int >> 16) & 0xFF
    g = (color_int >> 8) & 0xFF
    b = color_int & 0xFF
    return f"#{r:02X}{g:02X}{b:02X}"


def extract_mmbackup(mmbackup_path):
    """Extrae MyFinance.db del archivo .mmbackup."""
    with open(mmbackup_path, "rb") as f:
        header = f.read(8)
        if header != b"\x08\x08\x08\x08\x08\x08\x08\x08":
            raise ValueError("Formato .mmbackup no reconocido (cabecera inválida)")
        zip_data = f.read()

    tmpdir = tempfile.mkdtemp()
    zip_path = os.path.join(tmpdir, "data.zip")
    with open(zip_path, "wb") as f:
        f.write(zip_data)

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extract("MyFinance.db", tmpdir)

    db_path = os.path.join(tmpdir, "MyFinance.db")
    return db_path, tmpdir


def build_icon_map():
    """Construye mapa de icono por tipo y nombre de categoría."""
    return {}

def convert(mmbackup_path, output_path=None):
    """Convierte el archivo .mmbackup a JSON de FinanceFlow."""

    db_path, tmpdir = extract_mmbackup(mmbackup_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # ── Leer datos de Money Manager ─────────────────────────────────────

        # Transacciones
        cursor.execute(
            "SELECT uid, type, amountInDefaultCurrency, amountInRealCurrency, "
            "realCurrencyCode, amountInAccountCurrency, accountCurrencyCode, "
            "date, comment, created, modified "
            "FROM [transaction] WHERE isRemoved = 0"
        )
        transactions = [dict(r) for r in cursor.fetchall()]

        # Cuentas
        cursor.execute(
            "SELECT uid, title, icon, color, currencyCode, comment "
            "FROM account WHERE isRemoved = 0"
        )
        accounts = [dict(r) for r in cursor.fetchall()]

        # Balances
        balances = {}
        cursor.execute("SELECT uid, value FROM account_balance")
        for r in cursor.fetchall():
            balances[r["uid"]] = r["value"]

        # Categorías
        cursor.execute(
            "SELECT uid, title, type, color, icon FROM category WHERE isRemoved = 0"
        )
        categories = [dict(r) for r in cursor.fetchall()]

        # Tags
        cursor.execute("SELECT uid, name FROM tag WHERE isRemoved = 0")
        tags = {r["uid"]: r["name"] for r in cursor.fetchall()}

        # sync_link (relaciones)
        cursor.execute(
            "SELECT entityType, entityUid, otherType, otherUid "
            "FROM sync_link WHERE isRemoved = 0"
        )
        links = [dict(r) for r in cursor.fetchall()]

        # Configuración
        cursor.execute("SELECT uid, value, type FROM syncable_settings WHERE isRemoved = 0")
        settings_rows = [dict(r) for r in cursor.fetchall()]

        # ── Construir índices de relaciones ──────────────────────────────────

        # tx_uid -> {account_uid, category_uid, [tag_uids]}
        tx_relations = {}
        for link in links:
            if link["entityType"] == "Transaction":
                tx_uid = link["entityUid"]
                if tx_uid not in tx_relations:
                    tx_relations[tx_uid] = {
                        "account_uid": None,
                        "category_uid": None,
                        "tag_uids": [],
                    }
                if link["otherType"] == "Account":
                    tx_relations[tx_uid]["account_uid"] = link["otherUid"]
                elif link["otherType"] == "Category":
                    tx_relations[tx_uid]["category_uid"] = link["otherUid"]
                elif link["otherType"] == "Tag":
                    tx_relations[tx_uid]["tag_uids"].append(link["otherUid"])

        # ── Mapear categorías ────────────────────────────────────────────────

        fin_categories = []
        cat_uid_to_ff_id = {}
        custom_counter = 0

        for cat in categories:
            uid = cat["uid"]
            mm_title = cat["title"]
            mm_type = cat["type"]  # Income / Expense

            ff_type = "income" if mm_type == "Income" else "expense"

            # Determinar nombre y icono
            if uid in DEFAULT_CATEGORY_NAMES:
                name, icon_hint = DEFAULT_CATEGORY_NAMES[uid]
            elif mm_title:
                name = mm_title
                icon_hint = "plus"
            else:
                name = uid
                icon_hint = "plus"

            # Usar icono del hint si es válido para el tipo
            icon = icon_hint if icon_hint in DEFAULT_ICONS.get(ff_type, {}) else "plus"

            # Generar ID de FinanceFlow
            ff_id = uid if uid.startswith("Default") or uid in ("other_expense", "other_income") else f"mm-import-{uid[:8]}"

            cat_uid_to_ff_id[uid] = ff_id

            fin_categories.append({
                "id": ff_id,
                "name": name,
                "color": int_color_to_hex(cat["color"]),
                "icon": icon,
                "type": ff_type,
            })

        # ── Mapear cuentas ───────────────────────────────────────────────────

        fin_accounts = []
        account_uid_to_ff_id = {}
        for i, acc in enumerate(accounts):
            ff_id = i + 1  # IDs numericos para compatibilidad con FinanceFlow
            account_uid_to_ff_id[acc["uid"]] = ff_id

            base_balance = balances.get(acc["uid"], 0)
            base_balance_decimal = round(base_balance / 100, 2)

            fin_accounts.append({
                "id": ff_id,
                "name": acc["title"] or "Cuenta Principal",
                "type": "checking",
                "balance": base_balance_decimal,
                "baseBalance": base_balance_decimal,
                "currency": acc["currencyCode"] or "USD",
                "color": int_color_to_hex(acc["color"]),
                "comment": acc["comment"] or "",
            })

        # ── Convertir transacciones ──────────────────────────────────────────

        fin_entries = []
        fin_expenses = []

        for tx in transactions:
            tx_uid = tx["uid"]
            rel = tx_relations.get(tx_uid, {})
            cat_uid = rel.get("category_uid") or "other_expense" if tx["type"] == "Expense" else "other_income"
            acc_uid = rel.get("account_uid") or "main"

            ff_category_id = cat_uid_to_ff_id.get(cat_uid, cat_uid)
            ff_account_id = account_uid_to_ff_id.get(acc_uid, acc_uid)

            # Convertir monto: Money Manager usa enteros (x100), FinanceFlow usa decimales
            amount = round((tx["amountInAccountCurrency"] or tx["amountInDefaultCurrency"] or 0) / 100, 2)

            # Tags como parte del comentario
            tag_names = []
            for tag_uid in rel.get("tag_uids", []):
                tag_name = tags.get(tag_uid)
                if tag_name:
                    tag_names.append(tag_name)

            comment_parts = []
            if tx.get("comment"):
                comment_parts.append(tx["comment"])
            if tag_names:
                comment_parts.append(f"[Tags: {', '.join(tag_names)}]")
            comment = " | ".join(comment_parts) if comment_parts else ""

            item = {
                "amount": amount,
                "date": tx["date"],
                "category": ff_category_id,
                "accountId": ff_account_id,
                "description": comment,
                "comment": comment,
                "currency": tx.get("accountCurrencyCode") or tx.get("realCurrencyCode") or "USD",
            }

            if tx["type"] == "Income":
                fin_entries.append(item)
            else:
                fin_expenses.append(item)

        # ── Settings ──────────────────────────────────────────────────────────

        fin_settings = []
        defaults = {
            "currency": "USD",
            "theme": "dark",
            "pinEnabled": False,
            "autoLockMinutes": 15,
            "customCurrencies": "[]",
            "customCategories": "[]",
        }

        for row in settings_rows:
            key = row["uid"]
            value = row["value"]
            if key == "defaultCurrencyCode":
                defaults["currency"] = value
            elif key == "v":
                continue
            fin_settings.append({"key": key, "value": value})

        # Asegurar configuraciones mínimas
        for key, value in defaults.items():
            if not any(s["key"] == key for s in fin_settings):
                fin_settings.append({"key": key, "value": value})

        # ── Armar JSON final ─────────────────────────────────────────────────

        result = {
            "version": "1.0.0",
            "exportDate": datetime.now().isoformat(),
            "source": "Money Manager (.mmbackup)",
            "settings": fin_settings,
            "accounts": fin_accounts,
            "entries": fin_entries,
            "expenses": fin_expenses,
            "debts": [],
            "creditCards": [],
            "investments": [],
            "categories": fin_categories,
            "reminders": [],
        }

        # ── Guardar ───────────────────────────────────────────────────────────

        if not output_path:
            output_path = f"financeflow-import-{datetime.now().strftime('%Y-%m-%d')}.json"

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        # ── Resumen ──────────────────────────────────────────────────────────

        income_count = len(fin_entries)
        expense_count = len(fin_expenses)
        income_total = sum(e["amount"] for e in fin_entries)
        expense_total = sum(e["amount"] for e in fin_expenses)

        print(f"\n{'='*60}")
        print(f"  CONVERSION COMPLETADA")
        print(f"{'='*60}")
        print(f"  Archivo:     {output_path}")
        print(f"  Ingresos:    {income_count}  (total: ${income_total:,.2f})")
        print(f"  Gastos:      {expense_count}  (total: ${expense_total:,.2f})")
        print(f"  Cuentas:     {len(fin_accounts)}")
        print(f"  Categorias:  {len(fin_categories)}")
        print(f"{'='*60}\n")
        print(f"  Ahora importa el archivo JSON desde FinanceFlow:")
        print(f"  Ajustes > Importar Datos > Seleccionar {output_path}")
        print()

    finally:
        conn.close()
        shutil.rmtree(tmpdir, ignore_errors=True)


def main():
    if len(sys.argv) < 2:
        print("Uso: python convert_mmbackup.py <archivo.mmbackup> [salida.json]")
        print("Ejemplo: python convert_mmbackup.py backup.mmbackup")
        sys.exit(1)

    mmbackup_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(mmbackup_path):
        print(f"Error: archivo no encontrado: {mmbackup_path}")
        sys.exit(1)

    convert(mmbackup_path, output_path)


if __name__ == "__main__":
    main()
