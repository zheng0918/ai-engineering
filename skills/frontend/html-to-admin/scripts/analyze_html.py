#!/usr/bin/env python3
"""Inventory HTML prototype files for admin system conversion planning."""

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
UNIT_RE = re.compile(r"[-+]?(?:\d*\.)?\d+(px|rem|em|vh|vw|%)\b", re.IGNORECASE)
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
    "high_z_index": re.compile(r"z-index\s*:\s*(\d{3,})", re.IGNORECASE),
    "overflow_hidden": re.compile(r"overflow\s*:\s*hidden", re.IGNORECASE),
}
LAYOUT_PROPS = {
    "display", "position", "float", "clear", "overflow", "overflow-x", "overflow-y",
    "white-space", "text-overflow", "object-fit", "background-size", "background-position",
    "flex", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap",
    "grid", "grid-template-columns", "grid-template-rows",
}
# Admin-specific layout detection keywords
SIDEBAR_KEYWORDS = {"sidebar", "sider", "side-menu", "side-nav", "aside", "menu-side", "nav-side"}
HEADER_KEYWORDS = {"header", "navbar", "top-bar", "topbar", "top-nav", "nav-bar", "nav-top"}
CONTENT_KEYWORDS = {"content", "main-content", "main-container", "page-content", "body-content"}
BREADCRUMB_KEYWORDS = {"breadcrumb", "bread-crumb", "crumb"}
CHART_KEYWORDS = {"chart", "echarts", "highcharts", "graph", "dashboard-chart", "chart-container"}
TABLE_KEYWORDS = {"data-table", "ant-table", "el-table", "table-wrapper"}
FORM_KEYWORDS = {"search-form", "filter-form", "query-form", "form-panel"}
PAGINATION_KEYWORDS = {"pagination", "pager", "page-bar", "table-footer"}
TABS_KEYWORDS = {"tabs", "tab-bar", "tab-panel", "multi-tabs"}


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

        # Admin-specific detections
        self.canvas_tags: list[dict[str, str]] = []
        self.table_structures: list[dict[str, Any]] = []
        self.nav_menu_depths: list[int] = []
        self._nav_depth = 0
        self._in_nav = False
        self._current_table: dict[str, Any] | None = None
        self._table_header_count = 0

        # Layout region candidates
        self.layout_candidates: dict[str, list[str]] = defaultdict(list)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {name.lower(): value or "" for name, value in attrs}
        tag = tag.lower()
        self.tags[tag] += 1

        class_str = attr_map.get("class", "")
        class_list = class_str.split()
        for class_name in class_list:
            self.classes[class_name] += 1

        id_val = attr_map.get("id", "")
        if id_val:
            self.ids.append(id_val)

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

        # --- Admin-specific detections ---

        # Layout region detection by class/id
        all_identifiers = class_list + ([id_val] if id_val else [])
        for identifier in all_identifiers:
            ident_lower = identifier.lower()
            for region, keywords in [
                ("sidebar", SIDEBAR_KEYWORDS), ("header", HEADER_KEYWORDS),
                ("content", CONTENT_KEYWORDS), ("breadcrumb", BREADCRUMB_KEYWORDS),
                ("chart", CHART_KEYWORDS), ("table", TABLE_KEYWORDS),
                ("form_panel", FORM_KEYWORDS), ("pagination", PAGINATION_KEYWORDS),
                ("tabs", TABS_KEYWORDS),
            ]:
                if any(kw in ident_lower for kw in keywords):
                    self.layout_candidates[region].append(identifier)

        # Canvas / chart detection
        if tag == "canvas":
            self.canvas_tags.append({"id": id_val, "classes": class_list})

        # Table structure detection
        if tag == "table":
            self._current_table = {"classes": class_list, "id": id_val, "columns": 0}
        if tag in {"th"} and self._current_table is not None:
            self._table_header_count += 1

        # Navigation hierarchy detection
        if tag == "nav":
            self._in_nav = True
            self._nav_depth = 0
        if self._in_nav and tag in {"ul", "ol"}:
            self._nav_depth += 1
            if tag == "ul":
                self.nav_menu_depths.append(self._nav_depth)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "style":
            self._in_style = False
        if tag == "table" and self._current_table is not None:
            self._current_table["columns"] = self._table_header_count
            self.table_structures.append(self._current_table)
            self._current_table = None
            self._table_header_count = 0
        if tag == "nav":
            self._in_nav = False
            self._nav_depth = 0
        if self._in_nav and tag in {"ul", "ol"}:
            self._nav_depth -= 1

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

    # Extract CSS custom properties (design tokens)
    custom_props: dict[str, str] = {}
    token_re = re.compile(r"(--[-\w]+)\s*:\s*([^;]+)", re.IGNORECASE)
    for match in token_re.finditer(css_text):
        custom_props[match.group(1)] = match.group(2).strip()

    # Extract border-radius values
    radius_values: Counter[str] = Counter()
    radius_re = re.compile(r"border-radius\s*:\s*([^;{}]+)", re.IGNORECASE)
    for match in radius_re.finditer(css_text):
        radius_values[match.group(1).strip()] += 1

    # Extract box-shadow values
    shadow_values: Counter[str] = Counter()
    shadow_re = re.compile(r"box-shadow\s*:\s*([^;{}]+)", re.IGNORECASE)
    for match in shadow_re.finditer(css_text):
        shadow_values[match.group(1).strip()] += 1

    return {
        "colors": colors.most_common(60),
        "font_sizes": font_sizes.most_common(40),
        "font_families": font_families.most_common(30),
        "units": units.most_common(),
        "layout_values": {
            prop: values.most_common(30) for prop, values in sorted(layout_values.items())
        },
        "risk_flags": risks.most_common(),
        "custom_properties": custom_props,
        "radius_values": radius_values.most_common(20),
        "shadow_values": shadow_values.most_common(10),
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
        # Admin-specific
        "layout_candidates": {k: sorted(set(v)) for k, v in parser.layout_candidates.items()},
        "canvas_tags": parser.canvas_tags,
        "table_structures": parser.table_structures,
        "nav_menu_depths": parser.nav_menu_depths,
        "max_nav_depth": max(parser.nav_menu_depths) if parser.nav_menu_depths else 0,
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
    all_custom_props: dict[str, str] = {}
    radius_values: Counter[str] = Counter()
    shadow_values: Counter[str] = Counter()

    # Admin-specific aggregates
    all_layout_candidates: dict[str, Counter[str]] = defaultdict(Counter)
    all_canvas_tags: list[dict[str, str]] = []
    all_table_structures: list[dict[str, Any]] = []
    max_nav_depth = 0
    total_links: list[str] = []

    for item in files:
        tag_totals.update(dict(item["tags"]))
        class_totals.update(dict(item["top_classes"]))
        event_totals.update(dict(item["event_attrs"]))
        form_totals.update(dict(item["forms"]))
        total_links.extend(item.get("links", []))

        # Layout candidates
        for region, candidates in item.get("layout_candidates", {}).items():
            all_layout_candidates[region].update(dict.fromkeys(candidates, 1))

        # Canvas tags
        all_canvas_tags.extend(item.get("canvas_tags", []))

        # Table structures
        all_table_structures.extend(item.get("table_structures", []))

        # Nav depth
        max_nav_depth = max(max_nav_depth, item.get("max_nav_depth", 0))

        for summary_key in ("inline_style_summary", "style_block_summary"):
            summary = item[summary_key]
            colors.update(dict(summary["colors"]))
            font_sizes.update(dict(summary["font_sizes"]))
            font_families.update(dict(summary["font_families"]))
            units.update(dict(summary["units"]))
            risk_flags.update(dict(summary["risk_flags"]))
            radius_values.update(dict(summary.get("radius_values", [])))
            shadow_values.update(dict(summary.get("shadow_values", [])))
            # Merge custom properties (later files override earlier)
            all_custom_props.update(summary.get("custom_properties", {}))

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
        radius_values.update(dict(summary.get("radius_values", [])))
        shadow_values.update(dict(summary.get("shadow_values", [])))
        all_custom_props.update(summary.get("custom_properties", {}))

    # Detect likely CSS framework from class patterns
    framework_hints = _detect_css_framework(class_totals)

    # Determine layout structure from candidates
    layout_structure = {
        "has_sidebar": len(all_layout_candidates.get("sidebar", {})) > 0,
        "has_header": len(all_layout_candidates.get("header", {})) > 0,
        "has_breadcrumb": len(all_layout_candidates.get("breadcrumb", {})) > 0,
        "has_tabs": len(all_layout_candidates.get("tabs", {})) > 0,
        "sidebar_candidates": all_layout_candidates.get("sidebar", {}).most_common(10),
        "header_candidates": all_layout_candidates.get("header", {}).most_common(10),
    }

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
        "custom_properties": all_custom_props,
        "radius_values": radius_values.most_common(20),
        "shadow_values": shadow_values.most_common(10),
        # Admin-specific
        "framework_hints": framework_hints,
        "layout_structure": layout_structure,
        "chart_count": len(all_canvas_tags),
        "canvas_tags": all_canvas_tags,
        "table_count": len(all_table_structures),
        "table_structures": all_table_structures,
        "max_nav_depth": max_nav_depth,
        "link_count": len(total_links),
        "internal_links": _classify_links(total_links),
    }


