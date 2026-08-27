# Giảm token cho repo dùng với Claude Code

Ghi lại để áp dụng cho repo hiện tại và repo sau này. Xếp theo mức tác động,
làm từ trên xuống. Nguồn ở cuối.

## Nguyên tắc gốc

Cửa sổ ngữ cảnh là tài nguyên khan hiếm nhất, và **chất lượng trả lời giảm khi
ngữ cảnh đầy dần** — không chỉ là chuyện tiền. Mọi mẹo dưới đây đều quy về một
việc: đừng nạp thứ chưa cần.

## Bảng việc cần làm

| Mức | Việc | Vì sao |
|---|---|---|
| Cao | `CLAUDE.md` dưới ~500 token | Nạp lại **mỗi phiên**. File phình còn làm Claude bỏ sót chính quy tắc anh viết |
| Cao | Kiến thức thỉnh thoảng mới cần → để trong **skill**, không để trong `CLAUDE.md` | Thân skill chỉ nạp khi dùng; `description` thì luôn nằm sẵn |
| Cao | `/clear` giữa hai việc không liên quan | Ngữ cảnh cũ không giúp gì mà vẫn tính tiền và gây nhiễu |
| Cao | Tài liệu (PDF, Word, Excel) → Markdown trước khi đọc | Chính là skill `/md` trong repo này |
| Vừa | Tài liệu dài trong skill → tách file riêng cùng thư mục, `SKILL.md` chỉ dẫn link | File phụ chỉ nạp khi thật sự cần |
| Vừa | `SKILL.md` dưới 500 dòng, viết "làm gì" chứ không kể "vì sao" | Thân skill **nằm lại trong ngữ cảnh suốt phiên** |
| Vừa | Việc phải đọc nhiều file → giao cho **subagent** | Subagent đọc trong ngữ cảnh riêng, chỉ trả về kết luận |
| Vừa | Nhắc thẳng tên file trong câu hỏi (`@file`) thay vì tả chỗ nó nằm | Claude khỏi phải dò tìm |
| Vừa | Dùng CLI có sẵn (`gh`, `aws`…) thay vì để Claude tự mò API | CLI trả về gọn hơn nhiều |
| Thấp | Bảng thay cho danh sách gạch đầu dòng khi ghi dữ liệu có cấu trúc | Ít token hơn ở cùng lượng thông tin |
| Thấp | `/compact <chỉ dẫn>` thay vì để nén tự động | Anh chọn thứ được giữ lại |
| Thấp | Câu hỏi phụ dùng `/btw` | Câu trả lời không đi vào lịch sử hội thoại |

## Viết `CLAUDE.md`

Với từng dòng, tự hỏi: **"bỏ dòng này thì Claude có làm sai không?"** Không thì xoá.

| Nên có | Không nên có |
|---|---|
| Lệnh Claude không đoán được | Thứ đọc code là biết |
| Quy ước **khác** mặc định | Quy ước chuẩn của ngôn ngữ |
| Cách chạy test | Tài liệu API dài (để link) |
| Quy ước nhánh, PR | Thứ hay thay đổi |
| Quirk môi trường, biến bắt buộc | Mô tả từng file trong repo |
| Cái bẫy đã sập một lần | Lời khuyên chung chung ("viết code sạch") |

Nếu Claude cứ lặp lại một lỗi dù đã có luật cấm, thường là file quá dài nên luật
đó bị chìm. Cắt bớt, đừng viết thêm.

Mẫu sẵn: [`templates/CLAUDE.md`](../templates/CLAUDE.md).

### Có đặt được một `CLAUDE.md` dùng chung cho mọi dự án không?

Có, ở `~/.claude/CLAUDE.md` — mẫu: [`templates/user-CLAUDE.md`](../templates/user-CLAUDE.md).
Nhưng nó **chỉ chạy với Claude Code cài trên máy tính**. Phiên trên web hoặc điện
thoại chạy trong container dựng mới mỗi lần, và claude.ai chỉ đồng bộ `skills/`
với `plugins/` — không đồng bộ `CLAUDE.md`, cũng không giữ auto memory.

Không phải vì thế mà `CLAUDE.md` trong repo là giải pháp tạm — nó tốt hơn thật:

| | `~/.claude/CLAUDE.md` | `CLAUDE.md` trong repo |
|---|---|---|
| Phiên web / điện thoại | không chạy | chạy, vì nằm trong git |
| Máy khác, người khác | phải chép tay | tự có khi clone |
| Nội dung | chỉ nói chung chung được | ghi được lệnh test, quirk, cái bẫy riêng của repo |

Thứ làm `CLAUDE.md` đáng giá lại đúng là phần riêng của từng repo — phần mà file
dùng chung không chứa được. Hai file cộng vào nhau chứ không thay thế nhau.

## Viết skill

- Frontmatter **chỉ 6 key** claude.ai chấp nhận: `name`, `description`,
  `license`, `compatibility`, `metadata`, `allowed-tools`. Key khác thì Claude
  Code local vẫn chạy nhưng **tải lên lỗi cứng**.
- `description` luôn nằm trong ngữ cảnh của mọi phiên → viết đủ để Claude biết
  *khi nào* dùng, nhưng đừng dài dòng.
- `allowed-tools` siết vào đúng lệnh cần, ví dụ
  `Bash(${CLAUDE_SKILL_DIR}/convert.sh *)` thay vì mở cả `Bash`. Vừa an toàn hơn
  vừa không bị hỏi quyền giữa chừng.
- Skill có tác dụng phụ (deploy, gửi tin) → đặt `disable-model-invocation: true`
  để chỉ người dùng gọi được. Lưu ý key này **không** nằm trong 6 key trên nên
  chỉ dùng cho skill local, không tải lên claude.ai được.

## Cái bẫy về phạm vi skill

Skill trong `.claude/skills/` của repo **che** skill cùng tên đồng bộ từ
claude.ai. Nghĩa là sửa bản trong repo thì chỉ repo đó được hưởng, các phiên khác
vẫn dùng bản cũ trên tài khoản. Sửa xong nhớ tải lại lên claude.ai.

## Hai skill làm sẵn

| Skill | Dùng khi |
|---|---|
| `/giam-token` | Mở một repo bất kỳ → đo hiện trạng, cắt `CLAUDE.md`, tách skill dài, kiểm frontmatter |
| `/bo-tro` | Bắt đầu dự án mới → nhận diện loại dự án rồi tìm plugin/skill/MCP hợp, kèm cảnh báo chi phí token |

Tải hai skill này lên claude.ai thì mọi repo đều dùng được, không phải chép đi chép lại.

## Nguồn

- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [anthropics/skills](https://github.com/anthropics/skills)
