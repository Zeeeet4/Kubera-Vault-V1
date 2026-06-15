function openAddCurrencyModal() {
    modal.open({
        title: 'Agregar Moneda',
        content: `
            <div class="input-group">
                <label class="input-label">Código (3 letras)</label>
                <input type="text" class="input" id="currencyCode" maxlength="3" placeholder="Ej: GBP" style="text-transform: uppercase;">
            </div>
            <div class="input-group">
                <label class="input-label">Símbolo</label>
                <input type="text" class="input" id="currencySymbol" maxlength="3" placeholder="Ej: £">
            </div>
            <div class="input-group">
                <label class="input-label">Nombre</label>
                <input type="text" class="input" id="currencyName" placeholder="Ej: Libra Esterlina">
            </div>
        `,
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveCustomCurrency()">Guardar</button>
        `
    });
}

function openAddCategoryModal(type) {
    modal.open({
        title: 'Nueva Categoría',
        content: `
            <div class="input-group">
                <label class="input-label">Nombre</label>
                <input type="text" class="input" id="categoryName" placeholder="Ej: Suscripciones">
            </div>
            <div class="input-group">
                <label class="input-label">Color</label>
                <div class="color-picker" id="categoryColorPicker" style="margin-top: 8px;">
                    <div class="color-option selected" data-color="#2563EB" style="background-color: #2563EB"></div>
                    <div class="color-option" data-color="#059669" style="background-color: #059669"></div>
                    <div class="color-option" data-color="#DC2626" style="background-color: #DC2626"></div>
                    <div class="color-option" data-color="#D97706" style="background-color: #D97706"></div>
                    <div class="color-option" data-color="#7C3AED" style="background-color: #7C3AED"></div>
                    <div class="color-option" data-color="#EC4899" style="background-color: #EC4899"></div>
                    <div class="color-option" data-color="#06B6D4" style="background-color: #06B6D4"></div>
                    <div class="color-option" data-color="#84CC16" style="background-color: #84CC16"></div>
                </div>
                <input type="hidden" id="categoryColor" value="#2563EB">
            </div>
        `,
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveNewCategory('${type}')">Guardar</button>
        `
    });

    setupCategoryColorPicker('categoryColorPicker', 'categoryColor');
    setupFormListeners();
}

async function saveNewCategory(type) {
    const nameEl = document.getElementById('categoryName');
    const colorEl = document.getElementById('categoryColor');
    const name = nameEl?.value;
    const color = colorEl?.value;

    if (!name) {
        toast.error('Ingresa un nombre');
        return;
    }

    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const catData = { id, name, color, type, isCustom: true };
    const success = await DB.addCustomCategory(catData);

    if (success) {
        modal.close();
        await store.refreshCategories();
        toast.success('Categoría agregada');
        renderSettings();
    } else {
        toast.error('Error al guardar');
    }
}

function openEditCategoryModal(id, type) {
    const category = store.state.categories.find(c => c.id === id);
    if (!category) return;

    modal.open({
        title: 'Editar Categoría',
        content: `
            <div class="input-group">
                <label class="input-label">Nombre</label>
                <input type="text" class="input" id="editCategoryName" value="${category.name}">
            </div>
            <div class="input-group">
                <label class="input-label">Color</label>
                <div class="color-picker" id="editCategoryColorPicker" style="margin-top: 8px;">
                    ${['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED', '#EC4899', '#06B6D4', '#84CC16'].map(c => `
                        <div class="color-option ${category.color === c ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>
                    `).join('')}
                </div>
                <input type="hidden" id="editCategoryColor" value="${category.color}">
            </div>
        `,
        footer: `
            <button class="btn btn-ghost" onclick="modal.close()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveEditCategory('${id}')">Guardar</button>
        `
    });

    setupCategoryColorPicker('editCategoryColorPicker', 'editCategoryColor');
    setupFormListeners();
}

async function saveEditCategory(id) {
    const name = document.getElementById('editCategoryName').value;
    const color = document.getElementById('editCategoryColor').value;

    if (!name) {
        toast.error('Ingresa un nombre');
        return;
    }

    const category = store.state.categories.find(c => c.id === id);

    try {
        if (category && category.isCustom) {
            await DB.updateCustomCategory(id, { name, color });
        } else if (category) {
            await DB.updateBuiltInCategory(id, { name, color, type: category.type, icon: category.icon });
        } else {
            toast.error('Categoría no encontrada en el store');
            return;
        }

        modal.close();
        await store.refreshCategories();
        toast.success('Categoría actualizada');
        renderSettings();
    } catch (err) {
        toast.error('Error: ' + err.message);
    }
}

async function updateCategoryColor(id, color) {
    try {
        const category = store.state.categories.find(c => c.id === id);
        if (category && category.isCustom) {
            await DB.updateCustomCategory(id, { color });
        } else if (category) {
            await DB.updateBuiltInCategory(id, { color });
        }
        await store.refreshCategories();
        toast.success('Color actualizado');
    } catch (err) {
        toast.error('Error al actualizar color');
    }
}

async function deleteCategory(id) {
    const category = store.state.categories.find(c => c.id === id);
    if (!category) {
        toast.error('Categoría no encontrada');
        return;
    }
    if (!category.isCustom) {
        toast.error('No se pueden eliminar categorías predeterminadas');
        return;
    }
    window.confirmDialog('¿Eliminar esta categoría?', async () => {
        await DB.deleteCustomCategory(id);
        await store.refreshCategories();
        toast.success('Categoría eliminada');
        renderSettings();
        window.modal.close();
    });
}

window.openAddCurrencyModal = openAddCurrencyModal;
window.openAddCategoryModal = openAddCategoryModal;
window.saveNewCategory = saveNewCategory;
window.openEditCategoryModal = openEditCategoryModal;
window.saveEditCategory = saveEditCategory;
window.updateCategoryColor = updateCategoryColor;
window.deleteCategory = deleteCategory;
