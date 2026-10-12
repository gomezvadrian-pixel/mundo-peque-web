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

// Descripciones oficiales de los personajes (aprobadas 2026-10-12).
// Se muestran en la ficha individual de cada personaje.
const DESCRIPCIONES = {
'Nico': 'Nico es un pequeño conejo que nos acompaña en aventuras cotidianas llenas de ternura. Con él, hasta las cosas más sencillas pueden convertirse en una bonita historia.',
'Nina': 'Entre flores y pequeños rincones acogedores, Nina nos invita a descubrir la belleza de los detalles que a veces pasan desapercibidos.',
'Pau': 'Una tarde de lluvia, una taza de chocolate caliente y un rincón acogedor. Con Pau, los momentos más sencillos tienen algo especial.',
'Pía': 'Pía nos acompaña en pequeñas historias cotidianas, llenas de detalles para observar, descubrir y disfrutar sin prisa.',
'Milo': 'Milo nos recuerda que las pequeñas aventuras pueden encontrarse en cualquier rincón. Basta un poco de curiosidad para descubrir algo bonito.',
'Mila': 'Entre pequeñas creaciones y momentos cotidianos, Mila nos acompaña en historias donde cada detalle tiene su encanto.',
'Hada': 'Hada nos invita a disfrutar de esos pequeños momentos que dedicamos a cuidarnos, crear y hacer algo bonito para nosotros mismos.',
'Hugo': 'Con Hugo descubrimos el encanto de preparar algo con nuestras propias manos, disfrutar de las pequeñas tareas y compartir momentos acogedores.',
'Rita': 'Rita nos acompaña en pequeñas aventuras rodeadas de naturaleza, encuentros entrañables y momentos que invitan a observar con calma.',
'Roco': 'Con Roco, una actividad sencilla puede convertirse en una historia llena de pequeños descubrimientos y momentos para disfrutar.',
'Berta': 'Berta nos acompaña en paseos, pequeños descubrimientos y escenas acogedoras donde la naturaleza y las cosas sencillas cobran protagonismo.',
'Berto': 'Un buen libro, el sonido de la lluvia y un rincón calentito. Berto nos acompaña en esos momentos tranquilos que hacen que una casa se sienta como un hogar.',
'Bruno': 'Bruno forma parte de las pequeñas historias de Mundo Peque, donde siempre hay espacio para descubrir algo nuevo y disfrutar de los momentos cotidianos.',
'Lola': 'Entre dibujos, colores y pequeñas creaciones, Lola nos invita a disfrutar del proceso de hacer algo bonito con nuestras propias manos.',
'Sira': 'Sira nos acompaña en historias llenas de pequeños detalles, donde cada estación y cada rincón pueden esconder algo especial.',
'Siro': 'Con pinceles, colores y pequeñas ideas, Siro nos invita a descubrir el placer de crear sin prisas y disfrutar de cada paso.',
'Teo': 'Cuando llega la hora de descansar, Teo nos acompaña en historias suaves, noches acogedoras y pequeños momentos antes de dormir.',
'Tila': 'Tila nos recuerda lo especiales que pueden ser los pequeños rituales cotidianos: una bebida calentita, un rincón tranquilo y un momento para disfrutar.'
};
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

