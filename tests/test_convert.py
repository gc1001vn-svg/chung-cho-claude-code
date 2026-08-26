import builtins
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import convert  # noqa: E402


class FakeResult:
    def __init__(self, text):
        self.text_content = text


class FakeConverter:
    """Stands in for MarkItDown so the tests need no parser dependencies."""

    def __init__(self, text="# Hello\n", error=None):
        self.text = text
        self.error = error
        self.seen = []

    def convert(self, source):
        self.seen.append(source)
        if self.error:
            raise self.error
        return FakeResult(self.text)


@pytest.fixture
def fake(monkeypatch):
    converter = FakeConverter()
    monkeypatch.setattr(convert, "load_converter", lambda: converter)
    return converter


@pytest.fixture
def sample(tmp_path):
    path = tmp_path / "doc.html"
    path.write_text("<h1>Hello</h1>", encoding="utf-8")
    return path


def test_is_url():
    assert convert.is_url("https://example.com/page.html")
    assert convert.is_url("http://example.com")
    assert not convert.is_url("/tmp/doc.pdf")
    assert not convert.is_url("doc.pdf")
    assert not convert.is_url("C:/docs/report.docx")


def test_prints_markdown_to_stdout(fake, sample, capsys):
    assert convert.main([str(sample)]) == 0
    assert capsys.readouterr().out.strip() == "# Hello"
    assert fake.seen == [str(sample)]


def test_writes_single_output_file(fake, sample, tmp_path):
    out = tmp_path / "out" / "doc.md"
    assert convert.main([str(sample), "-o", str(out), "--quiet"]) == 0
    assert out.read_text(encoding="utf-8") == "# Hello\n"


def test_writes_one_file_per_source_into_directory(fake, sample, tmp_path):
    second = tmp_path / "other.html"
    second.write_text("<h1>Hi</h1>", encoding="utf-8")
    out_dir = tmp_path / "md"

    assert convert.main([str(sample), str(second), "-o", str(out_dir), "-q"]) == 0
    assert (out_dir / "doc.md").read_text(encoding="utf-8") == "# Hello\n"
    assert (out_dir / "other.md").read_text(encoding="utf-8") == "# Hello\n"


def test_missing_file_reports_error_and_exits_nonzero(fake, capsys):
    assert convert.main(["does-not-exist.pdf"]) == 1
    assert "no such file" in capsys.readouterr().err


def test_conversion_failure_does_not_stop_remaining_sources(monkeypatch, sample, capsys):
    class Flaky(FakeConverter):
        def convert(self, source):
            self.seen.append(source)
            if source.endswith("bad.html"):
                raise ValueError("unsupported")
            return FakeResult("# Hello\n")

    converter = Flaky()
    monkeypatch.setattr(convert, "load_converter", lambda: converter)
    bad = sample.parent / "bad.html"
    bad.write_text("<h1>x</h1>", encoding="utf-8")

    assert convert.main([str(bad), str(sample)]) == 1
    captured = capsys.readouterr()
    assert "unsupported" in captured.err
    assert "# Hello" in captured.out
    assert converter.seen == [str(bad), str(sample)]


def test_urls_are_passed_through_without_existence_check(fake, capsys):
    url = "https://example.com/page.html"
    assert convert.main([url]) == 0
    assert fake.seen == [url]


@pytest.mark.parametrize(
    "source,expected",
    [
        ("/tmp/report.pdf", "report.md"),
        ("https://example.com/docs/guide.html", "guide.md"),
        ("https://example.com", "example.com.md"),
        ("https://example.com/", "example.com.md"),
    ],
)
def test_output_path_for(source, expected, tmp_path):
    assert convert.output_path_for(source, tmp_path) == tmp_path / expected


def test_missing_markitdown_gives_actionable_message(monkeypatch):
    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "markitdown":
            raise ImportError("No module named 'markitdown'")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)
    with pytest.raises(SystemExit) as excinfo:
        convert.load_converter()
    assert "pip install -r requirements.txt" in str(excinfo.value)


def test_written_file_ends_with_newline(monkeypatch, sample, tmp_path):
    converter = FakeConverter(text="# No trailing newline")
    monkeypatch.setattr(convert, "load_converter", lambda: converter)
    out = tmp_path / "doc.md"

    assert convert.main([str(sample), "-o", str(out), "-q"]) == 0
    assert out.read_text(encoding="utf-8") == "# No trailing newline\n"
