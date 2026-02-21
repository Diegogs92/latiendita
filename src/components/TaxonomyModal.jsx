import { useEffect, useMemo, useState } from 'react';

function TaxonomyModal({
  open,
  onClose,
  categories = [],
  subcategories = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory
}) {
  const [categoryName, setCategoryName] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [subCategoryParent, setSubCategoryParent] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingSubcategoryId, setEditingSubcategoryId] = useState('');
  const [subcategoryViewCategory, setSubcategoryViewCategory] = useState('all');
  const [categorySaving, setCategorySaving] = useState(false);
  const [subCategorySaving, setSubCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );
  const sortedSubcategories = useMemo(
    () => [...subcategories].sort((a, b) => a.name.localeCompare(b.name)),
    [subcategories]
  );
  const visibleSubcategories = useMemo(
    () =>
      sortedSubcategories.filter(
        (item) => subcategoryViewCategory === 'all' || item.categoryId === subcategoryViewCategory
      ),
    [sortedSubcategories, subcategoryViewCategory]
  );

  useEffect(() => {
    if (!subCategoryParent && sortedCategories.length > 0) {
      setSubCategoryParent(sortedCategories[0].id);
    }
  }, [sortedCategories, subCategoryParent]);

  useEffect(() => {
    if (!open) {
      setCategoryError('');
    }
  }, [open]);

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      setCategoryError('Escribe una categoría.');
      return;
    }

    setCategorySaving(true);
    setCategoryError('');
    try {
      if (editingCategoryId) {
        await onUpdateCategory?.({ id: editingCategoryId, name });
      } else {
        await onCreateCategory?.(name);
      }
      setCategoryName('');
      setEditingCategoryId('');
    } catch (error) {
      setCategoryError(error?.message || 'No se pudo guardar la categoría.');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCreateSubcategory = async (event) => {
    event.preventDefault();
    const name = subCategoryName.trim();
    if (!subCategoryParent) {
      setCategoryError('Selecciona una categoría para la subcategoría.');
      return;
    }
    if (!name) {
      setCategoryError('Escribe una subcategoría.');
      return;
    }

    setSubCategorySaving(true);
    setCategoryError('');
    try {
      if (editingSubcategoryId) {
        await onUpdateSubcategory?.({
          id: editingSubcategoryId,
          categoryId: subCategoryParent,
          name
        });
      } else {
        await onCreateSubcategory?.({ categoryId: subCategoryParent, name });
      }
      setSubCategoryName('');
      setEditingSubcategoryId('');
    } catch (error) {
      setCategoryError(error?.message || 'No se pudo guardar la subcategoría.');
    } finally {
      setSubCategorySaving(false);
    }
  };

  const handleStartEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryError('');
  };

  const handleStartEditSubcategory = (subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setSubCategoryName(subcategory.name);
    setSubCategoryParent(subcategory.categoryId || '');
    setCategoryError('');
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop taxonomy-modal-backdrop" onClick={onClose}>
      <section className="taxonomy-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="section-head">
          <h2>Configuración de categorías</h2>
          <button type="button" className="button secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <section className="taxonomy-grid" id="taxonomy-manager">
          <article className="taxonomy-card">
            <div className="taxonomy-card-head">
              <h3>Categorías</h3>
              <span>{sortedCategories.length}</span>
            </div>

            <form className="inline-form taxonomy-form" onSubmit={handleCreateCategory}>
              <input
                type="text"
                placeholder="Nombre de categoría"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                maxLength={60}
              />
              <div className="taxonomy-form-actions">
                <button type="submit" className="button" disabled={categorySaving}>
                  {categorySaving ? 'Guardando...' : editingCategoryId ? 'Guardar cambios' : 'Crear categoría'}
                </button>
                {editingCategoryId && (
                  <button type="button" className="button secondary" onClick={() => {
                    setEditingCategoryId('');
                    setCategoryName('');
                    setCategoryError('');
                  }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="taxonomy-list">
              {sortedCategories.length === 0 ? (
                <p className="status-text">No hay categorías creadas.</p>
              ) : (
                sortedCategories.map((category) => (
                  <article key={category.id} className="taxonomy-item">
                    <div className="taxonomy-item-main">
                      <p>{category.name}</p>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleStartEditCategory(category)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button danger"
                        onClick={() => onDeleteCategory?.(category.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>

          <article className="taxonomy-card">
            <div className="taxonomy-card-head">
              <h3>Subcategorías</h3>
              <span>{visibleSubcategories.length}</span>
            </div>

            <form className="inline-form taxonomy-form" onSubmit={handleCreateSubcategory}>
              <div className="taxonomy-form-row">
                <select value={subCategoryParent} onChange={(e) => setSubCategoryParent(e.target.value)}>
                  {sortedCategories.length === 0 && <option value="">Sin categorías</option>}
                  {sortedCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Nombre de subcategoría"
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="taxonomy-form-actions">
                <button type="submit" className="button" disabled={subCategorySaving || sortedCategories.length === 0}>
                  {subCategorySaving ? 'Guardando...' : editingSubcategoryId ? 'Guardar cambios' : 'Crear subcategoría'}
                </button>
                {editingSubcategoryId && (
                  <button type="button" className="button secondary" onClick={() => {
                    setEditingSubcategoryId('');
                    setSubCategoryName('');
                    setSubCategoryParent(sortedCategories[0]?.id || '');
                    setCategoryError('');
                  }}>
                    Cancelar
                  </button>
                )}
              </div>
              {categoryError && <p className="status-text error-text">{categoryError}</p>}
            </form>

            <div className="taxonomy-filter">
              <select value={subcategoryViewCategory} onChange={(e) => setSubcategoryViewCategory(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {sortedCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="taxonomy-list">
              {visibleSubcategories.length === 0 ? (
                <p className="status-text">No hay subcategorías para este filtro.</p>
              ) : (
                visibleSubcategories.map((subcategory) => (
                  <article key={subcategory.id} className="taxonomy-item">
                    <div className="taxonomy-item-main">
                      <p>{subcategory.name}</p>
                      <small>{sortedCategories.find((item) => item.id === subcategory.categoryId)?.name || 'Sin categoría'}</small>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => handleStartEditSubcategory(subcategory)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button danger"
                        onClick={() => onDeleteSubcategory?.(subcategory.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </div>
  );
}

export default TaxonomyModal;
