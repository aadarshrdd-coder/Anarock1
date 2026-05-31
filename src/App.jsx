import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

const AUTH_STORAGE_KEY = 'wanderlog_auth';
const BUCKET_STORAGE_KEY = 'wanderlog_bucket';
const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,cca3,flags,region,subregion,capital,population,area,currencies,languages,borders,cca2';

function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    } catch {
      return null;
    }
  });

  const login = async ({ email, password, mode }) => {
    const endpoint = mode === 'register' ? 'https://reqres.in/api/register' : 'https://reqres.in/api/login';
    const payload = { email, password };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Auth failed');
    const authData = { email, token: result.token, id: result.id || null };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setUser(authData);
    return authData;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return { user, login, logout };
}

function useBucket(user) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(BUCKET_STORAGE_KEY) || '{}';
      const parsed = JSON.parse(raw);
      return user?.email ? parsed[user.email] || {} : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!user) {
      setItems({});
      return;
    }
    try {
      const raw = localStorage.getItem(BUCKET_STORAGE_KEY) || '{}';
      const parsed = JSON.parse(raw);
      setItems(parsed[user.email] || {});
    } catch {
      setItems({});
    }
  }, [user]);

  const saveItems = (next) => {
    setItems(next);
    const raw = localStorage.getItem(BUCKET_STORAGE_KEY) || '{}';
    const parsed = JSON.parse(raw);
    parsed[user.email] = next;
    localStorage.setItem(BUCKET_STORAGE_KEY, JSON.stringify(parsed));
  };

  const toggle = (code, label) => {
    saveItems({
      ...items,
      [code]: {
        ...items[code],
        [label]: !items[code]?.[label],
      },
    });
  };

  return { items, toggle };
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function AuthPage({ user, onAuth }) {
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('eve.holt@reqres.in');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('register');
    } else {
      setMode('login');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      navigate('/explore', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await onAuth({ email, password, mode });
      if (user) navigate('/explore');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pageHeading = mode === 'login' ? 'Welcome back!' : 'Create an account';
  const pageSubtext = mode === 'login'
    ? 'Sign in to continue your adventures and save countries to your bucket list.'
    : 'Create a WanderLog account to start tracking your travel goals.';
  const actionText = mode === 'login' ? 'Sign in' : 'Create account';
  const altActionText = mode === 'login' ? "Don't have an account?" : 'Already have an account?';
  const altActionLink = mode === 'login' ? '/signup' : '/login';
  const altActionLabel = mode === 'login' ? 'Create account' : 'Login';

  return (
    <main className="page auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">🌍</span>
          <div>
            <h1>WanderLog</h1>
            <p className="auth-brand-text">Your travel bucket list, powered by real-world country data.</p>
          </div>
        </div>

        <div className="auth-intro">
          <h2>{pageHeading}</h2>
          <p>{pageSubtext}</p>
        </div>

        <div className="auth-switch">
          <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
            Login
          </NavLink>
          <NavLink to="/signup" className={({ isActive }) => (isActive ? 'active' : '')}>
            Sign Up
          </NavLink>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eve.holt@reqres.in"
              required
            />
          </label>
          <label>
            <div className="label-row">
              <span>Password</span>
              {mode === 'login' && <button type="button" className="text-button">Forgot password?</button>}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any password"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Working…' : actionText}
          </button>
          {mode === 'login' && (
            <button type="button" className="secondary" onClick={async () => {
              setError('');
              setLoading(true);
              try {
                const user = await onAuth({ email: 'eve.holt@reqres.in', password: 'password', mode: 'login' });
                if (user) navigate('/explore');
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}>
              Continue with Google
            </button>
          )}
        </form>

        <p className="auth-footer">
          {altActionText}{' '}
          <button type="button" className="text-button" onClick={() => navigate(altActionLink)}>
            {altActionLabel}
          </button>
        </p>
      </section>
    </main>
  );
}

function Navbar({ user, onLogout, bucketCount, visitedCount }) {
  return (
    <header className="topbar">
      <div>
        <NavLink to="/explore" className="brand">
          WanderLog
        </NavLink>
      </div>
      <div className="topbar-actions">
        <span>{bucketCount} bucket list</span>
        <span>{visitedCount} visited</span>
        <span>{user?.email}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

function ExplorePage({ user, bucketItems, toggleBucket }) {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(COUNTRIES_API)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      })
      .catch(() => setError('Could not load countries.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return countries.filter((country) => {
      const name = country.name.common.toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesRegion = region === 'All' || country.region === region;
      return matchesSearch && matchesRegion;
    });
  }, [countries, search, region]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const bucketCount = Object.values(bucketItems).filter((item) => item.bucket).length;
    const visitedCount = Object.values(bucketItems).filter((item) => item.visited).length;
    return { total, bucketCount, visitedCount };
  }, [filtered, bucketItems]);

  return (
    <main className="page explore-page">
      <section className="intro-panel">
        <div>
          <h1>Explore Countries</h1>
          <p>Search, filter, and save countries to your personal travel bucket list.</p>
        </div>
        <div className="stats-grid">
          <div>
            <strong>{stats.total}</strong>
            <span>Countries</span>
          </div>
          <div>
            <strong>{stats.bucketCount}</strong>
            <span>Bucket list</span>
          </div>
          <div>
            <strong>{stats.visitedCount}</strong>
            <span>Visited</span>
          </div>
        </div>
      </section>

      <section className="filters-panel">
        <input
          type="search"
          placeholder="Search countries"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option>All</option>
          <option>Africa</option>
          <option>Americas</option>
          <option>Asia</option>
          <option>Europe</option>
          <option>Oceania</option>
        </select>
      </section>

      {loading && <p className="status-message">Loading countries…</p>}
      {error && <p className="status-message error">{error}</p>}

      <section className="grid-list">
        {filtered.map((country) => {
          const code = country.cca3;
          const item = bucketItems[code] || {};
          return (
            <article key={code} className="country-card" onClick={() => navigate(`/country/${code}`)}>
              <img src={country.flags.svg || country.flags.png} alt={`${country.name.common} flag`} />
              <div className="country-card-body">
                <h2>{country.name.common}</h2>
                <p>{country.region}</p>
                <p>{country.capital?.[0] || 'No capital'}</p>
                <p>{country.population.toLocaleString()} people</p>
                <p>{Math.round(country.area).toLocaleString()} km²</p>
              </div>
              <div className="country-card-actions">
                <button type="button" className="secondary" onClick={(event) => { event.stopPropagation(); navigate(`/country/${code}`); }}>
                  Details
                </button>
                <button type="button" className={item.bucket ? 'active' : ''} onClick={(event) => { event.stopPropagation(); toggleBucket(code, 'bucket'); }}>
                  {item.bucket ? 'Bucketed' : 'Bucket'}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function CountryDetailPage({ user, bucketItems, toggleBucket }) {
  const { code } = useParams();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`https://restcountries.com/v3.1/alpha/${code}?fields=name,cca3,flags,region,subregion,capital,population,area,currencies,languages,borders,capitalInfo`) 
      .then((res) => res.json())
      .then((data) => setCountry(Array.isArray(data) ? data[0] : data))
      .catch(() => setError('Country details not available.'))
      .finally(() => setLoading(false));
  }, [code]);

  const item = bucketItems[code] || {};

  if (loading) return <main className="page status-page">Loading country details…</main>;
  if (error) return <main className="page status-page error">{error}</main>;
  if (!country) return null;

  return (
    <main className="page detail-page">
      <section className="detail-panel">
        <div className="detail-header">
          <img src={country.flags.svg || country.flags.png} alt={`${country.name.common} flag`} />
          <div>
            <h1>{country.name.common}</h1>
            <p>{country.region} • {country.subregion}</p>
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <strong>Capital</strong>
            <p>{country.capital?.[0] || 'N/A'}</p>
          </div>
          <div>
            <strong>Population</strong>
            <p>{country.population.toLocaleString()}</p>
          </div>
          <div>
            <strong>Area</strong>
            <p>{Math.round(country.area).toLocaleString()} km²</p>
          </div>
          <div>
            <strong>Languages</strong>
            <p>{country.languages ? Object.values(country.languages).join(', ') : 'N/A'}</p>
          </div>
          <div>
            <strong>Currencies</strong>
            <p>{country.currencies ? Object.values(country.currencies).map((c) => c.name).join(', ') : 'N/A'}</p>
          </div>
          <div>
            <strong>Borders</strong>
            <p>{country.borders?.join(', ') || 'None'}</p>
          </div>
        </div>

        <div className="detail-actions">
          <button type="button" className={item.bucket ? 'active' : ''} onClick={() => toggleBucket(code, 'bucket')}>
            {item.bucket ? 'Remove from bucket' : 'Add to bucket'}
          </button>
          <button type="button" className={item.visited ? 'visited active' : 'visited'} onClick={() => toggleBucket(code, 'visited')}>
            {item.visited ? 'Mark not visited' : 'Mark visited'}
          </button>
        </div>
      </section>
    </main>
  );
}

function App() {
  const auth = useAuth();
  const bucket = useBucket(auth.user);
  const navigate = useNavigate();

  const bucketCount = Object.values(bucket.items).filter((item) => item.bucket).length;
  const visitedCount = Object.values(bucket.items).filter((item) => item.visited).length;

  const handleLogout = () => {
    auth.logout();
    navigate('/auth');
  };

  return (
    <div className="app-shell">
      {auth.user && <Navbar user={auth.user} onLogout={handleLogout} bucketCount={bucketCount} visitedCount={visitedCount} />}
      <Routes>
        <Route path="/auth" element={<AuthPage user={auth.user} onAuth={auth.login} />} />
        <Route path="/login" element={<AuthPage user={auth.user} onAuth={auth.login} />} />
        <Route path="/signup" element={<AuthPage user={auth.user} onAuth={auth.login} />} />
        <Route
          path="/explore"
          element={
            <ProtectedRoute user={auth.user}>
              <ExplorePage user={auth.user} bucketItems={bucket.items} toggleBucket={bucket.toggle} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/country/:code"
          element={
            <ProtectedRoute user={auth.user}>
              <CountryDetailPage user={auth.user} bucketItems={bucket.items} toggleBucket={bucket.toggle} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={auth.user ? '/explore' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={auth.user ? '/explore' : '/login'} replace />} />
      </Routes>
    </div>
  );
}

export default App;
