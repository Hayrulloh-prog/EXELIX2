import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchQrInfo } from '../api';
import { Header } from '../components/Header';

export default function QrGate({ theme, onTheme }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const d = await fetchQrInfo(code);
        if (!m) return;
        if (d.action === 'register') {
          navigate(`/register?qr=${d.qrCode}`, { replace: true });
          return;
        }
        if (d.action === 'cabinet') {
          navigate('/cabinet', { state: { user: d.user }, replace: true });
          return;
        }
        if (d.action === 'notify') {
          navigate('/notify', {
            state: { qrCode: d.qrCode, owner: d.owner, canCall: d.canCall, canTelegram: d.canTelegram, telegram: d.telegram, phone: d.phone },
            replace: true,
          });
          return;
        }
        setErr(t('errorGeneric'));
      } catch (e) {
        if (!m) return;
        setErr(e.message === 'QR_NOT_FOUND' ? t('errorGeneric') : t('errorNetwork'));
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => { m = false; };
  }, [code, navigate, t]);

  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container text-center mt2">
        {loading && <p className="text-muted">{t('loading')}</p>}
        {err && !loading && <p className="text-error">{err}</p>}
      </div>
    </div>
  );
}
