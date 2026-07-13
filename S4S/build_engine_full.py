#!/usr/bin/env python3
"""Regenerate engine_full.js from engine.js, with JS minification.

engine_full.js is a single JS string literal:
    var ENGINE_FULL = "<escaped, minified engine.js content>";

It's used by the compiler to embed the engine in standalone HTML exports.

Minification pipeline:
    1. Read engine.js (raw source, ~8800 lines, ~390 KB).
    2. Embed the PressStart2P-Regular.woff2 font as a base64 data URL and
       prepend a self-registering @font-face loader to the engine source.
       This makes standalone HTML exports self-contained — they no longer
       need a font/PressStart2P-Regular.woff2 file alongside the HTML.
    3. Minify with rjsmin — removes:
         - // single-line comments (preserves those inside strings/regex)
         - /* ... */ block comments
         - redundant whitespace (collapses runs to a single space or nothing)
         - redundant semicolons/newlines
       rjsmin is a proven, conservative minifier: it correctly handles
       regex literals, template literals (`... ${...} ...`), string
       literals with embedded comment-like sequences, and ASI (Automatic
       Semicolon Insertion) edge cases.
    4. Escape the minified source as a JSON string literal (valid JS).
    5. Write `var ENGINE_FULL = "...";\n` to engine_full.js.

Usage:
    python build_engine_full.py            # minify + embed font (default)
    python build_engine_full.py --no-min   # skip minification (debug)
    python build_engine_full.py --no-font  # skip font embedding

By default, engine.js, engine_full.js, and font/PressStart2P-Regular.woff2
are resolved relative to THIS script's directory, so you can run this
script from anywhere on any OS (Windows / Linux / macOS) without editing
paths.

Optional dependency: rjsmin  (pip install rjsmin)
    If rjsmin is not installed, the script falls back to no-minification
    mode with a warning, so the build never breaks the toolchain.
"""
import argparse
import base64
import json
import os
import sys

# Resolve defaults relative to THIS script's directory. This makes the
# script portable: it works on Windows (C:\\...\\SwitchGameCompiler\\),
# Linux (/home/.../compiler/), and macOS without any path editing.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SRC = os.path.join(SCRIPT_DIR, 'engine.js')
DEFAULT_DST = os.path.join(SCRIPT_DIR, 'engine_full.js')
DEFAULT_FONT = os.path.join(SCRIPT_DIR, 'font', 'PressStart2P-Regular.woff2')


def minify(source: str) -> str:
    """Minify JS source via rjsmin. Returns minified string."""
    try:
        import rjsmin
    except ImportError:
        print(
            'WARNING: rjsmin is not installed. '
            'Install with: pip install rjsmin\n'
            'Falling back to no-minification mode.',
            file=sys.stderr,
        )
        return source
    # rjsmin.jsmin preserves a leading "/" character for safety (to avoid
    # concatenation issues when the output is joined with other code). We
    # don't need that here because the output is wrapped in a string
    # literal. Pass keep_bang_comments=False to drop /*! ... */ too.
    return rjsmin.jsmin(source, keep_bang_comments=False)


def build_font_loader(font_path: str) -> str:
    """Read a woff2 font file and return a JS snippet that registers it
    via @font-face using a base64 data URL.

    The returned snippet is plain JS (no comments that rjsmin can't handle).
    It uses the CSS Font Loading API (document.fonts) to register a new
    @font-face rule at runtime. This works in all modern browsers and
    requires NO external font file.

    Falls back to injecting a <style> tag if the FontFace constructor is
    unavailable (very old browsers).
    """
    with open(font_path, 'rb') as f:
        font_bytes = f.read()
    b64 = base64.b64encode(font_bytes).decode('ascii')
    data_url = 'data:font/woff2;base64,' + b64

    # We use the FontFace API (modern, clean, no CSS parsing needed).
    # The font is registered under the family name "PressStart2P" which
    # is what engine.js uses in g_ctx.font = "...px PressStart2P, monospace".
    # Wrap in an IIFE so we don't pollute the global scope.
    return (
        '(function(){'
        'try{'
        'var ff=new FontFace("PressStart2P","url(' + data_url + ')");'
        'ff.load().then(function(){document.fonts.add(ff);}).catch(function(){});'
        '}catch(e){'
        # Fallback: inject a <style> with @font-face using the data URL.
        'try{'
        'var s=document.createElement("style");'
        's.textContent="@font-face{font-family:\'PressStart2P\';src:url(' + data_url + ') format(\'woff2\');}";'
        'document.head.appendChild(s);'
        '}catch(e2){}'
        '}'
        '})();'
    )


