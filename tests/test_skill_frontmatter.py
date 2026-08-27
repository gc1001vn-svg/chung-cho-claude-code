"""Canh frontmatter của SKILL.md theo đúng spec mà claude.ai chấp nhận.

Tải skill lên claude.ai (hoặc đóng gói bằng package_skill.py của anthropics/skills)
mà frontmatter có key ngoài spec thì **lỗi cứng**, không phải bỏ qua key đó:

    Unexpected key(s) in SKILL.md frontmatter: argument-hint.
    Allowed properties are: allowed-tools, compatibility, description, license, metadata, name

Claude Code chạy local thì nhận thêm nhiều key khác, nên lỗi này chỉ lộ ra đúng
lúc tải lên. Test này bắt nó từ trước.

Nguồn: https://code.claude.com/docs/en/skills — bảng "Distribution path".
"""

import re
from pathlib import Path

import pytest

SKILLS_DIR = Path(__file__).resolve().parent.parent / ".claude" / "skills"

# Sáu key duy nhất mà claude.ai upload / Skills API / package_skill.py cho phép
SPEC_KEYS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}

SKILL_FILES = sorted(SKILLS_DIR.glob("*/SKILL.md"))


def frontmatter_keys(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    assert match, f"{path} thiếu khối frontmatter --- ở đầu file"
    keys = []
    for line in match.group(1).splitlines():
        if line.startswith((" ", "\t", "#")) or not line.strip():
            continue  # giá trị lồng bên trong, hoặc dòng chú thích
        k = re.match(r"^([A-Za-z][A-Za-z0-9_-]*)\s*:", line)
        if k:
            keys.append(k.group(1))
    return keys


def test_co_it_nhat_mot_skill():
    assert SKILL_FILES, "không tìm thấy .claude/skills/*/SKILL.md nào"


@pytest.mark.parametrize("skill", SKILL_FILES, ids=lambda p: p.parent.name)
def test_frontmatter_chi_dung_key_trong_spec(skill):
    ngoai_spec = sorted(set(frontmatter_keys(skill)) - SPEC_KEYS)
    assert not ngoai_spec, (
        f"{skill.parent.name}/SKILL.md có key ngoài spec: {ngoai_spec}. "
        f"Tải lên claude.ai sẽ lỗi cứng. Chỉ được dùng: {sorted(SPEC_KEYS)}"
    )


@pytest.mark.parametrize("skill", SKILL_FILES, ids=lambda p: p.parent.name)
def test_co_du_name_va_description(skill):
    keys = frontmatter_keys(skill)
    for bat_buoc in ("name", "description"):
        assert bat_buoc in keys, f"{skill.parent.name}/SKILL.md thiếu `{bat_buoc}`"


@pytest.mark.parametrize("skill", SKILL_FILES, ids=lambda p: p.parent.name)
def test_ten_skill_khop_ten_thu_muc(skill):
    text = skill.read_text(encoding="utf-8")
    name = re.search(r"^name:\s*(\S+)", text, re.MULTILINE).group(1)
    assert name == skill.parent.name, (
        f"`name: {name}` không khớp thư mục `{skill.parent.name}` — "
        "khi đóng gói tải lên sẽ lệch tên"
    )


@pytest.mark.parametrize("skill", SKILL_FILES, ids=lambda p: p.parent.name)
def test_skill_md_duoi_500_dong(skill):
    """Tài liệu khuyến nghị dưới 500 dòng; thân skill nằm lại trong ngữ cảnh
    suốt phiên nên mỗi dòng là chi phí token lặp lại."""
    dong = len(skill.read_text(encoding="utf-8").splitlines())
    assert dong < 500, f"{skill.parent.name}/SKILL.md dài {dong} dòng"
