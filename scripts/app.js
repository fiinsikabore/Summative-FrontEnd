import { validateField, FIELDS } from './validators.js';
import { compileRegex, highlight, escapeHTML } from './search.js';

const $ = id => document.getElementById(id);
const fmt = n => Number(n).toLocaleString('en-US');
const today = () => new Date().toLocaleDateString('en-CA');

const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch { return fallback; }
};

let books = load('vault:books', []);
let goal = load('vault:goal', 6000);
let sortKey = 'dateAdded';
let query = '';

function save() {
    localStorage.setItem('vault:books', JSON.stringify(books));
    localStorage.setItem('vault:goal', JSON.stringify(goal));
}

function show(name) {
  document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== 'view-' + name; });
  document.querySelectorAll('[data-view]').forEach(button => {
    if (button.dataset.view === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelector(`#view-${name} h1`).focus();
}
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));


function renderHome() {
    const pages = books.reduce((sum, b) => sum + Number(b.pages), 0);
    const counts = {};
    books.forEach(b => { counts[b.tag] = (counts[b.tag] || 0) + 1; });
    const left = goal -pages;

    $('stat-pages').textContent = fmt(pages);
    $('stat-books').textContent = books.length;
    $('stat-authors').textContent = new Set(books.map(b => b.author)).size;
    $('stat-tag').textContent = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '—';
  $('goal-text').innerHTML = left >= 0
    ? `<b>${fmt(left)} pages</b> left before your goal of ${fmt(goal)}`
    : `<b>${fmt(-left)} pages</b> over your goal of ${fmt(goal)}`;
  $('goal-bar').style.width = Math.min(100, (pages / goal) * 100) + '%';

  const latest = [...books].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))[0];
  $('latest').textContent = latest ? latest.title : 'Nothing yet';

  const week = [...Array(7)].map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const key = day.toLocaleDateString('en-CA');
    return books.filter(b => b.dateAdded === key).reduce((sum, b) => sum + Number(b.pages), 0);
  });
  const max = Math.max(1, ...week);
  $('week').innerHTML = week.map((p, i) =>
    `<span class="${i === 6 ? 'today' : ''}" style="height:${Math.max(6, (p / max) * 100)}%"></span>`).join('');
}

function sorter(key) {
    if (key === 'pages') return (a, b) => b.pages - a.pages;
    if (key === 'title') return (a, b) => a.title.localeCompare(b.title);
    return (a, b) => b.dateAdded.localeCompare(a.dateAdded);
}

function row(b, regex) {
    return `<tr>
        <td><b>${highlight(b.title, regex)}</b><small>${highlight(b.author, regex)}</small></td>
        <td>${b.pages}</td>
        <td class="hide-sm">${highlight(b.tag, regex)}</td>
        <td class="hide-sm">${b.dateAdded}</td>
        <td><button class="pill" data-delete="${b.id}" aria-label="Delete ${escapeHTML(b.title)}">Delete</button></td>
        </tr>`;
}

function renderLibrary() {
    const regex = compileRegex(query);
    const sorted = [...books].sort(sorter(sortKey));
    const shown = regex ? sorted.filter(b => regex.test(`${b.title} ${b.author} ${b.tag}`)) : sorted;

    $('search-status').textContent = regex === false
    ? "This pattern isn't valid yet. Keep typing."
    : `${shown.length} of ${books.length} books`;
  $('book-rows').innerHTML = shown.length
    ? shown.map(b => row(b, regex || null)).join('')
    : '<tr><td colspan="5" class="empty">No book matches.</td></tr>';
}

$('search').addEventListener('input', e => { query = e.target.value; renderLibrary(); });

document.querySelectorAll('[data-sort]').forEach(button => {
    button.addEventListener('click', () => { sortKey = button.dataset.sort; renderLibrary(); });
});

$('book-rows').addEventListener('click', e => {
    const id = e.target.dataset.delete;
    if (!id || !confirm('Delete this book?')) return;
  books = books.filter(b => b.id !== id);
  save();
  renderAll();
});


const form = $('add-form');
const field = name => form.elements[name];

function check(input) {
    const message = validateField(input.name, input.value);
    $('err-' + input.name).textContent = message;
    input.setAttribute('aria-invalid', message !== '');
  return message === ''; 
}

form.addEventListener('input', e => check(e.target));

form.addEventListener('submit', e => {
    e.preventDefault();
    const allValid = FIELDS.map(name => check(field(name))).every(Boolean);
    if (!allValid) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
    }
    books.push({
        id: 'book_' + Date.now(),
        title: field('title').value,
        author: field('author').value,
        pages: Number(field('pages').value),
        tag: field('tag').value,
        updatedAt: new Date().toISOString()
    });
    save();
    form.reset();
    field('dateAdded').value = today();
    $('form-status').textContent = 'Book added.';
    renderAll();
    show('library');
});

$('goal-form').addEventListener('submit', e => {
    e.preventDefault();
    const value = Number($('goal-input').value);
    if (!Number.isInteger(value)|| value <= 0) {
    $('goal-error').textContent = 'Enter a whole number, like 6000.';
    return;
}
goal = value;
$('goal-error').textContent = '';
save();
renderAll();
});

const valid = b => b && b.id && FIELDS.every(name => !validateField(name, String(b[name] ?? '')));

$('import').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data) || !data.every(valid)) throw new Error('bad file');
        books = data;
        save();
        renderAll();
        $('data-status').textContent = `${data.length} books imported.`;
  } catch {
    $('data-status').textContent = "This file isn't a valid backup. Nothing changed.";
  }
  e.target.value = '';
});

async function loadSample() {
  try {
    books = await (await fetch('seed.json')).json();
    save();
    renderAll();
    $('data-status').textContent = 'Sample books loaded.';
    } catch {
    $('data-status').textContent = 'Open the app with a local server to load the sample.';
    }
}

$('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json '});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `book-vault-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    $('data-status').textContent = `Exported ${books.length} books.`;
});

$('seed').addEventListener('click', loadSample);

function renderAll() {
    renderHome();
    renderLibrary();
    $('goal-input').value = goal;
}

const hour = new Date().getHours();
$('greet').textContent = hour < 12 ? 'Good morning, Fiinsi' : hour < 18 ? 'Good afternoon, Fiinsi' : 'Good evening, Fiinsi'; field('dateAdded').value = today();
renderAll();
if (books.length === 0) loadSample();