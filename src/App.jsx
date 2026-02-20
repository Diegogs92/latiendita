import { useEffect, useMemo, useState } from 'react';
import AuthBar from './components/AuthBar';
import AdminPanel from './components/AdminPanel';
import ProductCard from './components/ProductCard';
import { supabase, supabaseConfigError } from './supabase';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [viewMode, setViewMode] = useState(localStorage.getItem('view-mode') || 'developer');

  const loadMarketplaceData = async () => {
    if (!supabase) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    const productsRes = await supabase
      .from('products')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (productsRes.error) {
      throw new Error(productsRes.error.message || 'No se pudieron cargar datos del marketplace.');
    }

    const nextProducts = (productsRes.data || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      tiempoUso: item.tiempo_uso || '',
      precioBase: item.precio_base,
      moneda: item.moneda || 'ARS',
      precioArs: item.precio_ars ?? (item.moneda === 'ARS' ? item.precio_base : null),
      precioUsd: item.precio_usd ?? (item.moneda === 'USD' ? item.precio_base : null),
      cuotasArs: item.cuotas_ars || item.cuotas || 1,
      interesArs: item.interes_ars || item.interes || 0,
      cuotasUsd: item.cuotas_usd || 1,
      interesUsd: item.interes_usd || 0,
      imagenes: item.imagenes || [],
      estado: item.estado,
      compradorId: item.comprador_id
    }));

    setProducts(nextProducts);
    setProductsError('');
    setLoadingProducts(false);
  };

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    const email = (user.email || '').toLowerCase();
    if (email && email !== ADMIN_EMAIL) {
      supabase.auth.signOut().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    loadMarketplaceData().catch((error) => {
      console.error('Load marketplace error:', error);
      setProducts([]);
      setProductsError('No se pudieron cargar los productos. Revisa tu configuración de Supabase.');
      setLoadingProducts(false);
    });
  }, []);

  const isAdmin = useMemo(() => {
    const email = (user?.email || '').toLowerCase();
    return Boolean(email) && email === ADMIN_EMAIL;
  }, [user]);
  const canUseAdminFeatures = isAdmin;
  const actingAsAdmin = canUseAdminFeatures && viewMode === 'developer';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuario';
  const userPhoto = user?.user_metadata?.avatar_url || '';

  const handleLogin = async () => {
    if (!supabase) return;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const uploadProductImages = async (files) => {
    if (!supabase || !user) return [];

    const urls = [];
    for (const file of files) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  };

  const createOrUpdateProduct = async ({
    productId,
    title,
    description,
    tiempoUso,
    precioArs,
    precioUsd,
    cuotasArs,
    interesArs,
    cuotasUsd,
    interesUsd,
    estado,
    files,
    existingImages
  }) => {
    if (!supabase || !user) return;

    try {
      const newImageUrls = files.length ? await uploadProductImages(files) : [];
      const imagenes = [...existingImages, ...newImageUrls];
      const normalizedArs = Number(precioArs) > 0 ? Number(precioArs) : null;
      const normalizedUsd = Number(precioUsd) > 0 ? Number(precioUsd) : null;
      const precioBase = normalizedArs ?? normalizedUsd ?? 0;
      const moneda = normalizedArs ? 'ARS' : 'USD';
      const payload = {
        title,
        description,
        tiempo_uso: tiempoUso || null,
        precio_base: precioBase,
        moneda,
        precio_ars: normalizedArs,
        precio_usd: normalizedUsd,
        cuotas_ars: cuotasArs,
        interes_ars: interesArs,
        cuotas_usd: cuotasUsd,
        interes_usd: interesUsd,
        estado,
        imagenes
      };

      if (productId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([
          {
            ...payload,
            creado_por: user.id
          }
        ]);

        if (error) throw error;
      }

      await loadMarketplaceData();
    } catch (error) {
      console.error('Create/update product error:', error);
      throw new Error(error?.message || 'No se pudo guardar. Revisa Storage bucket, RLS y tablas de Supabase.');
    }
  };

  const removeProduct = async (productId) => {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;

    if (editingProduct?.id === productId) {
      setEditingProduct(null);
    }

    await loadMarketplaceData();
  };

  const markProductUnavailable = async (productId) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('products')
      .update({ estado: 'Vendido', comprador_id: null })
      .eq('id', productId);

    if (error) throw error;
    await loadMarketplaceData();
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    const editor = document.getElementById('admin-editor');
    if (editor) {
      editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const uiUser = user
    ? {
        uid: user.id,
        email: user.email,
        displayName: userName,
        photoURL: userPhoto
      }
    : null;

  const summary = useMemo(() => {
    const soldCount = products.filter((item) => item.estado === 'Vendido').length;
    return {
      total: products.length,
      sold: soldCount,
    };
  }, [products]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1 className="friendly-title">La tiendita de Diego</h1>

        <AuthBar
          user={uiUser}
          isAdmin={canUseAdminFeatures}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        />
      </header>

      {actingAsAdmin && (
        <section className="summary-grid">
          <article className="summary-card card">
            <p>Productos</p>
            <strong>{summary.total}</strong>
          </article>
          <article className="summary-card card">
            <p>Ventas</p>
            <strong>{summary.sold}</strong>
          </article>
        </section>
      )}

      {canUseAdminFeatures && (
        <section className="card view-switch">
          <p>Vista activa</p>
          <div className="view-switch-actions">
            <button
              type="button"
              className={`button secondary ${viewMode === 'developer' ? 'active' : ''}`}
              onClick={() => setViewMode('developer')}
            >
              Desarrollador
            </button>
            <button
              type="button"
              className={`button secondary ${viewMode === 'client' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('client');
                setEditingProduct(null);
              }}
            >
              Cliente
            </button>
          </div>
        </section>
      )}

      <main className="content">
        {supabaseConfigError && (
          <section className="card status-block">
            <h2>Configuración pendiente</h2>
            <p>{supabaseConfigError}. Completa `/.env.local` y reinicia `npm run dev`.</p>
          </section>
        )}

        {actingAsAdmin && (
          <AdminPanel
            editingProduct={editingProduct}
            onSave={createOrUpdateProduct}
            onCancelEdit={() => setEditingProduct(null)}
          />
        )}

        <section className="products-section">
          <div className="section-head">
            <h2>Productos</h2>
            <p>{products.length} producto{products.length !== 1 ? 's' : ''}</p>
          </div>

          {loadingProducts ? (
            <p className="status-text">Cargando productos...</p>
          ) : productsError ? (
            <p className="status-text error-text">{productsError}</p>
          ) : products.length === 0 ? (
            <p className="status-text">No hay productos todavía.</p>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdmin={actingAsAdmin}
                  onEdit={startEditProduct}
                  onDelete={removeProduct}
                  onMarkUnavailable={markProductUnavailable}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {!isAdmin && (
        <button type="button" className="admin-entry-button" onClick={handleLogin} aria-label="Acceso administrador">
          Admin
        </button>
      )}
    </div>
  );
}

export default App;
