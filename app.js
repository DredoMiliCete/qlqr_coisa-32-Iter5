/* ============================================================
   HANDY — app.js  v4
   ============================================================ */

const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k),
};
const KEY_USERS    = 'handy_users';
const KEY_SESSION  = 'handy_session';
const KEY_REQUESTS = 'handy_requests';
const KEY_CHATS    = 'handy_chats';

let currentUser          = null;
let pendingReqAuto       = null;
let pendingManualStudent = null;
let pendingManualCategory= null;
// context from which openStudentProfile was called: 'search'|'pedido'|'historico'
let profileContext       = 'search';

// ── Categories ──────────────────────────────────────────────
const CATEGORIES = [
  { id:'canaliza',    name:'Canalização',      emoji:'🔧' },
  { id:'eletric',     name:'Eletricidade',     emoji:'⚡' },
  { id:'carpint',     name:'Carpintaria',      emoji:'🪚' },
  { id:'limpeza',     name:'Limpeza',          emoji:'🧹' },
  { id:'pintura',     name:'Pintura',          emoji:'🎨' },
  { id:'jardinagem',  name:'Jardinagem',       emoji:'🌿' },
  { id:'mudancas',    name:'Mudanças',         emoji:'📦' },
  { id:'informatica', name:'Informática',      emoji:'💻' },
  { id:'babysitting', name:'Babysitting',      emoji:'👶' },
  { id:'petsitting',  name:'Petsitting',       emoji:'🐾' },
  { id:'cozinhar',    name:'Cozinhar',         emoji:'🍳' },
  { id:'manutencao',  name:'Manutenção Geral', emoji:'🛠️' },
  { id:'climatizacao',name:'Climatização',     emoji:'❄️' },
  { id:'seguranca',   name:'Segurança',        emoji:'🔒' },
  { id:'montagem',    name:'Montagem/Móveis',  emoji:'🪑' },
  { id:'reparacao',   name:'Reparação',        emoji:'⚙️' },
  { id:'soldadura',   name:'Soldadura',        emoji:'🔥' },
  { id:'outros',      name:'Outros',           emoji:'🔩' },
];

