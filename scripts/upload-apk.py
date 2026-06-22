import os
import sys
import json
import re
import urllib.request
import urllib.error

REPO = "shivam238/attendance-system"
FILE_PATH = "ATTENDIFY.apk"
FILE_NAME = "ATTENDIFY.apk"

def get_github_token():
    # Try to find a GitHub token (ghp_...) in ~/.git-credentials
    creds_path = os.path.expanduser("~/.git-credentials")
    if os.path.exists(creds_path):
        try:
            with open(creds_path, "r") as f:
                content = f.read()
                match = re.search(r"ghp_[a-zA-Z0-9]{36}", content)
                if match:
                    return match.group(0)
        except Exception as e:
            print(f"Warning: Could not read ~/.git-credentials: {e}")
            
    # Fallback to env variable
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        return token
        
    print("Error: GitHub token not found in ~/.git-credentials or GITHUB_TOKEN env var.")
    sys.exit(1)

TOKEN = get_github_token()

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    headers["Authorization"] = f"token {TOKEN}"
    headers["Accept"] = "application/vnd.github.v3+json"
    
    req = urllib.request.Request(url, headers=headers, method=method, data=data)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        sys.exit(1)

def main():
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} does not exist.")
        sys.exit(1)

    print("Fetching latest release info...")
    status, body = make_request(f"https://api.github.com/repos/{REPO}/releases/latest")
    release = json.loads(body.decode("utf-8"))
    release_id = release["id"]
    tag_name = release["tag_name"]
    print(f"Latest release found: {tag_name} (ID: {release_id})")

    # Check if ATTENDIFY.apk already exists in assets
    existing_asset_id = None
    for asset in release.get("assets", []):
        if asset["name"] == FILE_NAME:
            existing_asset_id = asset["id"]
            break

    if existing_asset_id:
        print(f"Existing asset '{FILE_NAME}' found (ID: {existing_asset_id}). Deleting it...")
        delete_url = f"https://api.github.com/repos/{REPO}/releases/assets/{existing_asset_id}"
        status, _ = make_request(delete_url, method="DELETE")
        if status in (204, 200):
            print("Successfully deleted existing asset.")
        else:
            print("Failed to delete existing asset.")
            sys.exit(1)

    print(f"Uploading new '{FILE_NAME}'...")
    upload_url = f"https://uploads.github.com/repos/{REPO}/releases/{release_id}/assets?name={FILE_NAME}"
    
    # Read file data
    with open(FILE_PATH, "rb") as f:
        file_data = f.read()

    headers = {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": str(len(file_data))
    }
    
    status, body = make_request(upload_url, method="POST", headers=headers, data=file_data)
    if status == 201:
        print("Successfully uploaded new asset to latest release!")
    else:
        print(f"Failed to upload asset. Status: {status}")
        sys.exit(1)

if __name__ == "__main__":
    main()
