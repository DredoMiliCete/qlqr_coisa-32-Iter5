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
const KEY_STUDENT_STATS = 'handy_student_stats';

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

// ── Schools — diferenciadas por especialidade e distrito ──────
const SCHOOLS = {
  // Aveiro
  'ETP Aveiro':      { name:'ETP Aveiro',       district:'Aveiro',  specialty:'Instalações & Energia',       color:'#1a6ff0', emoji:'⚡' },
  'ETAP Aveiro':     { name:'ETAP Aveiro',       district:'Aveiro',  specialty:'Construção & Reparação',      color:'#0d4fc4', emoji:'🔧' },
  // Porto
  'ETP Porto':       { name:'ETP Porto',         district:'Porto',   specialty:'Tecnologia & Construção',     color:'#7c3aed', emoji:'🪚' },
  'EPTLH Porto':     { name:'EPTLH Porto',       district:'Porto',   specialty:'Hotelaria & Serviços Domésticos', color:'#db2777', emoji:'🍳' },
  'EPVC Gaia':       { name:'EPVC Gaia',         district:'Porto',   specialty:'Verde & Cuidados',            color:'#16a34a', emoji:'🌿' },
  // Lisboa
  'EPGB Lisboa':     { name:'EPGB Lisboa',       district:'Lisboa',  specialty:'Gestão & Informática',        color:'#dc2626', emoji:'💻' },
  'ETPL Lisboa':     { name:'ETPL Lisboa',       district:'Lisboa',  specialty:'Eletrónica & Segurança',      color:'#b45309', emoji:'🔒' },
  // Coimbra
  'ETP Coimbra':     { name:'ETP Coimbra',       district:'Coimbra', specialty:'Artes & Acabamentos',         color:'#0891b2', emoji:'🎨' },
  'EPCV Coimbra':    { name:'EPCV Coimbra',      district:'Coimbra', specialty:'Cuidados & Verde',            color:'#059669', emoji:'👶' },
};

