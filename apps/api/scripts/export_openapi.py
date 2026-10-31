"""Writes the OpenAPI document consumed by packages/shared to generate TypeScript types."""

import json
import sys
from pathlib import Path

from app.main import app

DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / "packages" / "shared" / "openapi.json"


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    output.write_text(json.dumps(app.openapi(), indent=2) + "\n")
    print(f"OpenAPI schema written to {output}")


if __name__ == "__main__":
    main()
