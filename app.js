'use strict';

/* 页边 Margin — 一个无后端的阅读词本。
   数据默认在 localStorage，配置后通过 GitHub Contents API 读写仓库里的 JSON。 */

const DATA_KEY = 'margin.data.v1';
const CFG_KEY = 'margin.cfg.v1';
const INTERVALS = [0, 1, 3, 7, 14, 30];

const SAMPLE_SENTENCE_1 = 'In it, Le Bon posits that with the rise of democracy and industrialization, it is the unreasoning crowds who will control the affairs of the people, not kings or the elite; and these crowds are largely irrational in action, conservative in thought, violent both in act and in speech, and easily hypnotized by individuals with prestige but not intelligence.';
const SAMPLE_SENTENCE_2 = 'Individuals in crowds feel anonymous and powerful, leading to destruction and violence; people in a crowd are a grain of sand amid other grains of sand, which the wind stirs up at will.';

const DEFAULT_DATA = {
  version: 1,
  updatedAt: '2026-11-03T21:20:00+08:00',
  items: [
    {
      id: 'sample-stir-up', kind: 'word', word: 'stir up', lemma: 'stir up',
      phonetic: '/stɜːr ʌp/', pos: 'phrasal verb',
      definition: '搅起、激起、挑起（风沙／情绪）',
      definitionEn: 'to cause a substance or feeling to become active or agitated',
      sentence: SAMPLE_SENTENCE_2, source: 'The Crowd', chapter: '',
      url: 'https://standardebooks.org/ebooks/gustave-le-bon/the-crowd/t-fisher-unwin-ltd',
      status: 'learning', level: 0, nextReview: '2026-11-03', seenCount: 1,
      createdAt: '2026-11-03T21:20:00+08:00', updatedAt: '2026-11-03T21:20:00+08:00', analysis: null
    },
    {
      id: 'sample-anonymous', kind: 'word', word: 'anonymous', lemma: 'anonymous',
      phonetic: '/əˈnɒnɪməs/', pos: 'adjective',
      definition: '匿名的；无个性特征的',
      definitionEn: 'not identified by name; lacking individuality',
      sentence: SAMPLE_SENTENCE_2, source: 'The Crowd', chapter: '',
      url: 'https://standardebooks.org/ebooks/gustave-le-bon/the-crowd/t-fisher-unwin-ltd',
      status: 'learning', level: 1, nextReview: '2026-11-03', seenCount: 2,
      createdAt: '2026-11-03T21:20:00+08:00', updatedAt: '2026-11-03T21:20:00+08:00', analysis: null
    },
    {
      id: 'sample-sentence-1', kind: 'sentence',
      word: 'a grain of sand amid other grains of sand…', lemma: '', phonetic: '', pos: '',
      definition: '', definitionEn: '', sentence: SAMPLE_SENTENCE_2,
      source: 'The Crowd', chapter: '',
      url: 'https://standardebooks.org/ebooks/gustave-le-bon/the-crowd/t-fisher-unwin-ltd',
      status: 'learning', level: 0, nextReview: '2026-11-03', seenCount: 1,
      createdAt: '2026-11-03T21:20:00+08:00', updatedAt: '2026-11-03T21:20:00+08:00',
      analysis: {
        trunk: 'people are a grain of sand',
        chunks: ['people in a crowd', 'a grain of sand', 'amid other grains of sand', 'which the wind stirs up at will'],
        modifiers: 'which 引导非限定定语从句，挂在前文的 grains of sand 上；at will 意为「随意地」',
        rewrite: '群体里的人只是沙堆中的一粒沙，风想怎么吹就怎么吹 —— 匿名、无力。',
        plain: '个人在群体中失去姓名与个性，被群体的力量任意摆布。'
      }
    }
  ]
};

const DEFAULT_CFG = {
  ghOwner: '', ghRepo: '', ghBranch: 'main', ghPath: 'data/vocabulary.json',
  ghToken: '', ghAuto: false,
  aiBase: '', aiModel: 'gpt-4o-mini', aiKey: '',
  appUrl: ''
};

const ANALYSIS_PROMPT = 'You help a Chinese reader parse difficult English sentences from 19th-century nonfiction. Return ONLY a JSON object, no markdown, with these keys: trunk (the bare subject-verb-object skeleton, in English), chunks (array of 2-5 meaning groups in order, keeping the original English words), modifiers (in Chinese: where each subordinate clause, participle or prepositional phrase attaches and what it modifies), rewrite (a plain modern-English paraphrase), plain (a concise Chinese explanation of the logic, NOT a literal full translation). Keep every value a string except chunks. Do not add keys.';

