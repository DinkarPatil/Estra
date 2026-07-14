"""
Append-safe JSON persistence with deduplication.

Writes are atomic (tempfile + os.replace) so a partial run can't leave a
half-written file. Dedupe key prefers `listing_url`; falls back to a
title+locality composite when no URL is available.
"""

import json
import os
import tempfile
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List


def _atomic_write(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.name + ".", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            try:
                os.unlink(tmp)
            except OSError:
                pass
        raise


def load_json(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def listing_key(entry: Dict[str, Any]) -> str:
    url = (entry.get("listing_url") or "").strip().lower()
    if url:
        return f"url::{url}"
    title = (entry.get("title") or "").strip().lower()
    locality = (entry.get("locality_text") or "").strip().lower()
    return f"tl::{title}::{locality}"


def project_key(entry: Dict[str, Any]) -> str:
    name = (entry.get("project_name") or "").strip().lower()
    city = (entry.get("city") or "").strip().lower()
    return f"{name}|{city}"


def merge_save(
    path: Path,
    new_entries: Iterable[Dict[str, Any]],
    key_fn: Callable[[Dict[str, Any]], str] = listing_key,
) -> Dict[str, int]:
    """Merge new entries into an existing JSON list at `path`, deduped by `key_fn`.

    Existing entries are preserved (append-safe). Returns counts:
      {"total": N, "added": k, "skipped_dupes": d}.
    """
    existing = load_json(path)
    by_key: Dict[str, Dict[str, Any]] = {key_fn(e): e for e in existing}

    added = 0
    skipped = 0
    for e in new_entries:
        k = key_fn(e)
        if k in by_key:
            skipped += 1
            continue
        by_key[k] = e
        added += 1

    merged = list(by_key.values())
    _atomic_write(path, merged)
    return {"total": len(merged), "added": added, "skipped_dupes": skipped}
