import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminLogin } from '../api';
import { Header } from '../components/Header';

export default function AdminLogin({ theme, onTheme }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await adminLogin(login, password);
      navigate('/admin/dash', { replace: true });
    } catch {
      setErr(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container">
        <div className="card" style={{ maxWidth: 360, margin: '24px auto 0' }}>
          <h2 className="text-center mb">{t('adminLogin')}</h2>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>{t('adminLogin')}</label>
              <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="admin" required />
            </div>
            <div className="form-group">
              <label>{t('adminPassword')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {err && <p className="text-error mb">{err}</p>}
            <button type="submit" className="btn-block" disabled={loading}>{t('adminLoginButton')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
