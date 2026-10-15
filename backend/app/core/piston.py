from dataclasses import dataclass

import httpx

from app.core.config import settings

_RUNTIMES = {
    "python": {"language": "python", "version": "3.12.0"},
    "cpp": {"language": "gcc", "version": "10.2.0"},
}

_FILENAMES = {"python": "main.py", "cpp": "main.cpp"}


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    status: str


async def run_code(language: str, code: str, stdin: str = "") -> ExecutionResult:
    runtime = _RUNTIMES.get(language)
    if runtime is None:
        raise ValueError(f"Qo'llab-quvvatlanmaydigan til: {language}")

    payload = {
        "language": runtime["language"],
        "version": runtime["version"],
        "files": [{"name": _FILENAMES[language], "content": code}],
        "stdin": stdin,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(f"{settings.PISTON_URL}/api/v2/execute", json=payload)
        response.raise_for_status()
        data = response.json()

    run_result = data.get("run", {})
    compile_result = data.get("compile")

    if compile_result and compile_result.get("code") not in (0, None):
        return ExecutionResult(
            stdout=compile_result.get("stdout", ""),
            stderr=compile_result.get("stderr", "Kod kompilyatsiya qilinmadi"),
            status="error",
        )

    if run_result.get("signal"):
        status = "timeout"
    elif run_result.get("code") not in (0, None):
        status = "error"
    else:
        status = "success"

    return ExecutionResult(
        stdout=run_result.get("stdout", ""),
        stderr=run_result.get("stderr", ""),
        status=status,
    )
