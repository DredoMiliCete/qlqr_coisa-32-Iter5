/* ============================================================
   HANDY — app.js  v3
   UC-01: Encontrar Prestador (Auto + Manual)
   UC-03: Realizar Serviço (chat inline)
   ============================================================ */

// ── Storage ───────────────────────────────────────────────────
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k),
};
const KEY_USERS    = 'handy_users';
const KEY_SESSION  = 'handy_session';
const KEY_REQUESTS = 'handy_requests';
const KEY_CHATS    = 'handy_chats';

// ── App state ─────────────────────────────────────────────────
let currentUser    = null;
let pendingReqAuto = null;
let pendingManualStudent = null;
let pendingManualCategory = null;

// ── Data ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id:'canaliza',    name:'Canalização',       emoji:'🔧' },
  { id:'eletric',     name:'Eletricidade',      emoji:'⚡' },
  { id:'carpint',     name:'Carpintaria',       emoji:'🪚' },
  { id:'limpeza',     name:'Limpeza',           emoji:'🧹' },
  { id:'pintura',     name:'Pintura',           emoji:'🎨' },
  { id:'jardinagem',  name:'Jardinagem',        emoji:'🌿' },
  { id:'mudancas',    name:'Mudanças',          emoji:'📦' },
  { id:'informatica', name:'Informática',       emoji:'💻' },
  { id:'babysitting', name:'Babysitting',       emoji:'👶' },
  { id:'petsitting',  name:'Petsitting',        emoji:'🐾' },
  { id:'cozinhar',    name:'Cozinhar',          emoji:'🍳' },
  { id:'manutencao',  name:'Manutenção Geral',  emoji:'🛠️' },
  { id:'climatizacao',name:'Climatização',      emoji:'❄️' },
  { id:'seguranca',   name:'Segurança',         emoji:'🔒' },
  { id:'montagem',    name:'Montagem/Móveis',   emoji:'🪑' },
  { id:'reparacao',   name:'Reparação',         emoji:'⚙️' },
  { id:'soldadura',   name:'Soldadura',         emoji:'🔥' },
  { id:'outros',      name:'Outros',            emoji:'🔩' },
];

