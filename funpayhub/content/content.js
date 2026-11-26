// Контент-скрипт: быстрые ответы в чате + статистика на странице заказов
(() => {
  'use strict';
  let settings = { ...FP_DEFAULTS };
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- быстрые ответы ---------- */
  function buyerName() {
    const el = $('.chat-header .media-user-name') || $('.chat-full-header .media-user-name');
    if (!el) return '';
    const a = el.querySelector('a');
    return ((a ? a.textContent : (el.firstChild && el.firstChild.textContent) || '') + '').trim();
  }

  function applyVars(text) {
    return text
      .replace(/\{buyer\}/gi, buyerName())
      .replace(/\s+([!.,?])/g, '$1')
      .replace(/,\s*([!.?])/g, '$1')
      .replace(/ {2,}/g, ' ');
  }

  function composeText(text) {
    let out = applyVars(text);
    if (settings.signatureEnabled && settings.signature) out += '\n' + settings.signature;
    return out;
  }

  function fillChat(text) {
    const ta = $('.chat-form textarea');
    if (!ta) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, composeText(text));
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    if (settings.sendInstantly) {
      const form = ta.closest('form');
      const btn = form && form.querySelector('button[type="submit"], button.btn, .btn');
      if (btn) btn.click();
      else if (form && form.requestSubmit) form.requestSubmit();
    }
  }

  function renderQuickReplies() {
    const form = $('.chat-form');
    const old = $('.fph-qr');
    if (!form || !form.querySelector('textarea')) {
      if (old) old.remove();
      return;
    }
    const buyer = buyerName();
    const blacklisted = !!buyer && (settings.blacklist || []).some((n) => n.toLowerCase() === buyer.toLowerCase());
    const sig = JSON.stringify([settings.templates, settings.blacklist, buyer]);
    if (old && old.dataset.sig === sig) return;
    if (old) old.remove();

    const bar = document.createElement('div');
    bar.className = 'fph-qr';
    bar.dataset.sig = sig;
    const label = document.createElement('span');
    label.className = 'fph-qr-label';
    label.textContent = 'Быстрые ответы';
    bar.appendChild(label);
    (settings.templates || []).forEach((t) => {
      if (!t.title) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fph-qr-btn';
      b.textContent = t.title;
      b.title = t.text;
      b.addEventListener('click', () => fillChat(t.text));
      bar.appendChild(b);
    });
    if (blacklisted) {
      const w = document.createElement('span');
      w.className = 'fph-bl-warn';
      w.textContent = '⚠ Покупатель в чёрном списке';
      bar.prepend(w);
    } else if (buyer) {
      const bl = document.createElement('button');
      bl.type = 'button';
      bl.className = 'fph-qr-btn danger';
      bl.textContent = '🚫 В ЧС';
      bl.title = 'Добавить покупателя в чёрный список';
      bl.addEventListener('click', () => fpSetSettings({ blacklist: [...(settings.blacklist || []), buyer] }));
      bar.appendChild(bl);
    }
    form.parentNode.insertBefore(bar, form);
  }

  /* ---------- статистика заказов ---------- */
  function parseMoney(t) {
    const s = (t || '').replace(/\u00a0/g, ' ').trim();
    const m = s.match(/([\d\s]+(?:[.,]\d+)?)\s*(\S*)/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(n) ? null : { n, cur: m[2] || '₽' };
  }
  const fmt = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  function renderStats() {
    const old = $('.fph-stats');
    const onOrders = /^\/orders\/(trade\/?)?$/.test(location.pathname);
    const rows = onOrders ? document.querySelectorAll('a.tc-item') : [];
    if (!settings.ordersStats || !rows.length) {
      if (old) old.remove();
      return;
    }
    const totals = {}; // cur -> {closed, paid, refund}
    rows.forEach((row) => {
      const status = ((row.querySelector('.tc-status') || {}).textContent || '').toLowerCase();
      const money = parseMoney((row.querySelector('.tc-price') || {}).textContent);
      if (!money) return;
      const key = status.includes('закры') ? 'closed' : status.includes('оплач') ? 'paid' : status.includes('возврат') ? 'refund' : null;
      if (!key) return;
      totals[money.cur] = totals[money.cur] || { closed: 0, paid: 0, refund: 0 };
      totals[money.cur][key] += money.n;
    });

    const parts = Object.entries(totals).map(([cur, t]) => {
      const bits = [];
      if (t.closed) bits.push(`<span class="ok">закрыто ${fmt(t.closed)} ${cur}</span>`);
      if (t.paid) bits.push(`<span class="warn">в работе ${fmt(t.paid)} ${cur}</span>`);
      if (t.refund) bits.push(`<span class="bad">возвраты ${fmt(t.refund)} ${cur}</span>`);
      return bits.join(' &nbsp; ');
    });
    const html = `<b>На странице: ${rows.length} заказов</b>` + (parts.length ? ' &nbsp;|&nbsp; ' + parts.join(' &nbsp;|&nbsp; ') : '');

    let panel = old;
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'fph-stats';
      rows[0].parentElement.parentElement.insertBefore(panel, rows[0].parentElement);
    }
    if (panel.dataset.sig !== html) {
      panel.dataset.sig = html;
      panel.innerHTML = html;
    }
  }

  /* ---------- слэш-команды: «/приветствие » -> текст шаблона ---------- */
  document.addEventListener('input', (e) => {
    const ta = e.target;
    if (!settings.slashEnabled || !(ta instanceof HTMLTextAreaElement) || !ta.closest('.chat-form')) return;
    const m = ta.value.match(/^\/(\S+)\s$/);
    if (!m) return;
    const t = (settings.templates || []).find((x) => fpSlug(x.title) === m[1].toLowerCase());
    if (!t) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, composeText(t.text));
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });

  /* ---------- запуск ---------- */
  function refresh() {
    renderQuickReplies();
    renderStats();
  }
  let timer = null;
  const schedule = () => {
    if (!/^\/(chat|orders)/.test(location.pathname)) return;
    clearTimeout(timer);
    timer = setTimeout(refresh, 300);
  };

  fpGetSettings().then((s) => {
    settings = s;
    refresh();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      fpGetSettings().then((s) => {
        settings = s;
        refresh();
      });
    }
  });
})();