// ── Students — max 2 competências, maioria 1 ─────────────────
// reviews: array of {author, text, rating, date}
const STUDENTS = [
  { id:'s1',  name:'Carlos Oliveira',  school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.7, nServices:18, cats:['canaliza','eletric'],    location:'Aveiro',   bio:'Apaixonado por eletricidade e canalização. 18 serviços com excelente feedback.',
    reviews:[{author:'João M.',text:'Muito profissional e rápido.',rating:5,date:'2026-04-10'},{author:'Ana S.',text:'Resolveu o problema na hora.',rating:4,date:'2026-03-22'}] },
  { id:'s2',  name:'Ana Ferreira',     school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.9, nServices:34, cats:['eletric','carpint'],     location:'Lisboa',   bio:'Especialista em carpintaria e instalações elétricas. Rigorosa e pontual.',
    reviews:[{author:'Pedro C.',text:'Excelente trabalho, muito recomendada!',rating:5,date:'2026-04-18'},{author:'Rita L.',text:'Pontual e cuidadosa.',rating:5,date:'2026-04-01'}] },
  { id:'s3',  name:'Miguel Santos',    school:'ETP Porto',     level:'BASICO',     rating:4.2, nServices:6,  cats:['limpeza'],               location:'Porto',    bio:'Disponível para serviços de limpeza. Sou esforçado e rápido.',
    reviews:[{author:'Marta F.',text:'Fez um bom trabalho!',rating:4,date:'2026-03-15'}] },
  { id:'s4',  name:'Inês Rodrigues',   school:'ETP Coimbra',   level:'AVANCADO',   rating:4.8, nServices:27, cats:['pintura','carpint'],     location:'Coimbra',  bio:'Especializada em pintura decorativa e restauro de mobiliário.',
    reviews:[{author:'Luís T.',text:'Trabalho impecável. Muito recomendo.',rating:5,date:'2026-04-20'},{author:'Sofia A.',text:'Super atenciosa e profissional.',rating:5,date:'2026-03-28'}] },
  { id:'s5',  name:'Rui Marques',      school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.5, nServices:12, cats:['canaliza'],              location:'Aveiro',   bio:'Canalizador experiente com boas referências. Respondo rápido.',
    reviews:[{author:'Carla M.',text:'Rápido e eficiente.',rating:5,date:'2026-04-05'},{author:'Hugo S.',text:'Bom serviço pelo preço.',rating:4,date:'2026-03-10'}] },
  { id:'s6',  name:'Sofia Costa',      school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.6, nServices:21, cats:['jardinagem','pintura'],  location:'Lisboa',   bio:'Adoro jardinagem e faço trabalhos de pintura de qualidade.',
    reviews:[{author:'Bruno N.',text:'Jardim ficou lindo!',rating:5,date:'2026-04-12'}] },
  { id:'s7',  name:'João Pereira',     school:'ETP Braga',     level:'BASICO',     rating:4.0, nServices:4,  cats:['mudancas'],              location:'Braga',    bio:'Disponível para ajudas em mudanças. Pontual e cuidadoso.',
    reviews:[{author:'Filipe R.',text:'Cuidadoso com os móveis.',rating:4,date:'2026-02-20'}] },
  { id:'s8',  name:'Marta Alves',      school:'ETP Porto',     level:'INTERMEDIO', rating:4.6, nServices:15, cats:['carpint','eletric'],     location:'Porto',    bio:'Trabalho bem em carpintaria e eletricidade. Gosto de desafios.',
    reviews:[{author:'David P.',text:'Muito competente!',rating:5,date:'2026-04-08'},{author:'Inês G.',text:'Ficou tudo perfeito.',rating:4,date:'2026-03-30'}] },
  { id:'s9',  name:'Tiago Nunes',      school:'ETP Aveiro',    level:'AVANCADO',   rating:4.9, nServices:42, cats:['canaliza'],              location:'Aveiro',   bio:'Top prestador em canalização. 42 serviços realizados.',
    reviews:[{author:'Patrícia L.',text:'O melhor que já contratei.',rating:5,date:'2026-04-22'},{author:'Rui A.',text:'Sempre pontual e profissional.',rating:5,date:'2026-04-14'}] },
  { id:'s10', name:'Beatriz Lima',     school:'ETP Coimbra',   level:'INTERMEDIO', rating:4.4, nServices:9,  cats:['pintura','limpeza'],     location:'Coimbra',  bio:'Pintora criativa e dedicada. Faço também limpezas pós-obra.',
    reviews:[{author:'Vasco M.',text:'Boa pintora, atenta ao detalhe.',rating:4,date:'2026-03-18'}] },
  { id:'s11', name:'Pedro Gomes',      school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.8, nServices:23, cats:['informatica','seguranca'],location:'Lisboa',   bio:'Técnico de informática especializado em redes e reparação de hardware.',
    reviews:[{author:'Sandra C.',text:'Resolveu um problema difícil rapidamente.',rating:5,date:'2026-04-16'},{author:'Marco L.',text:'Muito profissional.',rating:5,date:'2026-04-02'}] },
  { id:'s12', name:'Catarina Silva',   school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.5, nServices:11, cats:['informatica'],           location:'Aveiro',   bio:'Programação, instalação de software e suporte técnico.',
    reviews:[{author:'Nuno B.',text:'Instalou tudo sem problemas.',rating:4,date:'2026-03-25'}] },
  { id:'s13', name:'Leonor Faria',     school:'ETP Coimbra',   level:'BASICO',     rating:4.3, nServices:8,  cats:['babysitting'],           location:'Coimbra',  bio:'Amo crianças e tenho formação em primeiros socorros pediátricos.',
    reviews:[{author:'Maria J.',text:'Adorou os meus filhos!',rating:5,date:'2026-04-07'},{author:'Carlos B.',text:'Responsável e carinhosa.',rating:4,date:'2026-03-12'}] },
  { id:'s14', name:'André Correia',    school:'ETP Braga',     level:'BASICO',     rating:4.1, nServices:5,  cats:['babysitting','petsitting'],location:'Braga',   bio:'Disponível para cuidar de crianças e animais de estimação.',
    reviews:[{author:'Diana F.',text:'Ótimo com o meu cão.',rating:4,date:'2026-03-05'}] },
  { id:'s15', name:'Mariana Rocha',    school:'EPGB Lisboa',   level:'INTERMEDIO', rating:4.7, nServices:14, cats:['petsitting'],            location:'Lisboa',   bio:'Amante dos animais. Passeios, alimentação e companhia garantidos.',
    reviews:[{author:'Tiago R.',text:'O meu cão adorou!',rating:5,date:'2026-04-19'},{author:'Sofia C.',text:'Muito responsável.',rating:5,date:'2026-04-03'}] },
  { id:'s16', name:'Diogo Lemos',      school:'ETP Porto',     level:'AVANCADO',   rating:4.9, nServices:31, cats:['cozinhar'],              location:'Porto',    bio:'Chef em formação. Refeições do dia-a-dia ou jantares especiais.',
    reviews:[{author:'Ana M.',text:'Jantar incrível!',rating:5,date:'2026-04-21'},{author:'Pedro S.',text:'Comida deliciosa e bem apresentada.',rating:5,date:'2026-04-11'}] },
  { id:'s17', name:'Rita Mendes',      school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.6, nServices:16, cats:['cozinhar','limpeza'],    location:'Aveiro',   bio:'Cozinho com paixão e deixo a cozinha a brilhar no final.',
    reviews:[{author:'Joana P.',text:'Refeições saborosas.',rating:5,date:'2026-04-09'}] },
  { id:'s18', name:'Gonçalo Ferreira', school:'ETP Setúbal',   level:'AVANCADO',   rating:4.7, nServices:29, cats:['climatizacao'],          location:'Setúbal',  bio:'Técnico de climatização AVAC certificado. Instalo e reparo ar condicionado.',
    reviews:[{author:'Luísa M.',text:'Instalou o AC perfeitamente.',rating:5,date:'2026-04-15'},{author:'Bruno T.',text:'Profissional e rápido.',rating:4,date:'2026-03-27'}] },
  { id:'s19', name:'Francisca Pinto',  school:'ETP Faro',      level:'INTERMEDIO', rating:4.5, nServices:13, cats:['limpeza','babysitting'], location:'Faro',     bio:'Zeladora experiente e cuidadora dedicada. Flexível em horários.',
    reviews:[{author:'Rui C.',text:'Casa impecável.',rating:5,date:'2026-04-06'}] },
  { id:'s20', name:'Nuno Carvalho',    school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.8, nServices:38, cats:['seguranca'],             location:'Lisboa',   bio:'Especialista em sistemas de segurança e videovigilância.',
    reviews:[{author:'Carla S.',text:'Sistema de câmaras instalado sem erros.',rating:5,date:'2026-04-17'},{author:'Miguel A.',text:'Muito competente e organizado.',rating:5,date:'2026-04-03'}] },
  { id:'s21', name:'Sara Baptista',    school:'ETP Aveiro',    level:'BASICO',     rating:4.2, nServices:7,  cats:['pintura'],               location:'Aveiro',   bio:'Pintora disponível para interiores e exteriores.',
    reviews:[{author:'Hugo M.',text:'Bom trabalho!',rating:4,date:'2026-03-20'}] },
  { id:'s22', name:'Luís Teixeira',    school:'ETP Porto',     level:'AVANCADO',   rating:4.9, nServices:45, cats:['carpint','montagem'],    location:'Porto',    bio:'Marceneiro com 45 serviços. Desde reparações simples a peças personalizadas.',
    reviews:[{author:'Ana G.',text:'Móvel ficou lindo!',rating:5,date:'2026-04-23'},{author:'Pedro L.',text:'Profissional de excelência.',rating:5,date:'2026-04-10'}] },
  { id:'s23', name:'Patrícia Sousa',   school:'ETP Braga',     level:'INTERMEDIO', rating:4.4, nServices:10, cats:['cozinhar','babysitting'],location:'Braga',    bio:'Cozinheira e babysitter. Adoro trabalhar com crianças e cozinhar refeições saudáveis.',
    reviews:[{author:'Diana C.',text:'Os filhos adoram-na!',rating:4,date:'2026-03-22'}] },
  { id:'s24', name:'Ricardo Lopes',    school:'ETP Coimbra',   level:'BASICO',     rating:4.0, nServices:3,  cats:['jardinagem'],            location:'Coimbra',  bio:'Estudante de horticultura. Disponível para jardinagem.',
    reviews:[{author:'Maria T.',text:'Relva ficou perfeita.',rating:4,date:'2026-03-08'}] },
  { id:'s25', name:'Filipa Moreira',   school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.7, nServices:22, cats:['informatica','seguranca'],location:'Lisboa',  bio:'Técnica de redes e segurança informática. Wi-fi, câmaras e suporte IT.',
    reviews:[{author:'André B.',text:'Redes configuradas na perfeição.',rating:5,date:'2026-04-13'},{author:'Luísa C.',text:'Muito profissional.',rating:4,date:'2026-03-29'}] },
  { id:'s26', name:'Hélder Martins',   school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.6, nServices:17, cats:['soldadura'],             location:'Aveiro',   bio:'Soldador com certificação. Estruturas metálicas, portões e reparações.',
    reviews:[{author:'Paulo R.',text:'Portão novo ficou excelente.',rating:5,date:'2026-04-04'}] },
  { id:'s27', name:'Joana Azevedo',    school:'ETP Porto',     level:'BASICO',     rating:4.3, nServices:6,  cats:['limpeza','petsitting'],  location:'Porto',    bio:'Apaixonada por animais e pelo trabalho bem feito.',
    reviews:[{author:'Marco S.',text:'Ótima com o meu gato.',rating:4,date:'2026-03-16'}] },
  { id:'s28', name:'Vasco Cunha',      school:'ETP Braga',     level:'AVANCADO',   rating:4.8, nServices:33, cats:['canaliza','climatizacao'],location:'Braga',   bio:'Técnico especializado em canalização e climatização.',
    reviews:[{author:'Beatriz F.',text:'Excelente trabalho!',rating:5,date:'2026-04-24'},{author:'Tiago A.',text:'Muito eficiente.',rating:5,date:'2026-04-13'}] },
  { id:'s29', name:'Daniela Fonseca',  school:'ETP Setúbal',   level:'INTERMEDIO', rating:4.5, nServices:12, cats:['montagem','reparacao'],  location:'Setúbal',  bio:'Montagem de mobiliário e pequenas reparações domésticas. Precisa e rápida.',
    reviews:[{author:'Gonçalo P.',text:'Montou tudo rapidamente.',rating:5,date:'2026-04-07'}] },
  { id:'s30', name:'Bruno Esteves',    school:'ETP Faro',      level:'BASICO',     rating:4.1, nServices:4,  cats:['jardinagem','limpeza'],  location:'Faro',     bio:'Estudante de paisagismo. Corte de relva, podas e limpezas.',
    reviews:[{author:'Carla P.',text:'Jardim ficou arranjado.',rating:4,date:'2026-02-28'}] },
];

