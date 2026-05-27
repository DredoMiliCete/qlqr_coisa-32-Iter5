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
const KEY_EVALS    = 'handy_evals';   // { studentId: [{author,rating,comment,date,reqId}] }
const KEY_PROFILE  = 'handy_profile'; // extra client profile data

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  'ETP Aveiro':   { district:'Aveiro',  specialty:'Instalações & Energia',           color:'#1a6ff0', emoji:'⚡' },
  'ETAP Aveiro':  { district:'Aveiro',  specialty:'Construção & Reparação',           color:'#0d4fc4', emoji:'🔧' },
  'ETP Porto':    { district:'Porto',   specialty:'Tecnologia & Construção',          color:'#7c3aed', emoji:'🪚' },
  'EPTLH Porto':  { district:'Porto',   specialty:'Hotelaria & Serviços Domésticos',  color:'#db2777', emoji:'🍳' },
  'EPVC Gaia':    { district:'Porto',   specialty:'Verde & Cuidados',                 color:'#16a34a', emoji:'🌿' },
  'EPGB Lisboa':  { district:'Lisboa',  specialty:'Gestão & Informática',             color:'#dc2626', emoji:'💻' },
  'ETPL Lisboa':  { district:'Lisboa',  specialty:'Eletrónica & Segurança',           color:'#b45309', emoji:'🔒' },
  'ETP Coimbra':  { district:'Coimbra', specialty:'Artes & Acabamentos',              color:'#0891b2', emoji:'🎨' },
  'EPCV Coimbra': { district:'Coimbra', specialty:'Cuidados & Verde',                 color:'#059669', emoji:'👶' },
};

