---
name: giam-token
description: Rà một repo và cấu hình nó để tốn ít token nhất mà chất lượng không giảm — đo hiện trạng, cắt CLAUDE.md, tách skill quá dài, kiểm frontmatter. Dùng khi người dùng gõ /giam-token, khi mở một repo mới chưa có CLAUDE.md, hoặc khi họ than tốn token.
allowed-tools: Read Write Edit Glob Grep Bash(${CLAUDE_SKILL_DIR}/do.sh *)
---

## Nguyên tắc

Ngữ cảnh đầy thì chất lượng trả lời giảm, không chỉ tốn tiền. Mọi việc dưới đây
quy về một câu: **đừng nạp thứ chưa cần**.

Ba mức chi phí, phải phân biệt rõ vì cách xử lý khác nhau:

| Thứ | Nạp khi nào | Hệ quả |
|---|---|---|
| `CLAUDE.md` | **mỗi phiên**, luôn luôn | Đắt nhất. Cắt trước tiên |
| `description` của skill đang bật | **mỗi phiên**, kể cả không dùng | Nhiều skill bật = trả tiền cho cái không dùng |
| Thân `SKILL.md` | khi skill được gọi, rồi **nằm lại đến hết phiên** | Skill dài phải tách |
| File phụ trong thư mục skill | chỉ khi được đọc tới | Chỗ nên đẩy nội dung dài vào |

## Việc cần làm

### 1. Đo trước

```bash
bash "${CLAUDE_SKILL_DIR}/do.sh"
```

Script in kích thước `CLAUDE.md`, từng `SKILL.md`, và file phụ. Có số rồi mới
sửa — đừng đoán chỗ nào tốn.

### 2. Cắt `CLAUDE.md` xuống dưới ~500 token

Với **từng dòng**, hỏi: *"bỏ dòng này thì Claude có làm sai không?"* Không → xoá.

| Giữ | Xoá |
|---|---|
| Lệnh không đoán được (chạy test, build, lint) | Thứ đọc code là biết |
| Quy ước **khác** mặc định của ngôn ngữ | Quy ước chuẩn ai cũng biết |
| Quirk môi trường, biến bắt buộc | Tài liệu API dài (để link) |
| Cái bẫy đã sập một lần rồi | Lời khuyên chung ("viết code sạch") |
| Quy ước nhánh, PR | Mô tả từng file trong repo |

Chưa có `CLAUDE.md` thì tạo mới theo bảng trên, đừng chạy `/init` rồi để nguyên —
bản tự sinh thường dài gấp mấy lần mức cần thiết.

Dấu hiệu file quá dài: Claude cứ lặp lại một lỗi dù đã có luật cấm. Luật bị chìm.
**Cắt bớt, đừng viết thêm.**

### 3. Tách skill dài

`SKILL.md` trên ~150 dòng mà có nhiều phần độc lập thì tách: `SKILL.md` giữ phần
chi phối **mọi** câu trả lời (persona, ràng buộc tuyệt đối, văn phong) cộng một
bảng điều hướng; mỗi phần còn lại ra một file riêng cùng thư mục, đặt tên theo
chủ đề.

Hai điều bắt buộc khi tách:

- **Ràng buộc tuyệt đối phải ở lại `SKILL.md`.** Quy tắc cấm kỵ mà nằm trong file
  có thể không được nạp là đánh đổi sai — tiết kiệm token không đáng giá bằng.
- **Kiểm lại không mất chữ nào**: so từng dòng có nội dung giữa bản gốc và bản
  tách, phải bằng 0 dòng bị mất. Báo con số này cho người dùng.

Tách không phải lúc nào cũng lãi: câu hỏi cần **mọi** phần thì bản tách tốn hơn
một chút. Lãi đến khi phần lớn câu hỏi chỉ chạm 1–2 phần. Nói rõ điều này.

### 4. Kiểm frontmatter

Tải skill lên claude.ai chỉ nhận **6 key**: `name`, `description`, `license`,
`compatibility`, `metadata`, `allowed-tools`. Key khác (`argument-hint`,
`disable-model-invocation`…) thì Claude Code chạy local vẫn được nhưng **tải lên
lỗi cứng**. Skill chỉ dùng trong repo thì thoải mái; skill định dùng ở mọi phiên
thì phải theo 6 key.

`allowed-tools` siết vào đúng lệnh cần
(`Bash(${CLAUDE_SKILL_DIR}/script.sh *)`) thay vì mở cả `Bash`.

### 5. Cái bẫy về phạm vi

Skill trong `.claude/skills/` của repo **che** skill cùng tên đồng bộ từ
claude.ai. Sửa bản trong repo thì chỉ repo đó hưởng; các phiên khác vẫn dùng bản
cũ trên tài khoản. Sửa xong phải tải lại lên claude.ai.

## Trả lời

Tiếng Việt. Bảng trước/sau bằng **số đo thật**, không ước lượng suông. Nêu rõ thứ
đã cắt và thứ cố ý giữ lại kèm lý do. Nếu có tách skill thì báo số dòng nội dung
bị mất (phải là 0).
