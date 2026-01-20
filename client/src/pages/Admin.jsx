import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminStats, adminUsers, adminDownloadQr } from '../api';
import { useToast } from '../components/Toast';
import { Header } from '../components/Header';

export default function Admin({ theme, onTheme }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dlQr, setDlQr] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, u] = await Promise.all([adminStats(), adminUsers(0, 40)]);
        setStats(s);
        setUsers(u.users || []);
        setOffset(40);
      } catch {
        navigate('/admin', { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const u = await adminUsers(offset, 40);
      setUsers((prev) => [...prev, ...(u.users || [])]);
      setOffset((o) => o + 40);
    } catch {}
    setLoadingMore(false);
  };

  const onDownloadQr = async () => {
    setDlQr(true);
    try {
      await adminDownloadQr();
      toast(t('adminQrSuccess'));
    } catch {
      toast(t('errorGeneric'));
    } finally {
      setDlQr(false);
    }
  };

  if (loading) return <div className="page"><Header theme={theme} onTheme={onTheme} /><div className="container text-center">{t('loading')}</div></div>;

  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container">
        <h2 className="mb">Админ-панель</h2>

        {stats && (
          <div className="grid-2 mb" style={{ marginBottom: 24 }}>
            <div className="card"><div className="text-muted">{t('adminStatsUsers')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.users}</div></div>
            <div className="card"><div className="text-muted">{t('adminStatsSuccess')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.successful_requests}</div></div>
            <div className="card"><div className="text-muted">{t('adminStatsFail')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.unsuccessful_requests}</div></div>
            <div className="card"><div className="text-muted">{t('adminStatsTotal')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total_requests}</div></div>
            <div className="card"><div className="text-muted">{t('adminStatsInactiveQr')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.inactive_qr_count}</div></div>
          </div>
        )}

        <div className="mb">
          <button onClick={onDownloadQr} disabled={dlQr}>{t('adminDownloadQr')}</button>
        </div>

        <h3 className="mb">Пользователи</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Фото</th>
                <th style={{ padding: '8px 12px' }}>Имя</th>
                <th style={{ padding: '8px 12px' }}>Телефон</th>
                <th style={{ padding: '8px 12px' }}>Telegram</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {u.photo && <img src={u.photo.startsWith('/') ? u.photo : u.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{u.name} {u.surname}</td>
                  <td style={{ padding: '8px 12px' }}>{u.phone}</td>
                  <td style={{ padding: '8px 12px' }}>{u.telegram || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-ghost mt" onClick={loadMore} disabled={loadingMore}>{t('adminShowMore')}</button>
      </div>
    </div>
  );
}
