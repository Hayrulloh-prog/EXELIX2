import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { sendNotify } from '../api';
import { useToast } from '../components/Toast';
import { Header } from '../components/Header';
import { getFingerprint } from '../utils/fingerprint';

const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || '';

const NOTIFY_OPTS = [
  { key: 'blocking', critical: false },
  { key: 'wrong_place', critical: false },
  { key: 'alarm', critical: false },
  { key: 'evacuate', critical: true },
  { key: 'minor_accident', critical: false },
  { key: 'serious_accident', critical: true },
];

export default function Notify({ theme, onTheme }) {
  const loc = useLocation();
  const [search] = useSearchParams();
  const { t } = useTranslation();
  const toast = useToast();
  const [qrCode, setQrCode] = useState(loc.state?.qrCode || search.get('qr') || '');
  const [owner, setOwner] = useState(loc.state?.owner || null);
  const [canCall, setCanCall] = useState(loc.state?.canCall !== false);
  const [canTelegram, setCanTelegram] = useState(!!loc.state?.canTelegram);
  const [phone, setPhone] = useState(loc.state?.phone || loc.state?.owner?.phone || '');
  const [telegram, setTelegram] = useState(loc.state?.telegram || '');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(!loc.state?.qrCode && !!search.get('qr'));
  const [err, setErr] = useState('');
  const [captcha, setCaptcha] = useState(null);

  useEffect(() => {
    const q = search.get('qr');
    if (q && !loc.state?.qrCode) {
      (async () => {
        try {
          const r = await fetch(`/api/qr/q/${q}`, { credentials: 'omit' });
          const d = await r.json();
          if (d.action === 'notify') {
            setQrCode(d.qrCode);
            setOwner(d.owner);
            setCanCall(true);
            setCanTelegram(!!d.canTelegram);
            setTelegram(d.telegram || '');
            setPhone(d.phone || d.owner?.phone || '');
          }
        } catch (e) {}
        setLoadingPage(false);
      })();
    } else if (!qrCode) {
      setLoadingPage(false);
    }
  }, [search.get('qr')]);

  const toggle = (k) => {
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
    setErr('');
  };

  const onSubmit = async () => {
    if (selected.length === 0) { setErr(t('errorGeneric')); return; }
    if (HCAPTCHA_SITEKEY && !captcha) { setErr(t('errorCaptcha')); return; }
    setErr('');
    setLoading(true);
    try {
      await sendNotify(qrCode, selected, captcha || undefined, getFingerprint());
      setSelected([]);
      if (HCAPTCHA_SITEKEY && typeof setCaptcha === 'function') setCaptcha(null);
      toast(t('sendSuccess'));
    } catch (e) {
      const m = e.message;
      if (m === 'SENDER_LIMIT' || m === 'LIMIT_REACHED') toast(t('limitReached'));
      else if (m === 'OWNER_LIMIT' || m === 'OWNER_LIMIT_REACHED') toast(t('ownerLimitReached'));
      else if (m === 'TOO_FAST' || m === 'SEND_DELAY') toast(t('sendDelay'));
      else if (m === 'CAPTCHA_REQUIRED' || m === 'CAPTCHA_FAILED') setErr(t('errorCaptcha'));
      else toast(t('errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  const onCall = () => {
    const tel = phone || owner?.phone;
    if (tel) window.location.href = 'tel:' + tel.replace(/\D/g, '').replace(/^8/, '7');
  };

  const onCopyTelegram = () => {
    const v = (telegram || '').replace(/^@/, '');
    if (!v) return;
    const s = '@' + v;
    navigator.clipboard?.writeText(s).then(() => toast(t('telegramCopied'))).catch(() => toast(t('telegramCopied')));
  };

  if (loadingPage || !qrCode) {
    return (
      <div className="page">
        <Header theme={theme} onTheme={onTheme} />
        <div className="container text-center">{t('loading')}</div>
      </div>
    );
  }

  const ownerName = owner?.name && owner?.surname ? `${owner.name} ${owner.surname}` : null;
  const photoUrl = owner?.photo && (owner.photo.startsWith('http') || owner.photo.startsWith('/')) ? owner.photo : null;

  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container">
        {ownerName && (
          <div className="card mb" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {photoUrl && <img src={photoUrl} alt="" className="avatar" />}
            <span>{ownerName}</span>
          </div>
        )}

        <h3 className="mb">{t('send')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {NOTIFY_OPTS.map(({ key, critical }) => (
            <div
              key={key}
              className={`card notify-card ${selected.includes(key) ? 'selected' : ''} ${critical ? 'critical' : ''}`}
              onClick={() => toggle(key)}
              style={{ cursor: 'pointer', border: selected.includes(key) ? '2px solid var(--accent)' : undefined }}
            >
              <span className="icon">{critical ? '🔴' : '•'}</span>
              <span>{t('notify' + key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(''))}</span>
            </div>
          ))}
        </div>

        {HCAPTCHA_SITEKEY && (
          <div className="mt" style={{ minHeight: 70 }}>
            <HCaptcha sitekey={HCAPTCHA_SITEKEY} onVerify={setCaptcha} onExpire={() => setCaptcha(null)} />
          </div>
        )}

        {err && <p className="text-error mt">{err}</p>}
        <button className="btn-block mt" onClick={onSubmit} disabled={loading || selected.length === 0}>{t('send')}</button>

        <div className="mt2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canCall && (
            <button type="button" className="btn-ghost" onClick={onCall}>
              {t('call')}
            </button>
          )}
          {canTelegram && telegram && (
            <button type="button" className="btn-ghost" onClick={onCopyTelegram}>{t('telegramCopy')}</button>
          )}
        </div>
      </div>
    </div>
  );
}
