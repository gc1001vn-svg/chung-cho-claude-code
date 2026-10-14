"""Kiểm tra hai bộ lọc awk của skill /md.

Chạy trực tiếp trên awk nên không cần cài markitdown — chỉ cần awk và pytest.
Trọng tâm là toàn vẹn dữ liệu: bộ lọc được phép bỏ rác, tuyệt đối không được
bỏ nội dung thật.
"""

import shutil
import subprocess
from pathlib import Path

import pytest

SKILL = Path(__file__).resolve().parent.parent / ".claude" / "skills" / "md"
CLEAN = SKILL / "clean.awk"
DEDUP = SKILL / "dedup.awk"

pytestmark = pytest.mark.skipif(shutil.which("awk") is None, reason="cần awk")


def clean(text: str) -> str:
    out = subprocess.run(
        ["awk", "-f", str(CLEAN)], input=text, capture_output=True, text=True, check=True
    )
    return out.stdout


def dedup(text: str, tmp_path: Path) -> str:
    src = tmp_path / "in.md"
    src.write_text(text, encoding="utf-8")
    out = subprocess.run(
        ["awk", "-f", str(DEDUP), str(src), str(src)],
        capture_output=True,
        text=True,
        check=True,
    )
    return out.stdout


# ---------- clean.awk: dọn bảng của bảng tính ----------

SHEET = """## BaoCao
| STT | Hang muc | Unnamed: 2 | Unnamed: 3 |
| --- | --- | --- | --- |
| 1 | Thiet bi nang | NaN | NaN |
| 2 | Cau truc | NaN | NaN |
| NaN | NaN | NaN | NaN |
"""


def test_bo_cot_khong_ten_va_rong():
    result = clean(SHEET)
    assert "Unnamed" not in result
    assert "NaN" not in result
    assert "Thiet bi nang" in result
    assert "Cau truc" in result


def test_bo_dong_rong_hoan_toan():
    assert len([l for l in clean(SHEET).splitlines() if l.startswith("|")]) == 4


def test_giu_cot_co_tieu_de_that_du_moi_o_deu_rong():
    text = (
        "| Ten | Ghi chu |\n"
        "| --- | --- |\n"
        "| A | NaN |\n"
        "| B | NaN |\n"
        "| C | NaN |\n"
    )
    result = clean(text)
    assert "Ghi chu" in result, "cột có tiêu đề thật phải được giữ"
    assert result.count("|") == text.count("|"), "không được đổi số cột"


def test_giu_cot_khong_ten_nhung_co_du_lieu():
    text = (
        "| STT | Unnamed: 1 |\n"
        "| --- | --- |\n"
        "| 1 | co du lieu |\n"
        "| 2 | NaN |\n"
    )
    assert "co du lieu" in clean(text)


def test_van_ban_ngoai_bang_khong_bi_dong_vao():
    text = "# Tieu de\n\nMot doan van binh thuong.\n\n- gach dau dong\n"
    assert clean(text) == text


def test_bang_khong_co_rac_thi_giu_nguyen():
    text = "| A | B |\n| --- | --- |\n| 1 | 2 |\n"
    assert clean(text) == text


# ---------- dedup.awk: bỏ tiêu đề/chân trang lặp ----------


def test_bo_tieu_de_lap_lai_giu_lan_dau(tmp_path):
    header = "VIETSOVPETRO - XI NGHIEP VAN TAI BIEN VA CONG TAC LAN"
    text = "".join(f"{header}\nNoi dung trang {i}\n" for i in range(1, 6))
    result = dedup(text, tmp_path)
    assert result.count(header) == 1
    for i in range(1, 6):
        assert f"Noi dung trang {i}" in result


def test_khong_gop_cac_dong_chi_khac_nhau_o_chu_so(tmp_path):
    """Bẫy đã sập một lần: quy chữ số về '#' làm mất dữ liệu thật."""
    text = "".join(
        f"Thiet bi so {i} da duoc kiem tra va ket luan dat yeu cau\n" for i in range(1, 9)
    )
    result = dedup(text, tmp_path)
    for i in range(1, 9):
        assert f"Thiet bi so {i} " in result


def test_khong_bo_dong_ngan_lap_lai(tmp_path):
    text = "".join("Dat\n" for _ in range(9))
    assert dedup(text, tmp_path).count("Dat") == 9


def test_khong_bo_dong_bang_va_gach_dau_dong_lap_lai(tmp_path):
    row = "| Thiet bi nang loai A | dat yeu cau kiem dinh |"
    bullet = "- Kiem tra day cap va moc treo theo dinh ky hang quy"
    text = "".join(f"{row}\n{bullet}\n" for _ in range(5))
    result = dedup(text, tmp_path)
    assert result.count(row) == 5
    assert result.count(bullet) == 5


def test_lap_hai_lan_thi_van_giu_ca_hai(tmp_path):
    line = "Dong nay du dai nhung chi lap lai dung hai lan thoi"
    text = f"{line}\nkhac\n{line}\n"
    assert dedup(text, tmp_path).count(line) == 2


def test_tai_lieu_khong_co_khung_trang_thi_khong_doi(tmp_path):
    text = "Dong mot khac han.\nDong hai khac han.\nDong ba khac han.\n"
    assert dedup(text, tmp_path) == text