const LEVEL_LBL   = { BASICO:'Básico', INTERMEDIO:'Intermédio', AVANCADO:'Avançado' };
const URGENCY_LBL = { BAIXA:'Baixa', MEDIA:'Média', ALTA:'Alta', URGENTE:'Urgente' };
const STATUS_LBL  = {
  PENDENTE:'Pendente', EM_SELECAO:'A selecionar',
  AGUARDA:'Aguardar', CONFIRMADO:'Confirmado',
  CANCELADO:'Cancelado', CONCLUIDO:'Concluído',
};

// ── Smart scoring ────────────────────────────────────────────
function scoreStudent(student, req) {
  if (!student.cats.includes(req.catId)) return -1;
  let score = 30 + student.rating * 10;
  const lm = { BASICO:1, INTERMEDIO:2, AVANCADO:3 };
  const diff = (lm[student.level]||1) - (lm[req.level]||2);
  if (diff===0) score+=20; else if(diff===1) score+=10; else if(diff===-1) score+=5; else if(diff<-1) score-=10;
  if (req.urgency==='URGENTE') { if((lm[student.level]||1)>=2) score+=15; score+=student.nServices*0.3; }
  else if(req.urgency==='ALTA') { score+=8; score+=student.nServices*0.15; }
  else { score+=student.nServices*0.1; }
  score += Math.min(student.nServices,30)*0.5;
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
      document.getElementById('tab-login').classList.toggle('hidden', t !== 'login');
      document.getElementById('tab-register').classList.toggle('hidden', t !== 'register');
    });
  });

  buildCategoryList();
  populateAutoCategory();
});