const STUDENTS = [
  { id:'s1',  name:'Carlos Oliveira',  school:'ETP Aveiro',       level:'INTERMEDIO', rating:4.7, nServices:18, cats:['canaliza','eletric','manutencao'],       location:'Aveiro',     bio:'Apaixonado por eletricidade e canalização. Já realizei mais de 18 serviços com excelente feedback.' },
  { id:'s2',  name:'Ana Ferreira',     school:'EPGB Lisboa',      level:'AVANCADO',   rating:4.9, nServices:34, cats:['eletric','carpint','reparacao'],          location:'Lisboa',     bio:'Especialista em carpintaria e instalações elétricas. Rigorosa e pontual.' },
  { id:'s3',  name:'Miguel Santos',    school:'ETP Porto',        level:'BASICO',     rating:4.2, nServices:6,  cats:['limpeza','jardinagem','mudancas'],        location:'Porto',      bio:'Disponível para serviços de limpeza e jardinagem. Sou esforçado e rápido.' },
  { id:'s4',  name:'Inês Rodrigues',   school:'ETP Coimbra',      level:'AVANCADO',   rating:4.8, nServices:27, cats:['pintura','carpint','montagem'],           location:'Coimbra',    bio:'Especializada em pintura decorativa e restauro de mobiliário.' },
  { id:'s5',  name:'Rui Marques',      school:'ETP Aveiro',       level:'INTERMEDIO', rating:4.5, nServices:12, cats:['canaliza','limpeza','manutencao'],        location:'Aveiro',     bio:'Canalizador experiente com boas referências. Respondo rápido.' },
  { id:'s6',  name:'Sofia Costa',      school:'EPGB Lisboa',      level:'AVANCADO',   rating:4.6, nServices:21, cats:['jardinagem','pintura','outros'],          location:'Lisboa',     bio:'Adoro jardinagem e faço trabalhos de pintura de qualidade.' },
  { id:'s7',  name:'João Pereira',     school:'ETP Braga',        level:'BASICO',     rating:4.0, nServices:4,  cats:['mudancas','limpeza'],                    location:'Braga',      bio:'Disponível para ajudas em mudanças e limpezas. Pontual e cuidadoso.' },
  { id:'s8',  name:'Marta Alves',      school:'ETP Porto',        level:'INTERMEDIO', rating:4.6, nServices:15, cats:['carpint','eletric','reparacao'],          location:'Porto',      bio:'Trabalho bem em carpintaria e eletricidade. Gosto de desafios.' },
  { id:'s9',  name:'Tiago Nunes',      school:'ETP Aveiro',       level:'AVANCADO',   rating:4.9, nServices:42, cats:['canaliza','jardinagem','soldadura'],      location:'Aveiro',     bio:'Top prestador em canalização e jardinagem. 42 serviços realizados.' },
  { id:'s10', name:'Beatriz Lima',     school:'ETP Coimbra',      level:'INTERMEDIO', rating:4.4, nServices:9,  cats:['pintura','limpeza','mudancas'],           location:'Coimbra',    bio:'Pintora criativa e dedicada. Faço também limpezas pós-obra.' },
  { id:'s11', name:'Pedro Gomes',      school:'EPGB Lisboa',      level:'AVANCADO',   rating:4.8, nServices:23, cats:['informatica','seguranca'],                location:'Lisboa',     bio:'Técnico de informática especializado em redes e reparação de hardware.' },
  { id:'s12', name:'Catarina Silva',   school:'ETP Aveiro',       level:'INTERMEDIO', rating:4.5, nServices:11, cats:['informatica','outros'],                  location:'Aveiro',     bio:'Programação, instalação de software e suporte técnico.' },
  { id:'s13', name:'Leonor Faria',     school:'ETP Coimbra',      level:'BASICO',     rating:4.3, nServices:8,  cats:['babysitting'],                           location:'Coimbra',    bio:'Amo crianças e tenho formação em primeiros socorros pediátricos.' },
  { id:'s14', name:'André Correia',    school:'ETP Braga',        level:'BASICO',     rating:4.1, nServices:5,  cats:['babysitting','petsitting'],               location:'Braga',      bio:'Disponível para cuidar de crianças e animais de estimação.' },
  { id:'s15', name:'Mariana Rocha',    school:'EPGB Lisboa',      level:'INTERMEDIO', rating:4.7, nServices:14, cats:['petsitting'],                            location:'Lisboa',     bio:'Amante dos animais. Passeios, alimentação e companhia garantidos.' },
  { id:'s16', name:'Diogo Lemos',      school:'ETP Porto',        level:'AVANCADO',   rating:4.9, nServices:31, cats:['cozinhar'],                              location:'Porto',      bio:'Chef em formação. Refeições do dia-a-dia ou jantares especiais.' },
  { id:'s17', name:'Rita Mendes',      school:'ETP Aveiro',       level:'INTERMEDIO', rating:4.6, nServices:16, cats:['cozinhar','limpeza'],                    location:'Aveiro',     bio:'Cozinho com paixão e deixo a cozinha a brilhar no final.' },
  { id:'s18', name:'Gonçalo Ferreira', school:'ETP Setúbal',      level:'AVANCADO',   rating:4.7, nServices:29, cats:['climatizacao','manutencao','eletric'],    location:'Setúbal',    bio:'Técnico de climatização AVAC certificado. Instalo e reparo ar condicionado e aquecimento.' },
  { id:'s19', name:'Francisca Pinto',  school:'ETP Faro',         level:'INTERMEDIO', rating:4.5, nServices:13, cats:['limpeza','babysitting'],                  location:'Faro',       bio:'Zeladora experiente e cuidadora dedicada. Flexível em horários.' },
  { id:'s20', name:'Nuno Carvalho',    school:'EPGB Lisboa',      level:'AVANCADO',   rating:4.8, nServices:38, cats:['seguranca','eletric','manutencao'],        location:'Lisboa',     bio:'Especialista em sistemas de segurança e videovigilância. Instalação e manutenção.' },
  { id:'s21', name:'Sara Baptista',    school:'ETP Aveiro',       level:'BASICO',     rating:4.2, nServices:7,  cats:['pintura','limpeza'],                     location:'Aveiro',     bio:'Pintora criativa. Disponível para pintura de interiores e exteriores.' },
  { id:'s22', name:'Luís Teixeira',    school:'ETP Porto',        level:'AVANCADO',   rating:4.9, nServices:45, cats:['carpint','montagem','reparacao'],          location:'Porto',      bio:'Marceneiro com 45 serviços. Faço desde reparações simples a peças personalizadas.' },
  { id:'s23', name:'Patrícia Sousa',   school:'ETP Braga',        level:'INTERMEDIO', rating:4.4, nServices:10, cats:['cozinhar','babysitting'],                 location:'Braga',      bio:'Cozinheira e babysitter. Adoro trabalhar com crianças e cozinhar refeições saudáveis.' },
  { id:'s24', name:'Ricardo Lopes',    school:'ETP Coimbra',      level:'BASICO',     rating:4.0, nServices:3,  cats:['jardinagem','mudancas'],                  location:'Coimbra',    bio:'Estudante de horticultura. Disponível para jardinagem e ajuda em mudanças.' },
  { id:'s25', name:'Filipa Moreira',   school:'EPGB Lisboa',      level:'AVANCADO',   rating:4.7, nServices:22, cats:['informatica','seguranca','eletric'],       location:'Lisboa',     bio:'Técnica de redes e segurança informática. Instalação de camaras, wi-fi e suporte IT.' },
  { id:'s26', name:'Hélder Martins',   school:'ETP Aveiro',       level:'INTERMEDIO', rating:4.6, nServices:17, cats:['soldadura','manutencao','reparacao'],      location:'Aveiro',     bio:'Soldador com certificação. Estruturas metálicas, portões e reparações diversas.' },
  { id:'s27', name:'Joana Azevedo',    school:'ETP Porto',        level:'BASICO',     rating:4.3, nServices:6,  cats:['limpeza','petsitting'],                   location:'Porto',      bio:'Apaixonada por animais e pelo trabalho bem feito. Limpeza doméstica e cuidado de pets.' },
  { id:'s28', name:'Vasco Cunha',      school:'ETP Braga',        level:'AVANCADO',   rating:4.8, nServices:33, cats:['canaliza','climatizacao','manutencao'],    location:'Braga',      bio:'Técnico polivalente especializado em canalização e climatização.' },
  { id:'s29', name:'Daniela Fonseca',  school:'ETP Setúbal',      level:'INTERMEDIO', rating:4.5, nServices:12, cats:['montagem','reparacao','manutencao'],       location:'Setúbal',    bio:'Montagem de mobiliário, prateleiras e pequenas reparações domésticas. Precisa e rápida.' },
  { id:'s30', name:'Bruno Esteves',    school:'ETP Faro',         level:'BASICO',     rating:4.1, nServices:4,  cats:['jardinagem','limpeza','outros'],           location:'Faro',       bio:'Estudante de paisagismo. Corte de relva, podas e pequenas limpezas.' },
];

