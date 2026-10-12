#!/usr/bin/env python3
"""Sincroniza la videoteca de la web con los últimos vídeos del canal de YouTube.

Lee la playlist de subidas del canal, clasifica cada vídeo por serie según el
título (las plantillas fijas de Mundo Peque) y por formato según la duración,
elige los 2 más recientes de cada serie y formato, y regenera las tarjetas
dentro de index.html (solo entre las marcas VIDEOTECA-AUTO).

Uso:
    YOUTUBE_API_KEY=... python scripts/sync_youtube.py [--test]

Sin clave API (o con --test) usa datos de ejemplo para validar la generación.
"""
import html
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

CHANNEL_ID = "UCQBPndD_Nx5noA62U4sABPg"
SHORT_MAX_SECONDS = 110  # Short: menos de 1 min 50 s; el resto, largos

# Temporadas (Bloque 5). La destacada se configura expresamente en
# SEASON_FEATURED: nunca cambia sola por fecha. "patterns" recoge
# automáticamente; "include"/"exclude" resuelven casos ambiguos por id.
SEASONS = {
    "halloween": {
        "title": "Un Halloween muy Peque \U0001F383",
        "image": "assets/halloween-pau.jpg",
        "intro": "Disfraces, calabazas y pequeños paseos por el pueblo. Un Halloween lleno de ternura para disfrutar sin prisa. 🎃",
        "search": "halloween",
        "patterns": ["se disfraza", "halloween"],
        "include": ["24tpxbKzjM0", "40dXE_StxxQ"],  # Roco sándwich calavera, Rita huerto de calabazas
        "exclude": [],
    },
}
SEASON_FEATURED = "halloween"
SEASON_MAX_STORE = 30  # se guardan más de los que se muestran (la web enseña 8 + "Ver todos")
PER_SERIES = 2

SERIES = ["cocina", "creacion", "autocuidado", "hogar", "dormir", "descubre"]
BLOCK_ID = {s: f"serie-{s}" for s in SERIES}

# Personajes oficiales (mismo orden que la galería de la web)
PERSONAJES = ["Nico", "Nina", "Pau", "Pía", "Milo", "Mila", "Hada", "Hugo",
              "Rita", "Roco", "Berta", "Berto", "Bruno", "Lola", "Sira",
              "Siro", "Teo", "Tila"]
PER_CHARACTER = 6       # vídeos recientes por personaje en su ficha
MIN_ITEMS = 100         # la videoteca siempre ve al menos estos (comportamiento actual)
MAX_ITEMS = 500         # tope de paginación para cubrir personajes poco frecuentes

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")
CHAR_JSON = os.path.join(ROOT, "assets", "character-videos.json")
SEASON_JSON = os.path.join(ROOT, "assets", "seasons.json")


def classify(title):
    t = title.lower()
    if "se disfraza" in t:
        return None  # Halloween va en el bloque especial, manual
    if "la receta de" in t:
        return "cocina"
    if "crea:" in t:
        return "creacion"
    if "el momento de" in t:
        return "autocuidado"
    if "en casa:" in t:
        return "hogar"
    if "se duerme" in t:
        return "dormir"
    if "descubre:" in t:
        return "descubre"
    return None


def name_in_title(name, title):
    """True si el nombre del personaje aparece como palabra completa (insensible a mayúsculas)."""
    return re.search(r"\b" + re.escape(name) + r"\b", title, re.IGNORECASE) is not None


def parse_duration(iso):
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


def fmt_duration(total):
    m, s = divmod(total, 60)
    h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def api(endpoint, params):
    qs = urllib.parse.urlencode(params)
    with urllib.request.urlopen(
        f"https://www.googleapis.com/youtube/v3/{endpoint}?{qs}", timeout=30
    ) as r:
        return json.load(r)