def main():
    parser = argparse.ArgumentParser(
        description='Generate engine_full.js from engine.js (with minification and font embedding).'
    )
    parser.add_argument(
        '--no-min', action='store_true',
        help='Skip minification (output raw engine.js as a string literal).',
    )
    parser.add_argument(
        '--no-font', action='store_true',
        help='Skip embedding the PressStart2P font (standalone HTML will need the font file).',
    )
    parser.add_argument(
        '--src', default=DEFAULT_SRC,
        help='Source engine.js path (default: engine.js next to this script)',
    )
    parser.add_argument(
        '--dst', default=DEFAULT_DST,
        help='Destination engine_full.js path (default: engine_full.js next to this script)',
    )
    parser.add_argument(
        '--font', default=DEFAULT_FONT,
        help='Path to PressStart2P-Regular.woff2 (default: font/ next to this script)',
    )
    args = parser.parse_args()

    # Resolve to absolute paths for clearer logging.
    src_abs = os.path.abspath(args.src)
    dst_abs = os.path.abspath(args.dst)
    font_abs = os.path.abspath(args.font)

    # 1. Read engine.js
    if not os.path.isfile(src_abs):
        print(f'ERROR: source file not found: {src_abs}', file=sys.stderr)
        print('       Expected engine.js in the same directory as this script:', file=sys.stderr)
        print(f'       {SCRIPT_DIR}', file=sys.stderr)
        sys.exit(1)

    with open(src_abs, 'r', encoding='utf-8') as f:
        raw = f.read()

    raw_size = len(raw)
    raw_lines = raw.count('\n')

    # 2. Embed font (prepend font loader to the engine source)
    font_loader = ''
    if args.no_font:
        print('[build_engine_full] Font embedding DISABLED (--no-font)')
    else:
        if not os.path.isfile(font_abs):
            print(f'WARNING: font file not found: {font_abs}', file=sys.stderr)
            print('         Standalone HTML exports will need the font file alongside.', file=sys.stderr)
            print('         Continuing without font embedding.', file=sys.stderr)
        else:
            print(f'[build_engine_full] Embedding font: {font_abs}')
            font_loader = build_font_loader(font_abs)
            font_size_kb = os.path.getsize(font_abs) / 1024.0
            print(f'[build_engine_full]   {font_size_kb:.1f} KB → base64 data URL')

    # Prepend font loader to engine source (BEFORE minification so the
    # loader is also minified).
    body = font_loader + raw if font_loader else raw

    # 3. Minify (unless --no-min)
    if args.no_min:
        print('[build_engine_full] Minification DISABLED (--no-min)')
    else:
        print('[build_engine_full] Minifying with rjsmin...')
        body = minify(body)
        if body == (font_loader + raw):
            print('[build_engine_full] rjsmin not available — kept raw source.')

    body_size = len(body)
    body_lines = body.count('\n')

    # 4. Escape as a JSON string literal (valid JS double-quoted string).
    #    ensure_ascii=True converts non-ASCII (e.g. Cyrillic comments in
    #    engine.js) to \uXXXX escapes, keeping engine_full.js pure ASCII.
    escaped = json.dumps(body, ensure_ascii=True)

    # 5. Wrap and write.
    output = 'var ENGINE_FULL = ' + escaped + ';\n'
    with open(dst_abs, 'w', encoding='utf-8') as f:
        f.write(output)

    out_size = os.path.getsize(dst_abs)

    # 6. Report
    print(f'[build_engine_full] Source:    {src_abs}')
    print(f'[build_engine_full]   {raw_size:>10} bytes  {raw_lines:>6} lines (raw engine.js)')
    if font_loader:
        print(f'[build_engine_full]   + font loader (PressStart2P woff2 as base64 data URL)')
    if not args.no_min and body != (font_loader + raw):
        ratio = (1.0 - body_size / (len(raw) + len(font_loader))) * 100.0
        print(f'[build_engine_full]   {body_size:>10} bytes  {body_lines:>6} lines (minified)  '
              f'— {ratio:.1f}% smaller')
    print(f'[build_engine_full] Output:   {dst_abs}')
    print(f'[build_engine_full]   {out_size:>10} bytes  (JSON-escaped string literal)')
    print(f'[build_engine_full] Done.')


if __name__ == '__main__':
    main()
