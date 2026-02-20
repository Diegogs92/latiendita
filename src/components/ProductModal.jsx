import { useState, useEffect, useRef } from 'react';
import { formatUsageDuration } from '../utils/usageTime';

function ProductModal({ product, isAdmin, onEdit, onDelete, onMarkUnavailable, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const panelRef = useRef(null);
  const images = product.imagenes || [];
  const total = images.length;

  const goTo = (index) => setCurrentIndex(((index % total) + total) % total);

  const whatsappNumber = '543815151163';
  const message = `Hola, te escribo por ${product.title}`;
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  const specs = (product.description || '')
    .split(/\n+/)
    .map((line) => line.replace(/^[\u2022\-*]\s*/, '').trim())
    .filter(Boolean);
  const parsedSpecs = specs.map((line) => {
    const [label, ...rest] = line.split(':');
    if (rest.length === 0) return { label: '', value: line, raw: line };
    return { label: label.trim(), value: rest.join(':').trim(), raw: line };
  });
  const visibleSpecs = showAllSpecs ? parsedSpecs : parsedSpecs.slice(0, 8);
  const hasMoreSpecs = parsedSpecs.length > 8;

  const arsPrice = Number(product.precioArs) || 0;
  const usdPrice = Number(product.precioUsd) || 0;
  const hasDualPrice = arsPrice > 0 && usdPrice > 0;
  const isUnavailable = product.estado === 'Vendido' || product.estado === 'Proximamente';
  const usageLabel = formatUsageDuration(product.tiempoUso);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock page scroll (including keyboard) while modal is open
  useEffect(() => {
    const scrollY = window.scrollY;
    const html = document.documentElement;

    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      html.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Focus trap: keep keyboard focus inside the modal
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    // Focus the panel itself on open
    panel.focus();

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    panel.addEventListener('keydown', trap);
    return () => panel.removeEventListener('keydown', trap);
  }, []);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" ref={panelRef} tabIndex="-1" style={{ outline: 'none' }}>

        {/* Drag handle (mobile) */}
        <div className="modal-handle" />

        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">&#10005;</button>

        {/* Carousel — sticky top */}
        <div className="modal-carousel">
          {total > 0 ? (
            <>
              <div
                className="carousel-track"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {images.map((src, i) => (
                  <img
                    key={src}
                    className="carousel-img"
                    src={src}
                    alt={`${product.title} - ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                ))}
              </div>
              {total > 1 && (
                <>
                  <button type="button" className="carousel-arrow carousel-prev" onClick={() => goTo(currentIndex - 1)} aria-label="Anterior">&#8249;</button>
                  <button type="button" className="carousel-arrow carousel-next" onClick={() => goTo(currentIndex + 1)} aria-label="Siguiente">&#8250;</button>
                  <div className="carousel-dots">
                    {images.map((_, i) => (
                      <button key={i} type="button" className={`carousel-dot${i === currentIndex ? ' active' : ''}`} onClick={() => goTo(i)} aria-label={`Foto ${i + 1}`} />
                    ))}
                  </div>
                  <span className="carousel-counter">{currentIndex + 1}/{total}</span>
                </>
              )}
            </>
          ) : (
            <div className="empty-image">Sin imágenes</div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="modal-body">

          {/* Title + badges */}
          <div className="modal-header">
            <h2 className="modal-title">{product.title}</h2>
            <div className="modal-badges">
              <span className={`badge ${
                product.estado === 'Vendido' ? 'sold'
                : product.estado === 'Proximamente' ? 'soon'
                : 'available'
              }`}>
                {product.estado === 'Proximamente' ? 'Próximamente' : product.estado}
              </span>
              {usageLabel && (
                <span className="badge usage">Tiempo de uso: {usageLabel}</span>
              )}
            </div>
          </div>

          {/* Specs */}
          {specs.length > 0 ? (
            <div className="modal-specs">
              <ul className="spec-list">
                {visibleSpecs.map((item, index) => (
                  <li key={`${item.raw}-${index}`}>
                    {item.label ? (
                      <><span className="spec-label">{item.label}:</span>{' '}<span className="spec-value">{item.value}</span></>
                    ) : (
                      <span className="spec-value">{item.value}</span>
                    )}
                  </li>
                ))}
              </ul>
              {hasMoreSpecs && (
                <button type="button" className="spec-toggle" onClick={() => setShowAllSpecs((c) => !c)}>
                  {showAllSpecs ? 'Ver menos detalles' : `Ver ${parsedSpecs.length - 8} detalles más`}
                </button>
              )}
            </div>
          ) : product.description ? (
            <p className="product-description">{product.description}</p>
          ) : null}

          {/* Price block */}
          {!isUnavailable && (
            <div className={`modal-price-block price-block${hasDualPrice ? ' dual' : ''}`}>
            {arsPrice > 0 && (
              <div className="price-group">
                <p className="price">$ {arsPrice.toLocaleString('es-AR')}</p>
                {product.cuotasArs > 1 && (() => {
                  const interes = product.interesArs || 0;
                  const cuota = Math.round(arsPrice * (1 + interes / 100) / product.cuotasArs);
                  return (
                    <p className={`installments${interes > 0 ? ' with-interest' : ''}`}>
                      {product.cuotasArs}x $ {cuota.toLocaleString('es-AR')}
                      <span className="installments-note">{interes > 0 ? ` · ${interes}% interés` : ' · sin interés'}</span>
                    </p>
                  );
                })()}
              </div>
            )}
            {usdPrice > 0 && (
              <div className="price-group">
                <p className={hasDualPrice ? 'price secondary' : 'price'}>US$ {usdPrice.toLocaleString('es-AR')}</p>
                {product.cuotasUsd > 1 && (() => {
                  const interes = product.interesUsd || 0;
                  const cuota = Math.round(usdPrice * (1 + interes / 100) / product.cuotasUsd);
                  return (
                    <p className={`installments${interes > 0 ? ' with-interest' : ''}`}>
                      {product.cuotasUsd}x US$ {cuota.toLocaleString('es-AR')}
                      <span className="installments-note">{interes > 0 ? ` · ${interes}% interés` : ' · sin interés'}</span>
                    </p>
                  );
                })()}
              </div>
            )}
            </div>
          )}

          {/* Actions */}
          {isAdmin ? (
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => { onEdit(product); onClose(); }}>Editar</button>
              <button type="button" className="button secondary" onClick={() => { onMarkUnavailable(product.id); onClose(); }}>No disponible</button>
              <button type="button" className="button danger" onClick={() => { onDelete(product.id); onClose(); }}>Eliminar</button>
            </div>
          ) : !isUnavailable ? (
            <div className="modal-cta">
              <a className="button wa-offer-button" href={whatsappHref} target="_blank" rel="noreferrer">
                <span className="wa-offer-label">Ofertar por WhatsApp</span>
              </a>
              <p className="offer-helper">Respuesta directa de Diego</p>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}

export default ProductModal;
