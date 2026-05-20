import requests
import time
import json
import subprocess
from pathlib import Path

BASE = "http://localhost:8002/api/v1"
PHONE = "+79296544335"

def otp_send():
    r = requests.post(f"{BASE}/auth/otp/send", json={"phone": PHONE})
    print(f"[1] OTP send: {r.status_code} - {r.json()}")
    return r.status_code == 200

def otp_verify(code):
    r = requests.post(f"{BASE}/auth/otp/verify", json={"phone": PHONE, "code": code})
    print(f"[2] OTP verify: {r.status_code}")
    if r.status_code == 200:
        return r.json()["access_token"]
    print(r.text)
    return None

def create_project(token):
    headers = {"Authorization": f"Bearer {token}"}
    body = {"title": "E2E Test Wall", "room_type": "bathroom", "surface_type": "wall"}
    r = requests.post(f"{BASE}/projects/", headers=headers, json=body)
    print(f"[3] Create project: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"    ID: {data['id']}")
        return data["id"]
    print(r.text)
    return None

def list_projects(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE}/projects/", headers=headers)
    print(f"[4] List projects: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"    Total: {data['total']}, Items: {len(data['items'])}")
        for p in data["items"][:3]:
            print(f"    - {p['id'][:8]} | {p.get('title','')} | {p['status']}")
        return data
    print(r.text)
    return None

def _make_test_image(seed=42):
    """Create a realistic tile-like image with defects"""
    from PIL import Image, ImageDraw
    import io, random
    random.seed(seed)
    
    img = Image.new('RGB', (640, 480), color=(220, 220, 220))
    draw = ImageDraw.Draw(img)
    
    # Draw tile grid
    tile_w, tile_h = 80, 60
    for row in range(0, 480, tile_h):
        for col in range(0, 640, tile_w):
            base = random.randint(200, 240)
            color = (base, base, base + random.randint(-10, 10))
            draw.rectangle(
                [col, row, col + tile_w - 2, row + tile_h - 2],
                fill=color, outline=(180, 180, 180), width=1
            )
    
    # Add defect-like features
    for _ in range(5):
        x, y = random.randint(50, 590), random.randint(50, 430)
        r = random.randint(8, 20)
        draw.ellipse([x-r, y-r, x+r, y+r], fill=(120, 120, 120), outline=(100, 100, 100))
    
    for _ in range(3):
        x1, y1 = random.randint(0, 640), random.randint(0, 480)
        x2, y2 = x1 + random.randint(-100, 100), y1 + random.randint(-100, 100)
        draw.line([(x1, y1), (x2, y2)], fill=(60, 60, 60), width=2)
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    buf.seek(0)
    return buf

def upload_photos(token, project_id):
    """Upload 3 photos: front, left_30, right_30"""
    headers = {"Authorization": f"Bearer {token}"}
    angles = ["front", "left_30", "right_30"]
    
    for i, angle in enumerate(angles):
        buf = _make_test_image(seed=42 + i)
        files = {"file": (f"test_{angle}.jpg", buf, "image/jpeg")}
        data = {"angle": angle}
        
        r = requests.post(
            f"{BASE}/projects/{project_id}/photos",
            headers=headers,
            files=files,
            data=data
        )
        print(f"[5.{i+1}] Upload photo ({angle}): {r.status_code}")
        if r.status_code != 200:
            print(r.text)
            return False
    
    print("    All 3 photos uploaded")
    return True

def start_analysis(token, project_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.post(f"{BASE}/analysis/start", headers=headers, json={"project_id": project_id})
    print(f"[6] Start analysis: {r.status_code}")
    if r.status_code == 200:
        return r.json()
    print(r.text)
    return None

def get_analysis(token, project_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE}/analysis/{project_id}", headers=headers)
    print(f"[7] Get analysis: {r.status_code}")
    if r.status_code == 200:
        return r.json()
    print(r.text)
    return None

def test_delete(token, project_id):
    """Test DELETE endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.delete(f"{BASE}/projects/{project_id}", headers=headers)
    print(f"[DEL] Delete project: {r.status_code}")
    return r.status_code in (200, 204)

def run():
    print("=== E2E Test ===\n")
    
    # Step 1: Send OTP
    if not otp_send():
        return
    
    # Step 2: Get code from docker logs
    time.sleep(1)
    logs = subprocess.run(
        ["docker", "logs", "stroikontrol-api", "--tail", "3"],
        capture_output=True, text=True
    )
    code = None
    for line in logs.stdout.split("\n"):
        if "[SMS MOCK]" in line:
            code = line.split("Your code is ")[-1].strip()
            print(f"    Found code: {code}")
            break
    
    if not code:
        print("ERROR: Could not find OTP code in logs")
        return
    
    # Step 3: Verify
    token = otp_verify(code)
    if not token:
        return
    
    # Step 4: Create project
    project_id = create_project(token)
    if not project_id:
        return
    
    # Step 5: List (verify it exists)
    list_projects(token)
    
    # Step 6: Test DELETE
    print("\n    --- Testing DELETE ---")
    deleted = test_delete(token, project_id)
    if deleted:
        print("    ✅ Project deleted successfully")
    else:
        print("    ❌ Delete failed")
    
    # Step 7: Verify deletion (list again)
    print("\n    --- Verifying deletion ---")
    list_projects(token)
    
    print("\n=== E2E Complete ===")

if __name__ == "__main__":
    run()