const BM_TEMPLATE = `(function(){
var APP="__APP_URL__";
if(window.__marginPanel)return;
var host=document.createElement("div");
host.style.cssText="position:fixed;z-index:2147483647;right:16px;bottom:16px;width:290px;background:#fff;color:#2c2c2a;border:1px solid #e5e1d7;border-radius:12px;padding:14px;font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.15)";
host.innerHTML='<div style="font-weight:600;margin-bottom:6px">页边 · 划词收录</div><div id="mgWord" style="color:#8b8a83;word-break:break-word">在页面上选中一个词或句子</div><div style="display:flex;gap:6px;margin-top:10px"><button id="mgAdd" style="flex:1;padding:6px;border:1px solid #7a4f2a;background:#7a4f2a;color:#fff;border-radius:7px;cursor:pointer">存入词库</button><button id="mgClose" style="padding:6px 10px;border:1px solid #d6d1c4;background:#fff;border-radius:7px;cursor:pointer">关闭</button></div>';
document.body.appendChild(host);
window.__marginPanel=host;
var current={word:"",sentence:""};
function sentenceOf(txt,sel){
  var i=txt.indexOf(sel);if(i<0)return sel;
  var start=0,end=txt.length;
  for(var a=i-1;a>=0;a--){if(".!?\\n".indexOf(txt.charAt(a))>=0){start=a+1;break;}}
  for(var b=i+sel.length;b<txt.length;b++){if(".!?\\n".indexOf(txt.charAt(b))>=0){end=b+1;break;}}
  return txt.slice(start,end).trim().replace(/\\s+/g," ");
}
function update(){
  var s=window.getSelection?window.getSelection().toString().trim():"";
  if(!s)return;
  var sel=window.getSelection(),node=sel.anchorNode;
  var el=node?(node.nodeType===3?node.parentElement:node):null;
  var box=el&&el.closest?el.closest("p,div,article,section,body"):null;
  var full=box?(box.innerText||box.textContent||""):(document.body.innerText||"");
  current={word:s.length>90?s.slice(0,90):s,sentence:sentenceOf(full,s)};
  document.getElementById("mgWord").textContent=current.word;
}
document.addEventListener("mouseup",function(e){if(host.contains(e.target))return;setTimeout(update,10);});
document.getElementById("mgClose").onclick=function(){host.remove();window.__marginPanel=null;};
document.getElementById("mgAdd").onclick=function(){
  if(!current.word){alert("先在页面上选中一个词");return;}
  var payload={word:current.word,sentence:current.sentence,source:document.title,url:location.href};
  var bytes=new TextEncoder().encode(JSON.stringify(payload)),bin="";
  for(var k=0;k<bytes.length;k++)bin+=String.fromCharCode(bytes[k]);
  window.open(APP+(APP.indexOf("#")>=0?"&":"#")+"add="+encodeURIComponent(btoa(bin)),"_blank");
};
})();`;

let data = loadData();
let cfg = loadCfg();
let filter = 'all';
let keyword = '';
let bookSel = '';
let reviewQueue = [];
let reviewIdx = 0;
let reviewDone = 0;
let flipped = false;
let selInfo = null;
let pushTimer = null;
let toastTimer = null;
let lastAnalysis = null;

/* ---------- 基础工具 ---------- */

function $(id) { return document.getElementById(id); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function uid() { return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }
function localDate(d) {
  const x = d || new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return localDate(d); }
function nowISO() { return new Date().toISOString(); }
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToUtf8(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(arr);
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2300);
}
function setStatus(id, msg) { const el = $(id); if (el) el.textContent = msg; }

function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.items)) return d; }
  } catch (e) { console.warn('读取本地词库失败', e); }
  return clone(DEFAULT_DATA);
}
function loadCfg() {
  try { return Object.assign({}, DEFAULT_CFG, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); }
  catch (e) { return Object.assign({}, DEFAULT_CFG); }
}
function visible() { return data.items.filter(function (i) { return !i.deleted; }); }
function dueWords() {
  const t = localDate();
  return visible().filter(function (i) {
    return i.kind !== 'sentence' && i.status === 'learning' && (i.nextReview || t) <= t;
  });
}
function saveData(opts) {
  data.updatedAt = nowISO();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  render();
  if (!(opts && opts.sync === false) && cfg.ghAuto && ghReady()) schedulePush();
}

/* ---------- 渲染 ---------- */