// ── Students — max 2 competências, maioria 1 ─────────────────
// reviews: array of {author, text, rating, date, clientId?}
const STUDENTS = [
  // ── ETP Aveiro (Instalações & Energia) ───────────────────────
  { id:'s1',  name:'Carlos Oliveira',  school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.7, nServices:18, cats:['canaliza','eletric'],     location:'Aveiro',
    reviews:[{author:'João M.',text:'Muito profissional e rápido.',rating:5,date:'2026-04-10'},{author:'Ana S.',text:'Resolveu o problema na hora.',rating:4,date:'2026-03-22'}],
    bio:'Apaixonado por eletricidade e canalização. 18 serviços com excelente feedback.' },
  { id:'s5',  name:'Rui Marques',      school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.5, nServices:12, cats:['canaliza'],               location:'Ílhavo',
    reviews:[{author:'Carla M.',text:'Rápido e eficiente.',rating:5,date:'2026-04-05'},{author:'Hugo S.',text:'Bom serviço pelo preço.',rating:4,date:'2026-03-10'}],
    bio:'Canalizador experiente com boas referências. Respondo rápido.' },
  { id:'s9',  name:'Tiago Nunes',      school:'ETP Aveiro',    level:'AVANCADO',   rating:4.9, nServices:42, cats:['canaliza'],               location:'Aveiro',
    reviews:[{author:'Patrícia L.',text:'O melhor que já contratei.',rating:5,date:'2026-04-22'},{author:'Rui A.',text:'Sempre pontual e profissional.',rating:5,date:'2026-04-14'}],
    bio:'Top prestador em canalização. 42 serviços realizados.' },
  { id:'s12', name:'Catarina Silva',   school:'ETP Aveiro',    level:'INTERMEDIO', rating:4.5, nServices:11, cats:['informatica'],            location:'Oliveira do Bairro',
    reviews:[{author:'Nuno B.',text:'Instalou tudo sem problemas.',rating:4,date:'2026-03-25'}],
    bio:'Programação, instalação de software e suporte técnico.' },
  { id:'s31', name:'Fábio Nascimento', school:'ETP Aveiro',    level:'BASICO',     rating:4.1, nServices:5,  cats:['eletric'],                location:'Estarreja',
    reviews:[{author:'Teresa M.',text:'Boa disposição, trabalho correto.',rating:4,date:'2026-04-01'}],
    bio:'Curso de Instalações Elétricas. Disponível para instalações simples e manutenção.' },

  // ── ETAP Aveiro (Construção & Reparação) ─────────────────────
  { id:'s26', name:'Hélder Martins',   school:'ETAP Aveiro',   level:'INTERMEDIO', rating:4.6, nServices:17, cats:['soldadura'],              location:'Estarreja',
    reviews:[{author:'Paulo R.',text:'Portão novo ficou excelente.',rating:5,date:'2026-04-04'}],
    bio:'Soldador com certificação. Estruturas metálicas, portões e reparações.' },
  { id:'s21', name:'Sara Baptista',    school:'ETAP Aveiro',   level:'BASICO',     rating:4.2, nServices:7,  cats:['pintura'],                location:'Ovar',
    reviews:[{author:'Hugo M.',text:'Bom trabalho!',rating:4,date:'2026-03-20'}],
    bio:'Pintora disponível para interiores e exteriores.' },
  { id:'s32', name:'Afonso Correia',   school:'ETAP Aveiro',   level:'INTERMEDIO', rating:4.4, nServices:9,  cats:['manutencao'],             location:'Aveiro',
    reviews:[{author:'Sónia P.',text:'Resolveu vários pequenos problemas em casa.',rating:4,date:'2026-03-30'}],
    bio:'Manutenção geral de habitações. Especializado no curso de Construção Civil.' },
  { id:'s33', name:'Mara Figueiredo',  school:'ETAP Aveiro',   level:'BASICO',     rating:4.0, nServices:4,  cats:['reparacao'],              location:'Águeda',
    reviews:[{author:'Bernardo L.',text:'Reparou a torneira sem complicações.',rating:4,date:'2026-02-15'}],
    bio:'Curso de Construção e Manutenção. Disponível para pequenas reparações domésticas.' },

  // ── ETP Porto (Tecnologia & Construção) ──────────────────────
  { id:'s8',  name:'Marta Alves',      school:'ETP Porto',     level:'INTERMEDIO', rating:4.6, nServices:15, cats:['carpint','eletric'],      location:'Porto',
    reviews:[{author:'David P.',text:'Muito competente!',rating:5,date:'2026-04-08'},{author:'Inês G.',text:'Ficou tudo perfeito.',rating:4,date:'2026-03-30'}],
    bio:'Trabalho bem em carpintaria e eletricidade. Gosto de desafios.' },
  { id:'s22', name:'Luís Teixeira',    school:'ETP Porto',     level:'AVANCADO',   rating:4.9, nServices:45, cats:['carpint','montagem'],     location:'Gondomar',
    reviews:[{author:'Ana G.',text:'Móvel ficou lindo!',rating:5,date:'2026-04-23'},{author:'Pedro L.',text:'Profissional de excelência.',rating:5,date:'2026-04-10'}],
    bio:'Marceneiro com 45 serviços. Desde reparações simples a peças personalizadas.' },
  { id:'s28', name:'Vasco Cunha',      school:'ETP Porto',     level:'AVANCADO',   rating:4.8, nServices:33, cats:['canaliza','climatizacao'], location:'Paredes',
    reviews:[{author:'Beatriz F.',text:'Excelente trabalho!',rating:5,date:'2026-04-24'},{author:'Tiago A.',text:'Muito eficiente.',rating:5,date:'2026-04-13'}],
    bio:'Técnico especializado em canalização e climatização.' },
  { id:'s34', name:'Simão Barbosa',    school:'ETP Porto',     level:'BASICO',     rating:4.0, nServices:3,  cats:['montagem'],               location:'Maia',
    reviews:[{author:'Filomena S.',text:'Montou cama e roupeiro.',rating:4,date:'2026-03-05'}],
    bio:'Curso de Tecnologia e Construção. Montagem de mobiliário e prateleiras.' },
  { id:'s35', name:'Inês Carvalho',    school:'ETP Porto',     level:'INTERMEDIO', rating:4.5, nServices:10, cats:['eletric'],                location:'Vila Nova de Gaia',
    reviews:[{author:'Rui M.',text:'Instalou tomadas e disjuntor sem problemas.',rating:5,date:'2026-04-02'}],
    bio:'Eletricista em formação, com foco em instalações domésticas.' },

  // ── EPTLH Porto (Hotelaria & Serviços Domésticos) ────────────
  { id:'s16', name:'Diogo Lemos',      school:'EPTLH Porto',   level:'AVANCADO',   rating:4.9, nServices:31, cats:['cozinhar'],               location:'Porto',
    reviews:[{author:'Ana M.',text:'Jantar incrível!',rating:5,date:'2026-04-21'},{author:'Pedro S.',text:'Comida deliciosa e bem apresentada.',rating:5,date:'2026-04-11'}],
    bio:'Chef em formação. Refeições do dia-a-dia ou jantares especiais.' },
  { id:'s23', name:'Patrícia Sousa',   school:'EPTLH Porto',   level:'INTERMEDIO', rating:4.4, nServices:10, cats:['cozinhar','babysitting'],  location:'Valongo',
    reviews:[{author:'Diana C.',text:'Os filhos adoram-na!',rating:4,date:'2026-03-22'}],
    bio:'Cozinheira e babysitter. Adoro trabalhar com crianças e cozinhar refeições saudáveis.' },
  { id:'s36', name:'Tomás Andrade',    school:'EPTLH Porto',   level:'BASICO',     rating:4.1, nServices:6,  cats:['limpeza'],                location:'Matosinhos',
    reviews:[{author:'Celeste R.',text:'Limpeza cuidada e eficiente.',rating:4,date:'2026-03-18'}],
    bio:'Curso de Serviços Domésticos. Limpeza geral e organização de espaços.' },
  { id:'s37', name:'Madalena Cruz',    school:'EPTLH Porto',   level:'INTERMEDIO', rating:4.6, nServices:14, cats:['cozinhar'],               location:'Porto',
    reviews:[{author:'Nélson S.',text:'Cozinha caseira deliciosa!',rating:5,date:'2026-04-07'},{author:'Lúcia F.',text:'Pontual e simpática.',rating:4,date:'2026-03-25'}],
    bio:'Especializada em cozinha portuguesa tradicional. Preparação de refeições e sobremesas.' },

  // ── EPVC Gaia (Verde & Cuidados) ─────────────────────────────
  { id:'s7',  name:'João Pereira',     school:'EPVC Gaia',     level:'BASICO',     rating:4.0, nServices:4,  cats:['mudancas'],               location:'Vila Nova de Gaia',
    reviews:[{author:'Filipe R.',text:'Cuidadoso com os móveis.',rating:4,date:'2026-02-20'}],
    bio:'Disponível para ajudas em mudanças. Pontual e cuidadoso.' },
  { id:'s27', name:'Joana Azevedo',    school:'EPVC Gaia',     level:'BASICO',     rating:4.3, nServices:6,  cats:['limpeza','petsitting'],   location:'Espinho',
    reviews:[{author:'Marco S.',text:'Ótima com o meu gato.',rating:4,date:'2026-03-16'}],
    bio:'Apaixonada por animais e pelo trabalho bem feito.' },
  { id:'s38', name:'Rodrigo Pinto',    school:'EPVC Gaia',     level:'INTERMEDIO', rating:4.5, nServices:13, cats:['jardinagem'],             location:'Gondomar',
    reviews:[{author:'Amélia C.',text:'Jardim transformado! Recomendo.',rating:5,date:'2026-04-14'},{author:'Rúben A.',text:'Bom trabalho na poda.',rating:4,date:'2026-03-28'}],
    bio:'Técnico de Jardinagem e Espaços Verdes. Projeto, plantação e manutenção.' },
  { id:'s39', name:'Leonor Vieira',    school:'EPVC Gaia',     level:'BASICO',     rating:4.2, nServices:5,  cats:['petsitting'],             location:'Vila Nova de Gaia',
    reviews:[{author:'Dora M.',text:'Ficou ótimo com os meus dois gatos.',rating:4,date:'2026-03-10'}],
    bio:'Curso de Cuidados Veterinários. Petsitting responsável e carinhoso.' },

  // ── EPGB Lisboa (Gestão & Informática) ───────────────────────
  { id:'s2',  name:'Ana Ferreira',     school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.9, nServices:34, cats:['eletric','carpint'],      location:'Lisboa',
    reviews:[{author:'Pedro C.',text:'Excelente trabalho, muito recomendada!',rating:5,date:'2026-04-18'},{author:'Rita L.',text:'Pontual e cuidadosa.',rating:5,date:'2026-04-01'}],
    bio:'Especialista em carpintaria e instalações elétricas. Rigorosa e pontual.' },
  { id:'s11', name:'Pedro Gomes',      school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.8, nServices:23, cats:['informatica','seguranca'], location:'Oeiras',
    reviews:[{author:'Sandra C.',text:'Resolveu um problema difícil rapidamente.',rating:5,date:'2026-04-16'},{author:'Marco L.',text:'Muito profissional.',rating:5,date:'2026-04-02'}],
    bio:'Técnico de informática especializado em redes e reparação de hardware.' },
  { id:'s25', name:'Filipa Moreira',   school:'EPGB Lisboa',   level:'AVANCADO',   rating:4.7, nServices:22, cats:['informatica','seguranca'], location:'Amadora',
    reviews:[{author:'André B.',text:'Redes configuradas na perfeição.',rating:5,date:'2026-04-13'},{author:'Luísa C.',text:'Muito profissional.',rating:4,date:'2026-03-29'}],
    bio:'Técnica de redes e segurança informática. Wi-fi, câmaras e suporte IT.' },
  { id:'s40', name:'Gonçalo Neto',     school:'EPGB Lisboa',   level:'INTERMEDIO', rating:4.4, nServices:8,  cats:['informatica'],            location:'Loures',
    reviews:[{author:'Virgínia C.',text:'Configurou o portátil sem problemas.',rating:4,date:'2026-03-20'}],
    bio:'Curso de Gestão de Sistemas Informáticos. Suporte técnico e instalação de software.' },
  { id:'s41', name:'Beatriz Campos',   school:'EPGB Lisboa',   level:'BASICO',     rating:4.0, nServices:3,  cats:['outros'],                 location:'Lisboa',
    reviews:[{author:'Alberto S.',text:'Ajudou com organização do escritório.',rating:4,date:'2026-02-25'}],
    bio:'Curso de Gestão. Disponível para serviços de organização e apoio administrativo.' },

  // ── ETPL Lisboa (Eletrónica & Segurança) ─────────────────────
  { id:'s20', name:'Nuno Carvalho',    school:'ETPL Lisboa',   level:'AVANCADO',   rating:4.8, nServices:38, cats:['seguranca'],              location:'Loures',
    reviews:[{author:'Carla S.',text:'Sistema de câmaras instalado sem erros.',rating:5,date:'2026-04-17'},{author:'Miguel A.',text:'Muito competente e organizado.',rating:5,date:'2026-04-03'}],
    bio:'Especialista em sistemas de segurança e videovigilância.' },
  { id:'s6',  name:'Sofia Costa',      school:'ETPL Lisboa',   level:'AVANCADO',   rating:4.6, nServices:21, cats:['jardinagem','pintura'],   location:'Cascais',
    reviews:[{author:'Bruno N.',text:'Jardim ficou lindo!',rating:5,date:'2026-04-12'}],
    bio:'Adoro jardinagem e faço trabalhos de pintura de qualidade.' },
  { id:'s15', name:'Mariana Rocha',    school:'ETPL Lisboa',   level:'INTERMEDIO', rating:4.7, nServices:14, cats:['petsitting'],             location:'Almada',
    reviews:[{author:'Tiago R.',text:'O meu cão adorou!',rating:5,date:'2026-04-19'},{author:'Sofia C.',text:'Muito responsável.',rating:5,date:'2026-04-03'}],
    bio:'Amante dos animais. Passeios, alimentação e companhia garantidos.' },
  { id:'s42', name:'Henrique Saraiva', school:'ETPL Lisboa',   level:'INTERMEDIO', rating:4.5, nServices:11, cats:['eletric'],                location:'Sintra',
    reviews:[{author:'Olívia F.',text:'Instalou quadro elétrico novo.',rating:5,date:'2026-04-05'}],
    bio:'Eletrónica e automação doméstica. Quadros elétricos, domótica e instalações.' },
  { id:'s43', name:'Cláudia Mendes',   school:'ETPL Lisboa',   level:'BASICO',     rating:4.1, nServices:4,  cats:['seguranca'],              location:'Odivelas',
    reviews:[{author:'Tomás C.',text:'Instalou campainha e intercom.',rating:4,date:'2026-03-12'}],
    bio:'Curso de Sistemas de Segurança. Instalação de câmaras, alarmes e interfones.' },

  // ── ETP Coimbra (Artes & Acabamentos) ────────────────────────
  { id:'s4',  name:'Inês Rodrigues',   school:'ETP Coimbra',   level:'AVANCADO',   rating:4.8, nServices:27, cats:['pintura','carpint'],      location:'Coimbra',
    reviews:[{author:'Luís T.',text:'Trabalho impecável. Muito recomendo.',rating:5,date:'2026-04-20'},{author:'Sofia A.',text:'Super atenciosa e profissional.',rating:5,date:'2026-03-28'}],
    bio:'Especializada em pintura decorativa e restauro de mobiliário.' },
  { id:'s10', name:'Beatriz Lima',     school:'ETP Coimbra',   level:'INTERMEDIO', rating:4.4, nServices:9,  cats:['pintura','limpeza'],      location:'Figueira da Foz',
    reviews:[{author:'Vasco M.',text:'Boa pintora, atenta ao detalhe.',rating:4,date:'2026-03-18'}],
    bio:'Pintora criativa e dedicada. Faço também limpezas pós-obra.' },
  { id:'s29', name:'Daniela Fonseca',  school:'ETP Coimbra',   level:'INTERMEDIO', rating:4.5, nServices:12, cats:['montagem','reparacao'],   location:'Lousã',
    reviews:[{author:'Gonçalo P.',text:'Montou tudo rapidamente.',rating:5,date:'2026-04-07'}],
    bio:'Montagem de mobiliário e pequenas reparações domésticas. Precisa e rápida.' },
  { id:'s44', name:'Afonso Duarte',    school:'ETP Coimbra',   level:'BASICO',     rating:4.2, nServices:6,  cats:['carpint'],                location:'Coimbra',
    reviews:[{author:'Cristina B.',text:'Fez uma prateleira resistente.',rating:4,date:'2026-03-22'}],
    bio:'Curso de Artes do Mobiliário. Carpintaria básica e restauro de peças simples.' },
  { id:'s45', name:'Margarida Reis',   school:'ETP Coimbra',   level:'INTERMEDIO', rating:4.6, nServices:15, cats:['pintura'],                location:'Cantanhede',
    reviews:[{author:'Dinis F.',text:'Sala transformada! Cores perfeitas.',rating:5,date:'2026-04-11'},{author:'Elsa M.',text:'Muito caprichosa.',rating:4,date:'2026-03-27'}],
    bio:'Pintura decorativa e acabamentos. Especialidade em stucco e efeitos especiais.' },

  // ── EPCV Coimbra (Cuidados & Verde) ──────────────────────────
  { id:'s13', name:'Leonor Faria',     school:'EPCV Coimbra',  level:'BASICO',     rating:4.3, nServices:8,  cats:['babysitting'],            location:'Condeixa-a-Nova',
    reviews:[{author:'Maria J.',text:'Adorou os meus filhos!',rating:5,date:'2026-04-07'},{author:'Carlos B.',text:'Responsável e carinhosa.',rating:4,date:'2026-03-12'}],
    bio:'Amo crianças e tenho formação em primeiros socorros pediátricos.' },
  { id:'s19', name:'Francisca Pinto',  school:'EPCV Coimbra',  level:'INTERMEDIO', rating:4.5, nServices:13, cats:['limpeza','babysitting'],  location:'Cantanhede',
    reviews:[{author:'Rui C.',text:'Casa impecável.',rating:5,date:'2026-04-06'}],
    bio:'Zeladora experiente e cuidadora dedicada. Flexível em horários.' },
  { id:'s24', name:'Ricardo Lopes',    school:'EPCV Coimbra',  level:'BASICO',     rating:4.0, nServices:3,  cats:['jardinagem'],             location:'Montemor-o-Velho',
    reviews:[{author:'Maria T.',text:'Relva ficou perfeita.',rating:4,date:'2026-03-08'}],
    bio:'Estudante de horticultura. Disponível para jardinagem.' },
  { id:'s46', name:'Constança Melo',   school:'EPCV Coimbra',  level:'INTERMEDIO', rating:4.5, nServices:11, cats:['babysitting'],            location:'Coimbra',
    reviews:[{author:'Álvaro N.',text:'As crianças adoraram, muito responsável.',rating:5,date:'2026-04-08'},{author:'Laura F.',text:'Sempre pontual e carinhosa.',rating:4,date:'2026-03-19'}],
    bio:'Educação de Infância. Experiência com crianças de 0 a 10 anos.' },
  { id:'s47', name:'Eduardo Bessa',    school:'EPCV Coimbra',  level:'BASICO',     rating:4.1, nServices:5,  cats:['petsitting'],             location:'Figueira da Foz',
    reviews:[{author:'Miriam T.',text:'Cuidou bem do meu cão.',rating:4,date:'2026-03-01'}],
    bio:'Veterinária preventiva. Passeios, alimentação e cuidados básicos de animais.' },
];