const LEVEL_LBL   = { BASICO:'Básico', INTERMEDIO:'Intermédio', AVANCADO:'Avançado' };
const URGENCY_LBL = { BAIXA:'Baixa', MEDIA:'Média', ALTA:'Alta', URGENTE:'Urgente' };
const STATUS_LBL  = {
  PENDENTE:'Pendente', EM_SELECAO:'A selecionar',
  AGUARDA:'Aguardar', CONFIRMADO:'Confirmado',
  CANCELADO:'Cancelado', CONCLUIDO:'Concluído',
};

// ── Smart matching weights ─────────────────────────────────────
function scoreStudent(student, req) {
  let score = 0;

  // Category match (mandatory filter, but add bonus for multiple cats in this domain)
  if (!student.cats.includes(req.catId)) return -1;
  score += 30;

  // Rating weight
  score += student.rating * 10;

  // Level matching
  const levelRankMap = { BASICO:1, INTERMEDIO:2, AVANCADO:3 };
  const reqLevel = levelRankMap[req.level] || 2;
  const stuLevel = levelRankMap[student.level] || 1;
  const levelDiff = stuLevel - reqLevel;
  if (levelDiff === 0) score += 20;       // exact match
  else if (levelDiff === 1) score += 10;  // one above — good
  else if (levelDiff === -1) score += 5;  // one below — ok
  else if (levelDiff < -1) score -= 10;   // too low

  // Urgency — prefer experienced students for urgent jobs
  if (req.urgency === 'URGENTE') {
    if (stuLevel >= 2) score += 15;
    score += student.nServices * 0.3;
  } else if (req.urgency === 'ALTA') {
    if (stuLevel >= 1) score += 8;
    score += student.nServices * 0.15;
  } else {
    score += student.nServices * 0.1;
  }

  // Experience bonus — more services = more reliable
  score += Math.min(student.nServices, 30) * 0.5;

  return score;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  let users = LS.get(KEY_USERS) || [];
  if (!users.find(u => u.email === 'demo@handy.pt'))
    users.push({ id:'u_demo', name:'Maria Tomás', email:'demo@handy.pt', password:'demo123' });
  LS.set(KEY_USERS, users);

  const sess = LS.get(KEY_SESSION);
  if (sess) { currentUser = sess; enterApp(); }
  else showScreen('welcome');

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const t = tab.dataset.tab;
      document.getElementById('tab-login').classList.toggle('hidden',    t !== 'login');
      document.getElementById('tab-register').classList.toggle('hidden', t !== 'register');
    });
  });

  buildCategoryList();
  populateAutoCategory();
});

// ============================================================
// SCREENS
// ============================================================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

function goToAuth() { showScreen('auth'); }

function enterApp() {
  showScreen('app');
  switchTab('menu');
  renderActiveRequest();
  renderHistorico();
  renderSettings();
}

// ============================================================
// AUTH
// ============================================================
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const err   = document.getElementById('login-error');
  if (!email || !pass) { err.textContent = 'Preenche todos os campos.'; return; }
  const users = LS.get(KEY_USERS) || [];
  const user  = users.find(u => u.email === email && u.password === pass);
  if (!user) { err.textContent = 'Email ou password incorretos.'; return; }
  err.textContent = '';
  currentUser = { id: user.id, name: user.name, email: user.email };
  LS.set(KEY_SESSION, currentUser);
  enterApp();
}

function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value;
  const err   = document.getElementById('reg-error');
  if (!name || !email || !pass) { err.textContent = 'Preenche todos os campos.'; return; }
  if (pass.length < 6) { err.textContent = 'Password: mínimo 6 caracteres.'; return; }
  const users = LS.get(KEY_USERS) || [];
  if (users.find(u => u.email === email)) { err.textContent = 'Email já registado.'; return; }
  const nu = { id: 'u_' + Date.now(), name, email, password: pass };
  users.push(nu);
  LS.set(KEY_USERS, users);
  currentUser = { id: nu.id, name, email };
  LS.set(KEY_SESSION, currentUser);
  showToast('Conta criada! 🎉');
  enterApp();
}

