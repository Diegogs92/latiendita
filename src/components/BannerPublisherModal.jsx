import { useState } from 'react';

function BannerPublisherModal({ open, onClose, onCreateBanner }) {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalized = message.trim();
    if (!normalized) {
      setError('Escribe un cartel para publicarlo.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onCreateBanner?.({ message: normalized, tone });
      setMessage('');
      setTone('info');
      onClose?.();
    } catch (submitError) {
      setError(submitError?.message || 'No se pudo publicar el cartel.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop taxonomy-modal-backdrop" onClick={onClose}>
      <section className="taxonomy-modal card banner-publisher-modal" onClick={(e) => e.stopPropagation()}>
        <div className="section-head">
          <h2>Publicar cartel</h2>
          <button type="button" className="button secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="inline-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Texto del cartel para clientes"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={140}
          />
          <div className="form-row">
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="info">Informativo</option>
              <option value="success">Promo</option>
              <option value="warning">Urgente</option>
            </select>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Publicando...' : 'Publicar cartel'}
            </button>
          </div>
          {error && <p className="status-text error-text">{error}</p>}
        </form>
      </section>
    </div>
  );
}

export default BannerPublisherModal;
