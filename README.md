# chung-cho-claude-code

Repo dùng chung cho Claude Code.

| Thư mục | Nội dung |
| --- | --- |
| `.claude/skills/md/` | Skill `/md` — chuyển file người dùng tải lên sang Markdown gọn để tiết kiệm token |
| `.claude/skills/giam-token/` | Skill `/giam-token` — rà và cấu hình một repo bất kỳ để tốn ít token |
| `.claude/skills/bo-tro/` | Skill `/bo-tro` — tìm plugin/skill/MCP hợp với dự án đang mở |
| `docs/tiet-kiem-token.md` | Cách cấu hình repo để tốn ít token — áp dụng cho repo này và repo sau này |
| `templates/CLAUDE.md` | Mẫu `CLAUDE.md` để chép sang repo mới |
| `templates/user-CLAUDE.md` | Mẫu cho `~/.claude/CLAUDE.md` — áp cho mọi dự án, **chỉ chạy trên máy tính** |
| `xnvtbctl/` | Trang `index.html` của XN VTB&CTL |
| `tests/` | Test cho bộ lọc của `/md` và cho frontmatter của skill |

## Skill `/md`

Gõ `/md` trong phiên Claude Code để chuyển file vừa tải lên (PDF, Word, Excel,
PowerPoint, HTML, ảnh…) sang Markdown. Kết quả nằm trong `.mdcache/` và được
dùng lại nếu file nguồn không đổi.

Mục đích là để Claude đọc bản Markdown gọn thay vì nạp cả file gốc vào ngữ cảnh.
Script in kèm ước lượng token và dàn bài của từng file, để với file lớn thì đọc
đúng phần cần thay vì đọc trọn.

### Những gì script bỏ bớt

Chỉ bỏ phần chắc chắn là rác, không đụng vào nội dung:

| Rác | Vì sao bỏ được |
| --- | --- |
| Cột không tiêu đề (`Unnamed: N`) mà mọi ô đều trống | markitdown sinh ra từ vùng trống của bảng tính |
| Ô `NaN`, dòng trống hoàn toàn | ô trống của bảng tính |
| Ảnh nhúng base64 | thay bằng chữ `(anh)` |
| Tiêu đề đầu trang lặp y hệt ở mọi trang PDF | giữ lần xuất hiện đầu |

Cột có tiêu đề thật thì được giữ dù mọi ô đều trống. Các dòng chỉ khác nhau ở
chữ số (`Thiết bị số 12` / `Thiết bị số 13`) **không** bị gộp — đây là lỗi đã
mắc một lần khi làm và giờ có test canh.

Đo trên tài liệu mẫu: bảng tính 40 dòng có 9 cột trống giảm từ ~1861 xuống ~581
token (−69%); PDF 12 trang có tiêu đề lặp giảm từ ~3585 xuống ~3197 token (−11%).

## Chạy test

```bash
pip install pytest
python -m pytest
```

Test chạy thẳng trên `awk`, không cần cài `markitdown`.
