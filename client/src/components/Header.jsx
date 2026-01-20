import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'ky', label: 'KY' },
  { code: 'en', label: 'EN' },
];

export function Header({ theme, onTheme, showTheme = true }) {
  const { t, i18n } = useTranslation();
  const setLang = (l) => {
    i18n.changeLanguage(l);
    localStorage.setItem('exelix_lang', l);
  };
  return (
    <header className="header">
      <span className="logo">{t('appName')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="langs">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              className={`lang-btn ${i18n.language === code ? 'active' : ''}`}
              onClick={() => setLang(code)}
            >
              {label}
            </button>
          ))}
        </div>
        {showTheme && (
          <button
            type="button"
            className="theme-btn"
            onClick={onTheme}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            aria-label="theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        )}
      </div>
    </header>
  );
}
