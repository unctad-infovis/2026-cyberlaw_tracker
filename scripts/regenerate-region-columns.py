#!/usr/bin/env python3
"""Regenerate the geographic region columns of public/assets/data/data.csv from the
authoritative UNCTADStat hierarchy (tmp/DimCountries_All_Hierarchy.xls, M49
"Countries, all groups hierarchy").

Two modes:

  python3 scripts/regenerate-region-columns.py
      Only rebuilds the existing "Asia and Oceania" column (fixes a fill-down
      error that flagged ~66 non-Asian/Pacific economies). Header unchanged.

  python3 scripts/regenerate-region-columns.py --with-new-regions
      Also appends two columns:
        Europe           -> economies under UNCTADStat Europe (M49 5400)
        Northern America -> Canada + United States only (per Cyberlaw Tracker scope;
                            Greenland folds into Denmark, other territories absent)

The .xls is a real BIFF8/OLE2 file; this script contains a tiny self-contained
reader (no xlrd/pandas/LibreOffice needed).
"""

import csv
import io
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
XLS = ROOT / "tmp" / "DimCountries_All_Hierarchy.xls"
CSV_PATH = ROOT / "public" / "assets" / "data" / "data.csv"

# Northern America in the Cyberlaw Tracker = Canada + United States only.
NORTHERN_AMERICA_CODES = {"124", "840"}


