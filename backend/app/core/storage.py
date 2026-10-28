"""Fayllarni (sertifikat PDF'lari, mavzu resurslari) diskdagi papkada saqlash.

Oldin MinIO ishlatilgan edi, lekin uning rasmiy Docker imidjlari endi chiqarilmaydi.
Interfeys o'zgarmagan: `upload_bytes` va `download_bytes` — chaqiruvchi kodga tegilmaydi.
`settings.STORAGE_DIR` Docker volume sifatida ulanadi, shuning uchun fayllar konteyner
qayta yaratilganda ham saqlanadi.
"""

import asyncio
from pathlib import Path

from app.core.config import settings


def _resolve(object_key: str) -> Path:
    """Kalitni saqlash papkasi ichidagi yo'lga aylantiradi; papkadan tashqariga chiqishni rad etadi."""
    root = Path(settings.STORAGE_DIR).resolve()
    path = (root / object_key).resolve()
    if not path.is_relative_to(root):
        raise ValueError(f"Noto'g'ri fayl kaliti: {object_key!r}")
    return path


def _upload_bytes_sync(object_key: str, data: bytes) -> None:
    path = _resolve(object_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Avval vaqtinchalik faylga yozamiz: yuklash uzilsa, yarim fayl qolmaydi.
    tmp = path.with_name(path.name + ".part")
    tmp.write_bytes(data)
    tmp.replace(path)


async def upload_bytes(object_key: str, data: bytes, content_type: str) -> None:
    # content_type bazadagi LessonResource ichida saqlanadi, diskda alohida yozish shart emas.
    await asyncio.to_thread(_upload_bytes_sync, object_key, data)


def _download_bytes_sync(object_key: str) -> bytes:
    return _resolve(object_key).read_bytes()


async def download_bytes(object_key: str) -> bytes:
    return await asyncio.to_thread(_download_bytes_sync, object_key)


def _delete_sync(object_key: str) -> None:
    _resolve(object_key).unlink(missing_ok=True)


async def delete(object_key: str) -> None:
    """Faylni o'chiradi; fayl allaqachon yo'q bo'lsa, xato bermaydi."""
    await asyncio.to_thread(_delete_sync, object_key)
