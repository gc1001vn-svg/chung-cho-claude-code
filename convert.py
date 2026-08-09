import sys

from markitdown import MarkItDown


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python convert.py <path-or-url>")
        sys.exit(1)

    source = sys.argv[1]
    result = MarkItDown().convert(source)
    print(result.text_content)


if __name__ == "__main__":
    main()
