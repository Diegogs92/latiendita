function AuthBar({ user, isAdmin, showLogin, onLogin, onLogout, theme, onToggleTheme }) {
  return (
    <div className="authbar">
      <button type="button" className="button secondary" onClick={onToggleTheme} aria-label="Cambiar tema">
        {theme === 'light' ? '\u263E' : '\u2600'}
      </button>

      {!user && showLogin ? (
        <button type="button" className="button" onClick={onLogin}>
          Entrar
        </button>
      ) : user ? (
        <>
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