function doGoogleLogin() {
  currentUser = { id:'u_g_'+Date.now(), name:'Utilizador Google', email:'google@gmail.com' };
  LS.set(KEY_SESSION, currentUser);
  showToast('Login com Google simulado ✓');
  enterApp();
}

function doLogout() {
  LS.del(KEY_SESSION);
  currentUser = null;
  showScreen('welcome');
}

// ============================================================
// TAB BAR
// ============================================================
function switchTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  if (name === 'pedido')    renderActiveRequest();
  if (name === 'historico') renderHistorico();
  if (name === 'def')       renderSettings();
}

// ============================================================
// FULL-SCREEN OVERLAYS  (replace modals for auto + manual)
// ============================================================
function openFullScreen(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('fscreen-open');
  document.body.style.overflow = 'hidden';
}
function closeFullScreen(id) {
  const el = document.getElementById(id);
  el.classList.add('hidden');
  el.classList.remove('fscreen-open');
  document.body.style.overflow = '';
}

// ============================================================
// CATEGORY LIST + SCROLLBAR
// ============================================================
function buildCategoryList() {
  const list = document.getElementById('categories-list');
  list.innerHTML = CATEGORIES.map(c => `
    <div class="category-item" onclick="openManualCategory('${c.id}')">
      <span class="cat-emoji">${c.emoji}</span>
      <span class="cat-name">${c.name}</span>
    </div>`).join('');

  const thumb = document.getElementById('cat-scrollbar-thumb');
  list.addEventListener('scroll', () => syncScrollbar(list, thumb));
  setTimeout(() => syncScrollbar(list, thumb), 100);
}

function syncScrollbar(list, thumb) {
  const track = thumb.parentElement;
  const ratio = list.scrollTop / (list.scrollHeight - list.clientHeight || 1);
  const thumbH = Math.max(30, (list.clientHeight / list.scrollHeight) * track.clientHeight);
  const maxTop = track.clientHeight - thumbH;
  thumb.style.height = thumbH + 'px';
  thumb.style.top    = (ratio * maxTop) + 'px';
}

function populateAutoCategory() {
  const sel = document.getElementById('auto-category');
  sel.innerHTML = '<option value="">Escolhe uma categoria</option>' +
    CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
}

// ============================================================
// MANUAL FLOW — full-screen
// ============================================================
function openManualCategory(catId) {
  if (hasActiveRequest()) {
    showToast('Já tens um pedido ativo. Cancela-o primeiro.');
    return;
  }
  pendingManualCategory = catId;
  const cat = CATEGORIES.find(c => c.id === catId);
  const students = STUDENTS.filter(s => s.cats.includes(catId))
    .sort((a,b) => b.rating - a.rating);

  document.getElementById('fs-manual-title').textContent = `${cat.emoji} ${cat.name}`;
  document.getElementById('fs-manual-sub').textContent   =
    students.length > 0
      ? `${students.length} aluno${students.length > 1 ? 's' : ''} disponíve${students.length > 1 ? 'is' : 'l'} nesta categoria`
      : 'Nenhum aluno disponível de momento.';

  document.getElementById('fs-manual-students-list').innerHTML =
    students.length > 0
      ? students.map(s => renderStudentCard(s, 'manual')).join('')
      : `<div class="empty-state">Sem alunos disponíveis para esta categoria.</div>`;

  openFullScreen('fs-manual');
}

function openStudentProfile(studentId) {
  const s = STUDENTS.find(x => x.id === studentId);
  if (!s) return;

  const stars = starStr(s.rating);
  const catTags = s.cats.map(cid => {
    const cc = CATEGORIES.find(x => x.id === cid);
    return cc ? `<span class="profile-tag">${cc.emoji} ${cc.name}</span>` : '';
  }).join('');

  document.getElementById('fs-profile-content').innerHTML = `
    <div class="profile-hero">
      <div class="profile-big-avatar">${s.name[0]}</div>
      <div class="profile-pname">${s.name}</div>
      <div class="profile-school">🏫 ${s.school} · 📍 ${s.location}</div>
      <div class="profile-stars">${stars} <span style="font-size:.85rem;color:var(--text-2);font-family:var(--font-body)">${s.rating.toFixed(1)}</span></div>
    </div>
    <div class="profile-stats-row">
      <div class="pstat"><span class="pstat-num">${s.nServices}</span><span class="pstat-lbl">Serviços</span></div>
      <div class="pstat"><span class="pstat-num">${s.rating.toFixed(1)}</span><span class="pstat-lbl">Avaliação</span></div>
      <div class="pstat"><span class="pstat-num">${LEVEL_LBL[s.level][0]}</span><span class="pstat-lbl">${LEVEL_LBL[s.level]}</span></div>
    </div>
    <div class="profile-section">
      <h3>Sobre</h3>
      <p class="profile-bio">${s.bio}</p>
    </div>
    <div class="profile-section">
      <h3>Competências</h3>
      <div class="profile-tags">${catTags}</div>
    </div>
    <button class="btn-blue-full" style="margin-top:1.5rem" onclick="openSendProposal('${s.id}')">
      Enviar proposta
    </button>`;

  openFullScreen('fs-profile');
}

