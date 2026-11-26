// FunpayHub: лёгкий загрузчик. Кнопка в шапке, акцентный цвет, снег.
// Тяжёлая панель (content/panel.js) подгружается только при первом открытии.
(() => {
  'use strict';
  if (window.top !== window.self) return;

  const GRID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>';
  let S = { ...FP_DEFAULTS };
  let btn = null;
  let panelReq = null;

  /* ---------- акцент и снег ---------- */
  function applyAccent() {
    document.documentElement.style.setProperty('--fph-acc', S.accent || '#e8590c');
  }
  let snowCv = null;
  let snowRaf = 0;
  let snowFit = null;
  function setSnow(on) {
    if (!on) {
      if (snowCv) {
        cancelAnimationFrame(snowRaf);
        removeEventListener('resize', snowFit);
        snowCv.remove();
        snowCv = null;
      }
      return;
    }
    if (snowCv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147482000';
    document.body.appendChild(cv);
    snowCv = cv;
    const ctx = cv.getContext('2d');
    let W = 0;
    let H = 0;
    snowFit = () => {
      W = cv.width = innerWidth;
      H = cv.height = innerHeight;
    };
    snowFit();
    addEventListener('resize', snowFit);
    const flakes = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.2, v: 0.4 + Math.random(), d: Math.random() * 6 }));
    const frame = () => {
      // не рисуем, пока вкладка в фоне
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(110,140,200,.75)';
        for (const f of flakes) {
          f.y += f.v;
          f.d += 0.01;
          f.x += Math.sin(f.d) * 0.5;
          if (f.y > H) {
            f.y = -5;
            f.x = Math.random() * W;
          }
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, 6.283);
          ctx.fill();
        }
      }
      snowRaf = requestAnimationFrame(frame);
    };
    frame();
  }
  function applyAll() {
    applyAccent();
    setSnow(!!S.effectSnow);
  }

  /* ---------- подгрузка панели ---------- */
  function ensurePanel() {
    if (globalThis.__fphPanel) return Promise.resolve(globalThis.__fphPanel);
    if (!panelReq) {
      panelReq = chrome.runtime
        .sendMessage({ type: 'loadPanel' })
        .then((r) => {
          if (!r || !r.ok || !globalThis.__fphPanel) throw new Error((r && r.error) || 'не удалось загрузить панель');
          return globalThis.__fphPanel;
        })
        .catch((e) => {
          panelReq = null;
          throw e;
        });
    }
    return panelReq;
  }

  /* ---------- кнопка в шапке рядом с профилем ---------- */
  function makeBtn() {
    const a = document.createElement('a');
    a.id = 'fph-open-btn';
    a.className = 'fph-hdr-btn';
    a.href = '#';
    a.title = 'FunpayHub';
    a.setAttribute('role', 'button');
    a.innerHTML = GRID;
    // прогреваем панель при наведении — первый клик открывается мгновенно
    a.addEventListener('pointerenter', () => ensurePanel().catch(() => {}), { once: true });
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      ensurePanel().then((p) => p.toggle(), (err) => console.warn('FunpayHub:', err.message));
    });
    return a;
  }
  function placeButton() {
    const user = document.querySelector('.user-link');
    const li = user && user.closest('li');
    const floating = btn && btn.classList.contains('fph-float');
    if (btn && btn.isConnected && !(floating && li)) return;
    if (btn) (btn.closest('.fph-hdr-li') || btn).remove();
    btn = makeBtn();
    if (li && li.parentElement) {
      const wrapLi = document.createElement('li');
      wrapLi.className = 'fph-hdr-li';
      wrapLi.appendChild(btn);
      li.parentElement.insertBefore(wrapLi, li);
    } else {
      btn.classList.add('fph-float');
      document.body.appendChild(btn);
    }
  }

  /* ---------- запуск ---------- */
  fpGetSettings().then((s) => {
    S = s;
    applyAll();
    placeButton();
    setInterval(() => {
      if (!document.hidden) placeButton();
    }, 4000);
  });
  chrome.storage.onChanged.addListener((ch) => {
    if (ch.settings) {
      S = { ...FP_DEFAULTS, ...(ch.settings.newValue || {}) };
      applyAll();
    }
  });
})();
