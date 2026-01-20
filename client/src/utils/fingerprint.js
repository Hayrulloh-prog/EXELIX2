export function getFingerprint() {
  try {
    const s = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h = ((h << 5) - h) + c;
      h = h & h;
    }
    return 'fp_' + Math.abs(h).toString(36);
  } catch {
    return null;
  }
}
