import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export default function Home({ theme, onTheme }) {
  const { t } = useTranslation();
  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container text-center">
        <h1 style={{ marginTop: 48 }}>{t('appName')}</h1>
        <p className="text-muted" style={{ marginTop: 8 }}>
          Отсканируйте QR-код на лобовом стекле автомобиля
        </p>
        <p className="text-muted" style={{ marginTop: 24, fontSize: '.9rem' }}>
          <Link to="/admin">Вход для администратора</Link>
        </p>
      </div>
    </div>
  );
}
