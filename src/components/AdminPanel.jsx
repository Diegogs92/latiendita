import { useEffect, useState } from 'react';
import { isIsoDate } from '../utils/usageTime';

const CUOTAS_OPTIONS = [3, 6, 12, 18, 24];
const DOLAR_TYPE_OPTIONS = [
  { id: 'oficial', label: 'Oficial' },
  { id: 'blue', label: 'Blue' },
  { id: 'bolsa', label: 'MEP (Bolsa)' }
];

const initialForm = {
  productId: '',
  title: '',
  description: '',
  tiempoUso: '',
  categoryId: '',
  subcategoryId: '',
  precioArs: '',
  precioUsd: '',
  cuotasArs: 1,
  interesArs: 0,
  cuotasUsd: 1,
  interesUsd: 0,
  estado: 'Disponible',
  files: [],
  existingImages: []
};

function formatNumberInput(value) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-AR');
}

function parseFormattedNumber(formatted) {
  return Number(formatted.replace(/\D/g, '')) || 0;
}

function formatMoneyNumber(value) {
  const normalized = Number(value) || 0;
  if (!normalized) return '0';
  return Math.round(normalized).toLocaleString('es-AR');
}

function CuotasBlock({ label, symbol, basePrice, cuotas, interes, onChangeCuotas, onChangeInteres }) {
  const enabled = cuotas > 1;
  const totalConInteres = basePrice * (1 + (interes || 0) / 100);
  const cuotaPrice = Math.round(totalConInteres / cuotas);

  return (
    <div className="cuotas-block">
      <label className="cuotas-checkbox">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            if (e.target.checked) {
              onChangeCuotas(3);
            } else {
              onChangeCuotas(1);
              onChangeInteres(0);
            }
          }}
        />
        Precio en cuotas ({label})
      </label>
      {enabled && (
        <div className="cuotas-details">
          <select
            className="cuotas-select"
            value={cuotas}
            onChange={(e) => onChangeCuotas(Number(e.target.value))}
          >
            {CUOTAS_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} cuotas</option>
            ))}
          </select>
          <div className="input-with-suffix">
            <input
              type="number"
              min="0"
              max="200"
              step="0.5"
              placeholder="0"
              value={interes || ''}
              onChange={(e) => onChangeInteres(Number(e.target.value) || 0)}
            />
            <span className="input-suffix">% interés</span>
          </div>
          {basePrice > 0 && (
            <p className="cuota-preview">
              {cuotas}x {symbol} {cuotaPrice.toLocaleString('es-AR')}
              {interes > 0
                ? ` (total: ${symbol} ${Math.round(totalConInteres).toLocaleString('es-AR')})`
                : ' sin interés'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPanel({
  editingProduct,
  onSave,
  onCancelEdit,
  banners = [],
  onCreateBanner,
  onToggleBanner,
  onDeleteBanner,
  categories = [],
  subcategories = []
}) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const todayIso = new Date().toISOString().slice(0, 10);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerTone, setBannerTone] = useState('info');
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [dolarType, setDolarType] = useState('blue');
  const [dolarData, setDolarData] = useState(null);
  const [dolarLoading, setDolarLoading] = useState(false);
  const [dolarError, setDolarError] = useState('');

  useEffect(() => {
    if (!editingProduct) {
      setForm(initialForm);
      return;
    }

    setForm({
      productId: editingProduct.id,
      title: editingProduct.title,
      description: editingProduct.description,
      tiempoUso: isIsoDate(editingProduct.tiempoUso) ? editingProduct.tiempoUso : '',
      categoryId: editingProduct.categoryId || '',
      subcategoryId: editingProduct.subcategoryId || '',
      precioArs: editingProduct.precioArs ? Number(editingProduct.precioArs).toLocaleString('es-AR') : '',
      precioUsd: editingProduct.precioUsd ? Number(editingProduct.precioUsd).toLocaleString('es-AR') : '',
      cuotasArs: editingProduct.cuotasArs || 1,
      interesArs: editingProduct.interesArs || 0,
      cuotasUsd: editingProduct.cuotasUsd || 1,
      interesUsd: editingProduct.interesUsd || 0,
      estado: editingProduct.estado,
      files: [],
      existingImages: editingProduct.imagenes || []
    });
  }, [editingProduct]);

  useEffect(() => {
    if (!form.categoryId || !form.subcategoryId) return;
    const selectedSubcategory = subcategories.find((item) => item.id === form.subcategoryId);
    if (!selectedSubcategory || selectedSubcategory.categoryId !== form.categoryId) {
      setForm((prev) => ({ ...prev, subcategoryId: '' }));
    }
  }, [form.categoryId, form.subcategoryId, subcategories]);

  const loadDolarQuote = async (selectedType = dolarType) => {
    setDolarLoading(true);
    setDolarError('');
    try {
      const response = await fetch(`https://dolarapi.com/v1/dolares/${selectedType}`);
      if (!response.ok) {
        throw new Error('No se pudo obtener la cotización actual.');
      }
      const data = await response.json();
      setDolarData(data);
    } catch (error) {
      setDolarData(null);
      setDolarError(error?.message || 'No se pudo obtener la cotización actual.');
    } finally {
      setDolarLoading(false);
    }
  };

  useEffect(() => {
    loadDolarQuote(dolarType);
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    onCancelEdit();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const precioArs = parseFormattedNumber(form.precioArs);
    const precioUsd = parseFormattedNumber(form.precioUsd);

    if (!precioArs && !precioUsd) {
      setSaveError('Carga al menos un precio: ARS o USD.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({
        ...form,
        precioArs,
        precioUsd,
        files: Array.from(form.files)
      });
      resetForm();
    } catch (error) {
      setSaveError(error?.message || 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const basePriceArs = parseFormattedNumber(form.precioArs);
  const basePriceUsd = parseFormattedNumber(form.precioUsd);
  const dolarVenta = Number(dolarData?.venta) || 0;
  const suggestedUsd = basePriceArs > 0 && dolarVenta > 0 ? Math.max(1, Math.round(basePriceArs / dolarVenta)) : 0;
  const suggestedArs = basePriceUsd > 0 && dolarVenta > 0 ? Math.max(1, Math.round(basePriceUsd * dolarVenta)) : 0;
  const dolarUpdatedAt = dolarData?.fechaActualizacion
    ? new Date(dolarData.fechaActualizacion).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : '';
  const sortedBanners = [...banners].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const sortedSubcategories = [...subcategories].sort((a, b) => a.name.localeCompare(b.name));
  const productSubcategories = sortedSubcategories.filter((item) => item.categoryId === form.categoryId);

  const handleCreateBanner = async (event) => {
    event.preventDefault();
    const message = bannerMessage.trim();
    if (!message) {
      setBannerError('Escribe un cartel para publicarlo.');
      return;
    }

    setBannerSaving(true);
    setBannerError('');
    try {
      await onCreateBanner?.({ message, tone: bannerTone });
      setBannerMessage('');
      setBannerTone('info');
    } catch (error) {
      setBannerError(error?.message || 'No se pudo crear el cartel.');
    } finally {
      setBannerSaving(false);
    }
  };

  return (
    <section className="admin-panel card" id="admin-editor">
      <div className="section-head">
        <h2>{form.productId ? 'Editar producto' : 'Nuevo producto'}</h2>
        {form.productId && (
          <button type="button" className="button secondary" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="admin-form compact">
        <div className="admin-guidance">
          <p>Carga rápida para admin</p>
          <small>Completa título, descripción, precios y estado. Puedes usar el asistente ARS/USD debajo.</small>
        </div>

        <input
          required
          type="text"
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          required
          placeholder="Descripción (una línea por especificación)"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
        <label className="file-upload-label">
          Primer uso
          <input
            type="date"
            max={todayIso}
            value={form.tiempoUso}
            onChange={(e) => setForm((prev) => ({ ...prev, tiempoUso: e.target.value }))}
          />
        </label>

        <div className="form-row">
          <select
            value={form.categoryId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                categoryId: e.target.value,
                subcategoryId: ''
              }))
            }
          >
            <option value="">Sin categoría</option>
            {sortedCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={form.subcategoryId}
            onChange={(e) => setForm((prev) => ({ ...prev, subcategoryId: e.target.value }))}
            disabled={!form.categoryId}
          >
            <option value="">Sin subcategoría</option>
            {productSubcategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="price-currency-group">
          <div className="fx-assistant">
            <div className="fx-assistant-head">
              <p>Asistente de cotización</p>
              <div className="fx-controls">
                <select
                  value={dolarType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setDolarType(nextType);
                    loadDolarQuote(nextType);
                  }}
                >
                  {DOLAR_TYPE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      Dólar {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => loadDolarQuote(dolarType)}
                  disabled={dolarLoading}
                >
                  {dolarLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>
            {dolarData && (
              <p className="fx-rate-line">
                Venta: ${formatMoneyNumber(dolarData.venta)} · Compra: ${formatMoneyNumber(dolarData.compra)}
                {dolarUpdatedAt ? ` · ${dolarUpdatedAt}` : ''}
              </p>
            )}
            {dolarError && <p className="status-text error-text">{dolarError}</p>}
            <div className="fx-suggestions">
              <button
                type="button"
                className="button secondary"
                disabled={!suggestedUsd}
                onClick={() => setForm((prev) => ({ ...prev, precioUsd: formatMoneyNumber(suggestedUsd) }))}
              >
                Usar sugerencia USD: US$ {formatMoneyNumber(suggestedUsd)}
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={!suggestedArs}
                onClick={() => setForm((prev) => ({ ...prev, precioArs: formatMoneyNumber(suggestedArs) }))}
              >
                Usar sugerencia ARS: $ {formatMoneyNumber(suggestedArs)}
              </button>
            </div>
          </div>

          <div className="input-with-prefix">
            <span className="currency-prefix">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Precio ARS"
              value={form.precioArs}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, precioArs: formatNumberInput(e.target.value) }))
              }
            />
          </div>
          {basePriceArs > 0 && (
            <CuotasBlock
              label="ARS"
              symbol="$"
              basePrice={basePriceArs}
              cuotas={form.cuotasArs}
              interes={form.interesArs}
              onChangeCuotas={(v) => setForm((prev) => ({ ...prev, cuotasArs: v }))}
              onChangeInteres={(v) => setForm((prev) => ({ ...prev, interesArs: v }))}
            />
          )}
        </div>

        <div className="price-currency-group">
          <div className="input-with-prefix">
            <span className="currency-prefix">US$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Precio USD"
              value={form.precioUsd}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, precioUsd: formatNumberInput(e.target.value) }))
              }
            />
          </div>
          {basePriceUsd > 0 && (
            <CuotasBlock
              label="USD"
              symbol="US$"
              basePrice={basePriceUsd}
              cuotas={form.cuotasUsd}
              interes={form.interesUsd}
              onChangeCuotas={(v) => setForm((prev) => ({ ...prev, cuotasUsd: v }))}
              onChangeInteres={(v) => setForm((prev) => ({ ...prev, interesUsd: v }))}
            />
          )}
        </div>

        <select
          value={form.estado}
          onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))}
        >
          <option value="Disponible">Disponible</option>
          <option value="Vendido">Vendido</option>
          <option value="Proximamente">Próximamente</option>
        </select>

        {form.existingImages.length > 0 && (
          <div className="admin-images-preview">
            <p className="admin-images-label">Imágenes actuales:</p>
            <div className="admin-images-grid">
              {form.existingImages.map((url, i) => (
                <div key={url} className="admin-image-thumb">
                  <img src={url} alt={`Imagen ${i + 1}`} />
                  <button
                    type="button"
                    className="admin-image-remove"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        existingImages: prev.existingImages.filter((_, idx) => idx !== i)
                      }))
                    }
                    aria-label={`Quitar imagen ${i + 1}`}
                  >
                    &times;
                  </button>
                  {i === 0 && <span className="admin-image-cover-badge">Portada</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="file-upload-label">
          Agregar imágenes {form.existingImages.length > 0 ? '(se suman a las actuales)' : ''}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setForm((prev) => ({ ...prev, files: e.target.files || [] }))}
          />
        </label>

        <button type="submit" className="button" disabled={isSaving}>
          {isSaving ? 'Guardando...' : form.productId ? 'Actualizar' : 'Crear producto'}
        </button>
        {saveError && <p className="status-text error-text">{saveError}</p>}
      </form>

      <section className="banner-admin">
        <div className="section-head">
          <h2>Carteles</h2>
          <p>{sortedBanners.length} total</p>
        </div>

        <form className="inline-form" onSubmit={handleCreateBanner}>
          <input
            type="text"
            placeholder="Texto del cartel para clientes"
            value={bannerMessage}
            onChange={(e) => setBannerMessage(e.target.value)}
            maxLength={140}
          />
          <div className="form-row">
            <select value={bannerTone} onChange={(e) => setBannerTone(e.target.value)}>
              <option value="info">Informativo</option>
              <option value="success">Promo</option>
              <option value="warning">Urgente</option>
            </select>
            <button type="submit" className="button" disabled={bannerSaving}>
              {bannerSaving ? 'Publicando...' : 'Publicar cartel'}
            </button>
          </div>
          {bannerError && <p className="status-text error-text">{bannerError}</p>}
        </form>

        <div className="banner-admin-list">
          {sortedBanners.length === 0 ? (
            <p className="status-text">No hay carteles cargados.</p>
          ) : (
            sortedBanners.map((banner) => (
              <article key={banner.id} className={`banner-admin-item tone-${banner.tone}`}>
                <p>{banner.message}</p>
                <div className="row-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => onToggleBanner?.(banner.id, !banner.active)}
                  >
                    {banner.active ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => onDeleteBanner?.(banner.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

export default AdminPanel;

