# ĐẦU PHIÊN — CHUNG CHO CLAUDE CODE

> **Bảy bước chung A–G ở `so-thich.md` của kho `ghi-nho`** — chạy theo bảng đó.
> File này chỉ ghi thứ **riêng repo này**. Luật repo (skill `/md`, bẫy frontmatter): `CLAUDE.md`.

Chưa có `docs/TIEN_DO.md` — bước A bỏ qua tới khi có việc nhiều phiên.
`convert.py` **đã bỏ 26/08** (`a9b90b1`, trùng việc với skill `/md`) — đừng dựng lại.

## B. Dựng lại máy ảo

| Lệnh | Khi nào |
|---|---|
| `pip install -q pytest` | máy ảo mới chưa có `pytest` — thước `pytest` báo `No module` |
| `bash scripts/do.sh` | **luôn luôn**, trước khi động vào code và trước mỗi commit |
