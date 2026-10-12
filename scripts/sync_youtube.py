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
from datetime import datetime

CHANNEL_ID = "UCQBPndD_Nx5noA62U4sABPg"
SHORT_MAX_SECONDS = 180  # YouTube Shorts: hasta 3 minutos
PER_SERIES = 2

SERIES = ["cocina", "creacion", "autocuidado", "hogar", "dormir", "descubre"]
BLOCK_ID = {s: f"serie-{s}" for s in SERIES}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "index.html")


def classify(title):
    t = title.lower()
    if "se disfraza" in t:
        return None  # Halloween va en el bloque especial, manual
    if "la receta de" in t:
        return "cocina"
    if "sira crea" in t:
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
    while True:
        p = {"part": "snippet", "playlistId": uploads, "maxResults": 50, "key": api_key}
        if page:
            p["pageToken"] = page
        res = api("playlistItems", p)
        items.extend(res.get("items", []))
        page = res.get("nextPageToken")
        if not page or len(items) >= 100:
            break
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
    ]


def card(v, is_short):
    vid = html.escape(v["id"], quote=True)
    title = html.escape(v["title"])
    meta = "Short" if is_short else fmt_duration(v["seconds"])
    url = f"https://www.youtube.com/shorts/{vid}" if is_short else f"https://www.youtube.com/watch?v={vid}"
    thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    return (
        f'<article><div class="thumb"><img src="{thumb}" alt="{title}" loading="lazy"></div>'
        f"<h3>{title}</h3><p>{meta}</p>"
        f'<a class="video-link" href="{url}" target="_blank" rel="noopener">Ver en YouTube ↗</a></article>'
    )


def build_block(videos):
    picked = {s: {"largo": [], "corto": []} for s in SERIES}
    for v in videos:
        serie = classify(v["title"])
        if not serie:
            continue
        fmt = "corto" if v["seconds"] <= SHORT_MAX_SECONDS else "largo"
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
            f'<p class="sub-label">VÍDEOS</p><div class="videos">\n{group(serie, "largo")}\n</div>\n'
            f'<p class="sub-label">SHORTS</p><div class="videos">\n{group(serie, "corto")}\n</div>\n'
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

    total = sum(len(picked[s][f]) for s in SERIES for f in ("largo", "corto"))
    print(f"Videoteca regenerada: {total} tarjetas.")
    for s in SERIES:
        print(f"  {s}: {len(picked[s]['largo'])} largos, {len(picked[s]['corto'])} shorts")


if __name__ == "__main__":
    main()
