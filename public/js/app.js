(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const state = { whatsapp: null };

  const $ = (sel, root = document) => root.querySelector(sel);

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    children.flat().forEach((c) => c != null && node.append(c));
    return node;
  }

  function icon(id, cls = 'ico') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  }

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const kg = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const lower = (s) => String(s || '').toLowerCase();
  const idade = (m) => (m === 1 ? '1 mês' : `${m} meses`);

  // ---------- WhatsApp (RF05 / RN02) ----------
  function waLink(msg) {
    return `https://wa.me/${state.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  function applyWhatsApp(root = document) {
    root.querySelectorAll('.js-whatsapp').forEach((a) => {
      const msg = a.dataset.msg || 'Olá! Vim pelo site do Robany Bulls Poms.';
      if (state.whatsapp) {
        a.href = waLink(msg);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.removeAttribute('aria-disabled');
      } else {
        a.setAttribute('aria-disabled', 'true');
      }
    });
    if (state.whatsapp) document.querySelectorAll('.js-wa-note').forEach((n) => (n.hidden = true));
  }

  // ---------- Vitrine (RF01, RF02) ----------
  function cardAnimal(a) {
    const img = el('div', { class: 'card__img' });
    const ph = icon('i-paw', 'ico ph');
    if (a.imagem) {
      const pic = el('img', { src: a.imagem, alt: `Filhote ${a.nome}, ${a.raca}`, loading: 'lazy' });
      pic.addEventListener('error', () => { pic.remove(); img.prepend(ph); });
      img.append(pic);
    } else {
      img.append(ph);
    }
    img.append(el('span', { class: 'badge', text: 'Disponível' }));

    const fact = (label, value) => el('div', {}, el('dt', { text: label }), el('dd', { text: value }));
    const btn = el('a', { class: 'btn btn--moss js-whatsapp', href: '#contato',
      'data-msg': `Olá! Tenho interesse no(a) ${a.nome} (${a.raca}) que vi no site.` }, 'Tenho Interesse ', icon('i-chat'));

    return el('article', { class: 'card' },
      img,
      el('div', { class: 'card__body' },
        el('h3', { text: a.nome }),
        el('p', { class: 'card__raca', text: `Raça · ${a.raca}` }),
        el('dl', { class: 'facts' },
          fact('Cor', a.cor), fact('Sexo', lower(a.sexo)),
          fact('Idade', idade(a.idadeMeses)), fact('Peso', `${kg.format(a.pesoKg)} kg`)),
        el('div', { class: 'price' }, el('small', { text: 'Um novo começo' }), el('strong', { text: brl.format(a.preco) })),
        btn));
  }

  function renderAnimais(lista) {
    const grid = $('#grid');
    const empty = $('#empty');
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'false');
    const n = lista.length;
    $('#count').textContent = n === 1 ? '1 filhote' : `${n} filhotes`;
    if (!n) {
      grid.hidden = true;
      empty.hidden = false;
      $('#vitrineNote').hidden = true;
    } else {
      grid.hidden = false;
      empty.hidden = true;
      lista.forEach((a) => grid.append(cardAnimal(a)));
    }
    applyWhatsApp();
  }

  // ---------- Depoimentos (RF04) ----------
  function iniciais(nome) {
    return String(nome).replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  function renderDepoimentos(lista) {
    const box = $('#tests');
    const section = $('#depoimentos');
    if (!lista.length) { section.hidden = true; return; }
    lista.forEach((d) => {
      box.append(el('article', { class: 'test' },
        el('div', { class: 'stars', 'aria-label': `${d.estrelas || 5} de 5 estrelas`, text: '★'.repeat(d.estrelas || 5) }),
        el('blockquote', { text: `“${d.texto}”` }),
        el('div', { class: 'test__who' },
          el('span', { class: 'avatar', text: iniciais(d.nome) }),
          el('div', {}, el('strong', { text: d.nome }), el('small', { text: d.legenda || '' })))));
    });
  }

  // ---------- API ----------
  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  }

  async function init() {
    try {
      const cfg = await getJSON('/api/config');
      state.whatsapp = cfg.whatsapp;
    } catch (_) { /* botões ficam desabilitados */ }
    applyWhatsApp();

    getJSON('/api/animais')
      .then(renderAnimais)
      .catch(() => {
        $('#grid').setAttribute('aria-busy', 'false');
        $('#loading').textContent = 'Não foi possível carregar os filhotes agora. Tente novamente em instantes.';
      });

    getJSON('/api/depoimentos').then(renderDepoimentos).catch(() => { $('#depoimentos').hidden = true; });
  }

  // ---------- Menu mobile ----------
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  init();
})();
