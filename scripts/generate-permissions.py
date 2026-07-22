#!/usr/bin/env python3
import json
import pathlib
import sys
import urllib.parse
import urllib.request


ORG = "henosis-playground"
ROOT = pathlib.Path(__file__).resolve().parents[1]
TOKEN_PATH = ROOT / "secrets" / "github-pat.txt"
OUTPUT_DIR = ROOT / "permissions"


def github_get(token, url):
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "henosis-permissions-generator",
        },
    )
    with urllib.request.urlopen(request) as response:
        payload = json.loads(response.read().decode("utf-8"))
        links = response.headers.get("Link", "")
    return payload, links


def next_link(link_header):
    for item in link_header.split(","):
        parts = item.strip().split(";")
        if len(parts) != 2:
            continue
        url = parts[0].strip()
        rel = parts[1].strip()
        if rel == 'rel="next"' and url.startswith("<") and url.endswith(">"):
            return url[1:-1]
    return None


def org_members(token):
    url = f"https://api.github.com/orgs/{urllib.parse.quote(ORG)}/members?per_page=100"
    members = []
    while url:
        page, links = github_get(token, url)
        members.extend(page)
        url = next_link(links)
    return sorted(members, key=lambda member: member["login"].lower())


def permission_payload(members):
    return {
        "people": [],
        "github_users": [member["login"] for member in members],
        "discord_ids": [],
        "github_ids": [member["id"] for member in members],
    }


def people_payload(members):
    return {
        "people": {
            member["login"]: {
                "name": member.get("name") or member["login"],
                "github_id": member["id"],
                "github_sponsors": False,
            }
            for member in members
        }
    }


def teams_payload(members):
    return {
        "all": {
            "name": "all",
            "kind": "team",
            "members": [member["login"] for member in members],
            "alumni": [],
            "roles": [],
        }
    }


def write_json(path, payload):
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")


def main():
    token = TOKEN_PATH.read_text().strip()
    members = org_members(token)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    permissions = permission_payload(members)
    write_json(OUTPUT_DIR / "bors.review.json", permissions)
    write_json(OUTPUT_DIR / "bors.try.json", permissions)
    write_json(OUTPUT_DIR / "people.json", people_payload(members))
    write_json(OUTPUT_DIR / "teams.json", teams_payload(members))

    print(f"Wrote permissions for {len(members)} org member(s) to {OUTPUT_DIR}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"permission generation failed: {error}", file=sys.stderr)
        raise