// Mapa personaje -> vídeos, generado por scripts/sync_youtube.py (character-videos.json).
// Si no existe o falla la carga, se usa la asociación por DOM como antes.
let cmapPromise = null;
function loadCharacterMap() {
  if (!cmapPromise) {
    cmapPromise = fetch('assets/character-videos.json')
      .then(r => { if (!r.ok) throw new Error('sin JSON'); return r.json(); })
      .catch(() => null);
  }
  return cmapPromise;
}
function sheetVideoRow(v) {
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
  return row;
}
function renderSheetVideos(name, vv) {
  const vbox = document.getElementById('sheetVideos');
  vbox.innerHTML = '';
  if (!vv.length) {
    vbox.innerHTML = '<div class="sheet-empty">' + name + ' aún no tiene vídeos propios.<br>Muy pronto ♡</div>';
    return;
  }
  vv.forEach(v => vbox.append(sheetVideoRow(v)));
}
const sheet = document.getElementById('charSheet');
const backdrop = document.getElementById('sheetBackdrop');
function openSheet(name) {
  const img = document.getElementById('sheetImg');
  img.src = ids[name] || '';
  img.alt = 'Fotografía original de ' + name;
  img.onerror = () => { img.alt = 'Foto original de ' + name + ' pendiente de cargar'; img.removeAttribute('src'); };
  document.getElementById('sheetName').textContent = name;
  document.getElementById('sheetDesc').textContent = DESCRIPCIONES[name] || (name + ' forma parte del pequeño universo de Mundo Peque.');
  document.getElementById('sheetYt').href = 'https://www.youtube.com/@mundopequeconcalma/search?query=' + encodeURIComponent(name);
  renderSheetVideos(name, videosPor[name] || []);
  loadCharacterMap().then(cmap => {
    if (!cmap || !cmap.characters) return;
    if (sheet.hidden) return;
    if (document.getElementById('sheetName').textContent !== name) return;
    const list = cmap.characters[name] || [];
    if (list.length) {
      renderSheetVideos(name, list.map(e => ({t: e.title, u: e.url, img: e.thumb, meta: e.label})));
    }
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
  const fmtSet = ['Todos', 'Largos', 'Shorts'];
  filters.forEach((f, i) => {
    if (i === fmtSet.length) {
      const sep = document.createElement('span');
      sep.className = 'pills-sep'; sep.setAttribute('aria-hidden', 'true');
      pillsBox.append(sep);
    }
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = f; b.dataset.f = f;
    b.classList.add(fmtSet.includes(f) ? 'pill-fmt' : 'pill-ser');
    b.addEventListener('click', () => { active = f; apply(); });
    pillsBox.append(b);
  });
  search.addEventListener('input', apply);
  document.querySelectorAll('.cat[data-video-category]').forEach(c => {
    c.addEventListener('click', () => { active = c.dataset.videoCategory; search.value = ''; apply(); });
  });
  apply();
})();

/* Bloque 5: temporadas */
(function () {
  const grid = document.getElementById('season-grid');
  if (!grid) return;
  const SHOW = 8;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function card(v) {
    const isShort = v.label === 'Short';
    const kind = isShort ? 'short' : 'long';
    return '<article class="vcard vcard-' + kind + '"><a class="video-link" href="' + v.url + '" target="_blank" rel="noopener">'
      + '<span class="thumb thumb-' + kind + '"><img src="' + v.thumb + '" alt="' + esc(v.title) + '" loading="lazy"></span>'
      + '<span class="vbody"><h3>' + esc(v.title) + '</h3><p>' + esc(v.label) + '</p></span></a></article>';
  }
  function paint(key, seasons) {
    const s = seasons[key];
    if (!s) return;
    document.getElementById('season').dataset.season = key;
    const img = document.getElementById('season-img');
    img.src = s.image; img.alt = s.title;
    document.getElementById('season-title').textContent = s.title;
    document.getElementById('season-text').textContent = s.intro;
    document.getElementById('season-yt').href = 'https://www.youtube.com/@mundopequeconcalma/search?query=' + encodeURIComponent(s.search || key);
    const vids = s.videos || [];
    grid.classList.remove('season-open');
    grid.innerHTML = vids.map((v, i) => {
      const wide = v.label === 'Short' ? '' : ' season-cell-wide';
      const extra = i >= SHOW ? ' season-extra' : '';
      return '<div class="season-cell' + wide + extra + '">' + card(v) + '</div>';
    }).join('');
    const toggle = document.getElementById('season-toggle');
    toggle.hidden = vids.length <= SHOW;
    toggle.textContent = 'Ver todos';
    toggle.onclick = () => {
      const open = grid.classList.toggle('season-open');
      toggle.textContent = open ? 'Ver menos' : 'Ver todos';
      centerLone();
    };
    const arch = document.getElementById('season-archive');
    const others = Object.keys(seasons).filter(k => k !== key);
    arch.hidden = others.length === 0;
    arch.innerHTML = others.length
      ? '<span>Temporadas anteriores:</span> ' + others.map(k =>
        '<button type="button" data-season="' + k + '">' + esc(seasons[k].title) + '</button>').join('')
      : '';
    arch.querySelectorAll('button').forEach(b => b.addEventListener('click', () => paint(b.dataset.season, seasons)));
    centerLone();
  }
  function centerLone() {
    grid.querySelectorAll('.season-center').forEach(c => c.classList.remove('season-center'));
    const cols = window.matchMedia('(max-width:700px)').matches ? 2 : 4;
    const visible = Array.from(grid.children).filter(c =>
      !c.classList.contains('season-extra') || grid.classList.contains('season-open'));
    let group = [];
    const flush = () => {
      if (group.length % cols === 1) group[group.length - 1].classList.add('season-center');
      group = [];
    };
    visible.forEach(c => {
      if (c.classList.contains('season-cell-wide')) flush();
      else group.push(c);
    });
    flush();
  }
  let rsz;
  window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(centerLone, 200); });
  fetch('assets/seasons.json')
    .then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(d => {
      const seasons = d.seasons || {};
      const feat = seasons[d.featured] ? d.featured : Object.keys(seasons)[0];
      if (feat) paint(feat, seasons);
    })
    .catch(() => { /* sin JSON se mantiene el contenido estático */ });
})();

