#!/usr/bin/env python3
"""
Scan images/<slug>/ folders and write locations.json.

Add a place: create images/my-place/, drop photos in, run this script.
Optional display name: images/my-place/name.txt (one line).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / "images"
OUTPUT = ROOT / "locations.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
SKIP_FILES = {".gitkeep", ".ds_store", "name.txt", "readme.md"}
SKIP_PREFIXES = (".", "_")


def natural_sort_key(name: str) -> list:
    parts = re.split(r"(\d+)", name.lower())
    return [int(p) if p.isdigit() else p for p in parts]


def slug_to_name(slug: str) -> str:
    return slug.replace("-", " ").replace("_", " ").title()


def read_display_name(folder: Path, slug: str) -> str:
    name_file = folder / "name.txt"
    if name_file.is_file():
        text = name_file.read_text(encoding="utf-8").strip()
        if text:
            return text
    return slug_to_name(slug)


def is_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def should_skip_entry(name: str) -> bool:
    lowered = name.lower()
    if lowered in SKIP_FILES:
        return True
    return name.startswith(SKIP_PREFIXES)


def collect_locations() -> list[dict]:
    if not IMAGES_DIR.is_dir():
        return []

    locations = []

    for folder in sorted(IMAGES_DIR.iterdir(), key=lambda p: natural_sort_key(p.name)):
        if not folder.is_dir() or should_skip_entry(folder.name):
            continue

        slug = folder.name
        images = []

        for path in sorted(folder.iterdir(), key=lambda p: natural_sort_key(p.name)):
            if should_skip_entry(path.name):
                continue
            if is_image(path):
                images.append(f"images/{slug}/{path.name}".replace("\\", "/"))

        locations.append(
            {
                "name": read_display_name(folder, slug),
                "slug": slug,
                "images": images,
            }
        )

    locations.sort(key=lambda loc: natural_sort_key(loc["name"]))
    return locations


def main() -> int:
    locations = collect_locations()
    payload = {
        "generatedBy": "generate_locations.py",
        "locations": locations,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(locations)} location(s) to {OUTPUT.relative_to(ROOT)}")
    for loc in locations:
        count = len(loc["images"])
        print(f"  - {loc['name']} ({loc['slug']}): {count} image(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