def fetch_videos(api_key):
    ch = api("channels", {"part": "contentDetails", "id": CHANNEL_ID, "key": api_key})
    uploads = ch["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    items, page = [], None
    counts = {n: 0 for n in PERSONAJES}
    while True:
        p = {"part": "snippet", "playlistId": uploads, "maxResults": 50, "key": api_key}
        if page:
            p["pageToken"] = page
        res = api("playlistItems", p)
        batch = res.get("items", [])
        items.extend(batch)
        for it in batch:
            t = it["snippet"]["title"]
            for n in PERSONAJES:
                if counts[n] < PER_CHARACTER and name_in_title(n, t):
                    counts[n] += 1
        page = res.get("nextPageToken")
        if not page:
            break
        if len(items) >= MAX_ITEMS:
            break
        if len(items) >= MIN_ITEMS and all(c >= PER_CHARACTER for c in counts.values()):
            break  # todos los personajes tienen 6: no pedir más páginas
    ids = [it["snippet"]["resourceId"]["videoId"] for it in items]
    durations = {}
    for i in range(0, len(ids), 50):
        det = api(
            "videos",
            {"part": "contentDetails", "id": ",".join(ids[i : i + 50]), "key": api_key},
        )
        for v in det.get("items", []):
            durations[v["id"]] = parse_duration(v["contentDetails"]["duration"])
    videos = []
    for it in items:
        sn = it["snippet"]
        vid = sn["resourceId"]["videoId"]
        if vid not in durations:
            continue  # privado o eliminado
        videos.append(
            {
                "id": vid,
                "title": sn["title"],
                "published": sn["publishedAt"],
                "seconds": durations[vid],
            }
        )
    videos.sort(key=lambda v: v["published"], reverse=True)
    return videos


def fixture():
    return [
        {"id": "abc123XYZ_-", "title": "La receta de Roco: torrijas 🍞✨ | Mundo Peque", "published": "2026-10-12T10:00:00Z", "seconds": 216},
        {"id": "def456UVW_-", "title": "La receta de Lola: flan de coco 🥥✨ | Mundo Peque", "published": "2026-10-11T10:00:00Z", "seconds": 45},
        {"id": "ghi789RST_-", "title": "Sira crea: pinta calabazas 🎨✨ | Mundo Peque", "published": "2026-10-10T10:00:00Z", "seconds": 300},
        {"id": "jkl012MNO_-", "title": "El momento de Hada: baño de burbujas 🛁✨ | Mundo Peque", "published": "2026-10-09T10:00:00Z", "seconds": 52},
        {"id": "mno345PQR_-", "title": "Pau en casa: tarde de lectura 🏠✨ | Mundo Peque", "published": "2026-10-08T10:00:00Z", "seconds": 180},
        {"id": "pqr678STU_-", "title": "Berto se duerme: lluvia suave 🌙✨ | Mundo Peque", "published": "2026-10-07T10:00:00Z", "seconds": 3600},
        {"id": "stu901VWX_-", "title": "Berta descubre: setas de otoño 🌲✨ | Mundo Peque", "published": "2026-10-06T10:00:00Z", "seconds": 240},
        {"id": "vwx234YZA_-", "title": "Tila se disfraza: brujita 🎃✨ | Mundo Peque", "published": "2026-10-05T10:00:00Z", "seconds": 40},
        {"id": "nico01AAA_-", "title": "La receta de Nico: galletas de avena 🍪✨ | Mundo Peque", "published": "2026-10-04T10:00:00Z", "seconds": 45},
        {"id": "nico02BBB_-", "title": "Nico y Rita: tostadas con forma 🍞✨ | Mundo Peque", "published": "2026-10-03T10:00:00Z", "seconds": 52},
        {"id": "nico03CCC_-", "title": "un paseo con nico en minúsculas 🍂 | Mundo Peque", "published": "2026-10-02T10:00:00Z", "seconds": 40},
        {"id": "pia01DDD__-", "title": "Pía descubre: hojas de otoño 🍂✨ | Mundo Peque", "published": "2026-10-01T10:00:00Z", "seconds": 48},
        {"id": "hugo01EEE_-", "title": "Hugo en casa: prepara pan casero 🏠✨ | Mundo Peque", "published": "2026-09-30T10:00:00Z", "seconds": 300},
        {"id": "teo01FFF__-", "title": "Teo se duerme: arrullo suave 🌙✨ | Mundo Peque", "published": "2026-09-29T10:00:00Z", "seconds": 3600},
        {"id": "nina01GGG_-", "title": "Nina crea: flores de papel 🌸✨ | Mundo Peque", "published": "2026-09-28T10:00:00Z", "seconds": 200},
        {"id": "trampa01H_-", "title": "Verónica y la nicotina: charla seria 🎙️ | Mundo Peque", "published": "2026-09-27T10:00:00Z", "seconds": 600},
    ]


def video_url(vid, is_short):
    return (f"https://www.youtube.com/shorts/{vid}" if is_short
            else f"https://www.youtube.com/watch?v={vid}")


def video_entry(v):
    is_short = v["seconds"] < SHORT_MAX_SECONDS
    return {
        "id": v["id"],
        "title": v["title"],
        "url": video_url(v["id"], is_short),
        "thumb": f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg",
        "label": "Short" if is_short else fmt_duration(v["seconds"]),
        "published": v["published"],
    }


def build_seasons(videos, api_key=None):
    """Vídeos por temporada, del más reciente al más antiguo.
    No se limita a los mostrados: la web decide cuántos enseña."""
    seasons = {}
    by_id = {v["id"]: v for v in videos}
    for key, cfg in SEASONS.items():
        pats = [p.lower() for p in cfg.get("patterns", [])]
        matched = []
        for v in videos:  # ordenados de más a menos reciente
            if v["id"] in cfg.get("exclude", []):
                continue
            t = v["title"].lower()
            if v["id"] in cfg.get("include", []) or any(p in t for p in pats):
                matched.append(video_entry(v))
        # inclusiones manuales ausentes del escaneo (vídeos antiguos): pedir metadatos
        missing = [i for i in cfg.get("include", []) if i not in by_id]
        if missing and api_key:
            det = api("videos", {"part": "snippet,contentDetails",
                                 "id": ",".join(missing[:50]), "key": api_key})
            for it in det.get("items", []):
                sn = it["snippet"]
                v = {"id": it["id"], "title": sn["title"],
                     "published": sn["publishedAt"],
                     "seconds": parse_duration(it["contentDetails"]["duration"])}
                if v["id"] not in cfg.get("exclude", []):
                    matched.append(video_entry(v))
        seen, uniq = set(), []
        for e in matched:
            if e["id"] not in seen:
                seen.add(e["id"])
                uniq.append(e)
        uniq.sort(key=lambda e: e["published"], reverse=True)
        if not uniq:
            continue  # no mostrar temporadas vacías
        seasons[key] = {
            "title": cfg["title"],
            "image": cfg["image"],
            "intro": cfg["intro"],
            "search": cfg.get("search", ""),
            "videos": uniq[:SEASON_MAX_STORE],
        }
    return {"featured": SEASON_FEATURED, "seasons": seasons}


def build_character_map(videos):
    """Hasta PER_CHARACTER vídeos recientes por personaje (los más recientes primero)."""
    cmap = {n: [] for n in PERSONAJES}
    for v in videos:  # ya ordenados de más a menos reciente
        for n in PERSONAJES:
            if len(cmap[n]) < PER_CHARACTER and name_in_title(n, v["title"]):
                is_short = v["seconds"] < SHORT_MAX_SECONDS
                cmap[n].append({
                    "id": v["id"],
                    "title": v["title"],
                    "url": video_url(v["id"], is_short),
                    "thumb": f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg",
                    "label": "Short" if is_short else fmt_duration(v["seconds"]),
                    "published": v["published"],
                })
    return cmap


def card(v, is_short):
    """Tarjeta compacta (Bloque 4): toda la tarjeta es el enlace.
    Largos: horizontal con miniatura 16:9. Shorts: vertical con miniatura 4:3
    (las miniaturas de YT son 4:3 nativas: asi no se recorta ni se deforma nada)."""
    vid = html.escape(v["id"], quote=True)
    title = html.escape(v["title"])
    meta = "Short" if is_short else fmt_duration(v["seconds"])
    url = video_url(vid, is_short)
    thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    kind = "short" if is_short else "long"
    return (
        f'<article class="vcard vcard-{kind}"><a class="video-link" href="{url}" target="_blank" rel="noopener">'
        f'<span class="thumb thumb-{kind}"><img src="{thumb}" alt="{title}" loading="lazy"></span>'
        f'<span class="vbody"><h3>{title}</h3><p>{meta}</p></span>'
        f"</a></article>"
    )


def build_block(videos):
    picked = {s: {"largo": [], "corto": []} for s in SERIES}
    for v in videos:
        serie = classify(v["title"])
        if not serie:
            continue
        fmt = "corto" if v["seconds"] < SHORT_MAX_SECONDS else "largo"
        if len(picked[serie][fmt]) < PER_SERIES:
            picked[serie][fmt].append(v)

    def group(serie, fmt):
        items = picked[serie][fmt]
        if not items:
            return '<p class="missing">Muy pronto</p>'
        return "".join(card(v, fmt == "corto") for v in items)

    parts = []
    for serie in SERIES:
        parts.append(
            f'<div class="series-block" id="{BLOCK_ID[serie]}">\n'
            f"@@HEAD-{serie}@@\n"
            f'<p class="sub-label">VÍDEOS</p><div class="videos videos-longs">\n{group(serie, "largo")}\n</div>\n'
            f'<p class="sub-label">SHORTS</p><div class="videos videos-shorts">\n{group(serie, "corto")}\n</div>\n'
            "</div>"
        )
    return "\n".join(parts), picked


def main():
    test = "--test" in sys.argv
    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    if test or not api_key:
        print("Modo prueba: usando datos de ejemplo." if test else "Sin YOUTUBE_API_KEY: modo prueba.")
        videos = fixture()
    else:
        videos = fetch_videos(api_key)
        print(f"{len(videos)} vídeos leídos del canal.")

    with open(INDEX, encoding="utf-8") as f:
        doc = f.read()
    start_m, end_m = "<!-- VIDEOTECA-AUTO:INICIO -->", "<!-- VIDEOTECA-AUTO:FIN -->"
    si, ei = doc.index(start_m), doc.index(end_m)
    region = doc[si:ei]

    # Conserva la cabecera de cada serie (título + "Ver más ↗") tal cual está
    heads = {}
    for serie in SERIES:
        m = re.search(
            rf'<div class="series-block" id="{BLOCK_ID[serie]}">\n(.*?)<p class="sub-label">',
            region,
            re.S,
        )
        if not m:
            sys.exit(f"No se encontró el bloque {serie} en index.html")
        heads[serie] = m.group(1).rstrip("\n")

    new_region, picked = build_block(videos)
    for serie in SERIES:
        new_region = new_region.replace(f"@@HEAD-{serie}@@", heads[serie])

    doc = doc[: si + len(start_m)] + "\n" + new_region + "\n" + doc[ei:]
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(doc)

    cmap = build_character_map(videos)
    payload = {"generated": datetime.now(timezone.utc).isoformat(),
               "characters": cmap}
    os.makedirs(os.path.dirname(CHAR_JSON), exist_ok=True)
    tmp = CHAR_JSON + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, CHAR_JSON)  # atómico: nunca deja un JSON a medias
    con_videos = sum(1 for n in PERSONAJES if cmap[n])
    print(f"character-videos.json: {con_videos}/18 personajes con vídeos.")

    seasons = build_seasons(videos, api_key or None)
    tmp = SEASON_JSON + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(seasons, f, ensure_ascii=False)
    os.replace(tmp, SEASON_JSON)  # atómico
    for k, s in seasons["seasons"].items():
        print(f"seasons.json: {k}: {len(s['videos'])} vídeos.")

    total = sum(len(picked[s][f]) for s in SERIES for f in ("largo", "corto"))
    print(f"Videoteca regenerada: {total} tarjetas.")
    for s in SERIES:
        print(f"  {s}: {len(picked[s]['largo'])} largos, {len(picked[s]['corto'])} shorts")


if __name__ == "__main__":
    main()
