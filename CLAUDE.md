# chung-cho-claude-code

Tài sản chính là skill `/md`, tồn tại để giảm token. Mọi thay đổi phải đo được
bằng token và không được mất dữ liệu.

| Việc | Lệnh |
|---|---|
| Chạy test | `python -m pytest` (chỉ cần `pytest`) |
| Thử skill thật | `bash .claude/skills/md/convert.sh <file...>` |

## Điều dễ làm sai

**Sửa repo là chưa đủ.** Skill trong `.claude/skills/` **che** skill cùng tên
đồng bộ từ claude.ai. Sửa ở đây chỉ repo này hưởng; phiên khác vẫn dùng bản cũ
trên tài khoản. Sửa xong phải tải lại lên claude.ai.

**Frontmatter `SKILL.md` chỉ được 6 key:** `name`, `description`, `license`,
`compatibility`, `metadata`, `allowed-tools`. Key khác thì local vẫn chạy nhưng
tải lên claude.ai **lỗi cứng**. `tests/test_skill_frontmatter.py` canh việc này.

**`clean.awk` / `dedup.awk` được bỏ rác, không được bỏ nội dung thật.** Đã có lần
quy chữ số về `#` làm 144 dòng dữ liệu còn 1. Đổi bộ lọc thì phải chạy trên file
thật, đếm dòng dữ liệu trước/sau, và thêm test cho ca vừa suýt mất.

**Thân `SKILL.md` nằm lại trong ngữ cảnh suốt phiên** — mỗi dòng là chi phí lặp.
Tài liệu dài để ra file riêng cùng thư mục, chỉ dẫn link tới.

PR nhắm vào `main`; nhánh mặc định trên GitHub đang trỏ sai chỗ.