const LEVEL_LBL   = { BASICO:'Básico', INTERMEDIO:'Intermédio', AVANCADO:'Avançado' };
const URGENCY_LBL = { BAIXA:'Baixa', MEDIA:'Média', ALTA:'Alta', URGENTE:'Urgente' };
const STATUS_LBL  = {
  PENDENTE:'Pendente', EM_SELECAO:'A selecionar',
  AGUARDA:'Aguardar', CONFIRMADO:'Confirmado',
  AGUARDA_PAGAMENTO:'Aguarda Pagamento',
  PAGO:'Pagamento Efetuado',
  EM_EXECUCAO:'Em Execução',
  CANCELADO:'Cancelado', CONCLUIDO:'Concluído',
  CONCLUIDO_SEM_AVALIACAO:'Concluído s/ Avaliação',
};

// ============================================================
// SISTEMA DE LOCALIZAÇÃO
// Cidades dos distritos de Porto, Lisboa, Aveiro e Coimbra
// ============================================================
const CITY_COORDS = {
  // ── Distrito do Porto ────────────────────────────────────
  'Porto':             { lat: 41.1496, lon: -8.6109, district: 'Porto' },
  'Vila Nova de Gaia': { lat: 41.1240, lon: -8.6142, district: 'Porto' },
  'Matosinhos':        { lat: 41.1839, lon: -8.6963, district: 'Porto' },
  'Gondomar':          { lat: 41.1444, lon: -8.5319, district: 'Porto' },
  'Maia':              { lat: 41.2285, lon: -8.6201, district: 'Porto' },
  'Valongo':           { lat: 41.1900, lon: -8.4977, district: 'Porto' },
  'Paredes':           { lat: 41.2057, lon: -8.3304, district: 'Porto' },
  'Penafiel':          { lat: 41.2034, lon: -8.2836, district: 'Porto' },
  'Póvoa de Varzim':   { lat: 41.3800, lon: -8.7604, district: 'Porto' },
  'Vila do Conde':     { lat: 41.3518, lon: -8.7469, district: 'Porto' },
  'Santo Tirso':       { lat: 41.3428, lon: -8.4740, district: 'Porto' },
  'Trofa':             { lat: 41.3373, lon: -8.5558, district: 'Porto' },
  'Amarante':          { lat: 41.2699, lon: -8.0782, district: 'Porto' },
  'Felgueiras':        { lat: 41.3624, lon: -8.1956, district: 'Porto' },
  'Lousada':           { lat: 41.2785, lon: -8.2847, district: 'Porto' },
  'Paços de Ferreira': { lat: 41.2759, lon: -8.3886, district: 'Porto' },
  'Vila Nova de Famalicão': { lat: 41.4039, lon: -8.5183, district: 'Porto' },

  // ── Distrito de Lisboa ───────────────────────────────────
  'Lisboa':            { lat: 38.7167, lon: -9.1333, district: 'Lisboa' },
  'Sintra':            { lat: 38.7973, lon: -9.3877, district: 'Lisboa' },
  'Cascais':           { lat: 38.6979, lon: -9.4215, district: 'Lisboa' },
  'Loures':            { lat: 38.8317, lon: -9.1683, district: 'Lisboa' },
  'Oeiras':            { lat: 38.6970, lon: -9.3054, district: 'Lisboa' },
  'Amadora':           { lat: 38.7592, lon: -9.2294, district: 'Lisboa' },
  'Almada':            { lat: 38.6786, lon: -9.1571, district: 'Lisboa' },
  'Setúbal':           { lat: 38.5244, lon: -8.8882, district: 'Lisboa' },
  'Barreiro':          { lat: 38.6603, lon: -9.0706, district: 'Lisboa' },
  'Odivelas':          { lat: 38.7946, lon: -9.1852, district: 'Lisboa' },
  'Vila Franca de Xira':{ lat: 38.9545, lon: -8.9854, district: 'Lisboa' },
  'Montijo':           { lat: 38.7064, lon: -8.9746, district: 'Lisboa' },
  'Palmela':           { lat: 38.5690, lon: -8.9015, district: 'Lisboa' },
  'Sesimbra':          { lat: 38.4436, lon: -9.1009, district: 'Lisboa' },
  'Mafra':             { lat: 38.9366, lon: -9.3314, district: 'Lisboa' },
  'Torres Vedras':     { lat: 39.0919, lon: -9.2607, district: 'Lisboa' },
  'Caldas da Rainha':  { lat: 39.4008, lon: -9.1348, district: 'Lisboa' },

  // ── Distrito de Aveiro ───────────────────────────────────
  'Aveiro':            { lat: 40.6405, lon: -8.6538, district: 'Aveiro' },
  'Ílhavo':            { lat: 40.6010, lon: -8.6684, district: 'Aveiro' },
  'Ovar':              { lat: 40.8643, lon: -8.6303, district: 'Aveiro' },
  'Oliveira de Azeméis':{ lat: 40.8376, lon: -8.4767, district: 'Aveiro' },
  'São João da Madeira':{ lat: 40.8981, lon: -8.4911, district: 'Aveiro' },
  'Santa Maria da Feira':{ lat: 40.9276, lon: -8.5473, district: 'Aveiro' },
  'Espinho':           { lat: 41.0069, lon: -8.6413, district: 'Aveiro' },
  'Estarreja':         { lat: 40.7478, lon: -8.5701, district: 'Aveiro' },
  'Murtosa':           { lat: 40.7357, lon: -8.6335, district: 'Aveiro' },
  'Albergaria-a-Velha':{ lat: 40.6949, lon: -8.4831, district: 'Aveiro' },
  'Sever do Vouga':    { lat: 40.7317, lon: -8.3633, district: 'Aveiro' },
  'Águeda':            { lat: 40.5728, lon: -8.4455, district: 'Aveiro' },
  'Oliveira do Bairro':{ lat: 40.5190, lon: -8.4975, district: 'Aveiro' },
  'Anadia':            { lat: 40.4412, lon: -8.4330, district: 'Aveiro' },
  'Mealhada':          { lat: 40.3765, lon: -8.4481, district: 'Aveiro' },
  'Vagos':             { lat: 40.5545, lon: -8.6819, district: 'Aveiro' },
  'Mira':              { lat: 40.4272, lon: -8.7351, district: 'Aveiro' },

  // ── Distrito de Coimbra ──────────────────────────────────
  'Coimbra':           { lat: 40.2033, lon: -8.4103, district: 'Coimbra' },
  'Figueira da Foz':   { lat: 40.1511, lon: -8.8584, district: 'Coimbra' },
  'Condeixa-a-Nova':   { lat: 40.1126, lon: -8.4939, district: 'Coimbra' },
  'Cantanhede':        { lat: 40.3453, lon: -8.5950, district: 'Coimbra' },
  'Montemor-o-Velho':  { lat: 40.1697, lon: -8.6810, district: 'Coimbra' },
  'Soure':             { lat: 40.0590, lon: -8.6248, district: 'Coimbra' },
  'Pombal':            { lat: 39.9176, lon: -8.6305, district: 'Coimbra' },
  'Leiria':            { lat: 39.7436, lon: -8.8071, district: 'Coimbra' },
  'Penacova':          { lat: 40.2635, lon: -8.2760, district: 'Coimbra' },
  'Mortágua':          { lat: 40.3828, lon: -8.2326, district: 'Coimbra' },
  'Tábua':             { lat: 40.3593, lon: -8.0271, district: 'Coimbra' },
  'Arganil':           { lat: 40.2216, lon: -8.0547, district: 'Coimbra' },
  'Góis':              { lat: 40.1577, lon: -8.1078, district: 'Coimbra' },
  'Miranda do Corvo':  { lat: 40.1064, lon: -8.3302, district: 'Coimbra' },
  'Lousã':             { lat: 40.1111, lon: -8.2489, district: 'Coimbra' },
  'Oliveira do Hospital':{ lat: 40.3602, lon: -7.8592, district: 'Coimbra' },
  'Pampilhosa da Serra':{ lat: 40.0513, lon: -7.9564, district: 'Coimbra' },

  // ── Distrito da Madeira ──────────────────────────────────
  'Madeira':           { lat: 32.3933, lon: 16.5403, district: 'Coimbra' },
};

