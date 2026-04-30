import os
import sys
import base64
import uuid
from pathlib import Path

# Load .env
env_file = Path(__file__).parent / ".env"
if not env_file.exists():
    print("Error: .env file not found")
    sys.exit(1)

env_vars = {}
with open(env_file, "r") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            env_vars[key.strip()] = value.strip()

DATABASE_URL = env_vars.get("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

# Parse DATABASE_URL
# Format: mysql+pymysql://user:password@host:port/database
try:
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 3306
    database = parsed.path.lstrip("/")
    
    import pymysql
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset="utf8mb4"
    )
    print(f"Connected to database: {database}")
except Exception as e:
    print(f"Error connecting to database: {e}")
    sys.exit(1)

cursor = conn.cursor()

# Create upload_images directory
static_dir = Path(__file__).parent / "static"
upload_images_dir = static_dir / "upload_images"
upload_images_dir.mkdir(parents=True, exist_ok=True)
print(f"Images directory: {upload_images_dir}")

# Recover courses
print("\n--- Recovering Courses ---")
cursor.execute("SELECT id, image_base64 FROM courses WHERE image_base64 IS NOT NULL AND image_base64 != ''")
courses = cursor.fetchall()

course_count = 0
for course_id, image_base64 in courses:
    if not image_base64:
        continue
    
    try:
        filename = f"{uuid.uuid4().hex}.png"
        file_path = upload_images_dir / filename
        
        if file_path.exists():
            print(f"  Course {course_id}: already exists, skip")
            continue
        
        # Decode base64
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        image_data = base64.b64decode(image_base64)
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        image_url = f"/static/upload_images/{filename}"
        cursor.execute("UPDATE courses SET image = %s WHERE id = %s", (image_url, course_id))
        
        course_count += 1
        print(f"  Course {course_id}: recovered -> {filename}")
        
    except Exception as e:
        print(f"  Course {course_id}: error - {e}")

conn.commit()
print(f"Total courses recovered: {course_count}")

# Recover occupations
print("\n--- Recovering Occupations ---")
cursor.execute("SELECT id, anzsco_code, image_base64 FROM occupations WHERE image_base64 IS NOT NULL AND image_base64 != ''")
occupations = cursor.fetchall()

occupation_count = 0
for occ_id, anzsco_code, image_base64 in occupations:
    if not image_base64:
        continue
    
    try:
        filename = f"{uuid.uuid4().hex}.png"
        file_path = upload_images_dir / filename
        
        if file_path.exists():
            print(f"  Occupation {occ_id} ({anzsco_code}): already exists, skip")
            continue
        
        # Decode base64
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        image_data = base64.b64decode(image_base64)
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        image_url = f"/static/upload_images/{filename}"
        cursor.execute("UPDATE occupations SET image = %s WHERE id = %s", (image_url, occ_id))
        
        occupation_count += 1
        print(f"  Occupation {occ_id} ({anzsco_code}): recovered -> {filename}")
        
    except Exception as e:
        print(f"  Occupation {occ_id}: error - {e}")

conn.commit()
print(f"Total occupations recovered: {occupation_count}")

# Summary
print("\n=== Recovery Summary ===")
print(f"Courses: {course_count}")
print(f"Occupations: {occupation_count}")
print(f"Total: {course_count + occupation_count}")

cursor.close()
conn.close()
print("\nDone!")