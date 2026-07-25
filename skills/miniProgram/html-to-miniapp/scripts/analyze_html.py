#!/usr/bin/env python3
"""Inventory HTML prototype files for miniapp conversion planning."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ASSET_ATTRS = {"src", "href", "poster", "data-src", "srcset"}
CSS_SUFFIXES = {".css", ".wxss", ".scss", ".less"}
COLOR_RE = re.compile(
    r"#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|\btransparent\b|\bcurrentColor\b"
)
FONT_SIZE_RE = re.compile(r"font-size\s*:\s*([^;{}]+)", re.IGNORECASE)
FONT_FAMILY_RE = re.compile(r"font-family\s*:\s*([^;{}]+)", re.IGNORECASE)
UNIT_RE = re.compile(r"[-+]?(?:\d*\.)?\d+(rpx|px|rem|em|vh|vw|%)\b", re.IGNORECASE)
DECL_RE = re.compile(r"([-\w]+)\s*:\s*([^;{}]+)", re.IGNORECASE)
CSS_RISK_PATTERNS = {
    "pseudo_element": re.compile(r"::?(before|after)\b", re.IGNORECASE),
    "position_sticky": re.compile(r"position\s*:\s*sticky\b", re.IGNORECASE),
    "fixed_position": re.compile(r"position\s*:\s*fixed\b", re.IGNORECASE),
    "css_variable": re.compile(r"var\(|--[-\w]+\s*:", re.IGNORECASE),
    "filter": re.compile(r"(?<!backdrop-)filter\s*:", re.IGNORECASE),
    "backdrop_filter": re.compile(r"backdrop-filter\s*:", re.IGNORECASE),
    "viewport_unit": re.compile(r"[-+]?(?:\d*\.)?\d+(vh|vw|vmin|vmax)\b", re.IGNORECASE),
    "font_face": re.compile(r"@font-face\b", re.IGNORECASE),
    "keyframes": re.compile(r"@keyframes\b", re.IGNORECASE),
    "transition": re.compile(r"\btransition(?:-[\w-]+)?\s*:", re.IGNORECASE),
    "grid": re.compile(r"display\s*:\s*(?:inline-)?grid\b|\bgrid[-\w]*\s*:", re.IGNORECASE),
}
LAYOUT_PROPS = {
    "display",
    "position",
    "float",
    "clear",
    "overflow",
    "overflow-x",
    "overflow-y",
    "white-space",
    "text-overflow",
    "object-fit",
    "background-size",
    "background-position",
    "flex",
    "flex-direction",
    "flex-wrap",
    "align-items",
    "justify-content",
    "gap",
    "grid",
    "grid-template-columns",
    "grid-template-rows",
}


class PrototypeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: Counter[str] = Counter()
        self.classes: Counter[str] = Counter()
        self.ids: list[str] = []
        self.assets: list[str] = []
        self.links: list[str] = []
        self.scripts: list[str] = []
        self.forms: Counter[str] = Counter()
        self.inline_style_count = 0
        self.inline_styles: list[str] = []
        self.style_blocks: list[str] = []
        self._in_style = False
        self.event_attrs: Counter[str] = Counter()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {name.lower(): value or "" for name, value in attrs}
        tag = tag.lower()
        self.tags[tag] += 1

        for class_name in attr_map.get("class", "").split():
            self.classes[class_name] += 1

        if "id" in attr_map:
            self.ids.append(attr_map["id"])

        if "style" in attr_map:
            self.inline_style_count += 1
            self.inline_styles.append(attr_map["style"])

        for name in attr_map:
            if name.startswith("on"):
                self.event_attrs[name] += 1

        for attr in ASSET_ATTRS:
            value = attr_map.get(attr)
            if value:
                self.assets.append(value)

        if tag == "a" and attr_map.get("href"):
            self.links.append(attr_map["href"])

        if tag == "script" and attr_map.get("src"):
            self.scripts.append(attr_map["src"])

        if tag in {"form", "input", "textarea", "select", "button", "label"}:
            self.forms[tag] += 1

        if tag == "style":
            self._in_style = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "style":
            self._in_style = False

    def handle_data(self, data: str) -> None:
        if self._in_style and data.strip():
            self.style_blocks.append(data)


def analyze_css_text(css_text: str) -> dict[str, Any]:
    colors: Counter[str] = Counter(match.group(0) for match in COLOR_RE.finditer(css_text))
    font_sizes: Counter[str] = Counter(
        match.group(1).strip() for match in FONT_SIZE_RE.finditer(css_text)
    )
    font_families: Counter[str] = Counter(
        match.group(1).strip() for match in FONT_FAMILY_RE.finditer(css_text)
    )
    units: Counter[str] = Counter(match.group(1).lower() for match in UNIT_RE.finditer(css_text))
    layout_values: dict[str, Counter[str]] = defaultdict(Counter)

    for prop, value in DECL_RE.findall(css_text):
        prop = prop.lower()
        if prop in LAYOUT_PROPS:
            layout_values[prop][value.strip()] += 1

    risks = Counter(
        name for name, pattern in CSS_RISK_PATTERNS.items() for _ in pattern.finditer(css_text)
    )

    return {
        "colors": colors.most_common(60),
        "font_sizes": font_sizes.most_common(40),
        "font_families": font_families.most_common(30),
        "units": units.most_common(),
        "layout_values": {
            prop: values.most_common(30) for prop, values in sorted(layout_values.items())
        },
        "risk_flags": risks.most_common(),
    }


def find_html_files(path: Path) -> list[Path]:
    if path.is_file():
        return [path] if path.suffix.lower() in {".html", ".htm"} else []
    return sorted(
        file for file in path.rglob("*") if file.suffix.lower() in {".html", ".htm"}
    )


def analyze_file(path: Path) -> dict[str, Any]:
    parser = PrototypeParser()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    return {
        "file": str(path),
        "tags": parser.tags.most_common(),
        "top_classes": parser.classes.most_common(40),
        "ids": parser.ids,
        "assets": sorted(set(parser.assets)),
        "links": sorted(set(parser.links)),
        "scripts": sorted(set(parser.scripts)),
        "forms": parser.forms.most_common(),
        "inline_style_count": parser.inline_style_count,
        "event_attrs": parser.event_attrs.most_common(),
        "inline_style_summary": analyze_css_text(";".join(parser.inline_styles)),
        "style_block_summary": analyze_css_text("\n".join(parser.style_blocks)),
    }


def find_css_files(path: Path) -> list[Path]:
    if path.is_file():
        return [path] if path.suffix.lower() in CSS_SUFFIXES else []
    return sorted(file for file in path.rglob("*") if file.suffix.lower() in CSS_SUFFIXES)


def analyze_css_file(path: Path) -> dict[str, Any]:
    return {
        "file": str(path),
        "summary": analyze_css_text(path.read_text(encoding="utf-8", errors="ignore")),
    }


def summarize(files: list[dict[str, Any]], css_files: list[dict[str, Any]]) -> dict[str, Any]:
    tag_totals: Counter[str] = Counter()
    class_totals: Counter[str] = Counter()
    asset_exts: Counter[str] = Counter()
    all_assets: set[str] = set()
    event_totals: Counter[str] = Counter()
    form_totals: Counter[str] = Counter()
    colors: Counter[str] = Counter()
    font_sizes: Counter[str] = Counter()
    font_families: Counter[str] = Counter()
    units: Counter[str] = Counter()
    risk_flags: Counter[str] = Counter()

    for item in files:
        tag_totals.update(dict(item["tags"]))
        class_totals.update(dict(item["top_classes"]))
        event_totals.update(dict(item["event_attrs"]))
        form_totals.update(dict(item["forms"]))
        for summary_key in ("inline_style_summary", "style_block_summary"):
            summary = item[summary_key]
            colors.update(dict(summary["colors"]))
            font_sizes.update(dict(summary["font_sizes"]))
            font_families.update(dict(summary["font_families"]))
            units.update(dict(summary["units"]))
            risk_flags.update(dict(summary["risk_flags"]))
        for asset in item["assets"]:
            all_assets.add(asset)
            suffix = Path(asset.split("?", 1)[0]).suffix.lower()
            if suffix:
                asset_exts[suffix] += 1

    for item in css_files:
        summary = item["summary"]
        colors.update(dict(summary["colors"]))
        font_sizes.update(dict(summary["font_sizes"]))
        font_families.update(dict(summary["font_families"]))
        units.update(dict(summary["units"]))
        risk_flags.update(dict(summary["risk_flags"]))

    return {
        "file_count": len(files),
        "css_file_count": len(css_files),
        "tag_totals": tag_totals.most_common(),
        "top_classes": class_totals.most_common(60),
        "asset_count": len(all_assets),
        "asset_extensions": asset_exts.most_common(),
        "event_attrs": event_totals.most_common(),
        "forms": form_totals.most_common(),
        "colors": colors.most_common(80),
        "font_sizes": font_sizes.most_common(60),
        "font_families": font_families.most_common(40),
        "units": units.most_common(),
        "risk_flags": risk_flags.most_common(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analyze HTML prototype files for miniapp conversion."
    )
    parser.add_argument("path", help="HTML file or directory containing HTML files")
    parser.add_argument(
        "--pretty", action="store_true", help="Pretty-print JSON output"
    )
    args = parser.parse_args()

    root = Path(args.path).resolve()
    html_files = find_html_files(root)
    css_files = find_css_files(root)
    result: dict[str, Any] = {
        "root": str(root),
        "files": [analyze_file(path) for path in html_files],
        "css_files": [analyze_css_file(path) for path in css_files],
    }
    result["summary"] = summarize(result["files"], result["css_files"])

    print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