// Fórmula de Haversine — distância em km entre dois pontos
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Extrai a cidade reconhecida de uma string de localização livre.
// Tenta correspondências mais longas primeiro para evitar "Porto" dentro de "Porto Alegre".
function extractCity(locationStr) {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // sort by name length desc so "Vila Nova de Gaia" matches before "Vila"
  const sorted = Object.keys(CITY_COORDS).sort((a,b) => b.length - a.length);
  for (const city of sorted) {
    const norm = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes(norm)) return city;
  }
  return null;
}

// Distância em km entre a localização livre do cliente e a cidade do aluno
function distanceClientToStudent(clientLocation, studentCity) {
  const clientCity = extractCity(clientLocation);
  if (!clientCity || !studentCity) return null;
  const c1 = CITY_COORDS[clientCity];
  const c2 = CITY_COORDS[studentCity];
  if (!c1 || !c2) return null;
  return haversineKm(c1.lat, c1.lon, c2.lat, c2.lon);
}

// Limiares de distância
const AUTO_MAX_KM  = 60;  // máx para aparecer como candidato automático (hard cutoff)
const NEAR_KM      = 20;  // bónus de proximidade
const MANUAL_FAR_KM = 80; // limiar acima do qual o aluno pode recusar (fluxo manual)

// ── Smart scoring (inclui localização) ──────────────────────
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

  // ── Localização (apenas pedido automático com localização definida) ──
  if (req.location && req.location.trim()) {
    const dist = distanceClientToStudent(req.location, student.location);
    if (dist !== null) {
      // Hard cutoff: alunos acima de AUTO_MAX_KM não são elegíveis
      if (dist > AUTO_MAX_KM) return -1;
      // Bónus por proximidade
      if (dist <= NEAR_KM)         score += 30;
      else if (dist <= AUTO_MAX_KM) score += Math.round(30 * (1 - (dist - NEAR_KM) / (AUTO_MAX_KM - NEAR_KM)));
    }
    // Se cidade não reconhecida: sem penalização (benefício da dúvida), mas também sem bónus
  }

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

  const dynStats = getStudentStats(s.id);
  const dynRating = dynStats?.rating ?? s.rating;
  const dynNServices = dynStats?.nServices ?? s.nServices;

  const stars = starStr(dynRating);
  const catTags = s.cats.map(cid => {
    const cc = CATEGORIES.find(x => x.id === cid);
    return cc ? `<span class="profile-tag">${cc.emoji} ${cc.name}</span>` : '';
  }).join('');

  // Merge base reviews with any evaluations submitted by clients from localStorage
  const storedRequests = LS.get(KEY_REQUESTS) || [];
  const clientEvals = storedRequests
    .filter(r => r.assignedStudent?.id === s.id && r.evaluation)
    .map(r => ({
      author: currentUser?.name || 'Cliente Handy',
      text:   r.evaluation.comment,
      rating: r.evaluation.rating,
      date:   r.evaluation.date,
      fromClient: true,
    }));

  const allReviews = [...clientEvals, ...(s.reviews || [])];

  // Reviews HTML
  const reviewsHtml = allReviews.length > 0
    ? allReviews.map(r => `
      <div class="review-card${r.fromClient ? ' review-card-client' : ''}">
        <div class="review-top">
          <span class="review-author">${escapeHtml(r.author)}${r.fromClient ? ' <span class="review-badge">Tu</span>' : ''}</span>
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

  const schoolInfo = SCHOOLS[s.school];
  const schoolBadge = schoolInfo
    ? `<div class="school-specialty-badge" style="background:${schoolInfo.color}15;border-color:${schoolInfo.color}40;color:${schoolInfo.color}">
         ${schoolInfo.emoji} ${schoolInfo.specialty}
       </div>`
    : '';

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
      <h3>Escola Profissional</h3>
      <p class="profile-bio">🏫 ${s.school}</p>
      ${schoolBadge}
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
      <h3>Avaliações de clientes ${allReviews.length > 0 ? `<span style="font-size:.78rem;font-weight:600;color:var(--text-3)">(${allReviews.length})</span>` : ''}</h3>
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
  const dist = distanceClientToStudent(loc, pendingManualStudent.location);
  const tooFar = dist !== null && dist > MANUAL_FAR_KM;

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
    // tooFar is stored on the request — will be used when simulating the student's decision
    distanceTooFar:  tooFar,
    distanceKm:      dist !== null ? Math.round(dist) : null,
    status:          'AGUARDA',
    assignedStudent: pendingManualStudent,
    createdAt:       new Date().toISOString(),
  };
  saveRequest(req);

  closeFullScreen('fs-proposal');
  closeFullScreen('fs-profile');
  closeFullScreen('fs-manual');

  const distInfo = dist !== null
    ? ` A distância calculada é de <strong>${Math.round(dist)} km</strong>.`
    : '';

  showOkModal('📨', 'Proposta enviada!',
    `A tua proposta foi enviada a <strong>${pendingManualStudent.name}</strong>.${distInfo} Receberás uma notificação quando o aluno responder.`);

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

  // Check if any candidates exist BEFORE creating the request (inclui localização)
  const mockReq = { catId, level, urgency: urg, location: loc };
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

  const clientCity = extractCity(loc);
  runAutoLog(catId, level, urg, loc, () => {
    showAutoStep('auto-step-waiting');
    const locHtml = loc
      ? clientCity
        ? `${loc} <span style="color:var(--green);font-size:.8rem">(✓ ${clientCity})</span>`
        : `${loc} <span style="color:var(--orange);font-size:.8rem">(cidade não reconhecida — sem filtro)</span>`
      : `<em style="color:var(--text-3)">não especificada — alunos de qualquer cidade elegíveis</em>`;
    document.getElementById('waiting-info').innerHTML =
      `<strong>Pedido:</strong> ${cat.emoji} ${cat.name}<br>
       <strong>Urgência:</strong> ${URGENCY_LBL[urg]}<br>
       <strong>Nível:</strong> ${LEVEL_LBL[level]}<br>
       <strong>Localização:</strong> ${locHtml}<br>
       <strong>Raio máximo:</strong> ${loc && clientCity ? `${AUTO_MAX_KM} km` : '—'}<br>
       <strong>Descrição:</strong> ${desc}`;
  });
}

function runAutoLog(catId, level, urg, loc, cb) {
  const log = document.getElementById('auto-log');
  log.innerHTML = '';
  const catName    = CATEGORIES.find(c=>c.id===catId)?.name || catId;
  const clientCity = extractCity(loc);

  // Candidates that pass the full filter (with location)
  const mockReq = { catId, level, urgency: urg, location: loc };
  const eligible = STUDENTS.filter(s => scoreStudent(s, mockReq) >= 0);

  const locLines = loc
    ? clientCity
      ? [
          { t:2500, cls:'log-info', msg:`▶ GET /api/v1/maps/distance — verificar proximidade` },
          { t:2800, cls:'log-ok',   msg:`✓ Localização reconhecida: ${clientCity}` },
          { t:3000, cls:'log-info', msg:`  A calcular distâncias (Haversine)…` },
          { t:3200, cls:'log-ok',   msg:`✓ Raio máximo: ${AUTO_MAX_KM} km — ${eligible.length} aluno(s) elegíve${eligible.length !== 1 ? 'is' : 'l'}` },
        ]
      : [
          { t:2500, cls:'log-warn', msg:`⚠ Localização "${loc}" não reconhecida — sem filtro geográfico` },
          { t:2800, cls:'log-info', msg:`  Todos os alunos da categoria são elegíveis` },
        ]
    : [
        { t:2500, cls:'log-warn', msg:`⚠ Sem localização — sem filtro geográfico` },
        { t:2800, cls:'log-info', msg:`  Todos os alunos da categoria são elegíveis` },
      ];

  const lines = [
    { t:300,  cls:'log-info', msg:`▶ POST /api/v1/jobs — criar pedido (${catName})` },
    { t:700,  cls:'log-ok',   msg:`✓ Pedido criado [${pendingReqAuto?.id.slice(-6)||'???'}]` },
    { t:1100, cls:'log-info', msg:`▶ GET /api/v1/students/profile?cat=${catId}&level=${level}` },
    { t:1500, cls:'log-info', msg:`  Motor de atribuição a avaliar candidatos…` },
    { t:1800, cls:'log-ok',   msg:`✓ Critério categoria: ${catName}` },
    { t:2000, cls:'log-ok',   msg:`✓ Critério nível: ${LEVEL_LBL[level]}` },
    { t:2200, cls:'log-ok',   msg:`✓ Critério urgência: ${URGENCY_LBL[urg]}` },
    ...locLines,
    { t:3500, cls:'log-info', msg:`▶ POST /api/v1/notifications/job — notificar alunos` },
    { t:3900, cls:'log-ok',   msg:`✓ Propostas enviadas — aguardar respostas` },
  ];

  lines.forEach(({ t, cls, msg }) => setTimeout(() => {
    const l = document.createElement('div');
    l.className = `log-line ${cls}`; l.textContent = msg;
    log.appendChild(l); log.scrollTop = log.scrollHeight;
  }, t));
  setTimeout(cb, 4300);
}

// ── Rejection reasons (auto flow) ────────────────────────────
const REJECTION_REASONS = [
  'O aluno já tem a agenda cheia para essa semana.',
  'O aluno está em período de exames e não pode aceitar serviços.',
  'A escola não autorizou novos trabalhos este mês.',
  'O nível de dificuldade do serviço está acima da experiência atual do aluno.',
  'O aluno aceitou entretanto outro serviço em simultâneo.',
  'Indisponibilidade pessoal do aluno nesse período.',
  'O aluno não se sentiu preparado para este tipo específico de serviço.',
  'O serviço requer ferramentas que o aluno não tem disponíveis.',
];

// Returns {accepted: Student[], rejected: {student, reason}[]}
// Simulates that each eligible student randomly accepts or rejects
function simulateCandidateResponses(req) {
  const eligible = STUDENTS
    .map(s => ({ student: s, score: scoreStudent(s, req) }))
    .filter(x => x.score >= 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6); // notify up to 6 top candidates

  const accepted = [];
  const rejected = [];

  for (const { student, score } of eligible) {
    // Higher-scored students accept more often; min 30% max 85% chance
    const acceptChance = Math.min(0.85, Math.max(0.30, score / 150));
    if (Math.random() < acceptChance) {
      accepted.push(student);
      if (accepted.length === 3) break; // cap at 3 acceptances shown
    } else {
      const reason = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
      rejected.push({ student, reason });
    }
  }
  return { accepted, rejected };
}

function simulateAcceptance() {
  if (!pendingReqAuto) return;

  const { accepted, rejected } = simulateCandidateResponses(pendingReqAuto);
  const btn = document.getElementById('auto-waiting-sim-btn');

  if (accepted.length === 0) {
    // Show rejection details before cancelling
    const all = LS.get(KEY_REQUESTS) || [];
    const req = all.find(r => r.id === pendingReqAuto.id);
    if (req) { req.status = 'CANCELADO'; LS.set(KEY_REQUESTS, all); }
    renderActiveRequest(); renderHistorico();

    const rejHtml = rejected.length > 0
      ? `<div style="margin-top:.75rem;font-size:.82rem;color:var(--text-2)"><strong>Respostas dos alunos:</strong><br>${
          rejected.map(r => `• <em>${r.student.name}</em>: ${r.reason}`).join('<br>')
        }</div>` : '';

    document.getElementById('auto-expired-body').innerHTML =
      `Nenhum aluno aceitou o teu pedido dentro do prazo. O pedido foi cancelado.${rejHtml}`;

    showAutoStep('auto-step-expired');
    pendingReqAuto = null;
    return;
  }

  const all = LS.get(KEY_REQUESTS) || [];
  const req = all.find(r => r.id === pendingReqAuto.id);
  if (req) {
    req.status = 'AGUARDA';
    req.acceptedCandidates = accepted.map(s => s.id);
    req.rejectedLog = rejected.map(r => ({ studentId: r.student.id, reason: r.reason }));
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
  }
  pendingReqAuto = { ...pendingReqAuto, acceptedCandidates: accepted.map(s=>s.id), status:'AGUARDA' };

  const loc = pendingReqAuto.location;
  const rejNote = rejected.length > 0
    ? `<div style="margin:.5rem 0;font-size:.8rem;color:var(--text-2)">⚠ ${rejected.length} aluno${rejected.length>1?'s':''} recusaram a proposta.</div>` : '';

  showAutoStep('auto-step-choose');
  document.getElementById('auto-choose-sub').innerHTML =
    `${accepted.length} aluno${accepted.length !== 1 ? 's' : ''} aceitou a tua proposta${loc ? ` (dentro dos ${AUTO_MAX_KM} km)` : ''}. Escolhe um:${rejNote}`;
  document.getElementById('auto-students-list').innerHTML =
    accepted.map(s => renderStudentCard(s, 'auto', loc)).join('');
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
    candidates.map(s => renderStudentCard(s, 'auto', req.location)).join('');

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
    const stu = req.assignedStudent;
    if (req.distanceTooFar) {
      req.status = 'CANCELADO';
      LS.set(KEY_REQUESTS, all);
      renderActiveRequest(); renderHistorico();
      const distMsg = req.distanceKm != null ? ` (${req.distanceKm} km)` : '';
      showOkModal('❌', 'Proposta recusada por distância',
        `<strong>${stu.name}</strong> recusou o teu pedido. A localização indicada${distMsg} está demasiado longe de <strong>${stu.location}</strong> (limite: ${MANUAL_FAR_KM} km).<br><br>Tenta escolher um aluno mais próximo ou ajusta a localização.`);
      return;
    }
    // Random rejection chance for manual too (20%)
    if (Math.random() < 0.20) {
      const reason = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
      req.status = 'CANCELADO';
      LS.set(KEY_REQUESTS, all);
      renderActiveRequest(); renderHistorico();
      showOkModal('❌', 'Proposta recusada',
        `<strong>${stu.name}</strong> recusou o teu pedido: <em>${reason}</em><br><br>Tenta outro aluno da mesma categoria.`);
      return;
    }
    req.status = 'CONFIRMADO';
    req.confirmedAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
    showToast(`✅ ${stu.name} aceitou a proposta!`);
    return;
  }

  // Auto request — use random acceptance simulation
  const { accepted, rejected } = simulateCandidateResponses(req);

  if (accepted.length === 0) {
    req.status = 'CANCELADO';
    LS.set(KEY_REQUESTS, all);
    renderActiveRequest(); renderHistorico();
    const rejHtml = rejected.length > 0
      ? `<br><br><small style="color:var(--text-2)">${rejected.map(r=>`• <em>${r.student.name}</em>: ${r.reason}`).join('<br>')}</small>` : '';
    showOkModal('😔', 'Nenhum aluno aceitou',
      `Nenhum aluno aceitou o teu pedido dentro do prazo. O pedido foi cancelado.${rejHtml}<br><br>Tenta novamente ou usa a pesquisa manual.`);
    return;
  }

  req.status = 'AGUARDA';
  req.acceptedCandidates = accepted.map(s => s.id);
  req.rejectedLog = rejected.map(r => ({ studentId: r.student.id, reason: r.reason }));
  LS.set(KEY_REQUESTS, all);
  pendingReqAuto = req;
  renderActiveRequest(); renderHistorico();

  const rejNote = rejected.length > 0 ? ` (${rejected.length} recusaram)` : '';
  showToast(`${accepted.length} aluno${accepted.length>1?'s':''} aceitaram${rejNote}! Escolhe na aba do Pedido.`);
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
  const active = getUserRequests().find(r => ACTIVE_STATUSES.includes(r.status));

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
  const isConfirmed     = active.status === 'CONFIRMADO' && stu;
  const isWaiting       = (active.status === 'EM_SELECAO' || active.status === 'AGUARDA');
  const isPayment       = active.status === 'AGUARDA_PAGAMENTO';
  const isPaid          = active.status === 'PAGO';
  const isExecution     = active.status === 'EM_EXECUCAO';
  const hasCandidates   = active.acceptedCandidates && active.acceptedCandidates.length > 0;

  // Student block — shows in confirmed state and in manual-AGUARDA state
  const stuSection = stu ? `
    <div class="req-student-block" onclick="openStudentProfile('${stu.id}','pedido')" style="cursor:pointer">
      <div class="req-student-header">
        <div class="stu-avatar small">${stu.name[0]}</div>
        <div style="flex:1">
          <div class="req-student-name">${stu.name}</div>
          <div class="req-student-meta">🏫 ${stu.school} · 📍 ${stu.location}${
            active.distanceKm != null
              ? ` · <span style="color:${active.distanceTooFar ? 'var(--orange)' : 'var(--green)'}">
                  ${active.distanceKm} km ${active.distanceTooFar ? '⚠ longe' : '✓ perto'}
                  </span>`
              : ''
          }</div>
        </div>
        <span class="stars">${starStr(stu.rating)} <span style="font-size:.72rem;color:rgba(255,255,255,.7)">${stu.rating.toFixed(1)}</span></span>
      </div>
      <div class="req-student-view-profile">Ver perfil completo →</div>
    </div>` : '';

  // Accepted candidates list (auto: waiting, has candidates)
  let candidatesSection = '';
  if (isWaiting && hasCandidates) {
    const cands = active.acceptedCandidates.map(id => STUDENTS.find(s=>s.id===id)).filter(Boolean);
    candidatesSection = `
      <div class="candidates-block">
        <div class="candidates-header">✅ ${cands.length} aluno${cands.length>1?'s':''} aceitaram a proposta!</div>
        <p style="font-size:.82rem;color:var(--text-2);margin:.35rem 0 .75rem">Escolhe quem vai realizar o serviço:</p>
        ${cands.map(s => renderStudentCard(s,'auto', active.location)).join('')}
      </div>`;
  }

  // Simulate button — different label for manual vs auto
  const simulateBtnLabel = active.type === 'MANUAL'
    ? `🎭 Simular resposta do aluno${active.distanceTooFar ? ' (vai recusar — longe)' : ' (vai aceitar)'}`
    : `🎭 Simular resposta dos alunos`;
  const simulateBtn = (isWaiting && !hasCandidates) ? `
    <button class="btn-simulate-accept" onclick="simulateAcceptFromPedido('${active.id}')">
      ${simulateBtnLabel}
    </button>` : '';

  // US1.2 — Payment section
  const paymentSection = isPayment ? `
    <div class="us-section us-payment">
      <div class="us-section-title">💳 Pagamento do serviço</div>
      <p class="us-section-sub">O serviço está reservado. Realiza o pagamento para dar início ao trabalho.</p>
      <div class="payment-methods">
        <label class="pay-opt"><input type="radio" name="pay-method" value="mbway" checked/><span class="pay-chip">📱 MB WAY</span></label>
        <label class="pay-opt"><input type="radio" name="pay-method" value="card"/><span class="pay-chip">💳 Cartão</span></label>
      </div>
      <div class="us-action-row">
        <button class="btn-blue-sm" onclick="simulatePayment('${active.id}', true)">✅ Pagar (simular sucesso)</button>
        <button class="btn-danger-sm" onclick="simulatePayment('${active.id}', false)">❌ Simular recusa</button>
      </div>
      <div id="payment-error" class="form-error" style="margin:.25rem 0 0"></div>
    </div>` : '';

  // US2.1 — Service execution section
  const executionSection = isPaid ? `
    <div class="us-section us-execution">
      <div class="us-section-title">🔖 Recibo digital emitido</div>
      <p class="us-section-sub">Pagamento efetuado com sucesso. Aguarda que o aluno inicie o serviço.</p>
      <div class="us-action-row">
        <button class="btn-simulate-accept" style="width:100%;margin:0" onclick="simulateStartService('${active.id}')">🎭 Simular: Aluno inicia serviço</button>
      </div>
    </div>` : '';

  const inProgressSection = isExecution ? `
    <div class="us-section us-inprogress">
      <div class="us-section-title">⚙️ Serviço em execução</div>
      <p class="us-section-sub">O aluno está a realizar o serviço. Aguarda a conclusão.</p>
      <div class="us-action-row">
        <button class="btn-simulate-accept" style="width:100%;margin:0" onclick="simulateCompleteService('${active.id}')">🎭 Simular: Aluno conclui serviço</button>
      </div>
    </div>` : '';

  // Move to payment button (after confirmation)
  const moveToPaymentBtn = isConfirmed ? `
    <div style="padding:0 1.25rem .5rem">
      <button class="btn-blue-full" onclick="moveToPayment('${active.id}')">💳 Avançar para pagamento</button>
    </div>` : '';

  // Chat (confirmed onwards, before completion)
  const chatSection = (isConfirmed || isPayment || isPaid || isExecution) && stu ? renderChatSection(active) : '';

  const cancelBtn = !isExecution ? `
    <div style="padding:0 1.25rem 1.25rem">
      <button class="btn-cancel-req" onclick="cancelActiveRequest('${active.id}')">Cancelar pedido</button>
    </div>` : '';

  area.innerHTML = `
    <div class="active-req-card">
      <div class="active-req-top">
        <div class="active-req-icon">${active.catEmoji}</div>
        <div>
          <div class="active-req-title">${active.catName}</div>
          <div class="active-req-sub">${formatDate(active.createdAt)}</div>
        </div>
        <span class="status-chip chip-${active.status}" style="margin-left:auto">${STATUS_LBL[active.status]||active.status}</span>
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
      ${moveToPaymentBtn}
      ${paymentSection}
      ${executionSection}
      ${inProgressSection}
      ${chatSection}
      ${cancelBtn}
    </div>`;

  if ((isConfirmed || isPayment || isPaid || isExecution) && stu) wireChatInput(active.id);
}

// ============================================================
// US1.2 — Payment simulation
// ============================================================
function moveToPayment(reqId) {
  let all = LS.get(KEY_REQUESTS)||[];
  const r = all.find(x=>x.id===reqId);
  if (r) { r.status='AGUARDA_PAGAMENTO'; LS.set(KEY_REQUESTS,all); }
  renderActiveRequest(); renderHistorico();
  showToast('Serviço reservado! Realiza o pagamento para continuar.');
}

function simulatePayment(reqId, success) {
  const errEl = document.getElementById('payment-error');
  const method = document.querySelector('input[name="pay-method"]:checked')?.value || 'mbway';
  const methodName = method === 'mbway' ? 'MB WAY' : 'Cartão';

  if (!success) {
    if (errEl) errEl.textContent = `Pagamento por ${methodName} recusado. Tenta novamente ou escolhe outro método.`;
    showToast('❌ Pagamento recusado.');
    return;
  }

  let all = LS.get(KEY_REQUESTS)||[];
  const r = all.find(x=>x.id===reqId);
  if (r) {
    r.status = 'PAGO';
    r.paymentMethod = methodName;
    r.paidAt = new Date().toISOString();
    LS.set(KEY_REQUESTS, all);
  }
  renderActiveRequest(); renderHistorico();
  showToast(`✅ Pagamento via ${methodName} efetuado! Recibo emitido.`);
}

// ============================================================
// US2.1 — Service lifecycle simulation
// ============================================================
function simulateStartService(reqId) {
  let all = LS.get(KEY_REQUESTS)||[];
  const r = all.find(x=>x.id===reqId);
  if (r) { r.status='EM_EXECUCAO'; r.startedAt=new Date().toISOString(); LS.set(KEY_REQUESTS,all); }
  renderActiveRequest(); renderHistorico();
  showToast('⚙️ Aluno iniciou o serviço! Notificação enviada.');
}

function getStudentStats(studentId) {
  const all = LS.get(KEY_STUDENT_STATS) || {};
  return all[studentId] || null;
}
function saveStudentStats(studentId, patch) {
  const all = LS.get(KEY_STUDENT_STATS) || {};
  all[studentId] = { ...(all[studentId] || {}), ...patch };
  LS.set(KEY_STUDENT_STATS, all);
}

function simulateCompleteService(reqId) {
  let all = LS.get(KEY_REQUESTS)||[];
  if (r.assignedStudent?.id) {
  const s = STUDENTS.find(x => x.id === r.assignedStudent.id);
  const stats = getStudentStats(r.assignedStudent.id);
  const currentN = (stats?.nServices ?? s?.nServices ?? 0);
  saveStudentStats(r.assignedStudent.id, { nServices: currentN + 1 });
}
  const r = all.find(x=>x.id===reqId);
  if (r) { r.status='CONCLUIDO'; r.completedAt=new Date().toISOString(); LS.set(KEY_REQUESTS,all); }
  renderActiveRequest(); renderHistorico();
  showOkModal('🎉','Serviço concluído!',
    'O serviço foi marcado como concluído e o pagamento foi transferido para o aluno.<br><br>Podes agora avaliar o serviço na aba de Histórico.');
}

// ============================================================
// US2.2 — Evaluation
// ============================================================
function openEvaluation(reqId) {
  const r = getUserRequests().find(x=>x.id===reqId);
  if (!r || !r.assignedStudent) return;
  document.getElementById('eval-req-id').value = reqId;
  document.getElementById('eval-student-name').textContent = r.assignedStudent.name;
  document.getElementById('eval-comment').value = '';
  document.getElementById('eval-error').textContent = '';
  setEvalRating(0);
  openModal('modal-eval');
}

let evalRating = 0;
function setEvalRating(n) {
  evalRating = n;
  document.querySelectorAll('.eval-star').forEach((s,i) => {
    s.classList.toggle('active', i < n);
  });
}

function submitEvaluation() {
  const reqId   = document.getElementById('eval-req-id').value;
  const comment = document.getElementById('eval-comment').value.trim();
  const err     = document.getElementById('eval-error');
  if (evalRating === 0) { err.textContent = 'Escolhe uma pontuação de 1 a 5 estrelas.'; return; }

  let all = LS.get(KEY_REQUESTS)||[];
  const r = all.find(x=>x.id===reqId);
  if (r) {
    r.status = 'CONCLUIDO';
    r.evaluation = { rating: evalRating, comment, date: new Date().toISOString().slice(0,10) };
    LS.set(KEY_REQUESTS, all);

    if (r.assignedStudent?.id) {
      const s = STUDENTS.find(x => x.id === r.assignedStudent.id);
      const storedRequests = LS.get(KEY_REQUESTS) || [];
      const allEvals = storedRequests
        .filter(req => req.assignedStudent?.id === r.assignedStudent.id && req.evaluation);
      const baseReviews = s?.reviews || [];
      const totalRatings = [
        ...baseReviews.map(rv => rv.rating),
        ...allEvals.map(req => req.evaluation.rating)
      ];
      const newAvg = totalRatings.reduce((a,b) => a + b, 0) / totalRatings.length;
      saveStudentStats(r.assignedStudent.id, { rating: Math.round(newAvg * 10) / 10 });
    }
  }

  closeModal('modal-eval');
  renderHistorico();
  showOkModal('⭐','Avaliação registada!',
    `A tua avaliação de <strong>${evalRating} estrela${evalRating>1?'s':''}</strong> foi registada no perfil de ${r?.assignedStudent?.name||'aluno'}. Obrigada!`);
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
  // Only show non-cancelled requests in history
  const all   = getUserRequests().filter(r => r.status !== 'CANCELADO').slice().reverse();
  if (all.length===0) { list.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = all.map(r => {
    const stuLine = r.assignedStudent
      ? `<div class="hist-student" onclick="openStudentProfile('${r.assignedStudent.id}','historico')" style="cursor:pointer">
           👤 ${r.assignedStudent.name} · ${r.assignedStudent.school} <span style="font-size:.7rem;color:var(--blue-light)">Ver perfil</span>
         </div>`
      : '';
    // Show eval button for completed-without-review, or show review if exists
    let evalLine = '';
    if (r.status === 'CONCLUIDO' && !r.evaluation) {
      evalLine = `<button class="btn-eval-inline" onclick="openEvaluation('${r.id}')">⭐ Avaliar serviço</button>`;
    } else if (r.evaluation) {
      const cmnt = r.evaluation.comment || '';
      evalLine = `<div class="hist-eval">⭐ ${'★'.repeat(r.evaluation.rating)}${cmnt ? ` — <em>${cmnt.slice(0,40)}${cmnt.length>40?'…':''}</em>` : ''}</div>`;
    return `
    <div class="hist-card">
      <div class="hist-icon">${r.catEmoji}</div>
      <div class="hist-info">
        <div class="hist-title">${r.catName}${r.description?' — '+r.description.slice(0,38)+(r.description.length>38?'…':''):''}</div>
        <div class="hist-date">${formatDate(r.createdAt)} · ${r.type==='AUTO'?'🤖 Auto':'🔍 Manual'}</div>
        ${stuLine}
        ${evalLine}
      </div>
      <span class="status-chip chip-${r.status}">${STATUS_LBL[r.status]||r.status}</span>
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
const ACTIVE_STATUSES = ['EM_SELECAO','AGUARDA','CONFIRMADO','AGUARDA_PAGAMENTO','PAGO','EM_EXECUCAO'];
function hasActiveRequest() { return getUserRequests().some(r=>ACTIVE_STATUSES.includes(r.status)); }
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
function renderStudentCard(s, mode, clientLocation) {
  const stars = starStr(s.rating);

  // Distance badge — shown when clientLocation is provided
  let distBadge = '';
  if (clientLocation) {
    const dist = distanceClientToStudent(clientLocation, s.location);
    if (dist !== null) {
      const km = Math.round(dist);
      const color  = km <= NEAR_KM     ? 'var(--green)'  :
                     km <= AUTO_MAX_KM ? 'var(--blue)'   : 'var(--orange)';
      const bg     = km <= NEAR_KM     ? '#dcfce7'       :
                     km <= AUTO_MAX_KM ? 'var(--blue-light)' : '#ffedd5';
      distBadge = ` <span style="font-size:.68rem;font-weight:700;color:${color};background:${bg};padding:.1rem .4rem;border-radius:4px;white-space:nowrap">📍 ${km} km</span>`;
    }
  }

  let actionBtn;
  if (mode==='auto')
    actionBtn=`<button class="btn-choose" onclick="chooseAutoStudent('${s.id}')">Escolher</button>`;
  else
    actionBtn=`<button class="btn-proposal" onclick="openStudentProfile('${s.id}','search')">Ver perfil</button>`;
  return `
    <div class="student-card">
      <div class="stu-avatar">${s.name[0]}</div>
      <div class="stu-info">
        <div class="stu-name">${s.name}${distBadge}</div>
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
