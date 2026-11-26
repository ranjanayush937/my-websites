/* AWS Guide for data engineer interviews: hash-routed static app.
   Content comes from data/*.js via registry.js. */
(function () {
  const G = window.AWSGUIDE;
  const cats = G.cats;
  const $ = id => document.getElementById(id);
  const content = $('content'), sidebar = $('sidebar'), search = $('search');

  const PRI = { must: 'Must know', imp: 'Important', good: 'Good to know' };
  const RANK = { must: 0, imp: 1, good: 2 };
  let filter = 'all';

  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k === 'text') e.textContent = props[k];
      else e.setAttribute(k, props[k]);
    }
    kids.flat().forEach(k => k != null && e.append(k));
    return e;
  }
  // Text with `inline code` support.
  function rich(text) {
    return String(text).split('`').map((part, i) => i % 2 ? el('code', { class: 'inline', text: part }) : part);
  }
  const p = (text, cls) => el('p', cls ? { class: cls } : null, rich(text));

  let all = [];
  function prepare() {
    cats.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    all = [];
    cats.forEach(c => {
      c.services.forEach(s => {
        const x = G.extras[s.id];
        if (x) {
          if (x.priority) s.priority = x.priority;
          if (x.interview) s.interview = (s.interview || []).concat(x.interview);
        }
        s.cat = c;
      });
      // Stable sort: must-know first, then important, then good to know, then unranked.
      c.services.sort((a, b) => (RANK[a.priority] ?? 3) - (RANK[b.priority] ?? 3));
      c.services.forEach(s => all.push(s));
    });
  }
  const byId = id => all.find(s => s.id === id);
  const qCount = () => all.reduce((n, s) => n + (s.interview ? s.interview.length : 0), 0);

  /* ---------- Sidebar ---------- */
  function buildNav() {
    sidebar.replaceChildren(
      el('a', { href: '#/', 'data-id': '', text: 'Home' }),
      el('a', { href: '#/interview-qa', 'data-id': 'interview-qa', text: 'All interview Q&A (' + qCount() + ')' }));
    cats.forEach(c => {
      sidebar.append(el('h3', { text: c.title }));
      c.services.forEach(s => sidebar.append(el('a', { href: '#/' + s.id, 'data-id': s.id, text: s.name })));
    });
  }
  function markActive(id) {
    sidebar.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.id === id));
  }

  /* ---------- Shared pieces ---------- */
  function badge(s) {
    return s.priority ? el('span', { class: 'badge pri-' + s.priority, text: PRI[s.priority] }) : null;
  }
  function card(s) {
    return el('a', { class: 'card', href: '#/' + s.id },
      el('div', { class: 't' }, s.name, ' ', badge(s)),
      el('div', { class: 'd', text: s.short }));
  }
  function list(title, items, ordered) {
    if (!items || !items.length) return [];
    return [el('h2', { text: title }),
      el(ordered ? 'ol' : 'ul', { class: 'list' }, items.map(i => el('li', null, rich(i))))];
  }
  function table(t) {
    return el('div', { class: 'tablewrap' }, el('table', null,
      el('thead', null, el('tr', null, t.head.map(h => el('th', null, rich(h))))),
      el('tbody', null, t.rows.map(r => el('tr', null, r.map((c, i) =>
        el(i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row' } : null, rich(c))))))));
  }
  function codeBlock(lang, code) {
    const btn = el('button', { class: 'copy', type: 'button', text: 'Copy' });
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(code); }
      catch {
        const ta = el('textarea'); ta.value = code; document.body.append(ta); ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
    return el('pre', null, el('span', { class: 'lang', text: lang || 'bash' }), btn, el('code', { text: code }));
  }
  function qa(item) {
    const answer = String(item.a).split('\n\n').map(t => p(t));
    return el('details', { class: 'qa' }, el('summary', null, rich(item.q)), el('div', { class: 'ans' }, answer));
  }
  function section(sec) {
    const out = [el('h2', { text: sec.title })];
    if (sec.text) out.push(p(sec.text));
    if (sec.list) out.push(el(sec.ordered ? 'ol' : 'ul', { class: 'list' }, sec.list.map(i => el('li', null, rich(i)))));
    if (sec.table) out.push(table(sec.table));
    if (sec.code) out.push(codeBlock(sec.code.lang, sec.code.code));
    return out;
  }

  /* ---------- Views ---------- */
  function home() {
    document.title = 'AWS Guide for Data Engineers';
    const v = [
      el('h1', { text: 'AWS for Data Engineer Interviews' }),
      p('Built for a data engineer with about 4 years of experience. ' + all.length + ' pages, ' + qCount() + ' interview questions with answers, design walkthroughs and service comparisons.', 'lead'),
      el('div', { class: 'grid start' },
        el('a', { class: 'card', href: '#/prep-guide' }, el('div', { class: 't', text: 'Start here: how to prepare' }), el('div', { class: 'd', text: 'What interviewers expect and a study order.' })),
        el('a', { class: 'card', href: '#/interview-qa' }, el('div', { class: 't', text: 'Q&A revision mode' }), el('div', { class: 'd', text: 'Every question in one list, tap to reveal.' })))
    ];
    const chips = el('div', { class: 'chips filter', role: 'group', 'aria-label': 'Filter by priority' });
    [['all', 'All'], ['must', 'Must know'], ['imp', 'Important'], ['good', 'Good to know']].forEach(([k, label]) => {
      const b = el('button', { type: 'button', class: filter === k ? 'on' : '', text: label });
      b.addEventListener('click', () => { filter = k; route(); });
      chips.append(b);
    });
    v.push(chips);
    cats.forEach(c => {
      const items = c.services.filter(s => filter === 'all' || s.priority === filter);
      if (!items.length) return;
      v.push(el('h2', { class: 'cat-title', text: c.title }), el('div', { class: 'grid' }, items.map(card)));
    });
    return v;
  }

  function service(s) {
    document.title = s.name + ' | AWS Guide';
    const v = [
      el('div', { class: 'crumb' }, el('a', { href: '#/', text: 'Home' }), ' / ' + s.cat.title),
      el('h1', null, s.name, ' ', badge(s)),
      p(s.short, 'lead')
    ];
    if (s.overview) v.push(el('h2', { text: 'Overview' }), p(s.overview));
    v.push(...list('When to use it', s.whenToUse), ...list('Key concepts', s.concepts), ...list('Use cases', s.useCases));
    (s.sections || []).forEach(sec => v.push(...section(sec)));
    if (s.examples && s.examples.length) {
      v.push(el('h2', { text: 'Practical examples' }));
      s.examples.forEach(x => v.push(el('div', { class: 'ex' },
        el('h3', { text: x.title }), x.desc ? p(x.desc) : null, codeBlock(x.lang, x.code))));
    }
    if (s.interview && s.interview.length) {
      v.push(el('h2', { text: 'Interview questions (' + s.interview.length + ')' }),
        p('Tap a question to reveal a model answer. Say it in your own words and tie it to a project you worked on.', 'hint'),
        ...s.interview.map(qa));
    }
    if (s.pricing) v.push(el('h2', { text: 'Pricing' }), el('div', { class: 'note' }, rich(s.pricing)));
    v.push(...list('Best practices', s.tips));
    if (s.related && s.related.length) {
      v.push(el('h2', { text: 'Related services' }),
        el('div', { class: 'chips' }, s.related.map(id => {
          const r = byId(id);
          return r ? el('a', { href: '#/' + id, text: r.name }) : null;
        })));
    }
    const i = all.indexOf(s);
    const prev = all[i - 1], next = all[i + 1];
    v.push(el('div', { class: 'pager' },
      prev ? el('a', { class: 'card', href: '#/' + prev.id }, el('div', { class: 'd', text: 'Previous' }), el('div', { class: 't', text: prev.name })) : el('span'),
      next ? el('a', { class: 'card', href: '#/' + next.id, style: 'text-align:right' }, el('div', { class: 'd', text: 'Next' }), el('div', { class: 't', text: next.name })) : el('span')));
    return v;
  }

  function allQA() {
    document.title = 'Interview Q&A | AWS Guide';
    const v = [el('h1', { text: 'All interview Q&A' }), p(qCount() + ' questions grouped by page.', 'lead')];
    const bar = el('div', { class: 'chips filter' });
    const toggle = el('button', { type: 'button', text: 'Expand all' });
    toggle.addEventListener('click', () => {
      const open = toggle.textContent === 'Expand all';
      content.querySelectorAll('details.qa').forEach(d => { d.open = open; });
      toggle.textContent = open ? 'Collapse all' : 'Expand all';
    });
    bar.append(toggle);
    v.push(bar);
    all.filter(s => s.interview && s.interview.length).forEach(s => {
      v.push(el('h2', null, el('a', { href: '#/' + s.id, text: s.name }), ' ', badge(s)), ...s.interview.map(qa));
    });
    return v;
  }

  function results(q) {
    const t = q.toLowerCase();
    const hay = s => [s.name, s.short, s.overview, s.cat.title, (s.useCases || []).join(' '),
      (s.interview || []).map(i => i.q + ' ' + i.a).join(' ')].join(' ').toLowerCase();
    const hits = all.filter(s => hay(s).includes(t));
    return [el('h1', { text: 'Search' }),
      p(hits.length + ' result' + (hits.length === 1 ? '' : 's') + ' for "' + q + '" (includes interview answers)', 'lead'),
      hits.length ? el('div', { class: 'grid' }, hits.map(card)) : el('div', { class: 'empty', text: 'Nothing matches.' })];
  }

  /* ---------- Routing ---------- */
  function route() {
    closeMenu();
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const s = id && byId(id);
    markActive(s ? s.id : id === 'interview-qa' ? id : '');
    if (search.value.trim() && !s && id !== 'interview-qa') { content.replaceChildren(...results(search.value.trim())); return; }
    const view = s ? service(s) : id === 'interview-qa' ? allQA() : home();
    const y = window.scrollY;
    content.replaceChildren(...view);
    window.scrollTo(0, s || id === 'interview-qa' || location.hash !== lastHash ? 0 : y);
    lastHash = location.hash;
  }
  let lastHash = null;

  /* ---------- Search ---------- */
  search.addEventListener('input', () => {
    const q = search.value.trim();
    if (q) content.replaceChildren(...results(q));
    else route();
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); search.focus();
    }
  });
  content.addEventListener('click', e => {
    if (e.target.closest('a[href^="#/"]')) search.value = '';
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('menu-btn'), scrim = $('scrim');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    scrim.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  function closeMenu() { setMenu(false); }
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  scrim.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Theme ---------- */
  $('theme-btn').addEventListener('click', () => {
    const next = (document.documentElement.dataset.theme || 'dark') === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('aws-guide-theme', next); } catch {}
  });

  prepare();
  buildNav();
  window.addEventListener('hashchange', route);
  route();
})();