/* Bloque 7: actividades. Para añadir una actividad estacional en el futuro,
   añade un objeto al array ACTIVITIES (emoji, title, who, img, text, link?). */
const ACTIVITIES = [
{emoji:'\uD83C\uDF42',title:'Recoger hojas',who:'Hugo',pdf:'assets/actividades/actividad-recoger-hojas-hugo.pdf',img:'assets/personajes/hugo.webp',
text:'A Hugo le encantan las peque\u00f1as tareas hechas con calma. Sal a pasear sin prisa y recoge las hojas m\u00e1s bonitas del camino. Obs\u00e9rvalas con calma: sus colores, sus formas y el crujido al pisarlas.'},
{emoji:'\uD83C\uDFA8',title:'Dibujar lo que ves',who:'Lola',pdf:'assets/actividades/actividad-dibujar-lo-que-ves-lola.pdf',img:'assets/personajes/lola.webp',
text:'Como Lola entre sus dibujos y colores: si\u00e9ntate junto a la ventana y dibuja lo que veas \u2014un \u00e1rbol, una nube, tu taza\u2014. Sin prisa y sin borrar; lo bonito est\u00e1 en el proceso.'},
{emoji:'\uD83C\uDF27\uFE0F',title:'Escuchar la lluvia',who:'Berto',pdf:'assets/actividades/actividad-escuchar-la-lluvia-berto.pdf',img:'assets/personajes/berto.webp',
text:'Berto adora el sonido de la lluvia en su rinc\u00f3n calentito. Cuando llueva, ac\u00e9rcate a la ventana, cierra los ojos un momento y escucha. \u00bfQu\u00e9 sonidos descubres? \u00bfLa lluvia suena igual en el cristal que en el tejado?',
link:{label:'Ver un momento con Berto',url:'https://www.youtube.com/shorts/5cRHngcWIt8'}},
{emoji:'\uD83C\uDF31',title:'Cuidar una planta',who:'Rita',pdf:'assets/actividades/actividad-cuidar-una-planta-rita.pdf',img:'assets/personajes/rita.webp',
text:'Rita nos ense\u00f1a a observar la naturaleza con calma. Elige una planta de casa y enc\u00e1rgate de ella: ri\u00e9gala con ayuda de un adulto, qu\u00edtale las hojas secas y observa c\u00f3mo crece d\u00eda a d\u00eda.',
link:{label:'Ver un momento con Rita',url:'https://www.youtube.com/shorts/Z2zMTTmaZiY'}},
{emoji:'\uD83C\uDF75',title:'La hora de la merienda',who:'Berta',pdf:'assets/actividades/actividad-hora-de-la-merienda-berta.pdf',img:'assets/personajes/berta.webp',
text:'Berta sabe que las cosas sencillas se disfrutan sin prisa. Prepara una merienda que te guste, busca un rinc\u00f3n acogedor y comp\u00e1rtela con alguien especial. Sin pantallas, solo ese peque\u00f1o momento juntos.'},
{emoji:'\uD83D\uDD6F\uFE0F',title:'El ritual de la calma',who:'Hada',pdf:'assets/actividades/actividad-ritual-de-la-calma-hada.pdf',img:'assets/personajes/hada.webp',
text:'Hada dedica cada d\u00eda un peque\u00f1o momento para cuidarse. Por la noche, baja la luz, respira despacio tres veces y piensa en algo bonito del d\u00eda. Un ritual para terminar con calma.',
link:{label:'Ver un momento con Hada',url:'https://www.youtube.com/shorts/1BmgcWZJ7Ns'}}
];
(function renderActivities(){
const wrap = document.getElementById('activities');
if(!wrap) return;
wrap.innerHTML = ACTIVITIES.map(a => {
const link = a.link ? `<a class="activity-link" href="${a.link.url}" target="_blank" rel="noopener">${a.link.label} \u2197</a>` : '';
const dl = `<a class="activity-dl" href="${a.pdf}" download>Descargar actividad \u2193</a>`;
return `<article class="activity"><img class="activity-photo" src="${a.img}" alt="${a.who}" loading="lazy"><div class="activity-body"><div class="activity-titles"><h3>${a.emoji} ${a.title}</h3><p class="with">con ${a.who}</p></div><p class="activity-text">${a.text}</p><div class="activity-actions">${link}${dl}</div></div></article>`;
}).join('');
})();