function openSendProposal(studentId) {
  pendingManualStudent = STUDENTS.find(s => s.id === studentId);
  document.getElementById('proposal-to-name').textContent =
    `A enviar para: ${pendingManualStudent.name} · ${pendingManualStudent.school}`;
  document.getElementById('proposal-desc').value     = '';
  document.getElementById('proposal-location').value = '';
  document.getElementById('proposal-error').textContent = '';
  openModal('modal-send-proposal');
}

function sendManualProposal() {
  const desc = document.getElementById('proposal-desc').value.trim();
  const loc  = document.getElementById('proposal-location').value.trim();
  const err  = document.getElementById('proposal-error');
  if (!desc) { err.textContent = 'Adiciona uma descrição.'; return; }

  if (hasActiveRequest()) {
    err.textContent = 'Já tens um pedido ativo. Cancela-o antes de criar outro.';
    return;
  }

  const cat = CATEGORIES.find(c => c.id === pendingManualCategory);
  const req = {
    id:       'req_' + Date.now(),
    userId:   currentUser.id,
    type:     'MANUAL',
    catId:    pendingManualCategory,
    catName:  cat?.name || '–',
    catEmoji: cat?.emoji || '🔩',
    description: desc,
    location: loc,
    urgency:  'MEDIA',
    level:    pendingManualStudent.level,
    status:   'AGUARDA',
    assignedStudent: pendingManualStudent,
    createdAt: new Date().toISOString(),
  };
  saveRequest(req);

  closeModal('modal-send-proposal');
  closeFullScreen('fs-profile');
  closeFullScreen('fs-manual');

  showOkModal(
    '📨',
    'Proposta enviada!',
    `A tua proposta foi enviada a <strong>${pendingManualStudent.name}</strong>. Receberás uma notificação quando ele responder.`
  );

  renderActiveRequest();
  renderHistorico();
}

// ============================================================
// AUTO FLOW — full-screen
// ============================================================
function openAutoModal() {
  ['auto-step-form','auto-step-sending','auto-step-waiting','auto-step-choose']
    .forEach(id => document.getElementById(id).classList.toggle('hidden', id !== 'auto-step-form'));
  document.getElementById('auto-form-error').textContent = '';
  document.getElementById('auto-log').innerHTML = '';
  openFullScreen('fs-auto');
}

function submitAutoRequest() {
  const catId = document.getElementById('auto-category').value;
  const desc  = document.getElementById('auto-desc').value.trim();
  const loc   = document.getElementById('auto-location').value.trim();
  const urg   = document.querySelector('input[name="auto-urg"]:checked')?.value || 'MEDIA';
  const level = document.getElementById('auto-level').value;
  const err   = document.getElementById('auto-form-error');

  if (!catId) { err.textContent = 'Escolhe uma categoria.'; return; }
  if (!desc)  { err.textContent = 'Adiciona uma descrição.'; return; }
  if (hasActiveRequest()) { err.textContent = 'Já tens um pedido ativo.'; return; }

  const cat = CATEGORIES.find(c => c.id === catId);
  pendingReqAuto = {
    id:       'req_' + Date.now(),
    userId:   currentUser.id,
    type:     'AUTO',
    catId,
    catName:  cat.name,
    catEmoji: cat.emoji,
    description: desc,
    location: loc,
    urgency:  urg,
    level,
    status:   'EM_SELECAO',
    assignedStudent: null,
    createdAt: new Date().toISOString(),
  };
  saveRequest(pendingReqAuto);
  renderActiveRequest();

  showAutoStep('auto-step-sending');
  document.getElementById('auto-send-title').textContent = 'A enviar propostas…';
  document.getElementById('auto-send-sub').textContent   = `A procurar alunos para ${cat.emoji} ${cat.name}`;

  runAutoLog(catId, level, urg, () => {
    showAutoStep('auto-step-waiting');
    document.getElementById('waiting-info').innerHTML =
      `<strong>Pedido:</strong> ${cat.emoji} ${cat.name}<br>
       <strong>Urgência:</strong> ${URGENCY_LBL[urg]}<br>
       <strong>Nível:</strong> ${LEVEL_LBL[level]}<br>
       <strong>Descrição:</strong> ${desc}`;
  });
}

