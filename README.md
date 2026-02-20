# Marketplace Simple (React + Supabase)

Marketplace web minimal donde un admin publica productos y usuarios autenticados con Google pueden comentar, ofertar y comprar.

## Stack

- React + Vite
- Supabase Auth (Google)
- Supabase Postgres
- Supabase Storage
- Netlify

## Estructura del proyecto

```txt
catalogo/
  public/
  src/
    components/
      AdminPanel.jsx
      AuthBar.jsx
      ProductCard.jsx
    App.jsx
    main.jsx
    styles.css
    supabase.js
  supabase/
    schema.sql
  .env.example
  .env.local
  .gitignore
  index.html
  netlify.toml
  package.json
  vite.config.js
  README.md
```

## Variables de entorno

Usa `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAIL=tu-correo-admin@ejemplo.com
```

## Configuración Supabase (paso a paso)

1. Crea un proyecto en Supabase.
2. En `SQL Editor`, ejecuta completo `supabase/schema.sql`.
3. En `Authentication > Providers > Google`, habilita Google.
4. En Google Cloud Console, configura OAuth consent y credenciales.
5. Agrega Redirect URLs en Supabase Auth:
- `http://localhost:5173`
- `https://TU-SITIO-NETLIFY.netlify.app`
6. En `Storage`, crea bucket `product-images` y márcalo como público.
7. En `Storage > Policies` para `product-images`, crea políticas:
- `SELECT` público
- `INSERT`, `UPDATE`, `DELETE` solo para admin (email del JWT)

Ejemplo de política para escribir (ajusta email):

```sql
(auth.jwt() ->> 'email') = 'dgarciasantillan@gmail.com'
```

8. En `Project Settings > API`, copia:
- Project URL -> `VITE_SUPABASE_URL`
- `anon` public key -> `VITE_SUPABASE_ANON_KEY`

## Ejecutar local

```bash
npm install
npm run dev
```

## Deploy en Netlify

1. Sube el repo a GitHub.
2. En Netlify: New site from Git.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. En variables de entorno agrega:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`
6. Deploy.

`netlify.toml` ya incluye redirección SPA.

## Notas

- No hay backend separado; todo funciona con Supabase.
- Solo el admin crea/edita/elimina productos.
- Usuarios logueados pueden comentar, ofertar y comprar.
- Compra y aceptar oferta usan funciones RPC seguras (`buy_product`, `accept_offer`).
