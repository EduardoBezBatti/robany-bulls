(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const state = { section: 'animais', animais: [], depoimentos: [], editId: null, deleteId: null };
  const schemas = {
    animais: [
      ['nome', 'Nome', 'text', true, 100], ['raca', 'Raça', 'text', true, 100],
      ['cor', 'Cor', 'text', true, 100], ['sexo', 'Sexo', ['Macho', 'Fêmea'], true],
      ['idadeMeses', 'Idade (meses)', 'number', true], ['pesoKg', 'Peso (kg)', 'number', true],
      ['preco', 'Preço (R$)', 'number', true], ['status', 'Disponibilidade', ['Disponível', 'Reservado', 'Vendido'], true],
      ['imagem', 'Foto (URL HTTPS ou /img/arquivo.jpg)', 'text', false, 2048],
    ],
    depoimentos: [
      ['nome', 'Nome do cliente', 'text', true, 100], ['legenda', 'Legenda', 'text', false, 160],
      ['texto', 'Depoimento', 'textarea', true, 3000], ['estrelas', 'Estrelas', ['1', '2', '3', '4', '5'], true],
      ['autorizado', 'Tenho autorização para publicar este depoimento', 'checkbox', false],
    ],
  };
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function notice(message = '', error = false) {
    $('#notice').textContent = message;
    $('#notice').classList.toggle('error', error);
  }
  function showLogin() {
    $('#dashboard').hidden = true;
    $('#login').hidden = false;
    $('#editor').close();
    $('#delete-dialog').close();
    state.animais = [];
    state.depoimentos = [];
    $('#records').replaceChildren();
    $('#stats').replaceChildren();
    $('#identity').textContent = '';
    $('#password-form').reset();
  }
  async function api(url, { method = 'GET', body } = {}) {
    const response = await fetch(url, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && !url.includes('/sign-in/')) showLogin();
      if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
      if (url.includes('/sign-in/') && response.status !== 503) throw new Error('E-mail ou senha incorretos.');
      throw new Error(data?.erro || (response.status === 503 ? 'Acesso ainda não configurado. Contate o responsável pelo site.' : 'Não foi possível concluir a operação. Confira os dados e tente novamente.'));
    }
    return data;
  }
  async function busy(button, action) {
    button.disabled = true;
    try { await action(); } finally { button.disabled = false; }
  }
  async function load() {
    [state.animais, state.depoimentos] = await Promise.all([api('/api/admin/animais'), api('/api/admin/depoimentos')]);
    render();
  }
  function render() {
    $('#stats').replaceChildren(...[
      [state.animais.length, 'Filhotes cadastrados'],
      [state.animais.filter(a => a.status === 'Disponível').length, 'Disponíveis'],
      [state.depoimentos.filter(d => d.autorizado).length, 'Depoimentos publicados'],
    ].map(([count, label]) => {
      const element = node('div', undefined, 'stat');
      element.append(node('strong', count), node('span', label));
      return element;
    }));
    $('#new-record').textContent = state.section === 'animais' ? '+ Novo filhote' : '+ Novo depoimento';
    const records = state[state.section];
    $('#records').replaceChildren(...records.map(record => {
      const article = node('article', undefined, 'record');
      const content = node('div', undefined, 'record-content');
      content.append(node('h3', record.nome), node('p', state.section === 'animais'
        ? `${record.raca} · ${record.sexo} · ${record.idadeMeses} meses · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.preco)}`
        : record.texto));
      content.append(node('span', state.section === 'animais' ? record.status : (record.autorizado ? 'Publicado com autorização' : 'Não publicado'), 'record-status'));
      const actions = node('div', undefined, 'record-actions');
      const edit = node('button', 'Editar', 'btn btn--outline');
      edit.type = 'button'; edit.setAttribute('aria-label', `Editar ${record.nome}`);
      edit.addEventListener('click', () => openEditor(record));
      const remove = node('button', 'Excluir', 'btn btn--outline');
      remove.type = 'button'; remove.setAttribute('aria-label', `Excluir ${record.nome}`);
      remove.addEventListener('click', () => {
        state.deleteId = record._id;
        $('#delete-description').textContent = `“${record.nome}” será excluído. Esta ação não pode ser desfeita.`;
        $('#delete-error').textContent = '';
        $('#delete-dialog').showModal();
      });
      actions.append(edit, remove); article.append(content, actions);
      return article;
    }));
    if (!records.length) $('#records').append(node('p', 'Nenhum registro por aqui. Use o botão acima para começar.', 'record'));
  }
  function openEditor(record = {}) {
    state.editId = record._id || null;
    $('#editor-title').textContent = state.section === 'animais' ? (state.editId ? 'Editar filhote' : 'Novo filhote') : (state.editId ? 'Editar depoimento' : 'Novo depoimento');
    $('#editor-error').textContent = '';
    $('#fields').replaceChildren(...schemas[state.section].map(([key, title, type, required, max]) => {
      const label = node('label');
      const input = document.createElement(Array.isArray(type) ? 'select' : type === 'textarea' ? 'textarea' : 'input');
      input.name = key; input.required = required;
      if (Array.isArray(type)) {
        type.forEach(value => { const option = node('option', value); option.value = value; input.append(option); });
      } else if (type !== 'textarea') input.type = type;
      if (max) input.maxLength = max;
      if (type === 'number') { input.min = '0'; input.step = 'any'; }
      if (type === 'checkbox') { input.checked = record[key] === true; label.className = 'checkbox-label full-width'; label.append(input, node('span', title)); }
      else {
        input.value = record[key] ?? (key === 'estrelas' ? '5' : key === 'status' ? 'Disponível' : Array.isArray(type) ? type[0] : '');
        label.append(node('span', title), input);
      }
      if (['imagem', 'texto'].includes(key)) label.classList.add('full-width');
      return label;
    }));
    $('#editor').showModal();
  }
  $('#login-form').addEventListener('submit', event => {
    event.preventDefault();
    busy(event.submitter, async () => {
      try {
        const data = Object.fromEntries(new FormData(event.target));
        await api('/api/auth/sign-in/email', { method: 'POST', body: { ...data, rememberMe: false } });
        event.target.reset(); await initialize();
      } catch (error) { notice(error.message, true); }
    });
  });
  $('#logout').addEventListener('click', event => busy(event.target, async () => {
    try { await api('/api/auth/sign-out', { method: 'POST', body: {} }); showLogin(); notice('Você saiu da conta.'); }
    catch (error) { notice(error.message, true); }
  }));
  document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => {
    state.section = button.dataset.section;
    document.querySelectorAll('[data-section]').forEach(item => {
      item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  }));
  $('#new-record').addEventListener('click', () => openEditor());
  $('#close-editor').addEventListener('click', () => $('#editor').close());
  $('#cancel-editor').addEventListener('click', () => $('#editor').close());
  $('#cancel-delete').addEventListener('click', () => $('#delete-dialog').close());
  $('#record-form').addEventListener('submit', event => {
    event.preventDefault();
    busy(event.submitter, async () => {
      try {
        const form = new FormData(event.target), body = {};
        schemas[state.section].forEach(([key, , type]) => {
          body[key] = type === 'checkbox' ? form.has(key) : (type === 'number' || key === 'estrelas' ? Number(form.get(key)) : form.get(key));
        });
        await api(`/api/admin/${state.section}${state.editId ? '/' + state.editId : ''}`, { method: state.editId ? 'PATCH' : 'POST', body });
        $('#editor').close(); notice('Registro salvo. A vitrine já pode exibir a atualização.'); await load();
      } catch (error) { $('#editor-error').textContent = error.message; notice(error.message, true); }
    });
  });
  $('#confirm-delete').addEventListener('click', event => busy(event.target, async () => {
    try {
      await api(`/api/admin/${state.section}/${state.deleteId}`, { method: 'DELETE' });
      $('#delete-dialog').close(); notice('Registro excluído.'); await load();
    } catch (error) { $('#delete-error').textContent = error.message; notice(error.message, true); }
  }));
  $('#password-form').addEventListener('submit', event => {
    event.preventDefault();
    busy(event.submitter, async () => {
      try {
        await api('/api/auth/change-password', { method: 'POST', body: { ...Object.fromEntries(new FormData(event.target)), revokeOtherSessions: true } });
        event.target.reset(); notice('Senha atualizada. As outras sessões foram encerradas.');
      } catch (error) { notice(error.message, true); }
    });
  });
  async function initialize() {
    try {
      const me = await api('/api/admin/me');
      await load();
      $('#identity').textContent = `Olá, ${me.nome}.`;
      $('#login').hidden = true; $('#dashboard').hidden = false; notice();
    } catch (error) { showLogin(); notice(error.message === 'Entre como administrador para continuar.' ? '' : error.message, true); }
  }
  initialize();
})();
