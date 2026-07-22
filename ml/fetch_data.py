"""Step 1d: loop over Gen 1 (1-151) and write the results to a CSV."""
import urllib.request
import json
import time
import csv
import os

STAT_ORDER = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"]
OUT_PATH = os.path.join(os.path.dirname(__file__), "data", "pokemon_stats.csv")


def fetch_pokemon(pokemon_id: int) -> dict:
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "pokedex-ml-tutorial/0.1"}) #builds a request object without sending it
    #headers are metadata sent alongsign the request, User-Agent is a specific header that tells the server what kind of client is making the request
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    stats_by_name = {s["stat"]["name"]: s["base_stat"] for s in data["stats"]}
    types = [t["type"]["name"] for t in sorted(data["types"], key=lambda t: t["slot"])]

    row = {"id": pokemon_id, "name": data["name"], "primary_type": types[0]}
    row["secondary_type"] = types[1] if len(types) > 1 else ""
    for stat_name in STAT_ORDER:
        row[stat_name] = stats_by_name[stat_name]
    return row


rows = []
for pokemon_id in range(1, 152):
    row = fetch_pokemon(pokemon_id)
    rows.append(row)
    print(f"#{row['id']:03d} {row['name']:<12} type={row['primary_type']:<10} hp={row['hp']}")
    time.sleep(0.05)

fieldnames = ["id", "name", "primary_type", "secondary_type"] + STAT_ORDER
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nWrote {len(rows)} rows to {OUT_PATH}")
