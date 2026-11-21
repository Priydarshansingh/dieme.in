#!/usr/bin/env python3
"""
Dieme Ecosystem Automated Release & Version Engine
Usage:
    python3 scripts/release.py [--bump patch|minor|major|none] [--version X.Y.Z] [--code N] [--notes "Release notes"] [--skip-build] [--skip-push]
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import zipfile

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FILES = {
    "version_root": os.path.join(WORKSPACE_ROOT, "VERSION"),
    "version_json": os.path.join(WORKSPACE_ROOT, "version.json"),
    "web_version_json": os.path.join(WORKSPACE_ROOT, "dieme-web", "public", "version.json"),
    "web_version_route": os.path.join(WORKSPACE_ROOT, "dieme-web", "src", "app", "api", "version", "route.ts"),
    "dieme_gradle": os.path.join(WORKSPACE_ROOT, "dieme-android", "app", "build.gradle.kts"),
    "dg_gradle": os.path.join(WORKSPACE_ROOT, "dg-images", "app", "build.gradle.kts"),
    "release_rules": os.path.join(WORKSPACE_ROOT, "RELEASE_RULES.md"),
    "download_dir": os.path.join(WORKSPACE_ROOT, "download"),
    "dieme_debug_apk": os.path.join(WORKSPACE_ROOT, "dieme-android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    "dg_debug_apk": os.path.join(WORKSPACE_ROOT, "dg-images", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
    "dieme_target_apk": os.path.join(WORKSPACE_ROOT, "download", "dieme-app-latest.apk"),
    "digicast_target_apk": os.path.join(WORKSPACE_ROOT, "download", "digicast-app-latest.apk"),
    "dg_target_apk": os.path.join(WORKSPACE_ROOT, "download", "dg-images-latest.apk"),
    "suite_zip": os.path.join(WORKSPACE_ROOT, "download", "dieme-suite-complete.zip"),
}

def log(msg):
    print(f"[RELEASE ENGINE] {msg}")

def run_cmd(cmd, cwd=WORKSPACE_ROOT, check=True):
    log(f"$ {cmd} (cwd={os.path.basename(cwd)})")
    res = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    if check and res.returncode != 0:
        print(f"Error running command: {cmd}")
        print("STDERR:\n" + res.stderr)
        print("STDOUT:\n" + res.stdout)
        sys.exit(res.returncode)
    return res

def read_current_version():
    with open(FILES["version_json"], "r", encoding="utf-8") as f:
        data = json.load(f)
    dieme_info = data.get("dieme", {})
    current_code = dieme_info.get("versionCode", 1)
    current_name = dieme_info.get("versionName", "1.0.0")
    return current_code, current_name, data

def calculate_next_version(current_code, current_name, bump_type, custom_name=None, custom_code=None):
    if custom_code is not None:
        next_code = custom_code
    elif bump_type == "none":
        next_code = current_code
    else:
        next_code = current_code + 1

    if custom_name is not None:
        next_name = custom_name
    elif bump_type == "none":
        next_name = current_name
    else:
        parts = [int(p) for p in current_name.split(".")]
        while len(parts) < 3:
            parts.append(0)
        major, minor, patch = parts[0], parts[1], parts[2]
        if bump_type == "major":
            major += 1
            minor = 0
            patch = 0
        elif bump_type == "minor":
            minor += 1
            patch = 0
        else: # patch
            patch += 1
        next_name = f"{major}.{minor}.{patch}"

    return next_code, next_name

def update_version_files(new_code, new_name, notes_dieme, notes_dg, one_line_summary):
    today_str = datetime.date.today().isoformat()
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    log(f"Updating all version registries to v{new_name} (Build {new_code})...")

    # 1. VERSION root
    with open(FILES["version_root"], "w", encoding="utf-8") as f:
        f.write(f"{new_name}\n")
    log("✓ Updated VERSION")

    # 2. version.json & web version.json
    version_payload = {
        "dieme": {
            "versionCode": new_code,
            "versionName": new_name,
            "minSupportedVersionCode": 1,
            "releaseNotes": notes_dieme,
            "downloadUrl": "https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk",
            "releaseDate": today_str,
            "publishedAt": now_iso
        },
        "dgImages": {
            "versionCode": new_code,
            "versionName": new_name,
            "minSupportedVersionCode": 1,
            "releaseNotes": notes_dg,
            "downloadUrl": "https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk",
            "releaseDate": today_str,
            "publishedAt": now_iso
        }
    }

    formatted_json = json.dumps(version_payload, indent=2) + "\n"
    with open(FILES["version_json"], "w", encoding="utf-8") as f:
        f.write(formatted_json)
    log("✓ Updated version.json")

    os.makedirs(os.path.dirname(FILES["web_version_json"]), exist_ok=True)
    with open(FILES["web_version_json"], "w", encoding="utf-8") as f:
        f.write(formatted_json)
    log("✓ Updated dieme-web/public/version.json")

    # 3. dieme-web/src/app/api/version/route.ts
    escaped_notes_dieme = notes_dieme.replace("`", "\\`")
    escaped_notes_dg = notes_dg.replace("`", "\\`")
    route_content = f"""import {{ NextRequest, NextResponse }} from 'next/server';

