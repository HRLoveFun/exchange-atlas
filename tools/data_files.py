#!/usr/bin/env python3
"""tools/data_files.py — data/exchanges/*.yml 遍历与加载的共享例程

`sync.py`/`verify_quotes.py`/`fetch_sources.py`/`check_en_terms.py` 原先各自独立实现
「glob data/exchanges/*.yml + yaml.safe_load」这段样板——违反 CLAUDE.md 一节自己讲的
DRY 铁律（同一件事只手写一处），收敛到这里，其余脚本改为调用。
"""
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "exchanges"


def exchange_paths():
    """按文件名排序返回 data/exchanges/*.yml 的 Path 列表。"""
    return sorted(DATA_DIR.glob("*.yml"))


def exchange_ids():
    """按文件名排序返回全部交易所 id（<id>.yml 的 <id>）。"""
    return [p.stem for p in exchange_paths()]


def load_exchange(exchange_id):
    """读单家交易所的原始 YAML（未展开 `_meta`，未做 `sync.expand_exchange`）。"""
    with (DATA_DIR / f"{exchange_id}.yml").open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_all_exchanges():
    """`{id: 原始 YAML}` 全量字典，按 id 排序。"""
    return {p.stem: (yaml.safe_load(p.read_text(encoding="utf-8")) or {}) for p in exchange_paths()}