function render() {
  renderCounts();
  renderStats();
  renderBookFilter();
  renderWords();
  renderSyncPill();
}
function renderCounts() {
  $('countWords').textContent = visible().length;
  $('countReview').textContent = dueWords().length;
}
function renderStats() {
  const all = visible();
  const words = all.filter(function (i) { return i.kind !== 'sentence'; });
  const known = words.filter(function (i) { return i.status === 'known'; }).length;
  const sentences = all.filter(function (i) { return i.kind === 'sentence'; }).length;
  const cards = [
    ['词条总数', words.length],
    ['今日待复习', dueWords().length],
    ['已掌握', known],
    ['长句分析', sentences]
  ];
  $('stats').innerHTML = cards.map(function (c) {
    return '<div class="stat"><span>' + c[0] + '</span><strong>' + c[1] + '</strong></div>';
  }).join('');
}
function renderBookFilter() {
  const sel = $('bookFilter');
  const books = Array.from(new Set(visible().map(function (i) { return i.source || '未标注'; }))).sort();
  const prev = bookSel;
  sel.innerHTML = '<option value="">全部来源</option>' + books.map(function (b) {
    return '<option value="' + esc(b) + '">' + esc(b) + '</option>';
  }).join('');
  sel.value = books.indexOf(prev) >= 0 ? prev : '';
  bookSel = sel.value;
}
function renderSyncPill() {
  const p = $('syncPill');
  let text = '本地模式', cls = '';
  if (ghReady()) { text = cfg.ghAuto ? 'GitHub 自动同步' : 'GitHub 手动同步'; cls = 'on'; }
  p.className = 'sync-state' + (cls ? ' is-' + cls : '');
  p.querySelector('span').textContent = text;
}
function filteredItems() {
  const t = localDate();
  return visible().filter(function (i) {
    if (bookSel && (i.source || '未标注') !== bookSel) return false;
    if (filter === 'word' && i.kind === 'sentence') return false;
    if (filter === 'sentence' && i.kind !== 'sentence') return false;
    if (filter === 'due' && !(i.status === 'learning' && (i.nextReview || t) <= t)) return false;
    if (filter === 'known' && i.status !== 'known') return false;
    if (keyword) {
      const hay = [i.word, i.definition, i.definitionEn, i.sentence, i.source].join(' ').toLowerCase();
      if (hay.indexOf(keyword) < 0) return false;
    }
    return true;
  }).sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
}
function analysisHTML(a) {
  if (!a) return '';
  return '<div class="wc-analysis">' +
    '<div><b>主干</b><span>' + esc(a.trunk) + '</span></div>' +
    '<div><b>意群</b><span>' + esc((a.chunks || []).join('　/　')) + '</span></div>' +
    '<div><b>修饰</b><span>' + esc(a.modifiers) + '</span></div>' +
    '<div><b>改写</b><span>' + esc(a.rewrite) + '</span></div>' +
    '<div><b>人话</b><span>' + esc(a.plain) + '</span></div>' +
    '</div>';
}
function cardHTML(i) {
  const isSentence = i.kind === 'sentence';
  const tag = isSentence ? '<span class="wc-tag sentence">长句</span>'
    : (i.status === 'known' ? '<span class="wc-tag known">已掌握</span>' : '<span class="wc-tag">L' + (i.level || 0) + ' · 待复习</span>');
  const meta = [i.phonetic, i.pos].filter(Boolean).join(' · ');
  const def = i.definition || i.definitionEn || (isSentence ? '见下方句法分层' : '（暂无释义）');
  const defEn = i.definition && i.definitionEn ? '<em>' + esc(i.definitionEn) + '</em>' : '';
  const sourceLine = [i.source || '未标注', i.chapter, (i.createdAt || '').slice(0, 10)].filter(Boolean).join(' · ');
  const actions = isSentence
    ? '<button data-cmd="reanalyze" data-id="' + esc(i.id) + '">重新分析</button><button class="danger" data-cmd="delete" data-id="' + esc(i.id) + '">删除</button>'
    : '<button data-cmd="toggle" data-id="' + esc(i.id) + '">' + (i.status === 'known' ? '重新学习' : '标为已掌握') + '</button>' +
      '<button data-cmd="edit" data-id="' + esc(i.id) + '">编辑</button>' +
      '<button class="danger" data-cmd="delete" data-id="' + esc(i.id) + '">删除</button>';
  return '<article class="word-card">' +
    '<div class="wc-top"><span class="wc-word">' + esc(i.word) + '</span>' +
    (meta ? '<span class="wc-meta">' + esc(meta) + '</span>' : '') + tag + '</div>' +
    '<p class="wc-def">' + esc(def) + defEn + '</p>' +
    (i.sentence ? '<blockquote class="wc-quote">' + esc(i.sentence) + '</blockquote>' : '') +
    analysisHTML(i.analysis) +
    '<div class="wc-foot"><span>' + esc(sourceLine) + '</span><span>遇到 ' + (i.seenCount || 1) + ' 次</span><span class="spacer"></span>' + actions + '</div>' +
    '</article>';
}
function renderWords() {
  const list = filteredItems();
  const root = $('wordList');
  if (!list.length) {
    root.innerHTML = '<div class="empty">还没有符合条件的记录。去「阅读」里选中一个词，或点「载入示例段落」试试。</div>';
    return;
  }
  root.innerHTML = list.map(cardHTML).join('');
}

/* ---------- 弹窗 ---------- */

function openModal(html) {
  const root = $('modalRoot');
  root.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
  root.hidden = false;
  root.onclick = function (e) { if (e.target === root) closeModal(); };
}
function closeModal() { const r = $('modalRoot'); r.hidden = true; r.innerHTML = ''; }