const VERSION_METADATA = {{
  dieme: {{
    versionCode: {new_code},
    versionName: '{new_name}',
    minSupportedVersionCode: 1,
    releaseNotes:
      `{escaped_notes_dieme}`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '{today_str}',
    publishedAt: '{now_iso}',
  }},
  dgImages: {{
    versionCode: {new_code},
    versionName: '{new_name}',
    minSupportedVersionCode: 1,
    releaseNotes:
      `{escaped_notes_dg}`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '{today_str}',
    publishedAt: '{now_iso}',
  }},
}};

export async function GET(req: NextRequest) {{
  const {{ searchParams }} = new URL(req.url);
  const app = (searchParams.get('app') || '').toLowerCase();

  let body: unknown = VERSION_METADATA;
  if (app === 'dieme' || app === 'core' || app === 'app') {{
    body = VERSION_METADATA.dieme;
  }} else if (app === 'dgimages' || app === 'dg-images' || app === 'thumbnail') {{
    body = VERSION_METADATA.dgImages;
  }}

  return NextResponse.json(body, {{
    status: 200,
    headers: {{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }},
  }});
}}

export async function OPTIONS() {{
  return new NextResponse(null, {{
    status: 204,
    headers: {{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }},
  }});
}}
"""
    with open(FILES["web_version_route"], "w", encoding="utf-8") as f:
        f.write(route_content)
    log("✓ Updated dieme-web/src/app/api/version/route.ts")

    # 4. dieme-android/app/build.gradle.kts
    with open(FILES["dieme_gradle"], "r", encoding="utf-8") as f:
        dieme_gradle_content = f.read()
    dieme_gradle_content = re.sub(r'versionCode\s*=\s*\d+', f'versionCode = {new_code}', dieme_gradle_content, count=1)
    dieme_gradle_content = re.sub(r'versionName\s*=\s*"[^"]+"', f'versionName = "{new_name}"', dieme_gradle_content, count=1)
    with open(FILES["dieme_gradle"], "w", encoding="utf-8") as f:
        f.write(dieme_gradle_content)
    log("✓ Updated dieme-android/app/build.gradle.kts")

    # 5. dg-images/app/build.gradle.kts
    with open(FILES["dg_gradle"], "r", encoding="utf-8") as f:
        dg_gradle_content = f.read()
    dg_gradle_content = re.sub(r'versionCode\s*=\s*\d+', f'versionCode = {new_code}', dg_gradle_content, count=1)
    dg_gradle_content = re.sub(r'versionName\s*=\s*"[^"]+"', f'versionName = "{new_name}"', dg_gradle_content, count=1)
    with open(FILES["dg_gradle"], "w", encoding="utf-8") as f:
        f.write(dg_gradle_content)
    log("✓ Updated dg-images/app/build.gradle.kts")

    # 6. RELEASE_RULES.md
    with open(FILES["release_rules"], "r", encoding="utf-8") as f:
        rules_content = f.read()

    new_row = f"| `v{new_name}` | {new_code} | {new_name} | {today_str} | {one_line_summary} |"
    if f"`v{new_name}`" not in rules_content:
        # Insert after the table header
        table_marker = "| :--- | :--- | :--- | :--- | :--- |"
        if table_marker in rules_content:
            rules_content = rules_content.replace(table_marker, f"{table_marker}\n{new_row}")
            with open(FILES["release_rules"], "w", encoding="utf-8") as f:
                f.write(rules_content)
            log("✓ Updated RELEASE_RULES.md Release Registry Table")
        else:
            log("⚠ Could not locate Release Registry Table marker in RELEASE_RULES.md")
    else:
        log("ℹ Version already listed in RELEASE_RULES.md")

def build_and_package():
    log("Building dieme-android debug APK...")
    run_cmd("./gradlew assembleDebug", cwd=os.path.join(WORKSPACE_ROOT, "dieme-android"))

    log("Building dg-images debug APK...")
    run_cmd("./gradlew assembleDebug", cwd=os.path.join(WORKSPACE_ROOT, "dg-images"))

    os.makedirs(FILES["download_dir"], exist_ok=True)

    log("Copying generated APK binaries to distribution folder...")
    if os.path.exists(FILES["dieme_debug_apk"]):
        import shutil
        shutil.copy2(FILES["dieme_debug_apk"], FILES["dieme_target_apk"])
        shutil.copy2(FILES["dieme_debug_apk"], FILES["digicast_target_apk"])
        log(f"✓ Copied Dieme APK ({os.path.getsize(FILES['dieme_target_apk'])} bytes)")
    else:
        log(f"❌ Error: Dieme debug APK not found at {FILES['dieme_debug_apk']}")
        sys.exit(1)

    if os.path.exists(FILES["dg_debug_apk"]):
        import shutil
        shutil.copy2(FILES["dg_debug_apk"], FILES["dg_target_apk"])
        log(f"✓ Copied DgImages APK ({os.path.getsize(FILES['dg_target_apk'])} bytes)")
    else:
        log(f"❌ Error: DgImages debug APK not found at {FILES['dg_debug_apk']}")
        sys.exit(1)

    # Also copy to 'build output' folder if it exists
    build_output_dir = os.path.join(WORKSPACE_ROOT, "build output")
    if os.path.isdir(build_output_dir):
        shutil.copy2(FILES["dieme_target_apk"], os.path.join(build_output_dir, "app-debug.apk"))
        log(f"✓ Copied latest APK to 'build output/app-debug.apk'")

    log("Packaging download/dieme-suite-complete.zip...")
    with zipfile.ZipFile(FILES["suite_zip"], "w", zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(FILES["dieme_target_apk"], arcname="dieme-app-latest.apk")
        zipf.write(FILES["dg_target_apk"], arcname="dg-images-latest.apk")
    log(f"✓ Created suite archive ({os.path.getsize(FILES['suite_zip'])} bytes)")

def git_commit_and_push(new_code, new_name, one_line_summary, skip_push=False):
    log("Staging modified files for Git commit...")
    run_cmd("git add -A")

    commit_msg = f"feat(release): v{new_name} (Build {new_code}) - {one_line_summary}"
    log(f"Committing: {commit_msg}")
    run_cmd(f'git commit -m "{commit_msg}"')

    tag_name = f"v{new_name}"
    log(f"Creating Git tag: {tag_name}")
    # Force or delete if tag exists locally
    run_cmd(f'git tag -f -a {tag_name} -m "Release {tag_name} (Build {new_code})"')

    if skip_push:
        log("Push skipped (--skip-push provided).")
        return

    log("Pushing commit and tags to origin...")
    run_cmd("git push origin main")
    run_cmd(f"git push origin {tag_name} --force")

    # Sync to distro-final and distribution repos
    log("Synchronizing to distro-final and distribution repositories...")
    try:
        run_cmd("git checkout distro-final")
        run_cmd("git checkout main -- download/ version.json RELEASE_RULES.md")
        run_cmd("git add download/ version.json RELEASE_RULES.md")
        run_cmd(f'git commit -m "feat(release): v{new_name} (Build {new_code}) update distribution APKs and version metadata"')
        run_cmd("git push diemein distro-final:main --tags --force", check=False)
        run_cmd("git push digicast distro-final:main --tags --force", check=False)
    except Exception as e:
        log(f"Notice: Distribution repo push had warnings: {e}")
    finally:
        run_cmd("git checkout main")

    log("✓ Successfully pushed release to GitHub!")

def main():
    parser = argparse.ArgumentParser(description="Dieme Release & Versioning Engine")
    parser.add_argument("--bump", "-b", choices=["patch", "minor", "major", "none"], default="patch",
                        help="Semantic version bump type (default: patch)")
    parser.add_argument("--version", "-v", default=None, help="Explicit version name (e.g. 1.2.2)")
    parser.add_argument("--code", "-c", type=int, default=None, help="Explicit version code integer (e.g. 5)")
    parser.add_argument("--notes", "-m", default=None, help="Custom release notes string")
    parser.add_argument("--skip-build", action="store_true", help="Skip gradle APK compilation")
    parser.add_argument("--skip-push", action="store_true", help="Skip git push")
    parser.add_argument("--dry-run", action="store_true", help="Preview version calculation without disk writes")

    args = parser.parse_args()

    current_code, current_name, version_data = read_current_version()
    next_code, next_name = calculate_next_version(current_code, current_name, args.bump, args.version, args.code)

    log(f"Current Version: v{current_name} (Build {current_code})")
    log(f"Target Release:  v{next_name} (Build {next_code})")

    if args.dry_run:
        log("Dry run complete. No files changed.")
        return

    if args.notes:
        notes_dieme = args.notes
        notes_dg = args.notes
        one_line = args.notes.split("\n")[0].lstrip("•- ")
    else:
        notes_dieme = (
            "• Real-time in-app update checks on every app launch\n"
            "• Skippable update alert with session-based dismissal\n"
            "• 50MB disk caching in OkHttp client for high-performance offline resilience\n"
            "• Persistent YouTube channel clip markers & auth sync"
        )
        notes_dg = (
            "• Real-time in-app update checks on every app launch\n"
            "• Bulletproof ChatGPT image asset attachment retry engine & DataTransfer bridge\n"
            "• Extended 30s upload timeout with automated retry assignment\n"
            "• Minimalist top bar status indicator"
        )
        one_line = "Persistent in-app update checks on launch, attachment retry engine, and synchronized GitHub releases"

    update_version_files(next_code, next_name, notes_dieme, notes_dg, one_line)

    if not args.skip_build:
        build_and_package()
    else:
        log("Skipping native Android build (--skip-build).")

    git_commit_and_push(next_code, next_name, one_line, skip_push=args.skip_push)

    log("=" * 60)
    log(f"🎉 Release v{next_name} (Build {next_code}) successfully completed!")
    log("=" * 60)

if __name__ == "__main__":
    main()
