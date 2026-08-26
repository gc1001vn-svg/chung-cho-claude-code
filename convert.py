"""Convert documents and web pages to Markdown using Microsoft's markitdown."""

import argparse
import sys
from pathlib import Path
from urllib.parse import urlparse

__version__ = "0.2.0"

TEXT_ENCODING = "utf-8"


class ConversionError(Exception):
    """Raised when a single source cannot be converted."""


def is_url(source: str) -> bool:
    scheme = urlparse(source).scheme
    return scheme in ("http", "https")


def load_converter():
    """Import markitdown lazily so --help works without the dependency."""
    try:
        from markitdown import MarkItDown
    except ImportError as exc:
        raise SystemExit(
            "markitdown is not installed. Run: pip install -r requirements.txt"
        ) from exc
    return MarkItDown()


def convert_source(converter, source: str) -> str:
    """Convert one path or URL and return its Markdown text."""
    if not is_url(source) and not Path(source).exists():
        raise ConversionError(f"no such file: {source}")

    try:
        result = converter.convert(source)
    except Exception as exc:  # markitdown raises a variety of parser errors
        raise ConversionError(f"{source}: {exc}") from exc

    return result.text_content


def output_path_for(source: str, out_dir: Path) -> Path:
    """Pick the .md file name a source is written to inside out_dir."""
    if is_url(source):
        parsed = urlparse(source)
        stem = Path(parsed.path).stem or parsed.netloc.replace(":", "_") or "page"
    else:
        stem = Path(source).stem
    return out_dir / f"{stem}.md"


def write_output(text: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not text.endswith("\n"):
        text += "\n"
    destination.write_text(text, encoding=TEXT_ENCODING)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="convert.py",
        description=(
            "Convert documents (PDF, Office files, images, HTML, ...) and web "
            "pages to Markdown using Microsoft's markitdown."
        ),
    )
    parser.add_argument(
        "sources",
        nargs="+",
        metavar="SOURCE",
        help="file paths or http(s) URLs to convert",
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="PATH",
        help=(
            "write Markdown to PATH instead of stdout. With a single source "
            "PATH is the output file; with several sources it is a directory "
            "that receives one .md file per source."
        ),
    )
    parser.add_argument(
        "-q",
        "--quiet",
        action="store_true",
        help="do not print the name of each file written",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    converter = load_converter()

    out_dir = None
    if args.output and len(args.sources) > 1:
        out_dir = Path(args.output)

    failures = 0
    for index, source in enumerate(args.sources):
        try:
            text = convert_source(converter, source)
        except ConversionError as exc:
            print(f"error: {exc}", file=sys.stderr)
            failures += 1
            continue

        if out_dir is not None:
            destination = output_path_for(source, out_dir)
        elif args.output:
            destination = Path(args.output)
        else:
            if index:
                print()
            print(text)
            continue

        write_output(text, destination)
        if not args.quiet:
            print(f"wrote {destination}", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
