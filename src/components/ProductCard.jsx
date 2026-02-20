import { useState } from 'react';
import ProductModal from './ProductModal';
import { formatUsageDuration } from '../utils/usageTime';

function ProductCard({ product, isAdmin, onEdit, onDelete, onMarkUnavailable }) {
  const [showModal, setShowModal] = useState(false);
  const images = product.imagenes || [];
  const cover = images[0];
  const isUnavailable = product.estado === 'Vendido' || product.estado === 'Proximamente';

  const arsPrice = Number(product.precioArs) || 0;
  const usdPrice = Number(product.precioUsd) || 0;

  const whatsappNumber = '543815151163';
  const message = `Hola, te escribo por ${product.title}`;
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  const financingLines = [];
  const usageLabel = formatUsageDuration(product.tiempoUso);
  if (arsPrice > 0 && product.cuotasArs > 1) {
    const interes = product.interesArs || 0;
    const cuota = Math.round(arsPrice * (1 + interes / 100) / product.cuotasArs);
    financingLines.push(`${product.cuotasArs}x $ ${cuota.toLocaleString('es-AR')}${interes === 0 ? ' sin interés' : ''}`);
  }
  if (usdPrice > 0 && product.cuotasUsd > 1) {
    const interes = product.interesUsd || 0;
    const cuota = Math.round(usdPrice * (1 + interes / 100) / product.cuotasUsd);
    financingLines.push(`${product.cuotasUsd}x US$ ${cuota.toLocaleString('es-AR')}${interes === 0 ? ' sin interés' : ''}`);
  }

  return (
    <>
      <article className="product-card card" onClick={() => setShowModal(true)}>
        <div className="card-thumb">
          {cover ? (
            <img src={cover} alt={product.title} loading="lazy" className="card-thumb-img" />
          ) : (
            <div className="card-thumb-empty">Sin foto</div>
          )}
          {(product.estado === 'Vendido' || product.estado === 'Proximamente') && (
            <div className={`card-thumb-overlay ${product.estado === 'Vendido' ? 'sold' : 'soon'}`}>
              <span>{product.estado === 'Proximamente' ? 'Próximamente' : 'Vendido'}</span>
            </div>
          )}
        </div>

        <div className="card-info">
          <p className="card-title">{product.title}</p>
          {usageLabel && (
            <p className="card-usage">
              <span className="card-usage-label">Tiempo de uso:</span> {usageLabel}
            </p>
          )}
          {!isUnavailable && (
            <>
              <div className="card-prices">
                {arsPrice > 0 && <span className="card-price">$ {arsPrice.toLocaleString('es-AR')}</span>}
                {usdPrice > 0 && <span className={`card-price${arsPrice > 0 ? ' secondary' : ''}`}>US$ {usdPrice.toLocaleString('es-AR')}</span>}
              </div>
              {financingLines.map((line) => (
                <p key={line} className="card-financing">{line}</p>
              ))}
            </>
          )}
        </div>

        <div className="card-footer" onClick={(e) => e.stopPropagation()}>
          {isAdmin ? (
            <>
              <button type="button" className="button card-view-btn" onClick={() => setShowModal(true)}>
                Ver producto
              </button>
              <button type="button" className="button secondary card-edit-btn" onClick={() => onEdit(product)}>
                Editar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="button card-view-btn secondary" onClick={() => setShowModal(true)}>
                Ver producto
              </button>
              {!isUnavailable && (
                <a className="button card-wa-btn" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Ofertar por WhatsApp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.845L.057 23.272a.75.75 0 0 0 .921.921l5.43-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.71 9.71 0 0 1-4.953-1.354l-.355-.211-3.676.992.991-3.607-.23-.374A9.71 9.71 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                  </svg>
                </a>
              )}
            </>
          )}
        </div>
      </article>

      {showModal && (
        <ProductModal
          product={product}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkUnavailable={onMarkUnavailable}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default ProductCard;
