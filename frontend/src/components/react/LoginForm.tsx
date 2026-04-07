import { useState } from 'react';

type Mode = 'login' | 'register';

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regLastname, setRegLastname] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) { setMode(m); setError(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const d = await res.json();
      setError(d.error || 'Credenciales incorrectas');
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    // 1. Register
    const regRes = await fetch('/api/proxy/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: regName, lastname: regLastname,
        username: regUsername, email: regEmail,
        password: regPassword, rol: 'docente',
      }),
    });
    if (!regRes.ok) {
      const d = await regRes.json();
      setLoading(false);
      setError(d.message || 'Error al registrar');
      return;
    }
    // 2. Login to set cookie
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: regUsername, password: regPassword }),
    });
    setLoading(false);
    if (loginRes.ok) {
      window.location.href = '/dashboard';
    } else {
      setError('Cuenta creada. Inicia sesión manualmente.');
    }
  }

  return (
    <div className="login-page">
      <div className="auth-card">
        <div className="auth-logos">
          <div className="logo-pill"><img src="/logo.png" alt="UNAE" /></div>
          <div className="logo-pill"><img src="/logotec.jpg" alt="Tec de Monterrey" /></div>
        </div>

        <div className="auth-headline">
          <h1>MemoRetos</h1>
          <p>Panel de Administración Docente</p>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs">
            <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>
              Iniciar Sesión
            </button>
            <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => switchMode('register')}>
              Registrarse
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <span className="auth-field-icon material-symbols-outlined">person</span>
                <input className="auth-input" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Usuario" autoComplete="username" required />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon material-symbols-outlined">lock</span>
                <input type="password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña" autoComplete="current-password" required />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="auth-row">
                <div className="auth-field">
                  <input className="auth-input no-icon" value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="Nombre" required />
                </div>
                <div className="auth-field">
                  <input className="auth-input no-icon" value={regLastname} onChange={e => setRegLastname(e.target.value)}
                    placeholder="Apellido" required />
                </div>
              </div>
              <div className="auth-field">
                <span className="auth-field-icon material-symbols-outlined">person</span>
                <input className="auth-input" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                  placeholder="Usuario" required />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon material-symbols-outlined">mail</span>
                <input type="email" className="auth-input" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="Correo electrónico" required />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon material-symbols-outlined">lock</span>
                <input type="password" className="auth-input" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  placeholder="Contraseña" autoComplete="new-password" required />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
