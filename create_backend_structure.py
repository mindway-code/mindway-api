#!/usr/bin/env python3
"""
create_backend_structure.py

Creates the folder/file structure exactly as specified (Node.js + TS + Prisma layout).
It creates empty files (won't overwrite existing ones).

Usage:
  python create_backend_structure.py

Options:
  python create_backend_structure.py --root .
  python create_backend_structure.py --root my-backend
  python create_backend_structure.py --base /path/to/create
  python create_backend_structure.py --force
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


DIRS = [
    "src/api/v1/modules/auth",
    "src/api/v1/modules/users",
    "src/api/v1/validators",
    "src/core/config",
    "src/core/errors",
    "src/core/middlewares",
    "src/core/logger",
    "src/infra/database/prisma/migrations",
    "src/infra/database/repositories",
    "src/infra/redis",
    "src/infra/http",
    "src/utils/crypto",
    "src/utils/tokens",
]

FILES = [
    # api v1
    "src/api/v1/modules/auth/auth.controller.ts",
    "src/api/v1/modules/auth/auth.service.ts",
    "src/api/v1/modules/auth/auth.routes.ts",
    "src/api/v1/modules/auth/auth.types.ts",
    "src/api/v1/modules/users/users.controller.ts",
    "src/api/v1/modules/users/users.service.ts",
    "src/api/v1/modules/users/users.routes.ts",
    "src/api/v1/modules/users/users.types.ts",
    "src/api/v1/validators/auth.validator.ts",
    "src/api/v1/validators/users.validator.ts",
    "src/api/v1/v1.routes.ts",
    # core
    "src/core/config/env.ts",
    "src/core/config/cookies.ts",
    "src/core/config/cors.ts",
    "src/core/errors/AppError.ts",
    "src/core/errors/errorHandler.ts",
    "src/core/middlewares/auth.middleware.ts",
    "src/core/middlewares/authAdmin.middleware.ts",
    "src/core/middlewares/validate.middleware.ts",
    "src/core/middlewares/rateLimit.middleware.ts",
    "src/core/logger/logger.ts",
    # infra
    "src/infra/database/prisma/client.ts",
    "src/infra/database/prisma/schema.prisma",
    "src/infra/database/repositories/users.repository.ts",
    "src/infra/database/repositories/refreshTokens.repository.ts",
    "src/infra/redis/redis.client.ts",
    "src/infra/redis/redis.cache.ts",
    "src/infra/http/server.ts",
    "src/infra/http/app.ts",
    # utils
    "src/utils/crypto/hash.ts",
    "src/utils/crypto/jwt.ts",
    "src/utils/tokens/refreshToken.ts",
    "src/utils/tokens/cookieNames.ts",
    "src/utils/pagination.ts",
    "src/utils/date.ts",
    # entry
    "src/index.ts",
]


def ensure_dirs(root: Path) -> None:
    for d in DIRS:
        (root / d).mkdir(parents=True, exist_ok=True)


def ensure_files(root: Path) -> list[Path]:
    created: list[Path] = []
    for f in FILES:
        p = root / f
        p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists():
            p.write_text("", encoding="utf-8")
            created.append(p)
    return created


def main() -> int:
    parser = argparse.ArgumentParser(description="Create backend TypeScript folder structure.")
    parser.add_argument(
        "--root",
        default=".",
        help="Project root folder (default: current directory). Use a name to create a new folder.",
    )
    parser.add_argument(
        "--base",
        default=".",
        help="Base directory where root will be created (default: current directory).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="If root exists, create only missing items inside it (won't overwrite files).",
    )
    args = parser.parse_args()

    base = Path(args.base).expanduser().resolve()
    root = (base / args.root).resolve()

    if root.exists() and args.root not in (".", "./") and not args.force:
        print(f"Error: '{root}' already exists. Use --force to create missing items inside it.", file=sys.stderr)
        return 1

    root.mkdir(parents=True, exist_ok=True)
    ensure_dirs(root)
    created_files = ensure_files(root)

    print(f"✅ Structure ready at: {root}")
    print(f"📁 Dirs ensured: {len(DIRS)}")
    print(f"📄 Files created: {len(created_files)} (existing files were not overwritten)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
