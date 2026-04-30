import os
import base64
import uuid
from pathlib import Path


def get_upload_images_dir() -> Path:
    upload_dir = Path(__file__).parent.parent.parent / "static" / "upload_images"
    return upload_dir


def save_base64_image(base64_string: str, filename: str) -> str | None:
    if not base64_string:
        return None

    upload_dir = get_upload_images_dir()
    file_path = upload_dir / filename
    
    if file_path.exists():
        return f"/static/upload_images/{filename}"

    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        image_data = base64.b64decode(base64_string)
        with open(file_path, "wb") as f:
            f.write(image_data)

        return f"/static/upload_images/{filename}"
    except Exception:
        return None


def convert_base64_to_image(obj) -> str | None:
    if not obj.image_base64:
        return obj.image

    if obj.__class__.__name__ == "Occupation":
        filename = f"{obj.anzsco_code}.png"
    elif obj.__class__.__name__ == "Course":
        filename = f"{obj.id}.png"
    else:
        filename = f"{obj.id}.png"

    return save_base64_image(obj.image_base64, filename)


def save_image_from_base64(base64_string: str, overwrite: bool = True) -> str | None:
    if not base64_string:
        return None

    upload_dir = get_upload_images_dir()
    filename = f"{uuid.uuid4().hex}.png"
    file_path = upload_dir / filename
    
    if file_path.exists() and not overwrite:
        return f"/static/upload_images/{filename}"

    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        image_data = base64.b64decode(base64_string)
        with open(file_path, "wb") as f:
            f.write(image_data)

        return f"/static/upload_images/{filename}"
    except Exception:
        return None


def delete_image(filename: str) -> bool:
    if not filename:
        return False
    
    upload_dir = get_upload_images_dir()
    file_path = upload_dir / filename
    
    if file_path.exists():
        try:
            file_path.unlink()
            return True
        except Exception:
            return False
    return False
