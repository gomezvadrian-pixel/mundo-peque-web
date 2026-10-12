// Personajes de Mundo Peque — fotografías originales en local (assets/).
// Si una foto no carga, aparece un aviso honesto; nunca un personaje inventado.
const personajes = [
  ['Nico', 'assets/personajes/nico.webp'],
  ['Nina', 'assets/personajes/nina.webp'],
  ['Pau', 'assets/personajes/pau.webp'],
  ['Pía', 'assets/personajes/pia.webp'],
  ['Milo', 'assets/personajes/milo.webp'],
  ['Mila', 'assets/personajes/mila.webp'],
  ['Hada', 'assets/personajes/hada.webp'],
  ['Hugo', 'assets/personajes/hugo.webp'],
  ['Rita', 'assets/personajes/rita.webp'],
  ['Roco', 'assets/personajes/roco.webp'],
  ['Berta', 'assets/personajes/berta.webp'],
  ['Berto', 'assets/personajes/berto.webp'],
  ['Bruno', 'assets/personajes/bruno.webp'],
  ['Lola', 'assets/personajes/lola.webp'],
  ['Sira', 'assets/personajes/sira.webp'],
  ['Siro', 'assets/personajes/siro.webp'],
  ['Teo', 'assets/personajes/teo.webp'],
  ['Tila', 'assets/personajes/tila.webp']
];
const ids = Object.fromEntries(personajes);
function setupImage(img, name) {
  const src = ids[name];
  if (!src) { failed(img, name); return; }
  img.src = src;
  img.loading = 'lazy';
  img.onerror = () => failed(img, name);
}
function failed(img, name) {
  const el = document.createElement('div');
  el.className = 'missing';
  el.textContent = `Foto original de ${name} pendiente de cargar`;
  img.replaceWith(el);
}
const grid = document.getElementById('characters');
let lastCard = null;
personajes.forEach(([name]) => {
  const card = document.createElement('div');
  card.className = 'person';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', 'Ver la ficha de ' + name);
  card.addEventListener('click', () => { lastCard = card; openSheet(name); });
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lastCard = card; openSheet(name); } });
  const frame = document.createElement('div');
  frame.className = 'portrait';
  const img = document.createElement('img');
  img.alt = `Fotografía original de ${name}`;
  frame.append(img);
  const label = document.createElement('strong');
  label.textContent = name;
  card.append(frame, label);
  grid.append(card);
  setupImage(img, name);
});
document.querySelectorAll('img[data-personaje]').forEach(img => setupImage(img, img.dataset.personaje));
document.getElementById('year').textContent = new Date().getFullYear();
const menu = document.querySelector('.menu');
menu.addEventListener('click', () => {
  const open = document.querySelector('nav').classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => {
  document.querySelector('nav').classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}));

// Ficha de personaje: sus vídeos + sus wallpapers.
// Wallpapers AUTOMÁTICOS: sube al repo assets/wallpapers/<personaje>-1.jpg, -2.jpg...
// (p. ej. nico-1.jpg, pia-2.jpg) y aparecen solos en la ficha, con descarga.
// WALLPAPERS es un override manual opcional: 'Nico': [{src:'assets/wallpapers/nico-1.jpg', alt:'...'}]
const WALLPAPERS = {};
const wallSeen = {};
const HALLOWEEN_VIDEOS = [
  ['Tila', 'Tila se disfraza de diablilla', 'Short de Halloween', 'https://www.youtube.com/shorts/A1_qb7mo6O4', null],
  ['Teo', 'Teo se disfraza de murciélago', 'Short de Halloween', 'https://www.youtube.com/shorts/apH_i1QW1oU', null],
  ['Roco', 'Roco y su sándwich calavera', 'Short de Halloween', 'https://www.youtube.com/shorts/24tpxbKzjM0', null],
  ['Rita', 'Rita y el huerto de calabazas', 'Short de Halloween', 'https://www.youtube.com/shorts/40dXE_StxxQ', null],
  ['Pau', 'Un paseo en Halloween', 'Especial de Halloween', 'https://www.youtube.com/watch?v=Adz9Y9ScHY4', 'assets/halloween-pau.jpg']
];
const videosPor = {};
personajes.forEach(([name]) => { videosPor[name] = []; });
document.querySelectorAll('#videos article').forEach(a => {
  const t = (a.querySelector('h3') || {}).textContent || '';
  const link = a.querySelector('a.video-link');
  const u = link ? link.href : '#';
  const im = a.querySelector('.thumb img');
  const meta = ((a.querySelector('p') || {}).textContent || '').trim();
  personajes.forEach(([name]) => {
    if (new RegExp('\\b' + name + '\\b').test(t)) videosPor[name].push({ t: t.trim(), u, img: im ? im.getAttribute('src') : null, meta });
  });
});
HALLOWEEN_VIDEOS.forEach(([name, t, meta, u, img]) => { if (videosPor[name]) videosPor[name].push({ t, u, img, meta }); });