function runAutoLog(catId, level, urg, cb) {
  const log = document.getElementById('auto-log');
  log.innerHTML = '';
  const catName = CATEGORIES.find(c=>c.id===catId)?.name || catId;
  const lines = [
    { t:300,  cls:'log-info', msg:`▶ POST /api/v1/jobs — criar pedido (${catName})` },
    { t:700,  cls:'log-ok',   msg:`✓ Pedido criado [${pendingReqAuto.id.slice(-6)}]` },
    { t:1100, cls:'log-info', msg:`▶ GET /api/v1/students/profile?cat=${catId}&level=${level}` },
    { t:1600, cls:'log-info', msg:`  Motor de atribuição a avaliar candidatos…` },
    { t:2000, cls:'log-ok',   msg:`✓ Critério categoria: ${catName}` },
    { t:2200, cls:'log-ok',   msg:`✓ Critério nível: ${LEVEL_LBL[level]}` },
    { t:2400, cls:'log-ok',   msg:`✓ Critério urgência: ${URGENCY_LBL[urg]}` },
    { t:2700, cls:'log-info', msg:`  A calcular score composto (rating + exp + nível + urg)…` },
    { t:2900, cls:'log-info', msg:`▶ POST /api/v1/notifications/job — notificar alunos` },
    { t:3400, cls:'log-ok',   msg:`✓ Propostas enviadas — aguardar respostas` },
  ];
  lines.forEach(({ t, cls, msg }) => {
    setTimeout(() => {
      const l = document.createElement('div');
      l.className = `log-line ${cls}`;
      l.textContent = msg;
      log.appendChild(l);
      log.scrollTop = log.scrollHeight;
    }, t);
  });
  setTimeout(cb, 3800);
}

function simulateAcceptance() {
  if (!pendingReqAuto) return;

  // Smart matching using scoreStudent
  let candidates = STUDENTS
    .map(s => ({ student: s, score: scoreStudent(s, pendingReqAuto) }))
    .filter(x => x.score >= 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.student);

  if (candidates.length === 0) {
    showToast('Nenhum aluno disponível para esta categoria.');
    return;
  }

  showAutoStep('auto-step-choose');
  document.getElementById('auto-choose-sub').textContent =
    `${candidates.length} aluno${candidates.length > 1 ? 's' : ''} aceitou a tua proposta para ${pendingReqAuto.catEmoji} ${pendingReqAuto.catName}. Escolhe um:`;
  document.getElementById('auto-students-list').innerHTML =
    candidates.map(s => renderStudentCard(s, 'auto')).join('');
}

function showAutoStep(stepId) {
  ['auto-step-form','auto-step-sending','auto-step-waiting','auto-step-choose']
    .forEach(id => document.getElementById(id).classList.toggle('hidden', id !== stepId));
}

function chooseAutoStudent(studentId) {
  const student = STUDENTS.find(s => s.id === studentId);
  if (!student || !pendingReqAuto) return;

  const all = LS.get(KEY_REQUESTS) || [];
  const req = all.find(r => r.id === pendingReqAuto.id);
  if (req) {
    req.status = 'CONFIRMADO';
    req.assignedStudent = student;
    req.confirmedAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
  }

  closeFullScreen('fs-auto');
  showOkModal('🎉', 'Prestador confirmado!',
    `<strong>${student.name}</strong> da <em>${student.school}</em> foi confirmado e irá realizar o teu serviço. Podes comunicar com ele na aba de Pedido.`);

  pendingReqAuto = null;
  renderActiveRequest();
  renderHistorico();
}

// ============================================================
// RENDERS — Active Request (with chat)
// ============================================================
function renderActiveRequest() {
  const area = document.getElementById('active-request-area');
  const reqs = getUserRequests().filter(r => ['EM_SELECAO','AGUARDA','CONFIRMADO'].includes(r.status));
  const active = reqs[0];

  if (!active) {
    area.innerHTML = `
      <div class="no-active-req">
        <img src="logo.png" class="no-req-logo" alt=""/>
        <div class="no-req-text">Sem pedido ativo</div>
        <div class="no-req-sub">Vai ao Menu para criar um pedido automático ou escolher uma categoria.</div>
      </div>`;
    return;
  }

  const stu = active.assignedStudent;
  const isConfirmed = active.status === 'CONFIRMADO' && stu;

  // Build student section
  const stuSection = stu ? `
    <div class="req-student-block">
      <div class="req-student-header">
        <div class="stu-avatar small">${stu.name[0]}</div>
        <div>
          <div class="req-student-name">${stu.name}</div>
          <div class="req-student-meta">🏫 ${stu.school} · 📍 ${stu.location}</div>
        </div>
        <span class="stars" style="margin-left:auto">${starStr(stu.rating)} <span style="font-size:.72rem;color:var(--text-2)">${stu.rating.toFixed(1)}</span></span>
      </div>
    </div>` : '';

  // Simulate acceptance button (only while waiting)
  const simulateBtn = (active.status === 'EM_SELECAO' || active.status === 'AGUARDA') ? `
    <button class="btn-simulate-accept" onclick="simulateAcceptFromPedido('${active.id}')">
      🎭 Simular aceitação de aluno
    </button>` : '';

  // Chat section (only if confirmed)
  const chatSection = isConfirmed ? renderChatSection(active) : '';

  area.innerHTML = `
    <div class="active-req-card">
      <div class="active-req-top">
        <div class="active-req-icon">${active.catEmoji}</div>
        <div>
          <div class="active-req-title">${active.catName}</div>
          <div class="active-req-sub">${formatDate(active.createdAt)}</div>
        </div>
        <span class="status-chip chip-${active.status}" style="margin-left:auto">${STATUS_LBL[active.status]}</span>
      </div>
      <div class="active-req-body">
        <div class="req-field-row">
          <span class="req-field-label">Tipo</span>
          <span class="req-field-val">${active.type === 'AUTO' ? '🤖 Automático' : '🔍 Manual'}</span>
        </div>
        <div class="req-field-row">
          <span class="req-field-label">Urgência</span>
          <span class="req-field-val">${URGENCY_LBL[active.urgency]}</span>
        </div>
        <div class="req-field-row">
          <span class="req-field-label">Descrição</span>
          <span class="req-field-val">${active.description}</span>
        </div>
        ${active.location ? `<div class="req-field-row"><span class="req-field-label">Local</span><span class="req-field-val">${active.location}</span></div>` : ''}
      </div>
      ${stuSection}
      ${simulateBtn}
      ${chatSection}
      <div style="padding: 0 1.25rem 1.25rem">
        <button class="btn-cancel-req" onclick="cancelActiveRequest('${active.id}')">Cancelar pedido</button>
      </div>
    </div>`;

  // Wire chat input if present
  if (isConfirmed) {
    wireChatInput(active.id);
  }
}

