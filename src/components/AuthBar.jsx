function AuthBar({ user, isAdmin, onOpenSettings, onOpenBannerPublisher, onLogout, theme, onToggleTheme }) {
  return (
    <div className="authbar">
      <button
        type="button"
        className="button secondary theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      >
        <span className="theme-toggle-track" aria-hidden="true">
          <span className={`theme-toggle-thumb ${theme === 'dark' ? 'dark' : 'light'}`}>
            {theme === 'light' ? '\u263e' : '\u2600'}
          </span>
        </span>
      </button>

      {user && isAdmin ? (
        <>
          <button type="button" className="button secondary admin-settings-button" onClick={onOpenBannerPublisher}>
            Publicar cartel
          </button>
          <button type="button" className="button secondary admin-settings-button" onClick={onOpenSettings}>
            Configuración
          </button>
          <div className="user-chip">
            <img src={user.photoURL || ''} alt="" />
            <div>
              <p>{user.displayName}</p>
              {isAdmin && <small>Admin</small>}
            </div>
          </div>
          <button type="button" className="button secondary" onClick={onLogout}>
            Salir
          </button>
        </>
      ) : null}
    </div>
  );
}

export default AuthBar;
