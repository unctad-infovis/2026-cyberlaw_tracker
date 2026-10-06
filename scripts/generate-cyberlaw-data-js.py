#!/usr/bin/env python3
"""Generate public/assets/data/CyberlawData.js from public/assets/data/data.csv.

CyberlawData.js is a <script>-loadable export of this tracker's data for another
(non-React) UNCTAD page: it sets two globals, `currentData2` (ISO2-keyed per-country
legislation-status arrays + a credit line) and `statistics` (aggregate legislation
counts for a fixed set of groups). Run via `npm run generate-cyberlaw-data`, and
automatically before every `npm run build` (see package.json "prebuild").
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "public" / "assets" / "data" / "data.csv"
META_PATH = ROOT / "src" / "meta.json"
OUT_PATH = ROOT / "public" / "assets" / "data" / "CyberlawData.js"

LAWS = ["Electronic Transactions", "Consumer Protection", "Privacy and Data Protection", "Cybercrime", "Indirect Taxation"]
STATUS_CODE = {"No Data": 0, "Legislation": 1, "Draft Legislation": 2, "No Legislation": 3}
STATUS_LABEL = {"No Data": "No data", "Legislation": "Legislation", "Draft Legislation": "Draft Legislation", "No Legislation": "No Legislation"}

# Groups mirror the consuming page's own fixed set (not the tracker's full 10-region
# list): label -> CLT region column, or None for "all economies".
GROUPS = [
    ("Total", None),
    ("Africa", "Africa"),
    ("Asia-Pacific", "Asia and Oceania"),
    ("LDCs", "Least developed countries"),
    ("SIDS", "Small island developing states"),
    ("LLDCs", "Landlocked developing countries"),
    ("latinamericacaribbean", "Latin America and Caribbean"),
    ("Developedcountries", "Developed countries"),
]

# UN M49 numeric code (this tracker's "code" column) -> ISO 3166-1 alpha-2.
# Derived and verified 1:1 (195/195, no collisions) against the Cyberlaw Tracker's
# own country list.
M49_TO_ISO2 = {
    "004": "AF", "008": "AL", "012": "DZ", "020": "AD", "024": "AO", "028": "AG",
    "031": "AZ", "032": "AR", "036": "AU", "040": "AT", "044": "BS", "048": "BH",
    "050": "BD", "051": "AM", "052": "BB", "056": "BE", "064": "BT", "068": "BO",
    "070": "BA", "072": "BW", "076": "BR", "084": "BZ", "090": "SB", "096": "BN",
    "100": "BG", "104": "MM", "108": "BI", "112": "BY", "116": "KH", "120": "CM",
    "124": "CA", "132": "CV", "140": "CF", "144": "LK", "148": "TD", "152": "CL",
    "156": "CN", "170": "CO", "174": "KM", "178": "CG", "180": "CD", "188": "CR",
    "191": "HR", "192": "CU", "196": "CY", "203": "CZ", "204": "BJ", "208": "DK",
    "212": "DM", "214": "DO", "218": "EC", "222": "SV", "226": "GQ", "231": "ET",
    "232": "ER", "233": "EE", "242": "FJ", "246": "FI", "250": "FR", "262": "DJ",
    "266": "GA", "268": "GE", "270": "GM", "275": "PS", "276": "DE", "288": "GH",
    "296": "KI", "300": "GR", "308": "GD", "320": "GT", "324": "GN", "328": "GY",
    "332": "HT", "336": "VA", "340": "HN", "348": "HU", "352": "IS", "356": "IN",
    "360": "ID", "364": "IR", "368": "IQ", "372": "IE", "376": "IL", "380": "IT",
    "384": "CI", "388": "JM", "392": "JP", "398": "KZ", "400": "JO", "404": "KE",
    "408": "KP", "410": "KR", "414": "KW", "417": "KG", "418": "LA", "422": "LB",
    "426": "LS", "428": "LV", "430": "LR", "434": "LY", "438": "LI", "440": "LT",
    "442": "LU", "450": "MG", "454": "MW", "458": "MY", "462": "MV", "466": "ML",
    "470": "MT", "478": "MR", "480": "MU", "484": "MX", "492": "MC", "496": "MN",
    "498": "MD", "499": "ME", "504": "MA", "508": "MZ", "512": "OM", "516": "NA",
    "520": "NR", "524": "NP", "528": "NL", "548": "VU", "554": "NZ", "558": "NI",
    "562": "NE", "566": "NG", "578": "NO", "583": "FM", "584": "MH", "585": "PW",
    "586": "PK", "591": "PA", "598": "PG", "600": "PY", "604": "PE", "608": "PH",
    "616": "PL", "620": "PT", "624": "GW", "626": "TL", "634": "QA", "642": "RO",
    "643": "RU", "646": "RW", "659": "KN", "662": "LC", "670": "VC", "674": "SM",
    "678": "ST", "682": "SA", "686": "SN", "688": "RS", "690": "SC", "694": "SL",
    "702": "SG", "703": "SK", "704": "VN", "705": "SI", "706": "SO", "710": "ZA",
    "716": "ZW", "724": "ES", "728": "SS", "729": "SD", "740": "SR", "748": "SZ",
    "752": "SE", "756": "CH", "760": "SY", "762": "TJ", "764": "TH", "768": "TG",
    "776": "TO", "780": "TT", "784": "AE", "788": "TN", "792": "TR", "795": "TM",
    "798": "TV", "800": "UG", "804": "UA", "807": "MK", "818": "EG", "826": "GB",
    "834": "TZ", "840": "US", "854": "BF", "858": "UY", "860": "UZ", "862": "VE",
    "882": "WS", "887": "YE", "894": "ZM",
}


def js_str(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def dump(obj) -> str:
    if isinstance(obj, dict):
        return "{" + ",".join(f"{js_str(k)}:{dump(v)}" for k, v in obj.items()) + "}"
    if isinstance(obj, list):
        return "[" + ",".join(dump(v) for v in obj) + "]"
    if isinstance(obj, str):
        return js_str(obj)
    return json.dumps(obj)


def main() -> int:
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    header, body = rows[0], rows[1:]
    idx = {name: i for i, name in enumerate(header)}

    countries = {}
    for row in body:
        code = row[idx["code"]]
        iso2 = M49_TO_ISO2[code]
        countries[iso2] = [STATUS_CODE[row[idx[law]]] for law in LAWS]

    meta = json.loads(META_PATH.read_text())
    year, month, day = meta["updated_file"].split("-")
    credit_text = f"Source: UNCTAD, {day}/{month}/{year}"

    statistics = []
    for label, column in GROUPS:
        members = body if column is None else [r for r in body if r[idx[column]] == "1"]
        counts = {status: {law: 0 for law in LAWS} for status in STATUS_CODE}
        for row in members:
            for law in LAWS:
                counts[row[idx[law]]][law] += 1
        statistics.append({
            label: {
                "Data": {STATUS_LABEL[status]: counts[status] for status in STATUS_CODE},
                "count": len(members),
                "label": label,
            }
        })

    out = (
        f"var currentData2 = {{ creditText: {js_str(credit_text)}, countries: {dump(countries)} }};"
        f"let statistics = {dump(statistics)};\n"
    )
    OUT_PATH.write_text(out, encoding="utf-8")
    print(f"wrote {OUT_PATH} ({len(countries)} economies, {len(statistics)} groups)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
