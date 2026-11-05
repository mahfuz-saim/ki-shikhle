#!/usr/bin/env python
"""
Build the 5-slide "Ki Shikhle?" presentation deck.

Output: <repo root>/Ki-Shikhle-Deck.pptx

Run:  python scripts/build_deck.py
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ----------------------------------------------------------------------------
# Design tokens
# ----------------------------------------------------------------------------
INK       = RGBColor(0x14, 0x1B, 0x2D)   # near-black navy, body text
INK_SOFT  = RGBColor(0x4A, 0x55, 0x6B)   # secondary text
INK_FAINT = RGBColor(0x8A, 0x94, 0xA6)   # footers, captions
INDIGO    = RGBColor(0x4F, 0x46, 0xE5)   # primary brand
INDIGO_LT = RGBColor(0xEC, 0xEC, 0xFD)   # primary tint
INDIGO_MD = RGBColor(0x81, 0x7C, 0xF0)
RED       = RGBColor(0xD9, 0x33, 0x3F)   # "before" / failure
RED_LT    = RGBColor(0xFD, 0xEC, 0xEE)
GREEN     = RGBColor(0x0E, 0x8A, 0x5F)   # "after" / success
GREEN_LT  = RGBColor(0xE7, 0xF6, 0xEF)
AMBER     = RGBColor(0xB4, 0x6A, 0x06)
AMBER_LT  = RGBColor(0xFD, 0xF4, 0xE3)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
PAPER     = RGBColor(0xF7, 0xF8, 0xFB)
LINE      = RGBColor(0xE2, 0xE6, 0xEF)

FONT = "Segoe UI"

W, H = 13.333, 7.5
ML, MR = 0.70, 0.70
CW = W - ML - MR          # 11.933 content width

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "Ki-Shikhle-Deck.pptx")


# ----------------------------------------------------------------------------
# Primitives
# ----------------------------------------------------------------------------
def rect(slide, x, y, w, h, fill=None, line=None, radius=None, shape=MSO_SHAPE.RECTANGLE, line_w=1.0):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(line_w)
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            s.adjustments[0] = radius
        except Exception:
            pass
    s.shadow.inherit = False
    return s


def card(slide, x, y, w, h, fill=WHITE, line=LINE, radius=0.045):
    return rect(slide, x, y, w, h, fill=fill, line=line, radius=radius,
                shape=MSO_SHAPE.ROUNDED_RECTANGLE)


def textbox(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    return tf


def para(tf, text, size=12, bold=False, color=INK, align=PP_ALIGN.LEFT,
         space_before=0, space_after=0, line=1.15, first=False, italic=False,
         font=FONT):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(space_before)
    p.space_after = Pt(space_after)
    try:
        p.line_spacing = line
    except Exception:
        pass
    r = p.add_run()
    r.text = text
    f = r.font
    f.name = font
    f.size = Pt(size)
    f.bold = bold
    f.italic = italic
    f.color.rgb = color
    return p


def bullets(tf, items, size=11.5, color=INK, gap=6, bullet="\u2022  ", line=1.18,
            bold_lead=False):
    """items: list of str, or (lead, rest) tuples where lead is bolded."""
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap)
        try:
            p.line_spacing = line
        except Exception:
            pass
        r0 = p.add_run()
        r0.text = bullet
        r0.font.name = FONT
        r0.font.size = Pt(size)
        r0.font.color.rgb = INDIGO
        r0.font.bold = True
        if isinstance(it, tuple):
            lead, rest = it
            r1 = p.add_run()
            r1.text = lead
            r1.font.name = FONT
            r1.font.size = Pt(size)
            r1.font.bold = True
            r1.font.color.rgb = color
            r2 = p.add_run()
            r2.text = rest
            r2.font.name = FONT
            r2.font.size = Pt(size)
            r2.font.color.rgb = color
        else:
            r1 = p.add_run()
            r1.text = it
            r1.font.name = FONT
            r1.font.size = Pt(size)
            r1.font.bold = bold_lead
            r1.font.color.rgb = color


# ----------------------------------------------------------------------------
# Table helper
# ----------------------------------------------------------------------------
def style_cell(cell, text, size=10.5, bold=False, color=INK, fill=None,
               align=PP_ALIGN.LEFT, pad=0.10):
    cell.margin_left = Inches(pad)
    cell.margin_right = Inches(pad)
    cell.margin_top = Inches(0.03)
    cell.margin_bottom = Inches(0.03)
    cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    if fill is None:
        cell.fill.background()
    else:
        cell.fill.solid()
        cell.fill.fore_color.rgb = fill
    tf = cell.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color


def make_table(slide, x, y, col_w, row_h, n_rows, n_cols):
    shp = slide.shapes.add_table(n_rows, n_cols, Inches(x), Inches(y),
                                 Inches(sum(col_w)), Inches(sum(row_h)))
    tbl = shp.table
    tbl.first_row = False
    tbl.horz_banding = False
    for i, cw in enumerate(col_w):
        tbl.columns[i].width = Inches(cw)
    for i, rh in enumerate(row_h):
        tbl.rows[i].height = Inches(rh)
    return tbl


# ----------------------------------------------------------------------------
# Slide chrome
# ----------------------------------------------------------------------------
def new_slide(prs, title, subtitle, number, eyebrow="KI SHIKHLE?"):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    rect(slide, 0, 0, W, 0.075, fill=INDIGO)
    rect(slide, 0, 0.075, 4.3, 0.075, fill=INDIGO_MD)

    tf = textbox(slide, ML, 0.30, 6.0, 0.24)
    para(tf, eyebrow, size=9.5, bold=True, color=INDIGO, first=True)

    tf = textbox(slide, ML, 0.56, CW, 0.62)
    para(tf, title, size=29, bold=True, color=INK, first=True, line=1.0)

    tf = textbox(slide, ML, 1.20, CW - 0.2, 0.42)
    para(tf, subtitle, size=12.5, color=INK_SOFT, first=True, line=1.2)

    # footer
    rect(slide, ML, 6.94, CW, 0.012, fill=LINE)
    tf = textbox(slide, ML, 7.04, 8.0, 0.24)
    para(tf, "Ki Shikhle?  \u00b7  Parent-side learning tracker  \u00b7  multi-tenant, bilingual (en/bn)",
         size=8.5, color=INK_FAINT, first=True)
    tf = textbox(slide, W - MR - 1.5, 7.04, 1.5, 0.24)
    para(tf, f"{number} / 5", size=8.5, color=INK_FAINT, align=PP_ALIGN.RIGHT, first=True)
    return slide


def stat_tile(slide, x, y, w, h, value, label, accent=INDIGO, tint=INDIGO_LT,
              vsize=30, lsize=9.8):
    card(slide, x, y, w, h, fill=tint, line=None)
    rect(slide, x, y, 0.055, h, fill=accent)
    tf = textbox(slide, x + 0.26, y + 0.14, w - 0.42, h - 0.24)
    para(tf, value, size=vsize, bold=True, color=accent, first=True, line=0.98)
    para(tf, label, size=lsize, color=INK_SOFT, space_before=5, line=1.16)


def section_label(slide, x, y, w, text, color=INK, size=10):
    tf = textbox(slide, x, y, w, 0.24)
    para(tf, text.upper(), size=size, bold=True, color=color, first=True)
    return tf


# ============================================================================
prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)

# ---------------------------------------------------------------- SLIDE 1 ---
s = new_slide(
    prs,
    "Problem Statement",
    "Every account could read every other account\u2019s data. Verified against the running API \u2014 "
    "a brand-new parent, with its own valid token, read the demo family\u2019s children, notes, "
    "learning log and dashboard KPIs.",
    1,
)

# left: reproduction table
section_label(s, ML, 1.78, 7.0, "Reproduced live  \u00b7  new parent account, valid token")
col_w = [3.62, 0.78, 2.60]
row_h = [0.36] + [0.42] * 6
tbl = make_table(s, ML, 2.08, col_w, row_h, 7, 3)
for i, h in enumerate(["Request", "Status", "What came back"]):
    style_cell(tbl.cell(0, i), h, size=9.5, bold=True, color=WHITE, fill=INK,
               align=PP_ALIGN.CENTER if i == 1 else PP_ALIGN.LEFT)
repro = [
    ("GET /api/v1/children", "200", "3 demo children (demo-child-1/2/3)"),
    ("GET /children/demo-child-1/notes", "200", "3 notes from another family"),
    ("GET /children/demo-child-1/entries", "200", "5 learning entries"),
    ("GET /children/demo-child-1/dashboard/summary", "200", "Another child\u2019s KPIs"),
    ("GET /admin/users  (any parent token)", "200", "Every user\u2019s argon2id hash"),
    ("Authorization: Bearer demo-parent-token", "200", "Every tenant\u2019s children"),
]
for r, (req, st, got) in enumerate(repro, start=1):
    bg = WHITE if r % 2 else PAPER
    style_cell(tbl.cell(r, 0), req, size=9.8, color=INK, fill=bg)
    style_cell(tbl.cell(r, 1), st, size=10.5, bold=True, color=RED, fill=bg,
               align=PP_ALIGN.CENTER)
    style_cell(tbl.cell(r, 2), got, size=9.8, color=INK_SOFT, fill=bg)

tf = textbox(s, ML, 5.02, 7.0, 0.5)
para(tf, "Any token merely containing \u201crahim\u201d, \u201ctasnim\u201d, \u201cfahim\u201d or \u201cparent\u201d "
         "was also accepted \u2014 plus an unauthenticated account-restore endpoint and a public cron "
         "trigger that purged users and spent AI quota.",
     size=9.6, color=INK_FAINT, first=True, line=1.25)

# right: stat tiles
tx = ML + 7.30
tw = (CW - 7.30 - 0.22) / 2
th = 1.62
stat_tile(s, tx, 2.08, tw, th, "7", "critical auth & data\nvulnerabilities live in the API",
          accent=RED, tint=RED_LT, vsize=32)
stat_tile(s, tx + tw + 0.22, 2.08, tw, th, "5", "copies of assertOwnership\n\u2014 4 of them never threw",
          accent=RED, tint=RED_LT, vsize=32)
stat_tile(s, tx, 2.08 + th + 0.20, tw, th, "90", "API routes with no single\nownership choke point",
          accent=RED, tint=RED_LT, vsize=32)
stat_tile(s, tx + tw + 0.22, 2.08 + th + 0.20, tw, th, "100%", "of user records exposed \u2014 every\nhash, to any caller",
          accent=RED, tint=RED_LT, vsize=32)

# bottom takeaway band
card(s, ML, 5.72, CW, 1.02, fill=INK, line=None)
rect(s, ML, 5.72, 0.07, 1.02, fill=RED)
tf = textbox(s, ML + 0.34, 5.86, CW - 0.7, 0.78)
para(tf, "Net effect", size=9.5, bold=True, color=INDIGO_MD, first=True)
para(tf, "A parent account could read another family\u2019s children, notes, learning log, quiz attempts "
         "and dashboard KPIs \u2014 and one admin endpoint handed every user\u2019s password hash to any "
         "signed-in caller.",
     size=11.5, color=WHITE, space_before=3, line=1.2)

# ---------------------------------------------------------------- SLIDE 2 ---
s = new_slide(
    prs,
    "Proposed Solution",
    "Replace scattered, divergent ownership checks with one audited choke point \u2014 and give every route, "
    "every query and every response an explicit, reviewable boundary.",
    2,
)

PILLARS = [
    ("One ownership choke point",
     "core/tenancy.ts \u2014 resolveActor \u2192 assertChildAccess \u2192 assertEntityAccess. Every module now asks the same two questions, so the answer cannot differ per feature.",
     "1 module replaces 5 checks", INDIGO, INDIGO_LT),
    ("Tenant-partitioned fallback store",
     "The no-database dev mode is partitioned by owner exactly like SQL, so degraded mode enforces the same rules and is never a silent bypass.",
     "19 degraded-mode tests", INDIGO, INDIGO_LT),
    ("Explicit select projections",
     "No query returns a whole row by default. passwordHash and pinHash are projected out of every read, so a hash cannot reach a response by accident.",
     "0 hash fields in any response", INDIGO, INDIGO_LT),
    ("Route role gates",
     "Managing a child is a parent act: create child, re-grade, PIN, subjects, quiz generation, entry verification and billing are refused for a child token.",
     "9 role-gate tests", INDIGO, INDIGO_LT),
    ("Roles read from the database",
     "The JWT role claim is only a hint; the users row is the truth. A demotion takes effect on the next request instead of after the 7-day token lifetime.",
     "0 stale-claim escalations", INDIGO, INDIGO_LT),
]

y = 1.78
for i, (title, desc, metric, ac, tint) in enumerate(PILLARS, start=1):
    card(s, ML, y, CW, 0.92, fill=WHITE, line=LINE)
    rect(s, ML, y, 0.055, 0.92, fill=ac)
    badge = rect(s, ML + 0.24, y + 0.235, 0.45, 0.45, fill=ac, shape=MSO_SHAPE.OVAL)
    btf = badge.text_frame
    btf.margin_left = btf.margin_right = btf.margin_top = btf.margin_bottom = 0
    btf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para(btf, str(i), size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER, first=True, line=1.0)

    tf = textbox(s, ML + 0.86, y + 0.17, 3.05, 0.62)
    para(tf, title, size=13.5, bold=True, color=INK, first=True, line=1.05)

    tf = textbox(s, ML + 4.00, y + 0.13, 5.45, 0.70)
    para(tf, desc, size=10.3, color=INK_SOFT, first=True, line=1.22)

    card(s, ML + 9.62, y + 0.24, 2.20, 0.44, fill=tint, line=None)
    tf = textbox(s, ML + 9.62, y + 0.32, 2.20, 0.30)
    para(tf, metric, size=9.8, bold=True, color=ac, align=PP_ALIGN.CENTER, first=True)
    y += 1.02

# ---------------------------------------------------------------- SLIDE 3 ---
s = new_slide(
    prs,
    "How the Solution Works",
    "One request path from token to decision \u2014 identical for every module, in the database and in the fallback store.",
    3,
)

STEPS = [
    ("Verify JWT", "signature only"),
    ("resolveActor", "role from the DB row"),
    ("Actor", "ownerId \u00b7 userId \u00b7 childId \u00b7 role"),
    ("Assert access", "child / entity resolver"),
    ("404 or 200", "404 for cross-tenant"),
]
cw_ch = 2.58
for i, (t, sub) in enumerate(STEPS):
    x = ML + i * 2.34
    last = (i == len(STEPS) - 1)
    ch = rect(s, x, 1.80, cw_ch, 1.02,
              fill=INK if last else INDIGO, shape=MSO_SHAPE.CHEVRON)
    tf = ch.text_frame
    tf.margin_left = Inches(0.16)
    tf.margin_right = Inches(0.06)
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    para(tf, t, size=11.5, bold=True, color=WHITE, align=PP_ALIGN.CENTER, first=True, line=1.0)
    para(tf, sub, size=8.2, color=RGBColor(0xC9, 0xC6, 0xFA), align=PP_ALIGN.CENTER,
         space_before=2, line=1.0)

# left: rules
section_label(s, ML, 3.16, 5.7, "Rules that hold everywhere")
card(s, ML, 3.46, 5.70, 3.30, fill=WHITE, line=LINE)
tf = textbox(s, ML + 0.26, 3.66, 5.18, 2.95)
bullets(tf, [
    ("Cross-tenant access is 404, never 403. ", "403 would confirm the row exists."),
    ("Scope comes from the token only ", "\u2014 never a body, a query parameter or a hardcoded default."),
    ("The database row decides the role, ", "so a demotion applies immediately."),
    ("A child actor\u2019s ownerId is the parent\u2019s id ", "\u2014 so account-wide resources are scoped by userId instead."),
    ("An unknown account is never replaced ", "by another account. There is no default tenant."),
    ("Admin reads platform metrics only, ", "never tenant content."),
], size=10.6, gap=7)

# right: role matrix
section_label(s, ML + 6.23, 3.16, 5.7, "Who may do what")
col_w = [2.63, 0.95, 1.20, 0.95]
row_h = [0.40] + [0.42] * 5
tbl = make_table(s, ML + 6.23, 3.46, col_w, row_h, 6, 4)
for i, h in enumerate(["Capability", "Parent", "Child", "Admin"]):
    style_cell(tbl.cell(0, i), h, size=9.8, bold=True, color=WHITE, fill=INK,
               align=PP_ALIGN.LEFT if i == 0 else PP_ALIGN.CENTER)
MATRIX = [
    ("Read own child\u2019s notes, log, KPIs", "\u2713", "\u2713 own only", "\u2715"),
    ("Manage children, PIN, subjects, quizzes", "\u2713", "\u2715 403", "\u2715"),
    ("Verify a learning entry", "\u2713", "\u2715 403", "\u2715"),
    ("Billing & invoices", "\u2713", "\u2715 403", "\u2715"),
    ("Platform metrics", "\u2715", "\u2715", "\u2713"),
]
for r, row in enumerate(MATRIX, start=1):
    bg = WHITE if r % 2 else PAPER
    style_cell(tbl.cell(r, 0), row[0], size=9.6, color=INK, fill=bg)
    for c in (1, 2, 3):
        val = row[c]
        col = GREEN if val.startswith("\u2713") else RED
        style_cell(tbl.cell(r, c), val, size=9.6, bold=True, color=col, fill=bg,
                   align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- SLIDE 4 ---
s = new_slide(
    prs,
    "Introduction / Team Background",
    "Ki Shikhle? \u2014 a parent-side learning tracker: parents see what their children actually learned, "
    "children log in in under a minute, and quizzes are generated from the child\u2019s own notes.",
    4,
)

# left: profile
card(s, ML, 1.80, 4.45, 4.98, fill=WHITE, line=LINE)
av = rect(s, ML + 0.30, 2.06, 0.92, 0.92, fill=INDIGO, shape=MSO_SHAPE.OVAL)
tf = av.text_frame
tf.vertical_anchor = MSO_ANCHOR.MIDDLE
tf.margin_left = tf.margin_right = 0
para(tf, "MS", size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER, first=True, line=1.0)

tf = textbox(s, ML + 1.36, 2.14, 2.85, 0.80)
para(tf, "Mahfuz Saim", size=17, bold=True, color=INK, first=True, line=1.05)
para(tf, "Solo engineer \u00b7 design, backend, frontend, security review",
     size=9.6, color=INK_SOFT, space_before=3, line=1.15)

rect(s, ML + 0.30, 3.16, 3.85, 0.012, fill=LINE)

tf = textbox(s, ML + 0.30, 3.34, 3.85, 3.20)
bullets(tf, [
    ("63 commits ", "on the reform branch, 2026-10-31 \u2192 2026-11-05"),
    ("39.7k lines of code ", "\u2014 15.2k server, 24.5k client"),
    ("100 server files ", "+ 64 client source files"),
    ("15 API modules \u00b7 90 routes \u00b7 24 Prisma models ", "in a Postgres-backed multi-tenant schema"),
    ("1,314 bilingual strings ", "\u2014 English and Bangla at exact parity, checked by four scripts"),
    ("2 ", "live API verification scripts against the running server"),
], size=10.3, gap=8)

# right: tiles + timeline
rx = ML + 4.72
rw = (CW - 4.72 - 0.24) / 2
th = 1.28
stat_tile(s, rx, 1.80, rw, th, "39.7k", "lines of code\n(100 server + 64 client files)",
          vsize=26, lsize=9.3)
stat_tile(s, rx + rw + 0.24, 1.80, rw, th, "90", "API routes across\n15 feature modules",
          vsize=26, lsize=9.3)
stat_tile(s, rx, 1.80 + th + 0.18, rw, th, "1,314", "bilingual i18n keys,\nen = bn exact parity",
          vsize=26, lsize=9.3)
stat_tile(s, rx + rw + 0.24, 1.80 + th + 0.18, rw, th, "5 days", "from first commit to\nsecurity-audited release",
          vsize=26, lsize=9.3)

# timeline
section_label(s, rx, 4.72, CW - 4.72, "Build timeline")
tl_y = 5.02
card(s, rx, tl_y, CW - 4.72, 1.76, fill=PAPER, line=LINE)
PHASES = [
    ("Day 1", "Security audit", "7 critical vulns reproduced against the live API"),
    ("Day 2", "Ownership choke point", "core/tenancy.ts + tenant-partitioned store"),
    ("Day 3", "Feature sweep", "9 screens that faked or hid failures"),
    ("Day 4", "Role gates & credential leaks", "21 new tests, 0 hashes in any response"),
]
pw = (CW - 4.72 - 0.60 - 3 * 0.16) / 4
for i, (day, t, d) in enumerate(PHASES):
    x = rx + 0.30 + i * (pw + 0.16)
    rect(s, x, tl_y + 0.20, pw, 0.045, fill=INDIGO)
    tf = textbox(s, x, tl_y + 0.32, pw, 1.30)
    para(tf, day, size=8.8, bold=True, color=INDIGO, first=True, line=1.0)
    para(tf, t, size=10.6, bold=True, color=INK, space_before=3, line=1.1)
    para(tf, d, size=9.0, color=INK_SOFT, space_before=3, line=1.18)

# ---------------------------------------------------------------- SLIDE 5 ---
s = new_slide(
    prs,
    "Key Information \u2014 Status, Coverage & What\u2019s Next",
    "The isolation work is complete and pinned by tests: 22 test files, 282 tests, 100% passing. "
    "170 of those 282 are dedicated to security and isolation.",
    5,
)

# left: test coverage bars
section_label(s, ML, 1.78, 5.9, "Security & isolation suites  \u00b7  170 tests")
card(s, ML, 2.06, 5.90, 3.66, fill=WHITE, line=LINE)
SUITES = [
    ("isolation.test.ts", 42),
    ("tenant-scope.test.ts  (no DB)", 20),
    ("auth-bypass.test.ts", 17),
    ("entitlements.test.ts", 16),
    ("ai-mock-fidelity.test.ts", 15),
    ("upload.test.ts", 15),
    ("credential-leak.test.ts", 9),
    ("role-gates.test.ts", 9),
    ("csrf.test.ts", 9),
    ("child-identity.test.ts", 8),
    ("child-mode.test.ts", 7),
    ("quiz-cache-isolation.test.ts", 3),
]
bar_x = ML + 2.62
bar_max = 2.28
row = 2.28
for name, n in SUITES:
    tf = textbox(s, ML + 0.22, row - 0.015, 2.35, 0.24)
    para(tf, name, size=8.9, color=INK, first=True, line=1.0)
    w = max(0.10, bar_max * (n / 42))
    rect(s, bar_x, row + 0.035, bar_max, 0.15, fill=RGBColor(0xEE, 0xF0, 0xF6))
    rect(s, bar_x, row + 0.035, w, 0.15, fill=INDIGO)
    tf = textbox(s, bar_x + bar_max + 0.10, row - 0.015, 0.45, 0.24)
    para(tf, str(n), size=9.2, bold=True, color=INK, first=True, line=1.0)
    row += 0.28

# right: shipped / open
rx = ML + 6.16
rw = CW - 6.16
card(s, rx, 2.06, rw, 1.90, fill=GREEN_LT, line=None)
rect(s, rx, 2.06, 0.055, 1.90, fill=GREEN)
tf = textbox(s, rx + 0.26, 2.22, rw - 0.5, 0.28)
para(tf, "SHIPPED IN THIS PASS", size=9.3, bold=True, color=GREEN, first=True)
tf = textbox(s, rx + 0.26, 2.54, rw - 0.5, 1.30)
bullets(tf, [
    "Cross-tenant reads now 404 across 30+ endpoints, in both DB and degraded mode",
    "No credential hash leaves the API \u2014 explicit projections, 9 regression tests",
    "Child portal works for a child created at runtime (was a blanket 401)",
    "Quiz cache keyed by owner + child \u2014 no cross-account quiz reuse",
    "6 screens no longer report success for a failed request",
], size=9.5, gap=4)

card(s, rx, 4.10, rw, 1.62, fill=AMBER_LT, line=None)
rect(s, rx, 4.10, 0.055, 1.62, fill=AMBER)
tf = textbox(s, rx + 0.26, 4.24, rw - 0.5, 0.28)
para(tf, "STILL OPEN", size=9.3, bold=True, color=AMBER, first=True)
tf = textbox(s, rx + 0.26, 4.54, rw - 0.5, 1.10)
bullets(tf, [
    "Playwright e2e not re-run since the last four changes (was 10/10 green)",
    "Email delivery is still a console mock \u2014 no SMTP yet",
    "Access-token TTL is 7 days, not the 15 min the docs target",
    "Rate limiting is per instance, not distributed",
], size=9.5, gap=4)

# bottom: product features strip
section_label(s, ML, 5.90, CW, "The product in five features")
FEATS = [
    ("Notes \u2192 AI", "Upload notes; the server structures them with the AI engine."),
    ("Quiz generation", "Quizzes built from the child\u2019s own notes and weak topics."),
    ("Learning log", "Daily entries, with parent-only verification of the record."),
    ("Dashboard KPIs", "Study time, subject mastery, score trend, consistency."),
    ("Child mode", "PIN entry, own-data only, sibling isolation, parent exit."),
]
fw = (CW - 4 * 0.16) / 5
for i, (t, d) in enumerate(FEATS):
    x = ML + i * (fw + 0.16)
    card(s, x, 6.18, fw, 0.64, fill=PAPER, line=LINE)
    rect(s, x, 6.18, 0.05, 0.64, fill=INDIGO)
    tf = textbox(s, x + 0.20, 6.26, fw - 0.34, 0.50)
    para(tf, t, size=10.2, bold=True, color=INK, first=True, line=1.0)
    para(tf, d, size=8.1, color=INK_SOFT, space_before=2, line=1.1)

# ----------------------------------------------------------------------------
prs.save(OUT)
print("Saved:", OUT)
print("Slides:", len(prs.slides.__iter__.__self__._sldIdLst))