function simulateAcceptFromPedido(reqId) {
  // Find the pending auto request
  const all = LS.get(KEY_REQUESTS) || [];
  const req = all.find(r => r.id === reqId);
  if (!req) return;

  // Score and pick
  let candidates = STUDENTS
    .map(s => ({ student: s, score: scoreStudent(s, req) }))
    .filter(x => x.score >= 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.student);

  if (req.type === 'MANUAL' && req.assignedStudent) {
    // For manual, just confirm the chosen student
    req.status = 'CONFIRMADO';
    req.confirmedAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest();
    renderHistorico();
    showToast(`${req.assignedStudent.name} aceitou o pedido! ✅`);
    return;
  }

  if (candidates.length === 0) {
    showToast('Nenhum aluno disponível para esta categoria.');
    return;
  }

  // Show a mini chooser inside the pedido tab using a modal
  pendingReqAuto = req;
  showAutoStep('auto-step-choose');
  document.getElementById('auto-choose-sub').textContent =
    `${candidates.length} aluno${candidates.length > 1 ? 's' : ''} aceitou a tua proposta. Escolhe um:`;
  document.getElementById('auto-students-list').innerHTML =
    candidates.map(s => renderStudentCard(s, 'auto')).join('');
  openFullScreen('fs-auto');
  // Only show the choose step
  ['auto-step-form','auto-step-sending','auto-step-waiting'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));
  document.getElementById('auto-step-choose').classList.remove('hidden');
}

// ── Chat ──────────────────────────────────────────────────────
function getChatMessages(reqId) {
  const all = LS.get(KEY_CHATS) || {};
  return all[reqId] || [];
}

function saveChatMessage(reqId, msg) {
  const all = LS.get(KEY_CHATS) || {};
  if (!all[reqId]) all[reqId] = [];
  all[reqId].push(msg);
  LS.set(KEY_CHATS, all);
}

function renderChatSection(req) {
  const msgs = getChatMessages(req.id);
  const msgsHtml = msgs.length === 0
    ? `<div class="chat-empty">Sem mensagens ainda. Começa a conversa! 👋</div>`
    : msgs.map(m => `
        <div class="chat-bubble ${m.from === 'client' ? 'chat-me' : 'chat-other'}">
          <div class="chat-text">${escapeHtml(m.text)}</div>
          <div class="chat-time">${formatTimeShort(m.ts)}</div>
        </div>`).join('');

  return `
    <div class="chat-section">
      <div class="chat-section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Chat com ${req.assignedStudent.name}
      </div>
      <div class="chat-messages" id="chat-msgs-${req.id}">${msgsHtml}</div>
      <div class="chat-input-row">
        <input type="text" class="chat-input" id="chat-input-${req.id}" placeholder="Escreve uma mensagem…" onkeydown="chatKeydown(event,'${req.id}')"/>
        <button class="chat-send-btn" onclick="sendChatMessage('${req.id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>`;
}

function wireChatInput(reqId) {
  const el = document.getElementById(`chat-msgs-${reqId}`);
  if (el) el.scrollTop = el.scrollHeight;
}

function chatKeydown(e, reqId) {
  if (e.key === 'Enter') sendChatMessage(reqId);
}