// ── Students ─────────────────────────────────────────────────
// reviews count is proportional to nServices (~60-80% have a review)
const STUDENTS = [
  // ── ETP Aveiro (Instalações & Energia) ───────────────────────
  { id:'s1', name:'Carlos Oliveira', school:'ETP Aveiro', level:'INTERMEDIO', rating:4.7, nServices:18, acceptProb:0.75, cats:['canaliza','eletric'], location:'Aveiro',
    bio:'Apaixonado por eletricidade e canalização. 18 serviços com excelente feedback.',
    reviews:[
      {author:'João M.',text:'Muito profissional e rápido. Voltaria a contratar.',rating:5,date:'2026-04-10'},
      {author:'Ana S.',text:'Resolveu o problema de canalização na hora.',rating:4,date:'2026-03-22'},
      {author:'Rui P.',text:'Instalou quadro elétrico sem complicações.',rating:5,date:'2026-03-05'},
      {author:'Fernanda L.',text:'Excelente serviço, muito atencioso.',rating:5,date:'2026-02-18'},
      {author:'Carlos B.',text:'Chegou na hora certa, trabalho limpo.',rating:4,date:'2026-02-01'},
      {author:'Marisa T.',text:'Pequena reparação elétrica feita com cuidado.',rating:5,date:'2026-01-15'},
      {author:'Hélder N.',text:'Bom serviço, honesto no preço.',rating:4,date:'2026-01-02'},
      {author:'Sofia R.',text:'Canalização da cozinha resolvida rapidamente.',rating:5,date:'2025-12-20'},
      {author:'Pedro V.',text:'Profissional e simpático.',rating:4,date:'2025-12-05'},
      {author:'Lara F.',text:'Recomendo sem hesitar.',rating:5,date:'2025-11-18'},
      {author:'Tomás A.',text:'Pontual e eficiente.',rating:5,date:'2025-11-02'},
      {author:'Vera C.',text:'Ótimo trabalho de instalação.',rating:4,date:'2025-10-15'},
    ] },
  { id:'s5', name:'Rui Marques', school:'ETP Aveiro', level:'INTERMEDIO', rating:4.5, nServices:12, acceptProb:0.80, cats:['canaliza'], location:'Ílhavo',
    bio:'Canalizador experiente com boas referências. Respondo rápido.',
    reviews:[
      {author:'Carla M.',text:'Rápido e eficiente.',rating:5,date:'2026-04-05'},
      {author:'Hugo S.',text:'Bom serviço pelo preço.',rating:4,date:'2026-03-10'},
      {author:'Diana B.',text:'Torneira trocada em 30 minutos.',rating:5,date:'2026-02-22'},
      {author:'Nuno G.',text:'Resolveu o cano partido rapidamente.',rating:4,date:'2026-02-05'},
      {author:'Rita O.',text:'Muito disponível e cordial.',rating:5,date:'2026-01-20'},
      {author:'Álvaro S.',text:'Serviço correto, sem surpresas.',rating:4,date:'2026-01-08'},
      {author:'Joana R.',text:'Apareceu na hora e fez o trabalho.',rating:5,date:'2025-12-15'},
      {author:'Marco N.',text:'Profissional competente.',rating:4,date:'2025-11-28'},
    ] },
  { id:'s9', name:'Tiago Nunes', school:'ETP Aveiro', level:'AVANCADO', rating:4.9, nServices:42, acceptProb:0.50, cats:['canaliza'], location:'Aveiro',
    bio:'Top prestador em canalização. 42 serviços realizados.',
    reviews:[
      {author:'Patrícia L.',text:'O melhor canalizador que já contratei, sem dúvida.',rating:5,date:'2026-04-22'},
      {author:'Rui A.',text:'Sempre pontual e muito profissional.',rating:5,date:'2026-04-14'},
      {author:'Susana M.',text:'Resolveu problema que outros não conseguiram.',rating:5,date:'2026-04-02'},
      {author:'Bruno T.',text:'Qualidade de trabalho excecional.',rating:5,date:'2026-03-25'},
      {author:'Elsa F.',text:'Recomendado por toda a gente, e com razão.',rating:5,date:'2026-03-14'},
      {author:'Gonçalo P.',text:'Chegou, viu e resolveu. Impressionante.',rating:5,date:'2026-03-02'},
      {author:'Inês B.',text:'Trabalho impecável como sempre.',rating:5,date:'2026-02-18'},
      {author:'Jorge C.',text:'Profissionalismo de alto nível.',rating:4,date:'2026-02-04'},
      {author:'Marta V.',text:'Excelente serviço de canalização.',rating:5,date:'2026-01-22'},
      {author:'Paulo R.',text:'Muito bom, voltarei a contratar.',rating:5,date:'2026-01-09'},
      {author:'Célia M.',text:'Rápido e muito cuidadoso.',rating:5,date:'2025-12-28'},
      {author:'Dinis A.',text:'Top serviço em tudo.',rating:5,date:'2025-12-14'},
      {author:'Filipa T.',text:'Resolução rápida e eficaz.',rating:4,date:'2025-11-30'},
      {author:'Henrique S.',text:'Ótimo resultado, casa sem avarias.',rating:5,date:'2025-11-16'},
      {author:'Leonor B.',text:'Um dos melhores que conheço.',rating:5,date:'2025-11-01'},
      {author:'Miguel C.',text:'Trabalho primoroso.',rating:5,date:'2025-10-17'},
      {author:'Nádia F.',text:'Voltaria a contratar de olhos fechados.',rating:5,date:'2025-10-03'},
      {author:'Olga M.',text:'Canalização nova a funcionar na perfeição.',rating:5,date:'2025-09-19'},
      {author:'Quim R.',text:'Profissional de confiança.',rating:4,date:'2025-09-05'},
      {author:'Rosa N.',text:'Trabalho limpo e cuidadoso.',rating:5,date:'2025-08-22'},
      {author:'Sandro L.',text:'Excelente! Muito satisfeita.',rating:5,date:'2025-08-08'},
      {author:'Tânia P.',text:'Super competente e simpático.',rating:5,date:'2025-07-25'},
      {author:'Ulisses C.',text:'Fez um trabalho que durou anos.',rating:5,date:'2025-07-11'},
      {author:'Vera S.',text:'Muito recomendado pelo bairro todo.',rating:5,date:'2025-06-27'},
    ] },
  { id:'s12', name:'Catarina Silva', school:'ETP Aveiro', level:'INTERMEDIO', rating:4.5, nServices:11, acceptProb:0.80, cats:['informatica'], location:'Oliveira do Bairro',
    bio:'Programação, instalação de software e suporte técnico.',
    reviews:[
      {author:'Nuno B.',text:'Instalou tudo sem problemas.',rating:4,date:'2026-03-25'},
      {author:'Olga T.',text:'Configurou o router e o NAS.',rating:5,date:'2026-03-08'},
      {author:'Paulo F.',text:'Suporte técnico rápido e eficaz.',rating:4,date:'2026-02-20'},
      {author:'Iva C.',text:'Resolveu vírus no PC em pouco tempo.',rating:5,date:'2026-02-04'},
      {author:'Jorge M.',text:'Formatou e configurou portátil novo.',rating:4,date:'2026-01-18'},
      {author:'Kátia S.',text:'Muito simpática e competente.',rating:5,date:'2026-01-05'},
      {author:'Laura P.',text:'Instalou impressora de rede.',rating:4,date:'2025-12-22'},
    ] },
  { id:'s31', name:'Fábio Nascimento', school:'ETP Aveiro', level:'BASICO', rating:4.1, nServices:5, acceptProb:0.88, cats:['eletric'], location:'Estarreja',
    bio:'Curso de Instalações Elétricas. Disponível para instalações simples e manutenção.',
    reviews:[
      {author:'Teresa M.',text:'Boa disposição, trabalho correto.',rating:4,date:'2026-04-01'},
      {author:'Ulisses B.',text:'Tomada nova instalada sem problemas.',rating:4,date:'2026-03-10'},
      {author:'Vera L.',text:'Reparou o interruptor rapidamente.',rating:4,date:'2026-02-15'},
    ] },

  // ── ETAP Aveiro (Construção & Reparação) ─────────────────────
  { id:'s26', name:'Hélder Martins', school:'ETAP Aveiro', level:'INTERMEDIO', rating:4.6, nServices:17, acceptProb:0.74, cats:['soldadura'], location:'Estarreja',
    bio:'Soldador com certificação. Estruturas metálicas, portões e reparações.',
    reviews:[
      {author:'Paulo R.',text:'Portão novo ficou excelente.',rating:5,date:'2026-04-04'},
      {author:'Xana F.',text:'Soldadura perfeita na grade da janela.',rating:5,date:'2026-03-18'},
      {author:'Yuri C.',text:'Trabalho sólido e durável.',rating:4,date:'2026-03-01'},
      {author:'Zé M.',text:'Reparou estrutura metálica da garagem.',rating:5,date:'2026-02-14'},
      {author:'Ana V.',text:'Bom trabalho, preço justo.',rating:4,date:'2026-02-01'},
      {author:'Beto S.',text:'Profissional confiável.',rating:5,date:'2026-01-15'},
      {author:'Cláudia R.',text:'Portão corredera instalado.',rating:4,date:'2026-01-03'},
      {author:'Dário N.',text:'Soldou cano de ferro sem falhas.',rating:5,date:'2025-12-20'},
      {author:'Eduarda T.',text:'Muito satisfeita com o resultado.',rating:4,date:'2025-12-05'},
      {author:'Filipe B.',text:'Reparação de escadas metálicas perfeita.',rating:5,date:'2025-11-18'},
    ] },
  { id:'s21', name:'Sara Baptista', school:'ETAP Aveiro', level:'BASICO', rating:4.2, nServices:7, acceptProb:0.88, cats:['pintura'], location:'Ovar',
    bio:'Pintora disponível para interiores e exteriores.',
    reviews:[
      {author:'Hugo M.',text:'Bom trabalho!',rating:4,date:'2026-03-20'},
      {author:'Isabel F.',text:'Quarto pintado com cuidado.',rating:4,date:'2026-03-05'},
      {author:'Jacinto P.',text:'Fez o trabalho no tempo combinado.',rating:4,date:'2026-02-18'},
      {author:'Kika S.',text:'Resultado agradável.',rating:5,date:'2026-02-01'},
      {author:'Lena A.',text:'Boa pintora para trabalhos básicos.',rating:4,date:'2026-01-15'},
    ] },
  { id:'s32', name:'Afonso Correia', school:'ETAP Aveiro', level:'INTERMEDIO', rating:4.4, nServices:9, acceptProb:0.79, cats:['manutencao'], location:'Aveiro',
    bio:'Manutenção geral de habitações. Especializado no curso de Construção Civil.',
    reviews:[
      {author:'Sónia P.',text:'Resolveu vários pequenos problemas em casa.',rating:4,date:'2026-03-30'},
      {author:'Tiago F.',text:'Manutenção geral muito bem feita.',rating:5,date:'2026-03-14'},
      {author:'Ursula M.',text:'Reparou porta e janela.',rating:4,date:'2026-02-27'},
      {author:'Vasco C.',text:'Trabalho limpo e cuidadoso.',rating:4,date:'2026-02-10'},
      {author:'Wanda S.',text:'Polivalente e eficiente.',rating:5,date:'2026-01-25'},
      {author:'Xavier R.',text:'Resolveu infiltração.',rating:4,date:'2026-01-10'},
    ] },
  { id:'s33', name:'Mara Figueiredo', school:'ETAP Aveiro', level:'BASICO', rating:4.0, nServices:4, acceptProb:0.90, cats:['reparacao'], location:'Águeda',
    bio:'Curso de Construção e Manutenção. Disponível para pequenas reparações domésticas.',
    reviews:[
      {author:'Bernardo L.',text:'Reparou a torneira sem complicações.',rating:4,date:'2026-02-15'},
      {author:'Carmo P.',text:'Trabalho simples feito corretamente.',rating:4,date:'2026-01-28'},
    ] },

  // ── ETP Porto (Tecnologia & Construção) ──────────────────────
  { id:'s8', name:'Marta Alves', school:'ETP Porto', level:'INTERMEDIO', rating:4.6, nServices:15, acceptProb:0.72, cats:['carpint','eletric'], location:'Porto',
    bio:'Trabalho bem em carpintaria e eletricidade. Gosto de desafios.',
    reviews:[
      {author:'David P.',text:'Muito competente! Móveis montados na perfeição.',rating:5,date:'2026-04-08'},
      {author:'Inês G.',text:'Ficou tudo perfeito, instalação elétrica impecável.',rating:4,date:'2026-03-30'},
      {author:'Jorge M.',text:'Carpintaria de qualidade.',rating:5,date:'2026-03-15'},
      {author:'Karina F.',text:'Resolveu avaria elétrica rapidamente.',rating:4,date:'2026-02-28'},
      {author:'Lourenço B.',text:'Muito profissional e organizada.',rating:5,date:'2026-02-12'},
      {author:'Madalena S.',text:'Excelente trabalho.',rating:5,date:'2026-01-25'},
      {author:'Narciso T.',text:'Tomadas e prateleiras de madeira perfeitas.',rating:4,date:'2026-01-10'},
      {author:'Odete R.',text:'Recomendo muito.',rating:5,date:'2025-12-28'},
      {author:'Pedro A.',text:'Carpintaria bem acabada.',rating:4,date:'2025-12-12'},
    ] },
  { id:'s22', name:'Luís Teixeira', school:'ETP Porto', level:'AVANCADO', rating:4.9, nServices:45, acceptProb:0.50, cats:['carpint','montagem'], location:'Gondomar',
    bio:'Marceneiro com 45 serviços. Desde reparações simples a peças personalizadas.',
    reviews:[
      {author:'Ana G.',text:'Móvel feito à medida ficou incrível!',rating:5,date:'2026-04-23'},
      {author:'Pedro L.',text:'Profissional de excelência absoluta.',rating:5,date:'2026-04-10'},
      {author:'Quirina F.',text:'Roupeiro embutido perfeito.',rating:5,date:'2026-03-28'},
      {author:'Rafael M.',text:'O melhor marceneiro que já contratei.',rating:5,date:'2026-03-15'},
      {author:'Salomé T.',text:'Mesa de jantar à medida. Fantástica.',rating:5,date:'2026-03-02'},
      {author:'Tobias S.',text:'Qualidade premium em tudo.',rating:5,date:'2026-02-18'},
      {author:'Ulrica P.',text:'Trabalho primoroso e detalhado.',rating:5,date:'2026-02-04'},
      {author:'Vanessa B.',text:'Cozinha nova montada com perfeição.',rating:5,date:'2026-01-22'},
      {author:'Walter C.',text:'Armários robustos e bonitos.',rating:4,date:'2026-01-09'},
      {author:'Xuxa F.',text:'Serviço impecável.',rating:5,date:'2025-12-27'},
      {author:'Yolanda S.',text:'Recomendo a toda a gente.',rating:5,date:'2025-12-13'},
      {author:'Zara M.',text:'Excelente resultado, muito contente.',rating:5,date:'2025-11-29'},
      {author:'Alberto N.',text:'Peças personalizadas de alta qualidade.',rating:5,date:'2025-11-15'},
      {author:'Benedita F.',text:'Muito satisfeita com a cozinha.',rating:5,date:'2025-11-01'},
      {author:'César A.',text:'Volta sempre que preciso.',rating:4,date:'2025-10-18'},
      {author:'Dolores M.',text:'Marceneiro de excelência.',rating:5,date:'2025-10-04'},
      {author:'Estela P.',text:'Móvel de casa de banho perfeito.',rating:5,date:'2025-09-20'},
      {author:'Florentino C.',text:'Trabalho de artesão.',rating:5,date:'2025-09-06'},
      {author:'Graça B.',text:'Muito caprichoso e responsável.',rating:5,date:'2025-08-23'},
      {author:'Hernâni S.',text:'Qualidade inigualável.',rating:5,date:'2025-08-09'},
    ] },
  { id:'s28', name:'Vasco Cunha', school:'ETP Porto', level:'AVANCADO', rating:4.8, nServices:33, acceptProb:0.57, cats:['canaliza','climatizacao'], location:'Paredes',
    bio:'Técnico especializado em canalização e climatização.',
    reviews:[
      {author:'Beatriz F.',text:'Excelente trabalho de climatização!',rating:5,date:'2026-04-24'},
      {author:'Tiago A.',text:'Muito eficiente na instalação do AC.',rating:5,date:'2026-04-13'},
      {author:'Conceição M.',text:'Canalização nova toda impecável.',rating:5,date:'2026-04-01'},
      {author:'Domingos S.',text:'Reparou AC em menos de 1h.',rating:4,date:'2026-03-20'},
      {author:'Eulália P.',text:'Profissional e pontual.',rating:5,date:'2026-03-08'},
      {author:'Fabrício N.',text:'Instalação de aquecimento central.',rating:5,date:'2026-02-23'},
      {author:'Gabriela T.',text:'Muito bom trabalho.',rating:5,date:'2026-02-10'},
      {author:'Idalina B.',text:'Excelente técnico.',rating:4,date:'2026-01-27'},
      {author:'Jacinto R.',text:'AC funciona na perfeição.',rating:5,date:'2026-01-14'},
      {author:'Kátia M.',text:'Canalização do WC resolvida.',rating:5,date:'2026-01-02'},
      {author:'Lúcio F.',text:'Serviço de qualidade.',rating:4,date:'2025-12-20'},
      {author:'Marcelino S.',text:'Voltaria a contratar sem hesitar.',rating:5,date:'2025-12-06'},
      {author:'Natália P.',text:'Técnico de confiança.',rating:5,date:'2025-11-22'},
      {author:'Octávio M.',text:'Bom trabalho nas tubagens.',rating:4,date:'2025-11-08'},
      {author:'Palmira C.',text:'Muito satisfeita.',rating:5,date:'2025-10-25'},
    ] },
  { id:'s34', name:'Simão Barbosa', school:'ETP Porto', level:'BASICO', rating:4.0, nServices:3, acceptProb:0.90, cats:['montagem'], location:'Maia',
    bio:'Curso de Tecnologia e Construção. Montagem de mobiliário e prateleiras.',
    reviews:[
      {author:'Filomena S.',text:'Montou cama e roupeiro.',rating:4,date:'2026-03-05'},
      {author:'Gaspar M.',text:'Montagem de estantes feita bem.',rating:4,date:'2026-02-10'},
    ] },
  { id:'s35', name:'Inês Carvalho', school:'ETP Porto', level:'INTERMEDIO', rating:4.5, nServices:10, acceptProb:0.79, cats:['eletric'], location:'Vila Nova de Gaia',
    bio:'Eletricista em formação, com foco em instalações domésticas.',
    reviews:[
      {author:'Rui M.',text:'Instalou tomadas e disjuntor sem problemas.',rating:5,date:'2026-04-02'},
      {author:'Sónia B.',text:'Trabalhou de forma organizada.',rating:4,date:'2026-03-18'},
      {author:'Tomás F.',text:'Muito competente para a experiência.',rating:5,date:'2026-03-02'},
      {author:'Úrsula M.',text:'Instalação limpa e segura.',rating:4,date:'2026-02-15'},
      {author:'Valentim S.',text:'Excelente instalação elétrica.',rating:5,date:'2026-01-30'},
      {author:'Wanda C.',text:'Boa profissional.',rating:4,date:'2026-01-15'},
    ] },

  // ── EPTLH Porto (Hotelaria & Serviços Domésticos) ────────────
  { id:'s16', name:'Diogo Lemos', school:'EPTLH Porto', level:'AVANCADO', rating:4.9, nServices:31, acceptProb:0.52, cats:['cozinhar'], location:'Porto',
    bio:'Chef em formação. Refeições do dia-a-dia ou jantares especiais.',
    reviews:[
      {author:'Ana M.',text:'Jantar incrível, todos os convidados adoraram!',rating:5,date:'2026-04-21'},
      {author:'Pedro S.',text:'Comida deliciosa e muito bem apresentada.',rating:5,date:'2026-04-11'},
      {author:'Carina F.',text:'Fez o jantar de aniversário perfeito.',rating:5,date:'2026-03-29'},
      {author:'Dinis T.',text:'Criatividade e sabor a nível profissional.',rating:5,date:'2026-03-16'},
      {author:'Emília B.',text:'Surpreendeu todos com a refeição.',rating:5,date:'2026-03-03'},
      {author:'Fábio R.',text:'Chef de talento indiscutível.',rating:5,date:'2026-02-19'},
      {author:'Graça N.',text:'Voltarei a contratar com certeza.',rating:5,date:'2026-02-06'},
      {author:'Hélio M.',text:'Cozinha de restaurante em casa.',rating:4,date:'2026-01-23'},
      {author:'Ivone F.',text:'Muito bom jantar de família.',rating:5,date:'2026-01-10'},
      {author:'Jacinto S.',text:'Refeições da semana todas deliciosas.',rating:5,date:'2025-12-28'},
      {author:'Keila A.',text:'Excelente chef.',rating:5,date:'2025-12-14'},
      {author:'Lourdes B.',text:'Comida caseira de excelência.',rating:4,date:'2025-12-01'},
      {author:'Mário C.',text:'Jantar de Natal inesquecível.',rating:5,date:'2025-11-17'},
      {author:'Nélida F.',text:'Muito talentoso.',rating:5,date:'2025-11-03'},
    ] },
  { id:'s23', name:'Patrícia Sousa', school:'EPTLH Porto', level:'INTERMEDIO', rating:4.4, nServices:10, acceptProb:0.76, cats:['cozinhar','babysitting'], location:'Valongo',
    bio:'Cozinheira e babysitter. Adoro trabalhar com crianças e cozinhar refeições saudáveis.',
    reviews:[
      {author:'Diana C.',text:'Os filhos adoram-na!',rating:4,date:'2026-03-22'},
      {author:'Elvira M.',text:'Refeições saudáveis e saborosas.',rating:5,date:'2026-03-08'},
      {author:'Félix B.',text:'Tomou conta das crianças com carinho.',rating:4,date:'2026-02-22'},
      {author:'Graziela P.',text:'Muito responsável.',rating:5,date:'2026-02-05'},
      {author:'Horácio S.',text:'Bom jantar semanal.',rating:4,date:'2026-01-20'},
      {author:'Iris M.',text:'Crianças bem entretidas.',rating:4,date:'2026-01-07'},
    ] },

  // ── EPVC Gaia (Verde & Cuidados) ─────────────────────────────
  { id:'s3', name:'Miguel Santos', school:'EPVC Gaia', level:'BASICO', rating:4.2, nServices:6, acceptProb:0.90, cats:['limpeza'], location:'Matosinhos',
    bio:'Disponível para serviços de limpeza. Esforçado e rápido.',
    reviews:[
      {author:'Marta F.',text:'Fez um bom trabalho!',rating:4,date:'2026-03-15'},
      {author:'Nuno P.',text:'Casa ficou limpa.',rating:4,date:'2026-02-28'},
      {author:'Olinda C.',text:'Trabalhou com afinco.',rating:4,date:'2026-02-10'},
      {author:'Pompeu M.',text:'Resultado satisfatório.',rating:4,date:'2026-01-24'},
    ] },
  { id:'s36', name:'Laura Esteves', school:'EPVC Gaia', level:'INTERMEDIO', rating:4.5, nServices:14, acceptProb:0.75, cats:['jardinagem','limpeza'], location:'Espinho',
    bio:'Jardinagem e limpeza doméstica. Cuidadosa e pontual.',
    reviews:[
      {author:'Quitéria M.',text:'Jardim ficou impecável.',rating:5,date:'2026-04-15'},
      {author:'Ricardo S.',text:'Limpeza geral da casa muito boa.',rating:4,date:'2026-03-30'},
      {author:'Samira B.',text:'Muito cuidadosa com as plantas.',rating:5,date:'2026-03-14'},
      {author:'Teodora F.',text:'Casa e jardim em ordem.',rating:4,date:'2026-02-27'},
      {author:'Ulisses P.',text:'Bom serviço semanal.',rating:5,date:'2026-02-12'},
      {author:'Valentina C.',text:'Recomendo para jardinagem.',rating:4,date:'2026-01-27'},
      {author:'Waldemar S.',text:'Limpeza pós-obra muito bem feita.',rating:5,date:'2026-01-12'},
      {author:'Xénia M.',text:'Pontual e trabalhadeira.',rating:4,date:'2025-12-28'},
    ] },
  { id:'s37', name:'Duarte Melo', school:'EPVC Gaia', level:'BASICO', rating:4.0, nServices:4, acceptProb:0.89, cats:['petsitting'], location:'Vila Nova de Gaia',
    bio:'Curso de Veterinária Preventiva. Petsitting responsável e carinhoso.',
    reviews:[
      {author:'Dora M.',text:'Ficou ótimo com os meus dois gatos.',rating:4,date:'2026-03-10'},
      {author:'Ema F.',text:'Cão bem tratado e feliz.',rating:4,date:'2026-02-15'},
    ] },

  // ── EPGB Lisboa (Gestão & Informática) ───────────────────────
  { id:'s2', name:'Ana Ferreira', school:'EPGB Lisboa', level:'AVANCADO', rating:4.9, nServices:34, acceptProb:0.55, cats:['eletric','carpint'], location:'Lisboa',
    bio:'Especialista em carpintaria e instalações elétricas. Rigorosa e pontual.',
    reviews:[
      {author:'Pedro C.',text:'Excelente trabalho, muito recomendada!',rating:5,date:'2026-04-18'},
      {author:'Rita L.',text:'Pontual e cuidadosa em tudo.',rating:5,date:'2026-04-01'},
      {author:'Sandro M.',text:'Instalação elétrica de topo.',rating:5,date:'2026-03-19'},
      {author:'Tânia B.',text:'Carpintaria precisa e elegante.',rating:5,date:'2026-03-05'},
      {author:'Ugo F.',text:'Armário novo construído à medida.',rating:5,date:'2026-02-20'},
      {author:'Vilma S.',text:'Trabalho impecável como esperado.',rating:5,date:'2026-02-06'},
      {author:'Waldo C.',text:'Muito competente.',rating:4,date:'2026-01-23'},
      {author:'Xana R.',text:'Quadro elétrico novo perfeito.',rating:5,date:'2026-01-10'},
      {author:'Yara M.',text:'Uma das melhores técnicas.',rating:5,date:'2025-12-27'},
      {author:'Zilda F.',text:'Carpintaria de luxo.',rating:5,date:'2025-12-13'},
      {author:'Amadeu S.',text:'Recomendo 100%.',rating:5,date:'2025-11-29'},
      {author:'Belmira C.',text:'Rígida na qualidade.',rating:5,date:'2025-11-15'},
      {author:'Caetano M.',text:'Instalação elétrica impecável.',rating:4,date:'2025-11-01'},
      {author:'Delfina B.',text:'Muito satisfeita.',rating:5,date:'2025-10-18'},
      {author:'Ernesto F.',text:'Perfeição no trabalho.',rating:5,date:'2025-10-04'},
    ] },
  { id:'s11', name:'Pedro Gomes', school:'EPGB Lisboa', level:'AVANCADO', rating:4.8, nServices:23, acceptProb:0.58, cats:['informatica','seguranca'], location:'Oeiras',
    bio:'Técnico de informática especializado em redes e reparação de hardware.',
    reviews:[
      {author:'Sandra C.',text:'Resolveu um problema difícil rapidamente.',rating:5,date:'2026-04-16'},
      {author:'Marco L.',text:'Muito profissional e competente.',rating:5,date:'2026-04-02'},
      {author:'Natasha B.',text:'Rede doméstica configurada na perfeição.',rating:5,date:'2026-03-20'},
      {author:'Oscar M.',text:'Reparou computador que ninguém conseguia.',rating:5,date:'2026-03-06'},
      {author:'Paulina F.',text:'Câmaras instaladas sem falhas.',rating:4,date:'2026-02-21'},
      {author:'Quirino S.',text:'Muito bom suporte técnico.',rating:5,date:'2026-02-07'},
      {author:'Rosário M.',text:'Wi-fi novo muito melhor.',rating:5,date:'2026-01-24'},
      {author:'Sebastião F.',text:'Trabalho de grande qualidade.',rating:4,date:'2026-01-11'},
      {author:'Telma B.',text:'Recomendado por toda a gente.',rating:5,date:'2025-12-28'},
      {author:'Ulisses M.',text:'Profissional de topo.',rating:5,date:'2025-12-14'},
      {author:'Vitória C.',text:'Sistemas de segurança impecáveis.',rating:5,date:'2025-11-30'},
      {author:'Xavier S.',text:'Muito eficiente.',rating:4,date:'2025-11-16'},
    ] },
  { id:'s25', name:'Filipa Moreira', school:'EPGB Lisboa', level:'AVANCADO', rating:4.7, nServices:22, acceptProb:0.63, cats:['informatica','seguranca'], location:'Amadora',
    bio:'Técnica de redes e segurança informática. Wi-fi, câmaras e suporte IT.',
    reviews:[
      {author:'André B.',text:'Redes configuradas na perfeição.',rating:5,date:'2026-04-13'},
      {author:'Luísa C.',text:'Muito profissional e eficiente.',rating:4,date:'2026-03-29'},
      {author:'Mauro F.',text:'Sistema de câmaras novo e funcional.',rating:5,date:'2026-03-15'},
      {author:'Nádia S.',text:'Wi-fi rápido e estável.',rating:5,date:'2026-03-01'},
      {author:'Osvaldo B.',text:'Segurança informática reforçada.',rating:4,date:'2026-02-16'},
      {author:'Palmira M.',text:'Excelente técnica.',rating:5,date:'2026-02-02'},
      {author:'Quintino F.',text:'Trabalho de grande qualidade.',rating:4,date:'2026-01-19'},
      {author:'Rosinda S.',text:'NAS configurado na perfeição.',rating:5,date:'2026-01-06'},
      {author:'Sílvio B.',text:'Resolução rápida.',rating:4,date:'2025-12-23'},
      {author:'Teodolinda M.',text:'Câmaras e alarme instalados.',rating:5,date:'2025-12-09'},
    ] },
  { id:'s40', name:'Gonçalo Neto', school:'EPGB Lisboa', level:'INTERMEDIO', rating:4.4, nServices:8, acceptProb:0.81, cats:['informatica'], location:'Loures',
    bio:'Curso de Gestão de Sistemas Informáticos. Suporte técnico e instalação de software.',
    reviews:[
      {author:'Virgínia C.',text:'Configurou o portátil sem problemas.',rating:4,date:'2026-03-20'},
      {author:'Walter M.',text:'Formatou o PC e ficou rápido.',rating:4,date:'2026-03-04'},
      {author:'Xana S.',text:'Instalou o Office sem problemas.',rating:4,date:'2026-02-17'},
      {author:'Yasmin B.',text:'Suporte simpático e eficaz.',rating:5,date:'2026-02-01'},
      {author:'Zacarias F.',text:'Bom trabalho técnico.',rating:4,date:'2026-01-16'},
    ] },
  { id:'s41', name:'Beatriz Campos', school:'EPGB Lisboa', level:'BASICO', rating:4.0, nServices:3, acceptProb:0.90, cats:['outros'], location:'Lisboa',
    bio:'Curso de Gestão. Disponível para serviços de organização e apoio administrativo.',
    reviews:[
      {author:'Alberto S.',text:'Ajudou com organização do escritório.',rating:4,date:'2026-02-25'},
      {author:'Bruna M.',text:'Simpática e organizada.',rating:4,date:'2026-02-05'},
    ] },

  // ── ETPL Lisboa (Eletrónica & Segurança) ─────────────────────
  { id:'s20', name:'Nuno Carvalho', school:'ETPL Lisboa', level:'AVANCADO', rating:4.8, nServices:38, acceptProb:0.55, cats:['seguranca'], location:'Loures',
    bio:'Especialista em sistemas de segurança e videovigilância.',
    reviews:[
      {author:'Carla S.',text:'Sistema de câmaras instalado sem erros.',rating:5,date:'2026-04-17'},
      {author:'Miguel A.',text:'Muito competente e organizado.',rating:5,date:'2026-04-03'},
      {author:'Nazaré B.',text:'Alarme novo a funcionar na perfeição.',rating:5,date:'2026-03-21'},
      {author:'Olavo M.',text:'Câmaras de vigilância perfeitas.',rating:5,date:'2026-03-08'},
      {author:'Patrícia F.',text:'Instalação de sistema antifurto.',rating:4,date:'2026-02-23'},
      {author:'Querubim S.',text:'Excelente profissional.',rating:5,date:'2026-02-09'},
      {author:'Rufino B.',text:'Segurança total em casa.',rating:5,date:'2026-01-27'},
      {author:'Salomé M.',text:'Muito satisfeita com o sistema.',rating:4,date:'2026-01-13'},
      {author:'Tomé F.',text:'Câmaras interiores e exteriores.',rating:5,date:'2026-01-01'},
      {author:'Úrsula B.',text:'Profissionalismo de topo.',rating:5,date:'2025-12-18'},
      {author:'Victorino M.',text:'Voltaria a contratar.',rating:5,date:'2025-12-04'},
      {author:'Wenceslau F.',text:'Sistema CCTV de qualidade.',rating:4,date:'2025-11-20'},
      {author:'Ximena S.',text:'Muito eficiente e pontual.',rating:5,date:'2025-11-06'},
      {author:'Yolanda B.',text:'Câmaras e intercom instalados.',rating:5,date:'2025-10-23'},
      {author:'Zacarias M.',text:'Recomendo sem reservas.',rating:5,date:'2025-10-09'},
    ] },
  { id:'s6', name:'Sofia Costa', school:'ETPL Lisboa', level:'AVANCADO', rating:4.6, nServices:21, acceptProb:0.65, cats:['jardinagem','pintura'], location:'Cascais',
    bio:'Adoro jardinagem e faço trabalhos de pintura de qualidade.',
    reviews:[
      {author:'Bruno N.',text:'Jardim ficou absolutamente lindo!',rating:5,date:'2026-04-12'},
      {author:'Carmo M.',text:'Pintura do exterior ficou perfeita.',rating:5,date:'2026-03-28'},
      {author:'Diogo F.',text:'Jardim mantido todo o mês.',rating:4,date:'2026-03-14'},
      {author:'Estela S.',text:'Pintura interior muito cuidada.',rating:5,date:'2026-02-28'},
      {author:'Firmino B.',text:'Jardim redesenhado com gosto.',rating:5,date:'2026-02-14'},
      {author:'Goreti M.',text:'Muito criativa na jardinagem.',rating:4,date:'2026-01-31'},
      {author:'Hermínio F.',text:'Paredes pintadas com perfeição.',rating:5,date:'2026-01-17'},
      {author:'Isilda B.',text:'Excelente trabalho de jardinagem.',rating:4,date:'2026-01-03'},
      {author:'Jacinto S.',text:'Jardim florido durante todo o ano.',rating:5,date:'2025-12-20'},
      {author:'Kika M.',text:'Pintura e paisagismo perfeitos.',rating:5,date:'2025-12-06'},
    ] },
  { id:'s15', name:'Mariana Rocha', school:'ETPL Lisboa', level:'INTERMEDIO', rating:4.7, nServices:14, acceptProb:0.70, cats:['petsitting'], location:'Almada',
    bio:'Amante dos animais. Passeios, alimentação e companhia garantidos.',
    reviews:[
      {author:'Tiago R.',text:'O meu cão adorou absolutamente!',rating:5,date:'2026-04-19'},
      {author:'Sofia C.',text:'Muito responsável com os animais.',rating:5,date:'2026-04-03'},
      {author:'Ulrico M.',text:'Cão voltou feliz e bem cuidado.',rating:5,date:'2026-03-20'},
      {author:'Verónica F.',text:'Passeios diários como prometido.',rating:4,date:'2026-03-06'},
      {author:'Wilson B.',text:'Gato bem tratado durante férias.',rating:5,date:'2026-02-21'},
      {author:'Xana M.',text:'Muito carinhosa com o meu labrador.',rating:5,date:'2026-02-07'},
      {author:'Yara S.',text:'Animais sempre bem alimentados.',rating:4,date:'2026-01-24'},
      {author:'Zélia F.',text:'Recomendo para todos os pets.',rating:5,date:'2026-01-10'},
    ] },
  { id:'s42', name:'Henrique Saraiva', school:'ETPL Lisboa', level:'INTERMEDIO', rating:4.5, nServices:11, acceptProb:0.78, cats:['eletric'], location:'Sintra',
    bio:'Eletrónica e automação doméstica. Quadros elétricos, domótica e instalações.',
    reviews:[
      {author:'Olívia F.',text:'Instalou quadro elétrico novo.',rating:5,date:'2026-04-05'},
      {author:'Pedro T.',text:'Domótica configurada na perfeição.',rating:5,date:'2026-03-22'},
      {author:'Quirina B.',text:'Instalação elétrica de qualidade.',rating:4,date:'2026-03-08'},
      {author:'Renato M.',text:'Muito competente.',rating:4,date:'2026-02-23'},
      {author:'Stéphanie F.',text:'Trabalho organizado e limpo.',rating:5,date:'2026-02-09'},
      {author:'Tito S.',text:'Excelente eletricista.',rating:4,date:'2026-01-26'},
    ] },
  { id:'s43', name:'Cláudia Mendes', school:'ETPL Lisboa', level:'BASICO', rating:4.1, nServices:4, acceptProb:0.87, cats:['seguranca'], location:'Odivelas',
    bio:'Curso de Sistemas de Segurança. Instalação de câmaras, alarmes e interfones.',
    reviews:[
      {author:'Tomás C.',text:'Instalou campainha e intercom.',rating:4,date:'2026-03-12'},
      {author:'Ulca M.',text:'Câmara da porta instalada.',rating:4,date:'2026-02-20'},
    ] },

  // ── ETP Coimbra (Artes & Acabamentos) ────────────────────────
  { id:'s4', name:'Inês Rodrigues', school:'ETP Coimbra', level:'AVANCADO', rating:4.8, nServices:27, acceptProb:0.60, cats:['pintura','carpint'], location:'Coimbra',
    bio:'Especializada em pintura decorativa e restauro de mobiliário.',
    reviews:[
      {author:'Luís T.',text:'Trabalho impecável. Muito recomendo.',rating:5,date:'2026-04-20'},
      {author:'Sofia A.',text:'Super atenciosa e muito profissional.',rating:5,date:'2026-03-28'},
      {author:'Verónica M.',text:'Pintura decorativa de excelência.',rating:5,date:'2026-03-14'},
      {author:'Wilson F.',text:'Móvel restaurado ficou como novo.',rating:5,date:'2026-02-29'},
      {author:'Xabregas S.',text:'Stucco veneziano perfeito.',rating:5,date:'2026-02-14'},
      {author:'Ynez B.',text:'Carpintaria e pintura combinadas.',rating:5,date:'2026-01-31'},
      {author:'Zacário M.',text:'Restauro de madeira impecável.',rating:4,date:'2026-01-17'},
      {author:'Adelaide F.',text:'Acabamentos de alto nível.',rating:5,date:'2026-01-04'},
      {author:'Baltasar C.',text:'Mesa antiga restaurada na perfeição.',rating:5,date:'2025-12-21'},
      {author:'Celestino M.',text:'Pintura interior sem falhas.',rating:5,date:'2025-12-07'},
      {author:'Damiana F.',text:'Armário antigo como novo.',rating:5,date:'2025-11-23'},
      {author:'Ezequiel B.',text:'Muito criativa nos acabamentos.',rating:4,date:'2025-11-09'},
    ] },
  { id:'s10', name:'Beatriz Lima', school:'ETP Coimbra', level:'INTERMEDIO', rating:4.4, nServices:9, acceptProb:0.78, cats:['pintura','limpeza'], location:'Figueira da Foz',
    bio:'Pintora criativa e dedicada. Faço também limpezas pós-obra.',
    reviews:[
      {author:'Vasco M.',text:'Boa pintora, atenta ao detalhe.',rating:4,date:'2026-03-18'},
      {author:'Wanda F.',text:'Limpeza pós-obra muito eficaz.',rating:4,date:'2026-03-03'},
      {author:'Xiomara B.',text:'Resultado da pintura agradável.',rating:4,date:'2026-02-17'},
      {author:'Yuri M.',text:'Boa profissional.',rating:5,date:'2026-02-03'},
      {author:'Zilda S.',text:'Trabalho limpo e organizado.',rating:4,date:'2026-01-20'},
      {author:'Abílio F.',text:'Pintou cozinha muito bem.',rating:4,date:'2026-01-07'},
    ] },
  { id:'s29', name:'Daniela Fonseca', school:'ETP Coimbra', level:'INTERMEDIO', rating:4.5, nServices:12, acceptProb:0.77, cats:['montagem','reparacao'], location:'Lousã',
    bio:'Montagem de mobiliário e pequenas reparações domésticas. Precisa e rápida.',
    reviews:[
      {author:'Gonçalo P.',text:'Montou tudo rapidamente e sem erros.',rating:5,date:'2026-04-07'},
      {author:'Hortense M.',text:'Reparação de porta muito bem feita.',rating:4,date:'2026-03-24'},
      {author:'Ireneu F.',text:'Estantes e cama montadas.',rating:5,date:'2026-03-10'},
      {author:'Josefina B.',text:'Rápida e organizada.',rating:4,date:'2026-02-25'},
      {author:'Karim S.',text:'Móveis de cozinha montados.',rating:5,date:'2026-02-11'},
      {author:'Leonel M.',text:'Reparação de janela perfeita.',rating:4,date:'2026-01-28'},
      {author:'Maximina F.',text:'Trabalho de qualidade.',rating:5,date:'2026-01-14'},
      {author:'Narcisa B.',text:'Muito eficiente.',rating:4,date:'2026-01-01'},
    ] },
  { id:'s44', name:'Afonso Duarte', school:'ETP Coimbra', level:'BASICO', rating:4.2, nServices:6, acceptProb:0.88, cats:['carpint'], location:'Coimbra',
    bio:'Curso de Artes do Mobiliário. Carpintaria básica e restauro de peças simples.',
    reviews:[
      {author:'Cristina B.',text:'Fez uma prateleira resistente.',rating:4,date:'2026-03-22'},
      {author:'Domitila M.',text:'Mesa reparada com cuidado.',rating:4,date:'2026-03-06'},
      {author:'Erasmo F.',text:'Trabalho simples mas bem feito.',rating:4,date:'2026-02-18'},
      {author:'Felicidade S.',text:'Boa disposição.',rating:5,date:'2026-02-02'},
    ] },
  { id:'s45', name:'Margarida Reis', school:'ETP Coimbra', level:'INTERMEDIO', rating:4.6, nServices:15, acceptProb:0.73, cats:['pintura'], location:'Cantanhede',
    bio:'Pintura decorativa e acabamentos. Especialidade em stucco e efeitos especiais.',
    reviews:[
      {author:'Dinis F.',text:'Sala transformada! Cores perfeitas.',rating:5,date:'2026-04-11'},
      {author:'Elsa M.',text:'Muito caprichosa nos acabamentos.',rating:4,date:'2026-03-27'},
      {author:'Filomena T.',text:'Stucco veneziano incrível.',rating:5,date:'2026-03-13'},
      {author:'Gaspar B.',text:'Quarto pintado com classe.',rating:5,date:'2026-02-27'},
      {author:'Helena S.',text:'Efeito de parede fantástico.',rating:4,date:'2026-02-13'},
      {author:'Ilídio M.',text:'Pintura do corredor perfeita.',rating:5,date:'2026-01-30'},
      {author:'Júlia F.',text:'Muito contente com o resultado.',rating:4,date:'2026-01-16'},
      {author:'Kevin S.',text:'Casa com nova cara.',rating:5,date:'2026-01-03'},
      {author:'Lina B.',text:'Qualidade de trabalho excelente.',rating:5,date:'2025-12-20'},
    ] },

  // ── EPCV Coimbra (Cuidados & Verde) ──────────────────────────
  { id:'s13', name:'Leonor Faria', school:'EPCV Coimbra', level:'BASICO', rating:4.3, nServices:8, acceptProb:0.85, cats:['babysitting'], location:'Condeixa-a-Nova',
    bio:'Amo crianças e tenho formação em primeiros socorros pediátricos.',
    reviews:[
      {author:'Maria J.',text:'Os meus filhos adoraram-na!',rating:5,date:'2026-04-07'},
      {author:'Carlos B.',text:'Muito responsável e carinhosa.',rating:4,date:'2026-03-12'},
      {author:'Natércia F.',text:'Crianças bem entretidas.',rating:5,date:'2026-02-26'},
      {author:'Olinda M.',text:'Confiante e atenciosa.',rating:4,date:'2026-02-10'},
      {author:'Pompeu S.',text:'Filhos chegaram felizes.',rating:4,date:'2026-01-25'},
    ] },
  { id:'s19', name:'Francisca Pinto', school:'EPCV Coimbra', level:'INTERMEDIO', rating:4.5, nServices:13, acceptProb:0.78, cats:['limpeza','babysitting'], location:'Cantanhede',
    bio:'Zeladora experiente e cuidadora dedicada. Flexível em horários.',
    reviews:[
      {author:'Rui C.',text:'Casa impecável após a limpeza!',rating:5,date:'2026-04-06'},
      {author:'Solange M.',text:'Crianças bem cuidadas.',rating:4,date:'2026-03-22'},
      {author:'Toino F.',text:'Limpeza geral muito bem feita.',rating:5,date:'2026-03-07'},
      {author:'Umbelina B.',text:'Muito flexível nos horários.',rating:4,date:'2026-02-21'},
      {author:'Ventura M.',text:'Trabalha com cuidado.',rating:5,date:'2026-02-07'},
      {author:'Wanda F.',text:'Babysitting de qualidade.',rating:4,date:'2026-01-23'},
      {author:'Xiomara S.',text:'Casa sempre em ordem.',rating:5,date:'2026-01-09'},
      {author:'Yasmin B.',text:'Pontual e eficiente.',rating:4,date:'2025-12-26'},
    ] },
  { id:'s24', name:'Ricardo Lopes', school:'EPCV Coimbra', level:'BASICO', rating:4.0, nServices:3, acceptProb:0.90, cats:['jardinagem'], location:'Montemor-o-Velho',
    bio:'Estudante de horticultura. Disponível para jardinagem.',
    reviews:[
      {author:'Maria T.',text:'Relva ficou perfeita.',rating:4,date:'2026-03-08'},
      {author:'Narciso F.',text:'Jardim arranjado.',rating:4,date:'2026-02-10'},
    ] },
  { id:'s46', name:'Constança Melo', school:'EPCV Coimbra', level:'INTERMEDIO', rating:4.5, nServices:11, acceptProb:0.79, cats:['babysitting'], location:'Coimbra',
    bio:'Educação de Infância. Experiência com crianças de 0 a 10 anos.',
    reviews:[
      {author:'Álvaro N.',text:'As crianças adoraram, muito responsável.',rating:5,date:'2026-04-08'},
      {author:'Laura F.',text:'Sempre pontual e muito carinhosa.',rating:4,date:'2026-03-19'},
      {author:'Maurício B.',text:'Bebé bem tratado.',rating:5,date:'2026-03-05'},
      {author:'Nélia M.',text:'Muito cuidadosa.',rating:5,date:'2026-02-19'},
      {author:'Óscar F.',text:'Recomendo totalmente.',rating:4,date:'2026-02-04'},
      {author:'Piedade S.',text:'Crianças felizes e entretidas.',rating:5,date:'2026-01-21'},
      {author:'Quirino B.',text:'Babysitter de confiança.',rating:4,date:'2026-01-07'},
    ] },
  { id:'s47', name:'Eduardo Bessa', school:'EPCV Coimbra', level:'BASICO', rating:4.1, nServices:5, acceptProb:0.88, cats:['petsitting'], location:'Figueira da Foz',
    bio:'Veterinária preventiva. Passeios, alimentação e cuidados básicos de animais.',
    reviews:[
      {author:'Miriam T.',text:'Cuidou muito bem do meu cão.',rating:4,date:'2026-03-01'},
      {author:'Noel F.',text:'Gato bem alimentado.',rating:4,date:'2026-02-10'},
      {author:'Octávio S.',text:'Passeios cumpridos.',rating:4,date:'2026-01-20'},
    ] },
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
  // Restore dark mode preference
  const p = LS.get(KEY_PROFILE) || {};
  document.body.classList.toggle('dark', !!p.darkMode);
  showScreen('app');
  switchTab('menu');
  renderActiveRequest();
  renderHistorico();
  renderSettings();
}

