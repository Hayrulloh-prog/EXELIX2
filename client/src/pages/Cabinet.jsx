import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerMe, ownerUpdate, ownerAddTelegram, ownerAtCar, ownerPushSub } from '../api';
import { useToast } from '../components/Toast';
import { Header } from '../components/Header';

export default function Cabinet({ theme, onTheme }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [user, setUser] = useState(loc.state?.user || null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editPhoto, setEditPhoto] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [modalTelegram, setModalTelegram] = useState(false);
  const [tgInput, setTgInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await ownerMe();
        setUser(u);
        setEditName(u.name);
        setEditSurname(u.surname);
        setEditPhone(u.phone);
        setEditTelegram(u.telegram || '');
        if (u.lang && u.lang !== i18n.language) i18n.changeLanguage(u.lang);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, i18n]);

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const photoUrl = (p) => (p && (p.startsWith('http') || p.startsWith('/')) ? p : null);

  const onInstall = () => {
    if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice?.then(() => setInstallPrompt(null)); }
    else toast(t('installApp'));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const u = await ownerUpdate({
        name: editName,
        surname: editSurname,
        phone: editPhone,
        telegram: editTelegram || undefined,
        photo: editPhoto,
        lang: i18n.language,
      });
      setUser(u.user);
      setEdit(false);
      setEditPhoto(null);
      setEditPhotoPreview(null);
      toast(t('saveSuccess'));
    } catch {
      toast(t('errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  const onAddTelegram = async () => {
    const v = tgInput.trim();
    if (!v) return;
    try {
      await ownerAddTelegram(v);
      setUser((u) => ({ ...u, telegram: v }));
      setModalTelegram(false);
      setTgInput('');
      toast(t('addTelegramSuccess'));
    } catch {
      toast(t('errorGeneric'));
    }
  };

  const onAtCar = async () => {
    try {
      await ownerAtCar(!user?.at_car);
      setUser((u) => ({ ...u, at_car: !u?.at_car }));
      toast(user?.at_car ? t('atCarOff') : t('atCar'));
    } catch {
      toast(t('errorGeneric'));
    }
  };

  const onPhotoEdit = (e) => {
    const f = e.target.files?.[0];
    if (f) { setEditPhoto(f); setEditPhotoPreview(URL.createObjectURL(f)); }
  };

  const requestPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC || undefined,
      });
      if (sub) await ownerPushSub(sub.toJSON());
    } catch (e) { /* ignore */ }
  };
  useEffect(() => { requestPush(); }, []);

  if (loading || !user) return <div className="page"><Header theme={theme} onTheme={onTheme} /><div className="container text-center">{t('loading')}</div></div>;

  const avatar = editPhotoPreview || photoUrl(user.photo);

  return (
    <div className="page">
      <Header theme={theme} onTheme={onTheme} />
      <div className="container">
        {(installPrompt || /standalone|android|iphone/i.test(navigator.userAgent)) && (
          <button className="btn-block mb btn-ghost" onClick={onInstall}>{t('installApp')}</button>
        )}

        {!edit ? (
          <>
            <div className="card text-center">
              <img src={avatar || '/favicon.svg'} alt="" className="avatar avatar-lg" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 4px' }}>{user.name} {user.surname}</h3>
              <p className="text-muted" style={{ margin: 0 }}>{user.phone}</p>
              {user.telegram && <p className="text-muted" style={{ margin: '4px 0 0' }}>@{user.telegram.replace(/^@/, '')}</p>}
              {!user.telegram && (
                <button className="btn-ghost mt" onClick={() => setModalTelegram(true)}>{t('addTelegram')}</button>
              )}
            </div>
            <button className="btn-block mt" onClick={() => setEdit(true)}>{t('edit')}</button>
            <button className="btn-block mt btn-ghost" onClick={onAtCar}>
              {user.at_car ? '✓ ' : ''}{t('atCar')}
            </button>
          </>
        ) : (
          <div className="card">
            <h3 className="mb">{t('edit')}</h3>
            <div className="form-group">
              <label>{t('formName')}</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('formSurname')}</label>
              <input value={editSurname} onChange={(e) => setEditSurname(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('formPhoto')}</label>
              <div className="photo-upload">
                {(editPhotoPreview || user.photo) && (
                  <img src={editPhotoPreview || photoUrl(user.photo)} alt="" className="preview" />
                )}
                <input type="file" accept="image/*" onChange={onPhotoEdit} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('formPhone')}</label>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('formTelegram')}</label>
              <input value={editTelegram} onChange={(e) => setEditTelegram(e.target.value)} placeholder="@username" />
            </div>
            <button className="btn-block mt" onClick={onSave} disabled={saving}>{t('save')}</button>
            <button className="btn-block mt btn-ghost" onClick={() => { setEdit(false); setEditPhoto(null); setEditPhotoPreview(null); }}>{t('cancel')}</button>
          </div>
        )}
      </div>

      {modalTelegram && (
        <div className="modal-backdrop" onClick={() => setModalTelegram(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb">{t('addTelegram')}</h3>
            <input value={tgInput} onChange={(e) => setTgInput(e.target.value)} placeholder="@username" />
            <button className="btn-block mt" onClick={onAddTelegram}>{t('add')}</button>
            <button className="btn-block mt btn-ghost" onClick={() => setModalTelegram(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