# --- minimal OLE2 (compound file) reader -------------------------------------
def read_workbook_stream(path: Path) -> bytes:
    data = path.read_bytes()
    if data[:8] != bytes.fromhex("d0cf11e0a1b11ae1"):
        raise ValueError("not an OLE2 .xls file")

    sect_shift = struct.unpack("<H", data[0x1E:0x20])[0]
    sec = 1 << sect_shift
    mini_shift = struct.unpack("<H", data[0x20:0x22])[0]
    minisec = 1 << mini_shift
    first_dir = struct.unpack("<I", data[0x30:0x34])[0]
    mini_cutoff = struct.unpack("<I", data[0x38:0x3C])[0]
    first_minifat = struct.unpack("<I", data[0x3C:0x40])[0]
    num_difat = struct.unpack("<I", data[0x48:0x4C])[0]
    first_difat = struct.unpack("<I", data[0x44:0x48])[0]

    def sector(sid: int) -> bytes:
        off = 512 + sid * sec
        return data[off:off + sec]

    difat = list(struct.unpack("<109I", data[0x4C:0x4C + 109 * 4]))
    sid = first_difat
    for _ in range(num_difat):
        entries = struct.unpack("<%dI" % (sec // 4), sector(sid))
        difat.extend(entries[:-1])
        sid = entries[-1]
        if sid in (0xFFFFFFFE, 0xFFFFFFFF):
            break

    fat = []
    for fs in difat:
        if fs in (0xFFFFFFFF, 0xFFFFFFFE):
            continue
        fat.extend(struct.unpack("<%dI" % (sec // 4), sector(fs)))

    def chain(start: int):
        out, s, seen = [], start, set()
        while s not in (0xFFFFFFFE, 0xFFFFFFFF) and s < len(fat) and s not in seen:
            seen.add(s)
            out.append(s)
            s = fat[s]
        return out

    def read_fat_stream(start: int, size: int) -> bytes:
        return b"".join(sector(s) for s in chain(start))[:size]

    dir_bytes = read_fat_stream(first_dir, len(chain(first_dir)) * sec)
    entries = []
    for i in range(0, len(dir_bytes), 128):
        e = dir_bytes[i:i + 128]
        if len(e) < 128:
            break
        nlen = struct.unpack("<H", e[64:66])[0]
        name = e[:max(nlen - 2, 0)].decode("utf-16-le", "replace") if nlen else ""
        etype = e[66]
        start = struct.unpack("<I", e[116:120])[0]
        ssize = struct.unpack("<Q", e[120:128])[0]
        entries.append((name, etype, start, ssize))

    root = next(e for e in entries if e[1] == 5)
    mini_stream = read_fat_stream(root[2], len(chain(root[2])) * sec)[:root[3]]
    minifat = []
    for s in chain(first_minifat):
        minifat.extend(struct.unpack("<%dI" % (sec // 4), sector(s)))

    def mini_chain(start: int):
        out, s, seen = [], start, set()
        while s not in (0xFFFFFFFE, 0xFFFFFFFF) and s < len(minifat) and s not in seen:
            seen.add(s)
            out.append(s)
            s = minifat[s]
        return out

    for name, _etype, st, sz in entries:
        if name in ("Workbook", "Book"):
            if sz >= mini_cutoff:
                return read_fat_stream(st, len(chain(st)) * sec)[:sz]
            return b"".join(
                mini_stream[m * minisec:(m + 1) * minisec] for m in mini_chain(st)
            )[:sz]
    raise ValueError("no Workbook stream")


# --- BIFF8 record walk: LABEL (0x0204) cells + ROW (0x0208) outline levels ---
def _xlstr(b: bytes, o: int) -> str:
    cch = struct.unpack("<H", b[o:o + 2])[0]
    grbit = b[o + 2]
    o += 3
    nrich = extsz = 0
    if grbit & 0x08:
        nrich = struct.unpack("<H", b[o:o + 2])[0]
        o += 2
    if grbit & 0x04:
        extsz = struct.unpack("<I", b[o:o + 4])[0]
        o += 4
    if grbit & 0x01:
        return b[o:o + cch * 2].decode("utf-16-le", "replace")
    return b[o:o + cch].decode("latin-1", "replace")


def parse_hierarchy(wb: bytes):
    """Return an ordered list of (outline_level, code, label)."""
    cells: dict[tuple[int, int], str] = {}
    level: dict[int, int] = {}
    i = 0
    while i + 4 <= len(wb):
        typ, ln = struct.unpack("<HH", wb[i:i + 4])
        body = wb[i + 4:i + 4 + ln]
        if typ == 0x0204:  # LABEL
            r, c, _ixfe = struct.unpack("<HHH", body[0:6])
            cells[(r, c)] = _xlstr(body, 6)
        elif typ == 0x0208:  # ROW
            r = struct.unpack("<H", body[0:2])[0]
            grbit = struct.unpack("<I", body[12:16])[0] if len(body) >= 16 else 0
            level[r] = grbit & 0x07
        i += 4 + ln

    seq = []
    for r in sorted({rr for (rr, _c) in cells}):
        code = cells.get((r, 2), "").strip()
        label = cells.get((r, 3), "").strip()
        if code or label:
            seq.append((level.get(r, 0), code, label))
    return seq


def is_country(code: str) -> bool:
    return code.isdigit() and len(code) == 3


def continent_sets(seq):
    """Country codes grouped by the nearest level-1 continent heading, taken from
    the first (pure M49) block that runs from '0000 World' up to code '5600'."""
    groups: dict[str, set] = {}
    current_l1 = None
    in_block = False
    for level, code, label in seq:
        if code == "0000" and label == "World":
            in_block = True
            continue
        if code == "5600":  # start of the combined "Asia and Oceania" re-grouping
            break
        if not in_block:
            continue
        if level == 1 and not is_country(code):
            current_l1 = label
            groups.setdefault(current_l1, set())
        elif is_country(code) and current_l1:
            groups[current_l1].add(code)
    return groups


def main() -> int:
    with_new = "--with-new-regions" in sys.argv[1:]

    wb = read_workbook_stream(XLS)
    seq = parse_hierarchy(wb)
    cont = continent_sets(seq)

    asia_oceania = cont.get("Asia", set()) | cont.get("Oceania", set())
    europe = cont.get("Europe", set())

    raw = CSV_PATH.read_bytes().decode("utf-8")
    # Preserve the source file's exact framing: CRLF row endings, no final newline.
    eol = "\r\n" if "\r\n" in raw else "\n"
    trailing_newline = raw.endswith(("\r\n", "\n"))
    rows = list(csv.reader(io.StringIO(raw)))
    header, body = rows[0], rows[1:]

    idx = {name: i for i, name in enumerate(header)}
    ao_i = idx["Asia and Oceania"]
    code_i = idx["code"]

    def norm(c: str) -> str:
        return c.zfill(3)

    clt_codes = {norm(r[code_i]) for r in body}

    new_header = list(header)
    if with_new and "Europe" not in idx:
        new_header += ["Europe", "Northern America"]

    out_rows = [new_header]
    part = {"Africa": 0, "Asia and Oceania": 0, "Europe": 0,
            "Latin America and Caribbean": 0, "Northern America": 0}
    af_i, la_i = idx["Africa"], idx["Latin America and Caribbean"]

    for r in body:
        r = list(r)
        code = norm(r[code_i])
        r[ao_i] = "1" if code in asia_oceania else "0"
        eu = "1" if code in europe else "0"
        na = "1" if code in NORTHERN_AMERICA_CODES else "0"
        if with_new:
            if "Europe" in idx:  # already present -> overwrite in place
                r[idx["Europe"]] = eu
                r[idx["Northern America"]] = na
            else:
                r += [eu, na]
        out_rows.append(r)

        part["Africa"] += r[af_i] == "1"
        part["Asia and Oceania"] += r[ao_i] == "1"
        part["Latin America and Caribbean"] += r[la_i] == "1"
        if with_new:
            part["Europe"] += eu == "1"
            part["Northern America"] += na == "1"

    # sanity: every economy in exactly one geographic region (only meaningful once
    # all five columns exist)
    if with_new:
        for r in out_rows[1:]:
            flags = [r[af_i], r[ao_i], r[la_i], r[-2], r[-1]]
            if flags.count("1") != 1:
                raise SystemExit(
                    f"economy {r[code_i]} {r[idx['country']]} has geo flags {flags}"
                )
        total = sum(part.values())
        print("geographic partition:", part, "sum =", total)
        assert total == len(body), (total, len(body))

    buf = io.StringIO()
    csv.writer(buf, lineterminator=eol).writerows(out_rows)
    text = buf.getvalue()
    if not trailing_newline:
        text = text[:-len(eol)]
    CSV_PATH.write_bytes(text.encode("utf-8"))

    print(f"Asia and Oceania members: {part['Asia and Oceania']} "
          f"(of {len(body)} economies)")
    if with_new:
        print(f"Europe members: {part['Europe']}")
        print(f"Northern America members: {part['Northern America']}")
    unknown = europe - clt_codes
    print(f"(hierarchy Europe nodes not in CLT, ignored: {len(unknown)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
