function AuthBar({ user, isAdmin, onLogout, theme, onToggleTheme }) {
  return (
    <div className="authbar">
      <button type="button" className="button secondary" onClick={onToggleTheme} aria-label="Cambiar tema">
        {theme === 'light' ? '\u263E' : '\u2600'}
      </button>

      {user && isAdmin ? (
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
