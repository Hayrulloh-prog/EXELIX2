import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register as apiRegister } from '../api';
import { useToast } from '../components/Toast';
import { Header } from '../components/Header';

const API = import.meta.env.VITE_API_URL || '';

export default function Register({ theme, onTheme }) {
  const [search] = useSearchParams();
  const qrCode = search.get('qr') || '';
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [profileOpen, setProfileOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!qrCode) navigate('/');
  }, [qrCode, navigate]);

  const onPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const canNext = () => name.trim() && surname.trim() && phone.trim() && photo;

  const onNext = () => {
    setErr('');
    if (!canNext()) { setErr(t('errorGeneric')); return; }
    setStep(2);
  };

  const onSubmit = async () => {
    setErr('');
    setLoading(true);
    try {
      await apiRegister({
        qrCode,
        name: name.trim(),
        surname: surname.trim(),
        photo,
        phone: phone.trim(),
        telegram: telegram.trim() || undefined,
        profileOpen,
        lang: i18n.language,
      });
      toast(t('registerSuccess'));
      navigate('/cabinet', { replace: true });
    } catch (e) {
      setErr(e.message === 'QR_ALREADY_ACTIVE' || e.message === 'QR_NOT_FOUND' ? t('errorGeneric') : t('errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  if (!qrCode) return null;

  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container">
        {step === 1 && (
          <>
            <h2 className="text-center mb">{t('register')}</h2>
            <div className="form-group">
              <label>{t('formName')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('formName')} />
            </div>
            <div className="form-group">
              <label>{t('formSurname')}</label>
              <input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder={t('formSurname')} />
            </div>
            <div className="form-group">
              <label>{t('formPhoto')}</label>
              <div className="photo-upload">
                {photoPreview && <img src={photoPreview} alt="" className="preview" />}
                <input type="file" accept="image/*" capture="user" onChange={onPhoto} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('formPhone')}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+996..." />
            </div>
            <div className="form-group">
              <label>{t('formTelegram')} <span className="text-muted">{t('formOptional')}</span></label>
              <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
            </div>
            {err && <p className="text-error mb">{err}</p>}
            <button className="btn-block mt" onClick={onNext} disabled={!canNext()}>{t('next')}</button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-center mb">{t('register')}</h2>
            <p className="text-muted text-center mb">{t('profileOpenHint')}</p>
            <div
              className={`card card-select ${profileOpen ? 'selected' : ''}`}
              onClick={() => setProfileOpen(true)}
              style={{ marginBottom: 12 }}
            >
              <strong>{t('profileOpen')}</strong>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '.9rem' }}>{t('profileOpenHint')}</p>
            </div>
            <div
              className={`card card-select ${!profileOpen ? 'selected' : ''}`}
              onClick={() => setProfileOpen(false)}
              style={{ marginBottom: 16 }}
            >
              <strong>{t('profileClosed')}</strong>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '.9rem' }}>{t('profileClosedHint')}</p>
            </div>
            {err && <p className="text-error mb">{err}</p>}
            <button className="btn-block mt" onClick={() => setStep(1)} style={{ background: 'transparent', color: 'var(--text)' }}>{'← '}{t('edit')}</button>
            <button className="btn-block mt" onClick={onSubmit} disabled={loading}>{t('register')}</button>
          </>
        )}
      </div>
    </div>
  );
}
