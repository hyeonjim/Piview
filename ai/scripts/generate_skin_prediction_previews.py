from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", str(Path(__file__).resolve().parents[1] / ".cache" / "matplotlib"))

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.skin_preview import render_box_preview_from_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a simple box preview image")
    parser.add_argument("--image-path", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--box-width", type=int, default=10)
    parser.add_argument("--fill-alpha", type=int, default=64)
    parser.add_argument("--corner-radius", type=int, default=22)
    args = parser.parse_args()

    image_path = Path(args.image_path)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    preview = render_box_preview_from_path(
        image_path=image_path,
        box_width=args.box_width,
        fill_alpha=args.fill_alpha,
        corner_radius=args.corner_radius,
    )

    output_path = output_dir / f"{image_path.stem}_box_preview.jpg"
    preview.save(output_path, quality=95)
    print(output_path)


if __name__ == "__main__":
    main()