// ============================================================
// SCREENS / TABS
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

function switchTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  if (name === 'pedido')    renderActiveRequest();
  if (name === 'historico') renderHistorico();
  if (name === 'def')       renderSettings();
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
  const nu = { id: 'u_'+Date.now(), name, email, password: pass };
  users.push(nu); LS.set(KEY_USERS, users);
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
// FULL-SCREEN OVERLAYS
// ============================================================
function openFullScreen(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('fscreen-open'));
}
function closeFullScreen(id) {
  const el = document.getElementById(id);
  el.classList.remove('fscreen-open');
  setTimeout(() => el.classList.add('hidden'), 280);
}

// ============================================================
// CATEGORY LIST
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
  thumb.style.height = thumbH + 'px';
  thumb.style.top = (ratio * (track.clientHeight - thumbH)) + 'px';
}
function populateAutoCategory() {
  const sel = document.getElementById('auto-category');
  sel.innerHTML = '<option value="">Escolhe uma categoria</option>' +
    CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
}

// ============================================================
// MANUAL FLOW
// ============================================================
function openManualCategory(catId) {
  // Allow browsing even with active request; only block proposals (handled in openStudentProfile)
  pendingManualCategory = catId;
  const cat = CATEGORIES.find(c => c.id === catId);
  const students = STUDENTS.filter(s => s.cats.includes(catId)).sort((a,b) => b.rating - a.rating);

  document.getElementById('fs-manual-title').textContent = `${cat.emoji} ${cat.name}`;
  document.getElementById('fs-manual-sub').textContent = students.length > 0
    ? `${students.length} aluno${students.length !== 1 ? 's' : ''} disponíve${students.length !== 1 ? 'is' : 'l'} nesta categoria`
    : 'Nenhum aluno disponível de momento.';

  document.getElementById('fs-manual-students-list').innerHTML = students.length > 0
    ? students.map(s => renderStudentCard(s, 'manual')).join('')
    : `<div class="empty-state">Sem alunos disponíveis para esta categoria.</div>`;

  openFullScreen('fs-manual');
}

