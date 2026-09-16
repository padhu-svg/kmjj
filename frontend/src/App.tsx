import { Route, Routes, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getCounterLabel, getCounterFromQuery } from './config';
import { RegisterScreen } from './screens/RegisterScreen';
import { SearchScreen } from './screens/SearchScreen';
import { LandingScreen } from './screens/LandingScreen';

function App() {
  const location = useLocation();
  const counter = getCounterFromQuery();
  const isRegister = location.pathname === '/register';
  const isSearch = location.pathname === '/search';

  const navTitle = useMemo(() => {
    if (isRegister) {
      return 'ON-SPOT REGISTRATION';
    }
    if (isSearch) {
      return 'REGISTRATION VERIFICATION';
    }
    return 'COMMUNITY EVENT';
  }, [isRegister, isSearch]);

  const navSubtitle = useMemo(() => {
    if (isRegister) {
      return 'Registration';
    }
    if (isSearch) {
      return 'Verification';
    }
    return 'Choose Counter';
  }, [isRegister, isSearch]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="eyebrow">COMMUNITY EVENT</div>
          <h1>{navTitle}</h1>
          <div className="counter-badge">{navSubtitle}</div>
        </div>
        {location.pathname !== '/' && (
          <Link to="/" className="ghost-button compact">
            Home
          </Link>
        )}
      </header>

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