function renderPublicProfile() {
  if (!currentUser) return;
  const body = document.getElementById('public-profile-body');
  if (!body) return;
  const p = LS.get(KEY_PROFILE) || {};
  const reqs = getUserRequests().filter(r => r.status === 'CONCLUIDO' || r.status === 'CONCLUIDO_SEM_AVALIACAO');
  // Gather all reviews the user left (stored as r.evaluation inside requests)
  const allUserReviews = getUserRequests()
    .filter(r => r.evaluation)
    .map(r => ({ ...r.evaluation, studentName: r.assignedStudent?.name }));
  // Member since: approximate from oldest request or today
  const allReqs = LS.get(KEY_REQUESTS) || [];
  const userReqs = allReqs.filter(r => r.userId === currentUser.id);
  const oldest = userReqs.reduce((min, r) => (!min || r.createdAt < min) ? r.createdAt : min, null);
  const memberSince = oldest ? new Date(oldest).getFullYear() : new Date().getFullYear();
  const avgRating = allUserReviews.length > 0
    ? (allUserReviews.reduce((s,e) => s + (e.rating||5), 0) / allUserReviews.length).toFixed(1)
    : '—';

  const starsHtml = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

  const servicesHtml = reqs.length === 0
    ? `<div class="pub-empty">Ainda não tens serviços concluídos.</div>`
    : reqs.slice(0,10).map(r => {
        const catId = r.catId || r.category;
        const cat = CATEGORIES.find(c => c.id === catId) || { name: r.catName || catId || 'Serviço', emoji: r.catEmoji || '🔧' };
        const evalLine = r.evaluation
          ? `<span class="pub-service-stars">${starsHtml(r.evaluation.rating)}</span>`
          : '';
        const stuName = r.assignedStudent?.name || r.studentName || '';
        return `<div class="pub-service-item">
          <span class="pub-service-emoji">${cat.emoji}</span>
          <div class="pub-service-info">
            <div class="pub-service-name">${cat.name}</div>
            <div class="pub-service-date">${formatDate(r.createdAt)}${stuName ? ' · ' + stuName : ''}</div>
          </div>
          ${evalLine}
        </div>`;
      }).join('')

  const reviewsHtml = allUserReviews.length === 0
    ? `<div class="pub-empty">Ainda não fizeste nenhuma avaliação.</div>`
    : allUserReviews.slice(0,8).map(e => `
      <div class="review-card">
        <div class="review-top">
          <span class="review-stars">${starsHtml(e.rating)}</span>
          ${e.studentName ? `<span class="review-author" style="font-size:.78rem;color:var(--text-2)">→ ${e.studentName}</span>` : ''}
          <span class="review-date">${e.date || ''}</span>
        </div>
        <div class="review-text">${e.comment || ''}</div>
      </div>`).join('');

  body.innerHTML = `
    <div class="pub-profile-hero">
      <div class="pub-avatar">${(currentUser.name||'U')[0].toUpperCase()}</div>
      <div class="pub-name">${currentUser.name}</div>
      <div class="pub-email">${currentUser.email}</div>
      <div class="pub-member-since">Membro desde ${memberSince}</div>
      ${p.location ? `<div class="pub-member-since">📍 ${p.location}</div>` : ''}
      <button class="pub-edit-btn" onclick="openSettingsSection('fs-settings-info')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Editar perfil
      </button>
    </div>

    <div class="pub-stats-row">
      <div class="pub-stat"><span class="pub-stat-num">${reqs.length}</span><span class="pub-stat-lbl">Serviços</span></div>
      <div class="pub-stat"><span class="pub-stat-num">${allUserReviews.length}</span><span class="pub-stat-lbl">Avaliações</span></div>
      <div class="pub-stat"><span class="pub-stat-num">${avgRating}</span><span class="pub-stat-lbl">Média ★</span></div>
    </div>

    ${p.bio ? `
    <div class="pub-section-title">Sobre mim</div>
    <div class="pub-bio-card"><div class="pub-bio-text">${p.bio}</div></div>
    ` : ''}

    <div class="pub-section-title">Serviços realizados</div>
    <div class="pub-services-list">${servicesHtml}</div>

    <div class="pub-section-title">As minhas avaliações</div>
    <div class="pub-reviews-list">${reviewsHtml}</div>
  `;
}

function switchTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`)?.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  if (name === 'pedido')    renderActiveRequest();
  if (name === 'historico') renderHistorico();
  if (name === 'def')       renderPublicProfile();
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
  if (!EMAIL_RE.test(email)) { err.textContent = 'Email inválido. Usa o formato algo@dominio.com'; return; }
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
  const dynRating = dynStats.rating;
  const dynNServices = dynStats.nServices;

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
      <div class="profile-stars">${stars} <span style="font-size:.85rem;color:var(--text-2);font-family:var(--font-body)">${dynRating.toFixed(1)}</span></div>
    </div>
    <div class="profile-stats-row">
      <div class="pstat"><span class="pstat-num">${dynNServices}</span><span class="pstat-lbl">Serviços</span></div>
      <div class="pstat"><span class="pstat-num">${dynRating.toFixed(1)}</span><span class="pstat-lbl">Avaliação</span></div>
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
          { t:2500, cls:'log-info', msg:`📍 A verificar localização…` },
          { t:2800, cls:'log-ok',   msg:`✓ Localização reconhecida: ${clientCity}` },
          { t:3000, cls:'log-info', msg:`  A calcular distâncias…` },
          { t:3200, cls:'log-ok',   msg:`✓ Raio máximo: ${AUTO_MAX_KM} km — ${eligible.length} profissional(is) encontrado(s)` },
        ]
      : [
          { t:2500, cls:'log-warn', msg:`⚠ Localização "${loc}" não reconhecida — sem filtro de distância` },
          { t:2800, cls:'log-info', msg:`  Todos os profissionais da categoria são elegíveis` },
        ]
    : [
        { t:2500, cls:'log-warn', msg:`⚠ Sem localização indicada — sem filtro de distância` },
        { t:2800, cls:'log-info', msg:`  Todos os profissionais da categoria são elegíveis` },
      ];

  const lines = [
    { t:300,  cls:'log-info', msg:`🔍 A criar pedido para ${catName}…` },
    { t:700,  cls:'log-ok',   msg:`✓ Pedido registado com sucesso` },
    { t:1100, cls:'log-info', msg:`🔎 A pesquisar profissionais disponíveis…` },
    { t:1500, cls:'log-info', msg:`  A avaliar candidatos…` },
    { t:1800, cls:'log-ok',   msg:`✓ Categoria: ${catName}` },
    { t:2000, cls:'log-ok',   msg:`✓ Nível: ${LEVEL_LBL[level]}` },
    { t:2200, cls:'log-ok',   msg:`✓ Urgência: ${URGENCY_LBL[urg]}` },
    ...locLines,
    { t:3500, cls:'log-info', msg:`📨 A notificar profissionais…` },
    { t:3900, cls:'log-ok',   msg:`✓ Propostas enviadas — a aguardar respostas` },
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
const stuSection = stu ? (() => {
  const stuDynRating = getStudentStats(stu.id)?.rating ?? stu.rating;
  return `
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
        <span class="stars">${starStr(stuDynRating)} <span style="font-size:.72rem;color:rgba(255,255,255,.7)">${stuDynRating.toFixed(1)}</span></span>
      </div>
      <div class="req-student-view-profile">Ver perfil completo →</div>
    </div>`;
})() : '';

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
  const s = STUDENTS.find(x => x.id === studentId);
  const stored = LS.get(KEY_STUDENT_STATS) || {};
  const override = stored[studentId] || {};
  const baseReviews = s?.reviews || [];
  const baseRating = baseReviews.length > 0
    ? Math.round((baseReviews.reduce((a, r) => a + r.rating, 0) / baseReviews.length) * 10) / 10
    : s?.rating ?? 0;
  return {
    rating:     override.rating     ?? baseRating,
    nServices:  override.nServices  ?? s?.nServices ?? 0,
  };
}


function saveStudentStats(studentId, patch) {
  const all = LS.get(KEY_STUDENT_STATS) || {};
  all[studentId] = { ...(all[studentId] || {}), ...patch };
  LS.set(KEY_STUDENT_STATS, all);
}

function simulateCompleteService(reqId) {
  let all = LS.get(KEY_REQUESTS)||[];
  const r = all.find(x=>x.id===reqId);
  if (r) {
    r.status='CONCLUIDO'; r.completedAt=new Date().toISOString();
    if (r.assignedStudent?.id) {
      const s = STUDENTS.find(x => x.id === r.assignedStudent.id);
      const stats = getStudentStats(r.assignedStudent.id);
      const currentN = (stats?.nServices ?? s?.nServices ?? 0);
      saveStudentStats(r.assignedStudent.id, { nServices: currentN + 1 });
    }
    LS.set(KEY_REQUESTS, all);
  }
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
  const all   = getUserRequests().filter(r => r.status !== 'CANCELADO').slice().reverse();
  if (all.length===0) { list.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = all.map(r => {
    const stuLine = r.assignedStudent
      ? `<div class="hist-student" onclick="openStudentProfile('${r.assignedStudent.id}','historico')" style="cursor:pointer">
           👤 ${r.assignedStudent.name} · ${r.assignedStudent.school} <span style="font-size:.7rem;color:var(--blue-light)">Ver perfil</span>
         </div>`
      : '';
    let evalLine = '';
    if (r.status === 'CONCLUIDO' && !r.evaluation) {
      evalLine = `<button class="btn-eval-inline" onclick="openEvaluation('${r.id}')">⭐ Avaliar serviço</button>`;
    } else if (r.evaluation) {
      const cmnt = r.evaluation.comment || '';
      evalLine = `<div class="hist-eval">⭐ ${'★'.repeat(r.evaluation.rating)}${cmnt ? ` — <em>${cmnt.slice(0,40)}${cmnt.length>40?'…':''}</em>` : ''}</div>`;
    }
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

  // Load saved profile extras
  const p = LS.get(KEY_PROFILE) || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('set-name',        currentUser.name);
  setVal('set-phone',       p.phone);
  setVal('set-location',    p.location);
  setVal('set-addr-street', p.addrStreet);
  setVal('set-addr-zip',    p.addrZip);
  setVal('set-addr-city',   p.addrCity);
  setVal('set-email',       '');
  setVal('set-pass-current','');
  setVal('set-pass-new',    '');
  setVal('set-pass-confirm','');

  // Restore dark mode toggle
  const dark = p.darkMode || false;
  const toggle = document.getElementById('dark-toggle');
  if (toggle) toggle.checked = dark;
  document.body.classList.toggle('dark', dark);
}

function openSettingsSection(id) {
  renderSettings();
  openFullScreen(id);
}

function closeSettingsSection(id) {
  closeFullScreen(id);
}

function saveProfileSettings() {
  const name     = document.getElementById('set-name')?.value.trim();
  const phone    = document.getElementById('set-phone')?.value.trim();
  const location = document.getElementById('set-location')?.value.trim();
  const addrStreet= document.getElementById('set-addr-street')?.value.trim();
  const addrZip  = document.getElementById('set-addr-zip')?.value.trim();
  const addrCity = document.getElementById('set-addr-city')?.value.trim();
  // Try both possible msg elements (info section or billing section)
  const msgEl = document.getElementById('settings-save-msg') || document.getElementById('billing-save-msg');

  if (name) {
    currentUser.name = name;
    LS.set(KEY_SESSION, currentUser);
    // Update in users list too
    const users = LS.get(KEY_USERS) || [];
    const u = users.find(x => x.id === currentUser.id);
    if (u) { u.name = name; LS.set(KEY_USERS, users); }
  }

  const existing = LS.get(KEY_PROFILE) || {};
  LS.set(KEY_PROFILE, { ...existing, phone, location, addrStreet, addrZip, addrCity,
    darkMode: document.getElementById('dark-toggle')?.checked || existing.darkMode || false });

  document.getElementById('settings-name').textContent = currentUser.name;
  document.getElementById('settings-avatar').textContent = (currentUser.name||'U')[0].toUpperCase();
  if (msgEl) { msgEl.textContent = '✓ Alterações guardadas!'; setTimeout(() => msgEl.textContent = '', 3000); }
  // Refresh public profile page immediately if the user is on that tab
  const defPage = document.getElementById('page-def');
  if (defPage && defPage.classList.contains('active')) renderPublicProfile();
}

function saveAccountSettings() {
  const newEmail      = document.getElementById('set-email')?.value.trim();
  const passCurrent   = document.getElementById('set-pass-current')?.value;
  const passNew       = document.getElementById('set-pass-new')?.value;
  const passConfirm   = document.getElementById('set-pass-confirm')?.value;
  const msgEl         = document.getElementById('account-save-msg');
  if (msgEl) msgEl.textContent = '';

  const users = LS.get(KEY_USERS) || [];
  const u = users.find(x => x.id === currentUser.id);

  let changed = false;

  if (newEmail) {
    if (!EMAIL_RE.test(newEmail)) { if (msgEl) msgEl.textContent = '✗ Email inválido.'; return; }
    if (users.find(x => x.email === newEmail && x.id !== currentUser.id)) {
      if (msgEl) msgEl.textContent = '✗ Email já em uso por outra conta.'; return;
    }
    if (u) u.email = newEmail;
    currentUser.email = newEmail;
    LS.set(KEY_SESSION, currentUser);
    changed = true;
  }

  if (passCurrent || passNew || passConfirm) {
    if (!passCurrent) { if (msgEl) msgEl.textContent = '✗ Insere a password atual.'; return; }
    if (!u || u.password !== passCurrent) { if (msgEl) msgEl.textContent = '✗ Password atual incorreta.'; return; }
    if (passNew.length < 6) { if (msgEl) msgEl.textContent = '✗ Nova password: mínimo 6 caracteres.'; return; }
    if (passNew !== passConfirm) { if (msgEl) msgEl.textContent = '✗ As passwords não coincidem.'; return; }
    if (u) u.password = passNew;
    changed = true;
  }

  if (changed) {
    LS.set(KEY_USERS, users);
    document.getElementById('settings-email').textContent = currentUser.email;
    document.getElementById('set-email').value = '';
    document.getElementById('set-pass-current').value = '';
    document.getElementById('set-pass-new').value = '';
    document.getElementById('set-pass-confirm').value = '';
    if (msgEl) { msgEl.textContent = '✓ Conta atualizada!'; setTimeout(() => msgEl.textContent = '', 3000); }
  } else {
    if (msgEl) { msgEl.textContent = 'Nada para atualizar.'; setTimeout(() => msgEl.textContent = '', 2000); }
  }
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
   const dynStats = getStudentStats(s.id);
   const dynRating = dynStats.rating;
   const dynNServices = dynStats.nServices;

  const stars = starStr(dynRating);
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
        <div class="stu-meta">🏫 ${s.school} · 📍 ${s.location} · ${LEVEL_LBL[s.level]} · ✅ ${dynNServices} serv.</div>
      </div>
      <div class="stu-right">
        <span class="stars">${stars} <span style="font-size:.72rem;color:var(--text-2)">${dynRating.toFixed(1)}</span></span>
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
function toggleDark(cb) {
  document.body.classList.toggle('dark', cb.checked);
  const p = LS.get(KEY_PROFILE) || {};
  LS.set(KEY_PROFILE, { ...p, darkMode: cb.checked });
}
function showToast(msg,dur=3000) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.remove('hidden');
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.classList.add('hidden'),300);},dur);
}