// Opens profile from any context
function openStudentProfile(studentId, ctx) {
  profileContext = ctx || 'search';
  const s = STUDENTS.find(x => x.id === studentId);
  if (!s) return;

  const stars = starStr(s.rating);
  const catTags = s.cats.map(cid => {
    const cc = CATEGORIES.find(x => x.id === cid);
    return cc ? `<span class="profile-tag">${cc.emoji} ${cc.name}</span>` : '';
  }).join('');

  // Reviews HTML
  const reviewsHtml = s.reviews && s.reviews.length > 0
    ? s.reviews.map(r => `
      <div class="review-card">
        <div class="review-top">
          <span class="review-author">${escapeHtml(r.author)}</span>
          <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
          <span class="review-date">${r.date}</span>
        </div>
        <div class="review-text">${escapeHtml(r.text)}</div>
      </div>`).join('')
    : `<div class="empty-state" style="padding:.75rem 0">Sem avaliações ainda.</div>`;

  // Show "Enviar proposta" only from search context; show "Ver pedido" or nothing from other contexts
  let actionBtn = '';
  if (profileContext === 'search') {
    actionBtn = `<button class="btn-blue-full" style="margin-top:1.5rem" onclick="openSendProposal('${s.id}')">Enviar proposta</button>`;
  }

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
      <div class="pstat"><span class="pstat-num">${LEVEL_LBL[s.level]}</span><span class="pstat-lbl">Nível</span></div>
    </div>
    <div class="profile-section">
      <h3>Escola</h3>
      <p class="profile-bio">🏫 ${s.school}</p>
    </div>
    <div class="profile-section">
      <h3>Competências</h3>
      <div class="profile-tags">${catTags}</div>
    </div>
    <div class="profile-section">
      <h3>Sobre</h3>
      <p class="profile-bio">${s.bio}</p>
    </div>
    <div class="profile-section">
      <h3>Avaliações de clientes</h3>
      <div class="reviews-list">${reviewsHtml}</div>
    </div>
    ${actionBtn}`;

  openFullScreen('fs-profile');
}

// "Enviar proposta" — opens full-screen proposal form (only when no active request)
function openSendProposal(studentId) {
  if (hasActiveRequest()) {
    showOkModal('⚠️', 'Pedido ativo',
      'Já tens um pedido em curso. Cancela o pedido atual antes de criar um novo.');
    return;
  }
  pendingManualStudent = STUDENTS.find(s => s.id === studentId);
  document.getElementById('fs-proposal-title').textContent =
    `Proposta para ${pendingManualStudent.name}`;
  document.getElementById('fs-proposal-sub').textContent =
    `${pendingManualStudent.school} · ${pendingManualStudent.location}`;
  document.getElementById('proposal-desc').value = '';
  document.getElementById('proposal-location').value = '';
  document.getElementById('proposal-error').textContent = '';
  openFullScreen('fs-proposal');
}

function sendManualProposal() {
  const desc = document.getElementById('proposal-desc').value.trim();
  const loc  = document.getElementById('proposal-location').value.trim();
  const err  = document.getElementById('proposal-error');
  if (!desc) { err.textContent = 'Adiciona uma descrição.'; return; }

  const cat = CATEGORIES.find(c => c.id === pendingManualCategory) || CATEGORIES[CATEGORIES.length-1];
  const req = {
    id:              'req_' + Date.now(),
    userId:          currentUser.id,
    type:            'MANUAL',
    catId:           pendingManualCategory || 'outros',
    catName:         cat.name,
    catEmoji:        cat.emoji,
    description:     desc,
    location:        loc,
    urgency:         'MEDIA',
    level:           pendingManualStudent.level,
    status:          'AGUARDA',
    assignedStudent: pendingManualStudent,
    createdAt:       new Date().toISOString(),
  };
  saveRequest(req);

  closeFullScreen('fs-proposal');
  closeFullScreen('fs-profile');
  closeFullScreen('fs-manual');

  showOkModal('📨', 'Proposta enviada!',
    `A tua proposta foi enviada a <strong>${pendingManualStudent.name}</strong>. Receberás uma notificação quando ele responder.`);

  renderActiveRequest();
  renderHistorico();
}

// ============================================================
// AUTO FLOW
// ============================================================
function openAutoModal() {
  ['auto-step-form','auto-step-sending','auto-step-waiting',
   'auto-step-no-candidates','auto-step-expired','auto-step-choose']
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

  if (!catId)  { err.textContent = 'Escolhe uma categoria.'; return; }
  if (!desc)   { err.textContent = 'Adiciona uma descrição.'; return; }
  if (hasActiveRequest()) { err.textContent = 'Já tens um pedido ativo.'; return; }

  // Check if any candidates exist BEFORE creating the request
  const mockReq = { catId, level, urgency: urg };
  const hasCandidates = STUDENTS.some(s => scoreStudent(s, mockReq) >= 0);
  if (!hasCandidates) {
    err.textContent = '';
    showAutoStep('auto-step-no-candidates');
    return;
  }

  const cat = CATEGORIES.find(c => c.id === catId);
  pendingReqAuto = {
    id:       'req_' + Date.now(),
    userId:   currentUser.id,
    type:     'AUTO',
    catId, catName: cat.name, catEmoji: cat.emoji,
    description: desc, location: loc,
    urgency: urg, level,
    status:   'EM_SELECAO',
    assignedStudent: null,
    acceptedCandidates: [],
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
    { t:700,  cls:'log-ok',   msg:`✓ Pedido criado [${pendingReqAuto?.id.slice(-6)||'???'}]` },
    { t:1100, cls:'log-info', msg:`▶ GET /api/v1/students/profile?cat=${catId}&level=${level}` },
    { t:1600, cls:'log-info', msg:`  Motor de atribuição a avaliar candidatos…` },
    { t:2000, cls:'log-ok',   msg:`✓ Critério categoria: ${catName}` },
    { t:2200, cls:'log-ok',   msg:`✓ Critério nível: ${LEVEL_LBL[level]}` },
    { t:2400, cls:'log-ok',   msg:`✓ Critério urgência: ${URGENCY_LBL[urg]}` },
    { t:2700, cls:'log-info', msg:`  Score composto calculado (rating + exp + nível + urg)` },
    { t:2900, cls:'log-info', msg:`▶ POST /api/v1/notifications/job — notificar alunos` },
    { t:3400, cls:'log-ok',   msg:`✓ Propostas enviadas — aguardar respostas` },
  ];
  lines.forEach(({ t, cls, msg }) => setTimeout(() => {
    const l = document.createElement('div');
    l.className = `log-line ${cls}`; l.textContent = msg;
    log.appendChild(l); log.scrollTop = log.scrollHeight;
  }, t));
  setTimeout(cb, 3800);
}

function simulateAcceptance() {
  if (!pendingReqAuto) return;
  const candidates = STUDENTS
    .map(s => ({ student: s, score: scoreStudent(s, pendingReqAuto) }))
    .filter(x => x.score >= 0)
    .sort((a,b) => b.score - a.score)
    .slice(0,3).map(x => x.student);

  if (candidates.length === 0) {
    // No one accepted — expire the request
    const all = LS.get(KEY_REQUESTS) || [];
    const req = all.find(r => r.id === pendingReqAuto.id);
    if (req) { req.status = 'CANCELADO'; LS.set(KEY_REQUESTS, all); }
    renderActiveRequest(); renderHistorico();
    showAutoStep('auto-step-expired');
    pendingReqAuto = null;
    return;
  }

  // Save candidates to request so pedido tab can show them
  const all = LS.get(KEY_REQUESTS) || [];
  const req = all.find(r => r.id === pendingReqAuto.id);
  if (req) {
    req.status = 'AGUARDA';
    req.acceptedCandidates = candidates.map(s => s.id);
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
  }
  pendingReqAuto = { ...pendingReqAuto, acceptedCandidates: candidates.map(s=>s.id), status:'AGUARDA' };

  showAutoStep('auto-step-choose');
  document.getElementById('auto-choose-sub').textContent =
    `${candidates.length} aluno${candidates.length !== 1 ? 's' : ''} aceitou a tua proposta. Escolhe um:`;
  document.getElementById('auto-students-list').innerHTML =
    candidates.map(s => renderStudentCard(s, 'auto')).join('');
}

// Called from pedido tab: re-open chooser with accepted candidates
function openChooserFromPedido(reqId) {
  const all = LS.get(KEY_REQUESTS) || [];
  const req = all.find(r => r.id === reqId);
  if (!req) return;

  if (req.type === 'MANUAL') {
    // confirm the manually chosen student
    req.status = 'CONFIRMADO';
    req.confirmedAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
    showToast(`${req.assignedStudent.name} confirmado! ✅`);
    return;
  }

  const candidates = (req.acceptedCandidates || []).map(id => STUDENTS.find(s=>s.id===id)).filter(Boolean);
  pendingReqAuto = req;

  showAutoStep('auto-step-choose');
  document.getElementById('auto-choose-sub').textContent =
    `${candidates.length} aluno${candidates.length !== 1 ? 's' : ''} aceitou a tua proposta. Escolhe um:`;
  document.getElementById('auto-students-list').innerHTML =
    candidates.map(s => renderStudentCard(s, 'auto')).join('');

  ['auto-step-form','auto-step-sending','auto-step-waiting',
   'auto-step-no-candidates','auto-step-expired'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));
  document.getElementById('auto-step-choose').classList.remove('hidden');
  openFullScreen('fs-auto');
}

// Called from pedido tab: trigger simulate from the pedido page
function simulateAcceptFromPedido(reqId) {
  const all = LS.get(KEY_REQUESTS) || [];
  const req = all.find(r => r.id === reqId);
  if (!req) return;

  if (req.type === 'MANUAL') {
    req.status = 'CONFIRMADO';
    req.confirmedAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
    showToast(`${req.assignedStudent.name} aceitou! ✅`);
    return;
  }

  // For auto requests, score and decide
  const candidates = STUDENTS
    .map(s => ({ student: s, score: scoreStudent(s, req) }))
    .filter(x => x.score >= 0)
    .sort((a,b) => b.score - a.score)
    .slice(0,3).map(x => x.student);

  if (candidates.length === 0) {
    req.status = 'CANCELADO';
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
    showOkModal('😔', 'Nenhum aluno disponível',
      'Nenhum aluno aceitou o teu pedido dentro do prazo. O pedido foi cancelado. Tenta novamente ou usa a pesquisa manual.');
    return;
  }

  req.status = 'AGUARDA';
  req.acceptedCandidates = candidates.map(s => s.id);
  LS.set(KEY_REQUESTS, all);
  pendingReqAuto = req;
  renderActiveRequest();
  renderHistorico();
  showToast(`${candidates.length} aluno${candidates.length>1?'s':''} aceitaram! Escolhe um na aba do pedido.`);
}

function showAutoStep(stepId) {
  ['auto-step-form','auto-step-sending','auto-step-waiting',
   'auto-step-no-candidates','auto-step-expired','auto-step-choose']
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
    req.acceptedCandidates = [];
    req.confirmedAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
  }
  closeFullScreen('fs-auto');
  showOkModal('🎉', 'Prestador confirmado!',
    `<strong>${student.name}</strong> da <em>${student.school}</em> foi confirmado. Podes comunicar com ele na aba Pedido.`);
  pendingReqAuto = null;
  renderActiveRequest(); renderHistorico();
}

// ============================================================
// ACTIVE REQUEST RENDER
// ============================================================
function renderActiveRequest() {
  const area = document.getElementById('active-request-area');
  const active = getUserRequests().find(r => ['EM_SELECAO','AGUARDA','CONFIRMADO'].includes(r.status));

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
  const isWaiting   = (active.status === 'EM_SELECAO' || active.status === 'AGUARDA');
  const hasCandidates = active.acceptedCandidates && active.acceptedCandidates.length > 0;

  // Student block (confirmed)
  const stuSection = isConfirmed ? `
    <div class="req-student-block" onclick="openStudentProfile('${stu.id}','pedido')" style="cursor:pointer">
      <div class="req-student-header">
        <div class="stu-avatar small">${stu.name[0]}</div>
        <div style="flex:1">
          <div class="req-student-name">${stu.name}</div>
          <div class="req-student-meta">🏫 ${stu.school} · 📍 ${stu.location}</div>
        </div>
        <span class="stars">${starStr(stu.rating)} <span style="font-size:.72rem;color:rgba(255,255,255,.7)">${stu.rating.toFixed(1)}</span></span>
      </div>
      <div class="req-student-view-profile">Ver perfil completo →</div>
    </div>` : '';

  // Accepted candidates list (waiting, before choosing)
  let candidatesSection = '';
  if (isWaiting && hasCandidates) {
    const cands = active.acceptedCandidates.map(id => STUDENTS.find(s=>s.id===id)).filter(Boolean);
    candidatesSection = `
      <div class="candidates-block">
        <div class="candidates-header">✅ ${cands.length} aluno${cands.length>1?'s':''} aceitaram a proposta!</div>
        <p style="font-size:.82rem;color:var(--text-2);margin:.35rem 0 .75rem">Escolhe quem vai realizar o serviço:</p>
        ${cands.map(s => renderStudentCard(s,'auto')).join('')}
      </div>`;
  }

  // Simulate btn only if waiting and no candidates yet
  const simulateBtn = (isWaiting && !hasCandidates) ? `
    <button class="btn-simulate-accept" onclick="simulateAcceptFromPedido('${active.id}')">
      🎭 Simular resposta dos alunos
    </button>` : '';

  // Chat
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
        <div class="req-field-row"><span class="req-field-label">Tipo</span><span class="req-field-val">${active.type==='AUTO'?'🤖 Automático':'🔍 Manual'}</span></div>
        <div class="req-field-row"><span class="req-field-label">Urgência</span><span class="req-field-val">${URGENCY_LBL[active.urgency]}</span></div>
        <div class="req-field-row"><span class="req-field-label">Descrição</span><span class="req-field-val">${active.description}</span></div>
        ${active.location ? `<div class="req-field-row"><span class="req-field-label">Local</span><span class="req-field-val">${active.location}</span></div>` : ''}
      </div>
      ${stuSection}
      ${candidatesSection}
      ${simulateBtn}
      ${chatSection}
      <div style="padding:0 1.25rem 1.25rem">
        <button class="btn-cancel-req" onclick="cancelActiveRequest('${active.id}')">Cancelar pedido</button>
      </div>
    </div>`;

  if (isConfirmed) wireChatInput(active.id);
}

