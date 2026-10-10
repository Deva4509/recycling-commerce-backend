from __future__ import annotations

import io
import uuid

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from app.config import settings


ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024


def _configure() -> None:
    if not all(
        (
            settings.cloudinary_cloud_name,
            settings.cloudinary_api_key,
            settings.cloudinary_api_secret,
        )
    ):
        raise HTTPException(
            status_code=503,
            detail="Image storage is not configured.",
        )

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def _validate_signature(data: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")

    if content_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")

    if content_type == "image/webp":
        return (
            len(data) >= 12
            and data[:4] == b"RIFF"
            and data[8:12] == b"WEBP"
        )

    return False


async def upload_product_image(
    upload: UploadFile,
    product_id: str,
) -> tuple[str, str]:
    content_type = (upload.content_type or "").lower()

    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are allowed.",
        )

    data = await upload.read()

    if not data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Each image must be 5 MB or smaller.",
        )

    if not _validate_signature(data, content_type):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    _configure()

    public_id = f"greencore/products/{product_id}/{uuid.uuid4().hex}"

    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        public_id=public_id,
        resource_type="image",
        overwrite=False,
        use_filename=False,
        unique_filename=False,
    )

    secure_url = result.get("secure_url")
    returned_public_id = result.get("public_id", public_id)

    if not secure_url:
        raise HTTPException(
            status_code=502,
            detail="Image storage did not return a public URL.",
        )

    return secure_url, returned_public_id


def delete_product_image(public_id: str) -> None:
    if not public_id:
        return

    _configure()

    cloudinary.uploader.destroy(
        public_id,
        resource_type="image",
        invalidate=True,
    )


async def upload_profile_image(
    upload: UploadFile,
    user_id: str,
) -> tuple[str, str]:
    """Validate and store a profile photo separately from product images."""

    content_type = (upload.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are allowed.",
        )

    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Profile photos must be 5 MB or smaller.",
        )
    if not _validate_signature(data, content_type):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    _configure()
    public_id = f"greencore/users/{user_id}/profile-{uuid.uuid4().hex}"
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        public_id=public_id,
        resource_type="image",
        overwrite=False,
        use_filename=False,
        unique_filename=False,
    )
    secure_url = result.get("secure_url")
    returned_public_id = result.get("public_id", public_id)
    if not secure_url:
        raise HTTPException(
            status_code=502,
            detail="Image storage did not return a public URL.",
        )
    return secure_url, returned_public_id