def _detect_css_framework(class_totals: Counter[str]) -> list[str]:
    """Detect likely CSS framework from class name patterns."""
    hints = []
    class_set = {c.lower() for c, _ in class_totals.items()}

    # Tailwind: characteristic utility classes
    tailwind_patterns = {"flex", "grid", "p-4", "m-2", "bg-white", "text-center", "rounded-lg"}
    tailwind_hits = sum(1 for p in tailwind_patterns if p in class_set)
    if tailwind_hits >= 3:
        hints.append("tailwind")

    # Bootstrap: characteristic classes
    bootstrap_patterns = {"container", "row", "col-md-", "btn-primary", "form-group"}
    bootstrap_hits = sum(1 for p in bootstrap_patterns if any(p in c for c in class_set))
    if bootstrap_hits >= 3:
        hints.append("bootstrap")

    # Element Plus
    el_patterns = {"el-menu", "el-table", "el-form", "el-button", "el-dialog"}
    el_hits = sum(1 for p in el_patterns if any(p in c for c in class_set))
    if el_hits >= 2:
        hints.append("element-plus")

    # Ant Design
    ant_patterns = {"ant-menu", "ant-table", "ant-form", "ant-btn", "ant-modal"}
    ant_hits = sum(1 for p in ant_patterns if any(p in c for c in class_set))
    if ant_hits >= 2:
        hints.append("ant-design")

    return hints


def _classify_links(links: list[str]) -> dict[str, list[str]]:
    """Classify links as internal (hash/#) vs external."""
    internal = []
    external = []
    for link in links:
        link = link.strip()
        if not link or link.startswith("javascript:") or link == "#":
            continue
        if link.startswith("#") or link.startswith("/") or not link.startswith(("http://", "https://")):
            internal.append(link)
        else:
            external.append(link)
    return {"internal": sorted(set(internal)), "external": sorted(set(external))}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analyze HTML prototype files for admin system conversion."
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
