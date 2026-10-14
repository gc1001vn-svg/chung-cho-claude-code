# ĐẦU PHIÊN — CHUNG CHO CLAUDE CODE

> **Bảy bước chung A–G ở `so-thich.md` của kho `ghi-nho`** — chạy theo bảng đó.
> File này chỉ ghi thứ **riêng repo này**.

Repo chỉ có `convert.py`: đổi file (PDF, Word, Excel, ảnh, HTML…) hay link sang Markdown bằng
`markitdown`. Chưa có `docs/TIEN_DO.md` — bước A bỏ qua tới khi có việc nhiều phiên.

## B. Dựng lại máy ảo

| Lệnh | Khi nào |
|---|---|
| `pip install -q -r requirements.txt` | máy ảo mới — thiếu thì file Word, PDF báo lỗi "pip install markitdown[...]" |
| `bash scripts/do.sh` | **luôn luôn**, trước khi động vào code và trước mỗi commit |

## Dùng

```bash
python3 convert.py <đường-dẫn-hay-link> > ra.md
```