function sendChatMessage(reqId) {
  const input = document.getElementById(`chat-input-${reqId}`);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  saveChatMessage(reqId, { from:'client', text, ts: Date.now() });
  input.value = '';

  // Re-render chat only
  const req = (LS.get(KEY_REQUESTS)||[]).find(r => r.id === reqId);
  if (!req) return;
  const msgs = getChatMessages(reqId);
  const container = document.getElementById(`chat-msgs-${reqId}`);
  if (container) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-me';
    bubble.innerHTML = `<div class="chat-text">${escapeHtml(text)}</div><div class="chat-time">${formatTimeShort(Date.now())}</div>`;
    container.querySelector('.chat-empty')?.remove();
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  // Simulate student reply after delay
  setTimeout(() => {
    const replies = [
      'Olá! Confirmado, estarei aí na hora combinada. 👍',
      'Perfeito, sem problema!',
      'Claro, podem contar comigo.',
      'Obrigado pelo contacto! Estou a ver o pedido já.',
      'Entendido, até logo!',
      'Combinado! Qualquer dúvida, é só falar.',
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    saveChatMessage(reqId, { from:'student', text: reply, ts: Date.now() });
    const c = document.getElementById(`chat-msgs-${reqId}`);
    if (c) {
      const b = document.createElement('div');
      b.className = 'chat-bubble chat-other';
      b.innerHTML = `<div class="chat-text">${escapeHtml(reply)}</div><div class="chat-time">${formatTimeShort(Date.now())}</div>`;
      c.appendChild(b);
      c.scrollTop = c.scrollHeight;
    }
  }, 900 + Math.random() * 1200);
}

// ============================================================
// HISTORICO
// ============================================================
function renderHistorico() {
  const list  = document.getElementById('historico-list');
  const empty = document.getElementById('historico-empty');
  const all   = getUserRequests().slice().reverse();

  if (all.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = all.map(r => {
    const stuLine = r.assignedStudent
      ? `<div class="hist-student">👤 ${r.assignedStudent.name} · ${r.assignedStudent.school}</div>`
      : '';
    return `
    <div class="hist-card">
      <div class="hist-icon">${r.catEmoji}</div>
      <div class="hist-info">
        <div class="hist-title">${r.catName}${r.description ? ' — ' + r.description.slice(0,40) + (r.description.length > 40 ? '…':'') : ''}</div>
        <div class="hist-date">${formatDate(r.createdAt)} · ${r.type === 'AUTO' ? '🤖 Auto' : '🔍 Manual'}</div>
        ${stuLine}
      </div>
      <span class="status-chip chip-${r.status}">${STATUS_LBL[r.status]}</span>
    </div>`;
  }).join('');
}

function renderSettings() {
  if (!currentUser) return;
  document.getElementById('settings-name').textContent  = currentUser.name;
  document.getElementById('settings-email').textContent = currentUser.email;
  document.getElementById('settings-avatar').textContent = (currentUser.name||'U')[0].toUpperCase();
}

// ============================================================
// REQUEST helpers
// ============================================================
function getUserRequests() {
  return (LS.get(KEY_REQUESTS) || []).filter(r => r.userId === currentUser?.id);
}
function saveRequest(req) {
  let all = LS.get(KEY_REQUESTS) || [];
  const i = all.findIndex(r => r.id === req.id);
  if (i >= 0) all[i] = req; else all.push(req);
  LS.set(KEY_REQUESTS, all);
}
function hasActiveRequest() {
  return getUserRequests().some(r => ['EM_SELECAO','AGUARDA','CONFIRMADO'].includes(r.status));
}
function cancelActiveRequest(reqId) {
  if (!confirm('Cancelar este pedido?')) return;
  let all = LS.get(KEY_REQUESTS) || [];
  const r = all.find(x => x.id === reqId);
  if (r) { r.status = 'CANCELADO'; LS.set(KEY_REQUESTS, all); }
  renderActiveRequest();
  renderHistorico();
  showToast('Pedido cancelado.');
}
function clearAllData() {
  if (!confirm('Apagar todos os dados locais?')) return;
  LS.del(KEY_REQUESTS);
  LS.del(KEY_CHATS);
  renderActiveRequest();
  renderHistorico();
  showToast('Dados apagados.');
}

// ============================================================
// MODALS
// ============================================================
function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function showOkModal(icon, title, body) {
  document.getElementById('ok-icon').textContent  = icon;
  document.getElementById('ok-title').textContent = title;
  document.getElementById('ok-body').innerHTML    = body;
  openModal('modal-ok');
}

// ============================================================
// STUDENT CARD
// ============================================================
function renderStudentCard(s, mode) {
  const stars = starStr(s.rating);
  const actionBtn = mode === 'auto'
    ? `<button class="btn-choose" onclick="chooseAutoStudent('${s.id}')">Escolher</button>`
    : `<button class="btn-proposal" onclick="openStudentProfile('${s.id}')">Ver perfil</button>`;
  return `
    <div class="student-card">
      <div class="stu-avatar">${s.name[0]}</div>
      <div class="stu-info">
        <div class="stu-name">${s.name}</div>
        <div class="stu-meta">🏫 ${s.school} · 📍 ${s.location} · ${LEVEL_LBL[s.level]} · ✅ ${s.nServices} serv.</div>
      </div>
      <div class="stu-right">
        <span class="stars">${stars} <span style="font-size:.72rem;color:var(--text-2)">${s.rating.toFixed(1)}</span></span>
        ${actionBtn}
      </div>
    </div>`;
}

// ============================================================
// UTILS
// ============================================================
function starStr(r) { return '★'.repeat(Math.floor(r)) + (r%1>=.5?'½':''); }
function levelRank(l) { return { BASICO:1, INTERMEDIO:2, AVANCADO:3 }[l] || 1; }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-PT', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatTimeShort(ts) {
  return new Date(ts).toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' });
}
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toggleDark(cb) { document.body.classList.toggle('dark', cb.checked); }

function showToast(msg, dur=3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 300); }, dur);
}