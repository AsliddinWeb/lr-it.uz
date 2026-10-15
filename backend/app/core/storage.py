import asyncio
import io

from minio import Minio

from app.core.config import settings

_client: Minio | None = None


def _get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False,
        )
    return _client


def _ensure_bucket_sync() -> None:
    client = _get_client()
    if not client.bucket_exists(settings.MINIO_BUCKET):
        client.make_bucket(settings.MINIO_BUCKET)


async def ensure_bucket() -> None:
    await asyncio.to_thread(_ensure_bucket_sync)


def _upload_bytes_sync(object_key: str, data: bytes, content_type: str) -> None:
    client = _get_client()
    client.put_object(
        settings.MINIO_BUCKET,
        object_key,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )


async def upload_bytes(object_key: str, data: bytes, content_type: str) -> None:
    await ensure_bucket()
    await asyncio.to_thread(_upload_bytes_sync, object_key, data, content_type)


def _download_bytes_sync(object_key: str) -> bytes:
    client = _get_client()
    response = client.get_object(settings.MINIO_BUCKET, object_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


async def download_bytes(object_key: str) -> bytes:
    return await asyncio.to_thread(_download_bytes_sync, object_key)