async function lookupWord(word) {
  try {
    const head = String(word).trim().split(/\s+/)[0].replace(/[^A-Za-z'-]/g, '');
    if (!head) return null;
    const r = await fetch('https://dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(head));
    if (!r.ok) return null;
    const j = await r.json();
    const e = Array.isArray(j) ? j[0] : null;
    if (!e) return null;
    const m = (e.meanings || [])[0] || {};
    const d = (m.definitions || [])[0] || {};
    return {
      phonetic: e.phonetic || ((e.phonetics || []).find(function (p) { return p.text; }) || {}).text || '',
      pos: m.partOfSpeech || '',
      definitionEn: d.definition || ''
    };
  } catch (e) { return null; }
}

function openAddModal(p) {
  const edit = !!p.editId;
  const item = edit ? data.items.find(function (x) { return x.id === p.editId; }) : null;
  const v = item || p;
  const html = '<h3>' + (edit ? '编辑词条' : '加入词库') + '</h3>' +
    '<p class="sub">释义可以先留空，之后随时补；原句和出处会自动记住。</p>' +
    (v.sentence ? '<div class="quote-preview">' + esc(v.sentence) + '</div>' : '') +
    '<div class="field-row">' +
      '<div class="field"><label>单词 / 短语</label><input id="fWord" type="text" value="' + esc(v.word || '') + '"></div>' +
      '<div class="field"><label>词元（用于去重）</label><input id="fLemma" type="text" value="' + esc(v.lemma || v.word || '') + '"></div>' +
    '</div>' +
    '<div class="field-row">' +
      '<div class="field"><label>音标</label><input id="fPhonetic" type="text" value="' + esc(v.phonetic || '') + '"></div>' +
      '<div class="field"><label>词性</label><input id="fPos" type="text" value="' + esc(v.pos || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>中文释义</label><input id="fDef" type="text" value="' + esc(v.definition || '') + '" placeholder="搅起、激起"></div>' +
    '<div class="field"><label>英文释义（可选，自动查词典时填入）</label><textarea id="fDefEn">' + esc(v.definitionEn || '') + '</textarea></div>' +
    '<div class="field"><label>原文语境</label><textarea id="fSentence">' + esc(v.sentence || '') + '</textarea></div>' +
    '<div class="field-row">' +
      '<div class="field"><label>来源</label><input id="fSource" type="text" value="' + esc(v.source || '') + '"></div>' +
      '<div class="field"><label>章节 / 备注</label><input id="fChapter" type="text" value="' + esc(v.chapter || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>网页地址</label><input id="fUrl" type="text" value="' + esc(v.url || '') + '"></div>' +
    '<div class="modal-actions"><button class="btn" id="fCancel" type="button">取消</button>' +
    '<button class="btn btn-primary" id="fSave" type="button">' + (edit ? '保存修改' : '存入词库') + '</button></div>';
  openModal(html);

  $('fCancel').onclick = closeModal;
  $('fSave').onclick = function () {
    const word = $('fWord').value.trim();
    if (!word) { toast('请填写单词'); return; }
    const payload = {
      word: word,
      lemma: ($('fLemma').value.trim() || word).toLowerCase(),
      phonetic: $('fPhonetic').value.trim(),
      pos: $('fPos').value.trim(),
      definition: $('fDef').value.trim(),
      definitionEn: $('fDefEn').value.trim(),
      sentence: $('fSentence').value.trim(),
      source: $('fSource').value.trim(),
      chapter: $('fChapter').value.trim(),
      url: $('fUrl').value.trim()
    };
    if (edit && item) {
      Object.assign(item, payload, { updatedAt: nowISO() });
      closeModal(); saveData(); toast('已保存修改'); return;
    }
    const dup = visible().find(function (x) {
      return x.kind !== 'sentence' && String(x.lemma || '').toLowerCase() === payload.lemma;
    });
    if (dup) {
      dup.seenCount = (dup.seenCount || 1) + 1;
      if (payload.sentence && payload.sentence !== dup.sentence) dup.sentence = payload.sentence;
      dup.updatedAt = nowISO();
      closeModal(); saveData(); toast('这个词已有记录，累计遇到 ' + dup.seenCount + ' 次'); return;
    }
    data.items.push(Object.assign({
      id: uid(), kind: 'word', status: 'learning', level: 0,
      nextReview: localDate(), seenCount: 1, createdAt: nowISO(),
      updatedAt: nowISO(), analysis: null
    }, payload));
    closeModal(); saveData(); toast('已存入词库');
  };

  if (!edit && !v.phonetic && !v.definitionEn) {
    lookupWord(p.word || '').then(function (res) {
      if (!res || !$('fPhonetic')) return;
      if (!$('fPhonetic').value) $('fPhonetic').value = res.phonetic || '';
      if (!$('fPos').value) $('fPos').value = res.pos || '';
      if (!$('fDefEn').value) $('fDefEn').value = res.definitionEn || '';
    });
  }
}

function openAnalysisModal(sentence, existingId) {
  lastAnalysis = null;
  const html = '<h3>长难句分析</h3>' +
    '<p class="sub">先拆主干和意群，再给一版人话改写；不是整句直译。</p>' +
    '<div class="quote-preview">' + esc(sentence) + '</div>' +
    '<div id="analysisOut"></div>' +
    '<div class="modal-actions">' +
      '<button class="btn" id="aCopy" type="button">复制分析指令</button>' +
      '<button class="btn" id="aSave" type="button" disabled>存为句析</button>' +
      '<button class="btn btn-primary" id="aRun" type="button">开始分析</button>' +
    '</div>';
  openModal(html);

  $('aCopy').onclick = function () {
    const text = ANALYSIS_PROMPT + '\n\nSentence:\n' + sentence;
    copyText(text);
  };
  $('aSave').onclick = function () {
    if (!lastAnalysis) return;
    if (existingId) {
      const it = data.items.find(function (x) { return x.id === existingId; });
      if (it) { it.analysis = lastAnalysis; it.updatedAt = nowISO(); }
    } else {
      data.items.push({
        id: uid(), kind: 'sentence', word: sentence.length > 44 ? sentence.slice(0, 44) + '…' : sentence,
        lemma: '', phonetic: '', pos: '', definition: '', definitionEn: '',
        sentence: sentence, source: '阅读台', chapter: '', url: '',
        status: 'learning', level: 0, nextReview: localDate(), seenCount: 1,
        createdAt: nowISO(), updatedAt: nowISO(), analysis: lastAnalysis
      });
    }
    closeModal(); saveData(); toast('句析已存入词库');
  };
  $('aRun').onclick = async function () {
    const btn = this;
    const out = $('analysisOut');
    if (!cfg.aiBase || !cfg.aiKey) {
      out.innerHTML = '<div class="analysis-view"><p style="margin:0 0 8px">还没配置分析接口。你可以先点「复制分析指令」，把句子贴到任意 AI 里得到同样结果；或在「设置」里填一个 OpenAI 兼容接口。</p><div class="prompt-box">' + esc(ANALYSIS_PROMPT + '\n\nSentence:\n' + sentence) + '</div></div>';
      return;
    }
    btn.disabled = true; btn.textContent = '分析中…';
    out.innerHTML = '<div class="analysis-view">正在拆解句子结构…</div>';
    try {
      const a = await analyzeSentence(sentence);
      lastAnalysis = a;
      out.innerHTML = '<div class="analysis-view">' +
        '<div class="row"><b>主干</b><span>' + esc(a.trunk) + '</span></div>' +
        '<div class="row"><b>意群</b><ol>' + (a.chunks || []).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="row"><b>修饰</b><span>' + esc(a.modifiers) + '</span></div>' +
        '<div class="row"><b>改写</b><span>' + esc(a.rewrite) + '</span></div>' +
        '<div class="row"><b>人话</b><span>' + esc(a.plain) + '</span></div>' +
        '</div>';
      $('aSave').disabled = false;
    } catch (e) {
      out.innerHTML = '<div class="analysis-view">分析失败：' + esc(e.message || e) + '。可改用「复制分析指令」。</div>';
    }
    btn.disabled = false; btn.textContent = '开始分析';
  };
}

async function analyzeSentence(sentence) {
  const base = String(cfg.aiBase || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const r = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.aiKey },
    body: JSON.stringify({
      model: cfg.aiModel || 'gpt-4o-mini',
      messages: [{ role: 'system', content: ANALYSIS_PROMPT }, { role: 'user', content: sentence }],
      temperature: 0.2
    })
  });
  if (!r.ok) throw new Error('接口返回 ' + r.status);
  const j = await r.json();
  let text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  const obj = JSON.parse(text);
  return {
    trunk: String(obj.trunk || ''),
    chunks: Array.isArray(obj.chunks) ? obj.chunks.map(String) : [],
    modifiers: String(obj.modifiers || ''),
    rewrite: String(obj.rewrite || ''),
    plain: String(obj.plain || '')
  };
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板'); }, function () { fallbackCopy(text); });
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('已复制到剪贴板'); } catch (e) { toast('复制失败，请手动选择文本'); }
  ta.remove();
}

/* ---------- 阅读台选区 ---------- */

function sentenceAround(full, sel) {
  const i = full.indexOf(sel);
  if (i < 0) return sel;
  let start = 0, end = full.length;
  for (let a = i - 1; a >= 0; a--) { if (/[.!?\n]/.test(full[a])) { start = a + 1; break; } }
  for (let b = i + sel.length; b < full.length; b++) { if (/[.!?\n]/.test(full[b])) { end = b + 1; break; } }
  return full.slice(start, end).trim().replace(/\s+/g, ' ');
}
function hideSelbar() { $('selbar').hidden = true; selInfo = null; }
function handleSelection() {
  setTimeout(function () {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text || !sel.rangeCount || !$('reader').contains(sel.anchorNode)) { hideSelbar(); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const wrap = $('reader').getBoundingClientRect();
    const bar = $('selbar');
    const top = Math.max(4, rect.top - wrap.top - 46);
    const left = Math.max(6, Math.min(rect.left - wrap.left, Math.max(6, wrap.width - 250)));
    bar.style.top = top + 'px';
    bar.style.left = left + 'px';
    bar.hidden = false;
    selInfo = { word: text, sentence: sentenceAround($('reader').innerText, text) };
  }, 10);
}

function loadSample() {
  const note = '（示例文本取自 Standard Ebooks 对 The Crowd 的书籍简介，用来体验划词与长句分析。）';
  $('reader').innerHTML = '<p>' + esc(note) + '</p><p>' + esc(SAMPLE_SENTENCE_1) + '</p><p>' + esc(SAMPLE_SENTENCE_2) + '</p>';
  toast('已载入示例段落，试着选中一个词');
}
function parsePasted(raw) {
  const t = String(raw).trim().replace(/\s+/g, ' ');
  const phonetic = (t.match(/\/[^\/]{1,40}\//) || [])[0] || '';
  const withoutPh = phonetic ? t.replace(phonetic, ' ') : t;
  const cnParts = withoutPh.match(/[\u4e00-\u9fff][\u4e00-\u9fff，、；,;·\sA-Za-z]*/g) || [];
  const definition = cnParts.length ? cnParts[cnParts.length - 1].trim() : '';
  let head = definition ? withoutPh.split(definition)[0] : withoutPh;
  head = head.replace(/[:：\-—|]/g, ' ').trim();
  const word = (head.match(/[A-Za-z][A-Za-z\s'’-]*/) || [''])[0].trim() || head.trim();
  return { word: word, phonetic: phonetic, definition: definition, sentence: '', source: '粘贴录入' };
}

/* ---------- 复习 ---------- */

function startReview() {
  reviewQueue = dueWords().slice();
  reviewIdx = 0; reviewDone = 0; flipped = false;
  renderReviewCard();
}
function renderReviewCard() {
  const area = $('reviewArea');
  if (!reviewQueue.length) {
    area.innerHTML = '<div class="review-done"><h3>今天没有到期的词</h3><p>去读一章新的，遇到生词再来。</p></div>';
    return;
  }
  if (reviewIdx >= reviewQueue.length) {
    area.innerHTML = '<div class="review-done"><h3>今天复习完了</h3><p>共 ' + reviewDone + ' 张卡片，明天的清单会按等级自动排好。</p></div>';
    return;
  }
  const it = reviewQueue[reviewIdx];
  const raw = it.sentence || '';
  const target = String(it.word || '').split(/\s+/)[0];
  let front;
  if (target) {
    const re = new RegExp(escapeRegex(target), 'i');
    const parts = raw.split(re);
    front = parts.length > 1
      ? esc(parts[0]) + '<span class="blank">' + esc(target) + '</span>' + esc(parts.slice(1).join(target))
      : esc(raw);
  } else front = esc(raw);
  if (!front) front = '<em>这条记录没有原句，请直接回想词义。</em>';

  area.innerHTML = '<div class="review-shell">' +
    '<div class="review-progress"><span>复习进度 ' + (reviewIdx + 1) + ' / ' + reviewQueue.length + '</span><span>当前等级 L' + (it.level || 0) + '</span></div>' +
    '<div class="review-card' + (flipped ? ' is-flipped' : '') + '" id="flipCard">' +
      '<div class="label">它在这一句里是什么意思？点卡片翻面</div>' +
      '<div class="front">' + front + '</div>' +
      '<div class="answer"><h4>' + esc(it.word) + '</h4>' +
        '<p>' + esc(it.definition || it.definitionEn || '（暂无释义）') + '</p>' +
        (it.phonetic ? '<p>' + esc(it.phonetic) + (it.pos ? ' · ' + esc(it.pos) : '') + '</p>' : '') +
        '<p style="color:var(--ink-3)">' + esc(it.source || '') + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="review-actions">' +
      '<button class="btn btn-bad" data-grade="bad" type="button">忘了 · 明天再来</button>' +
      '<button class="btn btn-good" data-grade="good" type="button">记得 · 拉长间隔</button>' +
    '</div></div>';

  $('flipCard').onclick = function () { flipped = !flipped; this.classList.toggle('is-flipped', flipped); };
  Array.prototype.forEach.call(area.querySelectorAll('[data-grade]'), function (b) {
    b.onclick = function () { grade(b.dataset.grade === 'good'); };
  });
}
function grade(good) {
  const it = reviewQueue[reviewIdx];
  if (!it) return;
  it.level = good ? Math.min(5, (it.level || 0) + 1) : 0;
  it.nextReview = addDays(INTERVALS[it.level]);
  it.updatedAt = nowISO();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  reviewDone++; reviewIdx++; flipped = false;
  renderCounts(); renderStats(); renderReviewCard();
  if (cfg.ghAuto && ghReady()) schedulePush();
}

/* ---------- GitHub 数据层 ---------- */

function ghReady() { return !!(cfg.ghOwner && cfg.ghRepo && cfg.ghToken); }
function ghUrl() {
  const p = (cfg.ghPath || 'data/vocabulary.json').split('/').map(encodeURIComponent).join('/');
  return 'https://api.github.com/repos/' + encodeURIComponent(cfg.ghOwner) + '/' + encodeURIComponent(cfg.ghRepo) + '/contents/' + p;
}
function ghHeaders() {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + cfg.ghToken,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}
function mergeData(a, b) {
  const map = new Map();
  (a.items || []).forEach(function (i) { if (i && i.id) map.set(i.id, i); });
  (b.items || []).forEach(function (i) {
    if (!i || !i.id) return;
    const cur = map.get(i.id);
    if (!cur || String(i.updatedAt || '') > String(cur.updatedAt || '')) map.set(i.id, i);
  });
  return { version: 1, updatedAt: nowISO(), items: Array.from(map.values()) };
}
async function ghPull(silent) {
  if (!ghReady()) { if (!silent) toast('请先填写 GitHub 设置'); return; }
  const r = await fetch(ghUrl() + '?ref=' + encodeURIComponent(cfg.ghBranch || 'main') + '&t=' + Date.now(), { headers: ghHeaders() });
  if (r.status === 404) throw new Error('仓库里还没有这个文件，先点「推送到仓库」');
  if (!r.ok) throw new Error('GitHub 返回 ' + r.status + ' ' + (await r.text()).slice(0, 120));
  const j = await r.json();
  let remote;
  try { remote = JSON.parse(b64ToUtf8(j.content)); } catch (e) { throw new Error('远端文件不是合法 JSON'); }
  if (!remote || !Array.isArray(remote.items)) throw new Error('远端文件不是词库格式');
  data = mergeData(data, remote);
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  render();
  if (!silent) { setStatus('ghStatus', '拉取成功，已按 id 合并 ' + visible().length + ' 条记录。'); toast('已从仓库拉取并合并'); }
}
async function ghPush(silent) {
  if (!ghReady()) { if (!silent) toast('请先填写 GitHub 设置'); return; }
  const content = utf8ToB64(JSON.stringify({ version: 1, updatedAt: nowISO(), items: data.items }, null, 2));
  const getR = await fetch(ghUrl() + '?ref=' + encodeURIComponent(cfg.ghBranch || 'main') + '&t=' + Date.now(), { headers: ghHeaders() });
  let sha = null;
  if (getR.ok) {
    const j = await getR.json();
    sha = j.sha;
    if (String(j.content || '').replace(/\s/g, '') === String(content).replace(/\s/g, '')) {
      if (!silent) setStatus('ghStatus', '仓库已是最新，无需重复提交。');
      return;
    }
  } else if (getR.status !== 404) {
    throw new Error('读取远端失败：' + getR.status);
  }
  const body = {
    message: 'chore(wordbook): 更新词库 ' + localDate() + ' · ' + visible().length + ' 条',
    content: content,
    branch: cfg.ghBranch || 'main'
  };
  if (sha) body.sha = sha;
  const r = await fetch(ghUrl(), {
    method: 'PUT',
    headers: Object.assign({}, ghHeaders(), { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('推送失败：' + r.status + ' ' + (await r.text()).slice(0, 160));
  if (!silent) { setStatus('ghStatus', '推送成功，已生成一次 commit。'); toast('已推送到仓库'); }
}
function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(function () {
    ghPush(true).catch(function (e) { console.warn(e); setStatus('ghStatus', '自动同步失败：' + e.message); });
  }, 2500);
}

/* ---------- 书签小工具与导入导出 ---------- */

function guessAppUrl() {
  const base = location.href.split('#')[0].split('?')[0];
  return /^https?:/.test(base) ? base : '';
}
function buildBookmarklet() {
  const url = String(cfg.appUrl || guessAppUrl()).trim().replace(/\/+$/, '');
  if (!url) return null;
  const code = BM_TEMPLATE.replace('__APP_URL__', url.replace(/"/g, '\\"'));
  return { url: url, href: 'javascript:' + encodeURIComponent(code) };
}
function showBookmarklet() {
  const bm = buildBookmarklet();
  const box = $('bmResult');
  if (!bm) {
    box.hidden = false;
    box.innerHTML = '<p>请先在上方填写应用地址（部署到 GitHub Pages 后的网址），或直接点「阅读」页的「生成书签小工具」。</p>';
    return;
  }
  box.hidden = false;
  box.innerHTML = '<p><strong>把这个按钮拖到书签栏</strong>，之后在 Standard Ebooks 网页点一下，划词即可带着原句和出处回到词本。</p>' +
    '<a class="bm-link" href="' + esc(bm.href) + '" onclick="return false">页边 · 划词收录</a>' +
    '<p>如果拖动不方便，复制下面整段代码，手动新建一个书签并把网址粘贴进去：</p>' +
    '<textarea id="bmCode" readonly>' + esc(bm.href) + '</textarea>' +
    '<p>目标地址：<code>' + esc(bm.url) + '</code>　手机上没有书签栏，用「粘贴解析」即可。</p>';
  $('bmCode').onclick = function () { this.select(); copyText(this.value); };
}
function download(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportJSON() {
  download('vocabulary.json', JSON.stringify({ version: 1, updatedAt: nowISO(), items: data.items }, null, 2), 'application/json;charset=utf-8');
  toast('已导出 vocabulary.json');
}
function csvCell(s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""').replace(/\n/g, ' ') + '"'; }
function exportAnki() {
  const rows = [['Front', 'Back', 'Source']];
  visible().filter(function (i) { return i.kind !== 'sentence'; }).forEach(function (i) {
    rows.push([i.word + (i.phonetic ? ' ' + i.phonetic : ''),
      (i.definition || i.definitionEn || '') + '\n\n' + (i.sentence || ''),
      i.source || '']);
  });
  const csv = '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  download('anki-cards.csv', csv, 'text/csv;charset=utf-8');
  toast('已导出 Anki CSV（共 ' + (rows.length - 1) + ' 张）');
}

/* ---------- 设置 ---------- */

const CFG_FIELDS = ['ghOwner', 'ghRepo', 'ghBranch', 'ghPath', 'ghToken', 'aiBase', 'aiModel', 'aiKey', 'appUrl'];
function fillSettings() {
  CFG_FIELDS.forEach(function (k) { const el = $(k); if (el) el.value = cfg[k] || ''; });
  $('ghAuto').checked = !!cfg.ghAuto;
  setStatus('ghStatus', ghReady() ? (cfg.ghAuto ? '自动同步已开启，每次改动 2.5 秒后推送。' : '手动同步模式，改动后请点「推送到仓库」。') : '尚未配置同步。');
  setStatus('aiStatus', (cfg.aiBase && cfg.aiKey) ? '已配置分析接口，可在应用内直接拆解长句。' : '未配置，使用复制指令模式。');
}
function persistSettings() {
  CFG_FIELDS.forEach(function (k) { const el = $(k); if (el) cfg[k] = el.value.trim(); });
  cfg.ghAuto = $('ghAuto').checked;
  if (!cfg.ghBranch) cfg.ghBranch = 'main';
  if (!cfg.ghPath) cfg.ghPath = 'data/vocabulary.json';
  if (!cfg.aiModel) cfg.aiModel = 'gpt-4o-mini';
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* 隐私模式下降级为仅内存保存 */ }
  renderSyncPill();
}
function readSettings() {
  persistSettings(); fillSettings();
}
function switchTab(name) {
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) { t.classList.toggle('is-active', t.dataset.tab === name); });
  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (p) { p.classList.toggle('is-active', p.id === 'panel-' + name); });
  render();
  if (name === 'review') startReview();
  if (name === 'settings') fillSettings();
}

/* ---------- 从书签小工具接收数据 ---------- */

function readHash() {
  const h = location.hash;
  const i = h.indexOf('add=');
  if (i < 0) return;
  try {
    const b64 = decodeURIComponent(h.slice(i + 4));
    const p = JSON.parse(b64ToUtf8(b64));
    try { history.replaceState(null, '', location.pathname + location.search); }
    catch (e) { location.hash = ''; }
    switchTab('read');
    openAddModal({
      word: p.word || '', sentence: p.sentence || '',
      source: p.source || '', url: p.url || ''
    });
    toast('已从网页带回选中内容');
  } catch (e) { console.warn('无法解析书签小工具数据', e); }
}

/* ---------- 事件绑定 ---------- */

function bind() {
  $('tabs').addEventListener('click', function (e) {
    const b = e.target.closest('.tab'); if (b) switchTab(b.dataset.tab);
  });
  $('btnSample').onclick = loadSample;
  $('btnClearReader').onclick = function () { $('reader').innerHTML = ''; hideSelbar(); };
  $('btnBookmarklet').onclick = function () { switchTab('settings'); showBookmarklet(); };
  $('btnPasteParse').onclick = function () {
    const raw = $('pasteInput').value.trim();
    if (!raw) { toast('先粘贴一段翻译结果'); return; }
    const p = parsePasted(raw);
    if (!p.word) { toast('没能识别出单词，请检查格式'); return; }
    openAddModal(p);
    $('pasteInput').value = '';
  };
  $('reader').addEventListener('mouseup', handleSelection);
  $('reader').addEventListener('keyup', function (e) { if (e.shiftKey) handleSelection(); });
  $('reader').addEventListener('touchend', handleSelection);
  document.addEventListener('mousedown', function (e) {
    if (!$('selbar').contains(e.target) && !$('reader').contains(e.target)) hideSelbar();
  });
  $('selbar').addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b || !selInfo) return;
    const act = b.dataset.act;
    if (act === 'add') openAddModal({ word: selInfo.word, sentence: selInfo.sentence, source: '阅读台', url: '' });
    if (act === 'analyze') openAnalysisModal(selInfo.sentence || selInfo.word);
    if (act === 'copy') copyText(selInfo.word);
    hideSelbar();
  });

  $('searchInput').addEventListener('input', function () { keyword = this.value.trim().toLowerCase(); renderWords(); });
  $('bookFilter').addEventListener('change', function () { bookSel = this.value; renderWords(); });
  $('statusChips').addEventListener('click', function (e) {
    const b = e.target.closest('.chip'); if (!b) return;
    filter = b.dataset.filter;
    Array.prototype.forEach.call(this.querySelectorAll('.chip'), function (c) { c.classList.toggle('is-active', c === b); });
    renderWords();
  });
  $('wordList').addEventListener('click', function (e) {
    const b = e.target.closest('button[data-cmd]'); if (!b) return;
    const it = data.items.find(function (x) { return x.id === b.dataset.id; });
    if (!it) return;
    const cmd = b.dataset.cmd;
    if (cmd === 'toggle') {
      it.status = it.status === 'known' ? 'learning' : 'known';
      it.updatedAt = nowISO(); saveData();
      toast(it.status === 'known' ? '已标为掌握' : '已放回学习');
    } else if (cmd === 'edit') {
      openAddModal({ editId: it.id });
    } else if (cmd === 'reanalyze') {
      openAnalysisModal(it.sentence || it.word, it.id);
    } else if (cmd === 'delete') {
      it.deleted = true; it.updatedAt = nowISO(); saveData(); toast('已删除（同步时以墓碑记录保留）');
    }
  });

  $('btnImport').onclick = function () { $('fileInput').click(); };
  $('fileInput').addEventListener('change', function () {
    const f = this.files && this.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const incoming = JSON.parse(reader.result);
        if (!incoming || !Array.isArray(incoming.items)) throw new Error('格式不对');
        data = mergeData(data, incoming);
        saveData(); toast('导入完成，已按 id 合并');
      } catch (e) { toast('导入失败：' + e.message); }
    };
    reader.readAsText(f, 'utf-8');
    this.value = '';
  });
  $('btnExport').onclick = exportJSON;
  $('btnAnki').onclick = exportAnki;
  $('btnReviewReset').onclick = startReview;

  $('btnGhSave').onclick = function () { readSettings(); toast('设置已保存（仅存本机）'); };
  $('btnAiSave').onclick = function () { readSettings(); toast('分析设置已保存'); };
  $('btnBmMake').onclick = function () { readSettings(); showBookmarklet(); };
  $('appUrl').addEventListener('change', function () { if (!cfg.appUrl && this.value) { cfg.appUrl = this.value.trim(); localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } });
  CFG_FIELDS.forEach(function (k) { const el = $(k); if (el) el.addEventListener('input', persistSettings); });
  $('ghAuto').addEventListener('change', persistSettings);
  $('btnGhTest').onclick = async function () {
    readSettings();
    if (!ghReady()) { toast('请先填好所有者、仓库名和 token'); return; }
    setStatus('ghStatus', '正在测试连接…');
    try { await ghPull(true); setStatus('ghStatus', '连接正常，仓库里的词库可以读取。'); toast('连接正常'); }
    catch (e) { setStatus('ghStatus', '连接失败：' + e.message); toast('连接失败，看下方说明'); }
  };
  $('btnGhPull').onclick = async function () {
    readSettings(); setStatus('ghStatus', '正在拉取…');
    try { await ghPull(false); } catch (e) { setStatus('ghStatus', '拉取失败：' + e.message); toast('拉取失败'); }
  };
  $('btnGhPush').onclick = async function () {
    readSettings(); setStatus('ghStatus', '正在推送…');
    try { await ghPush(false); } catch (e) { setStatus('ghStatus', '推送失败：' + e.message); toast('推送失败'); }
  };
  $('btnResetSample').onclick = function () {
    if (!window.confirm('用示例数据覆盖本机词库？')) return;
    data = clone(DEFAULT_DATA); saveData(); toast('已恢复示例数据');
  };
  $('btnWipe').onclick = function () {
    if (!window.confirm('清空本机所有词条？此操作不可撤销。')) return;
    data = { version: 1, updatedAt: nowISO(), items: [] }; saveData(); toast('本机数据已清空');
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
}

function init() {
  if (!localStorage.getItem(CFG_KEY)) localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  if (!cfg.appUrl) { const g = guessAppUrl(); if (g) cfg.appUrl = g; }
  fillSettings();
  render();
  startReview();
  bind();
  readHash();
  if (cfg.ghAuto && ghReady()) {
    setTimeout(function () {
      ghPull(true).then(function () { return ghPush(true); })
        .catch(function (e) { console.warn('启动时同步失败', e); setStatus('ghStatus', '启动时同步失败：' + e.message); });
    }, 800);
  }
}

init();