const sheet = document.getElementById('charSheet');
const backdrop = document.getElementById('sheetBackdrop');
function openSheet(name) {
  const img = document.getElementById('sheetImg');
  img.src = ids[name] || '';
  img.alt = 'Fotografía original de ' + name;
  img.onerror = () => { img.alt = 'Foto original de ' + name + ' pendiente de cargar'; img.removeAttribute('src'); };
  document.getElementById('sheetName').textContent = name;
  document.getElementById('sheetDesc').textContent = name + ' forma parte del pequeño universo de Mundo Peque.';
  document.getElementById('sheetYt').href = 'https://www.youtube.com/@mundopequeconcalma/search?query=' + encodeURIComponent(name);
  const vv = videosPor[name] || [];
  const vbox = document.getElementById('sheetVideos');
  vbox.innerHTML = '';
  if (!vv.length) {
    vbox.innerHTML = '<div class="sheet-empty">' + name + ' aún no tiene vídeos propios.<br>Muy pronto ♡</div>';
  }
  vv.forEach(v => {
    const row = document.createElement('div');
    row.className = 'sheet-video';
    const media = v.img
      ? '<img class="sv-thumb" src="' + v.img + '" alt="" loading="lazy">'
      : '<div class="sv-play">▶</div>';
    row.innerHTML = media + '<div><strong></strong><span></span></div>';
    row.querySelector('strong').textContent = v.t;
    row.querySelector('span').textContent = v.meta;
    const a = document.createElement('a');
    a.href = v.u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Ver ↗';
    row.append(a);
    vbox.append(row);
  });
  const wbox = document.getElementById('sheetWalls');
  const wtitle = document.getElementById('sheetWallsTitle');
  wbox.innerHTML = '';
  wbox.hidden = true;
  if (wtitle) wtitle.hidden = true;
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!wallSeen[slug]) wallSeen[slug] = {};
  function addWall(src, label) {
    if (wbox.hidden) { wbox.hidden = false; if (wtitle) wtitle.hidden = false; }
    const a = document.createElement('a');
    a.href = src;
    a.download = slug + '-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
    a.className = 'sheet-video'; a.target = '_blank'; a.rel = 'noopener';
    const im = document.createElement('img');
    im.className = 'sv-thumb'; im.src = src; im.alt = ''; im.loading = 'lazy';
    const d = document.createElement('div');
    const s = document.createElement('strong'); s.textContent = label;
    d.append(s);
    const dl = document.createElement('span'); dl.textContent = 'Descargar ↓'; dl.style.fontWeight = '700';
    a.append(im, d, dl);
    wbox.append(a);
  }
  (WALLPAPERS[name] || []).forEach((w, i) => addWall(w.src, w.alt || ('Wallpaper ' + (i + 1) + ' de ' + name)));
  for (let k = 1; k <= 8; k++) {
    const src = 'assets/wallpapers/' + slug + '-' + k + '.jpg';
    if (wallSeen[slug][src]) { addWall(src, 'Wallpaper ' + k + ' de ' + name); continue; }
    const probe = new Image();
    probe.onload = () => { wallSeen[slug][src] = true; addWall(src, 'Wallpaper ' + k + ' de ' + name); };
    probe.src = src;
  }
  sheet.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sheet.classList.add('show');
    backdrop.classList.add('show');
  }));
  document.body.style.overflow = 'hidden';
  document.getElementById('sheetClose').focus();
}
function closeSheet() {
  sheet.classList.remove('show');
  backdrop.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => { sheet.hidden = true; backdrop.hidden = true; }, 320);
  if (lastCard && lastCard.focus) lastCard.focus();
}
document.getElementById('sheetClose').addEventListener('click', closeSheet);
backdrop.addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

// Buscador y filtros de la videoteca
(function(){
  const section = document.getElementById('videos');
  if(!section) return;
  const search = document.getElementById('videoSearch');
  const pillsBox = document.getElementById('videoPills');
  const count = document.getElementById('videoCount');
  if(!search || !pillsBox) return;
  const catNames = {cocina:'Cocina',creacion:'Creación',autocuidado:'Autocuidado',hogar:'Hogar cozy',dormir:'Dormir',descubre:'Descubre'};
  const filters = ['Todos','Largos','Shorts'].concat(Object.values(catNames));
  let active = 'Todos';
  const articles = Array.from(section.querySelectorAll('.series-block article'));
  articles.forEach(a => {
    const block = a.closest('.series-block');
    const id = (block && block.id || '').replace('serie-','');
    a.dataset.cat = catNames[id] || '';
    const meta = ((a.querySelector('p') || {}).textContent) || '';
    a.dataset.format = /short/i.test(meta) ? 'corto' : 'largo';
  });
  function match(a){
    const q = search.value.trim().toLowerCase();
    const t = (((a.querySelector('h3') || {}).textContent) || '').toLowerCase();
    if(q && t.indexOf(q) === -1) return false;
    if(active === 'Todos') return true;
    if(active === 'Largos') return a.dataset.format === 'largo';
    if(active === 'Shorts') return a.dataset.format === 'corto';
    return a.dataset.cat === active;
  }
  function apply(){
    let n = 0;
    articles.forEach(a => { const v = match(a); a.style.display = v ? '' : 'none'; if(v) n++; });
    section.querySelectorAll('.series-block').forEach(b => {
      const vis = Array.from(b.querySelectorAll('article')).some(a => a.style.display !== 'none');
      b.style.display = vis ? '' : 'none';
      b.querySelectorAll('.sub-label').forEach(l => {
        const div = l.nextElementSibling;
        const any = div ? Array.from(div.querySelectorAll('article')).some(a => a.style.display !== 'none') : false;
        l.style.display = any ? '' : 'none';
        if(div) div.style.display = any ? '' : 'none';
      });
    });
    count.textContent = (n === articles.length) ? '' : (n + ' de ' + articles.length + ' vídeos');
    pillsBox.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.f === active));
  }
  filters.forEach(f => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = f; b.dataset.f = f;
    b.addEventListener('click', () => { active = f; apply(); });
    pillsBox.append(b);
  });
  search.addEventListener('input', apply);
  document.querySelectorAll('.cat[data-video-category]').forEach(c => {
    c.addEventListener('click', () => { active = c.dataset.videoCategory; search.value = ''; apply(); });
  });
  apply();
})();