// ============================================================
// CHAT
// ============================================================
function getChatMessages(reqId) { return (LS.get(KEY_CHATS)||{})[reqId]||[]; }
function saveChatMessage(reqId, msg) {
  const all = LS.get(KEY_CHATS)||{};
  if (!all[reqId]) all[reqId]=[];
  all[reqId].push(msg); LS.set(KEY_CHATS, all);
}
function renderChatSection(req) {
  const msgs = getChatMessages(req.id);
  const msgsHtml = msgs.length===0
    ? `<div class="chat-empty">Sem mensagens ainda. Começa a conversa! 👋</div>`
    : msgs.map(m=>`<div class="chat-bubble ${m.from==='client'?'chat-me':'chat-other'}"><div class="chat-text">${escapeHtml(m.text)}</div><div class="chat-time">${formatTimeShort(m.ts)}</div></div>`).join('');
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
function wireChatInput(reqId) { const el=document.getElementById(`chat-msgs-${reqId}`); if(el) el.scrollTop=el.scrollHeight; }
function chatKeydown(e,reqId) { if(e.key==='Enter') sendChatMessage(reqId); }
function sendChatMessage(reqId) {
  const input = document.getElementById(`chat-input-${reqId}`);
  if (!input) return;
  const text = input.value.trim(); if(!text) return;
  saveChatMessage(reqId, {from:'client',text,ts:Date.now()});
  input.value='';
  const c = document.getElementById(`chat-msgs-${reqId}`);
  if (c) {
    const b=document.createElement('div'); b.className='chat-bubble chat-me';
    b.innerHTML=`<div class="chat-text">${escapeHtml(text)}</div><div class="chat-time">${formatTimeShort(Date.now())}</div>`;
    c.querySelector('.chat-empty')?.remove(); c.appendChild(b); c.scrollTop=c.scrollHeight;
  }
  const replies=['Olá! Confirmado, estarei aí na hora combinada. 👍','Perfeito, sem problema!','Claro, podem contar comigo.','Obrigado pelo contacto!','Entendido, até logo!','Combinado! Qualquer dúvida, é só falar.'];
  setTimeout(()=>{
    const reply=replies[Math.floor(Math.random()*replies.length)];
    saveChatMessage(reqId,{from:'student',text:reply,ts:Date.now()});
    const cc=document.getElementById(`chat-msgs-${reqId}`);
    if(cc){const b=document.createElement('div');b.className='chat-bubble chat-other';
    b.innerHTML=`<div class="chat-text">${escapeHtml(reply)}</div><div class="chat-time">${formatTimeShort(Date.now())}</div>`;
    cc.appendChild(b);cc.scrollTop=cc.scrollHeight;}
  }, 900+Math.random()*1200);
}

// ============================================================
// HISTORICO
// ============================================================
function renderHistorico() {
  const list  = document.getElementById('historico-list');
  const empty = document.getElementById('historico-empty');
  const all   = getUserRequests().slice().reverse();
  if (all.length===0) { list.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = all.map(r => {
    const stuLine = r.assignedStudent
      ? `<div class="hist-student" onclick="openStudentProfile('${r.assignedStudent.id}','historico')" style="cursor:pointer">
           👤 ${r.assignedStudent.name} · ${r.assignedStudent.school} <span style="font-size:.7rem;color:var(--blue-light)">Ver perfil</span>
         </div>`
      : '';
    return `
    <div class="hist-card">
      <div class="hist-icon">${r.catEmoji}</div>
      <div class="hist-info">
        <div class="hist-title">${r.catName}${r.description?' — '+r.description.slice(0,38)+(r.description.length>38?'…':''):''}</div>
        <div class="hist-date">${formatDate(r.createdAt)} · ${r.type==='AUTO'?'🤖 Auto':'🔍 Manual'}</div>
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
  document.getElementById('settings-avatar').textContent= (currentUser.name||'U')[0].toUpperCase();
}

// ============================================================
// REQUEST HELPERS
// ============================================================
function getUserRequests() { return (LS.get(KEY_REQUESTS)||[]).filter(r=>r.userId===currentUser?.id); }
function saveRequest(req) {
  let all = LS.get(KEY_REQUESTS)||[];
  const i = all.findIndex(r=>r.id===req.id);
  if(i>=0) all[i]=req; else all.push(req);
  LS.set(KEY_REQUESTS,all);
}
function hasActiveRequest() { return getUserRequests().some(r=>['EM_SELECAO','AGUARDA','CONFIRMADO'].includes(r.status)); }
function cancelActiveRequest(reqId) {
  if (!confirm('Cancelar este pedido?')) return;
  let all=LS.get(KEY_REQUESTS)||[];
  const r=all.find(x=>x.id===reqId);
  if(r){r.status='CANCELADO';LS.set(KEY_REQUESTS,all);}
  renderActiveRequest(); renderHistorico(); showToast('Pedido cancelado.');
}
function clearAllData() {
  if(!confirm('Apagar todos os dados locais?')) return;
  LS.del(KEY_REQUESTS); LS.del(KEY_CHATS);
  renderActiveRequest(); renderHistorico(); showToast('Dados apagados.');
}

// ============================================================
// MODALS
// ============================================================
function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
function showOkModal(icon,title,body) {
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
  let actionBtn;
  if (mode==='auto')
    actionBtn=`<button class="btn-choose" onclick="chooseAutoStudent('${s.id}')">Escolher</button>`;
  else
    actionBtn=`<button class="btn-proposal" onclick="openStudentProfile('${s.id}','search')">Ver perfil</button>`;
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
function starStr(r) { return '★'.repeat(Math.floor(r))+(r%1>=.5?'½':''); }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function formatTimeShort(ts) { return new Date(ts).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}); }
function escapeHtml(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toggleDark(cb) { document.body.classList.toggle('dark',cb.checked); }
function showToast(msg,dur=3000) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.remove('hidden');
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.classList.add('hidden'),300);},dur);
}