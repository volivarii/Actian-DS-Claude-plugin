#!/usr/bin/env python3
"""Dispatcher: render a plugin data model to a branded Office file.

Usage: render-office.py --type {presentation} <data>.json -o <out>.pptx
The Office path is strictly additive; importable failures exit nonzero with a friendly message.
"""
import argparse
import json
import os
import sys

KNOWN_TYPES = {"presentation"}  # PR2/PR3 add: brief, audit


def main(argv=None):
    ap = argparse.ArgumentParser(prog="render-office.py")
    ap.add_argument("--type", dest="type", required=True)
    ap.add_argument("data")
    ap.add_argument("-o", "--out", dest="out", required=True)
    args = ap.parse_args(argv)

    if args.type not in KNOWN_TYPES:
        print(f"error: unknown --type '{args.type}' (known: {sorted(KNOWN_TYPES)})", file=sys.stderr)
        return 2
    if not os.path.exists(args.data):
        print(f"error: input data file not found: {args.data}", file=sys.stderr)
        return 2

    try:
        import pptx  # noqa: F401
    except ImportError:
        print("error: python-pptx not installed. Run: pip install python-pptx", file=sys.stderr)
        return 3

    with open(args.data, encoding="utf-8") as fh:
        data = json.load(fh)

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    try:
        if args.type == "presentation":
            from mappers.presentation_pptx import render_presentation
            render_presentation(data, args.out)
    except Exception as e:  # noqa: BLE001 - CLI boundary: surface a clean message
        print(f"error: failed to render {args.type}: {e}", file=sys.stderr)
        return 4

    from engine.qa import check_pptx
    issues = check_pptx(args.out)
    if issues:
        print("warning: structural QA found issues:", file=sys.stderr)
        for i in issues:
            print(f"  - {i}", file=sys.stderr)
    print(f"ok: wrote {args.out}")
    return 0


if __name__ == "__main__":
    # allow `from mappers... import` and `from engine... import` to resolve from this dir
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    raise SystemExit(main())
