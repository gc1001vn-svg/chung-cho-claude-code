---
name: bo-tro
description: Tìm plugin, skill và MCP phù hợp với dự án đang làm, rồi cân nhắc chi phí token trước khi bật. Dùng khi người dùng gõ /bo-tro, khi vừa mở một dự án mới, hoặc khi họ hỏi có công cụ nào hỗ trợ việc đang làm không.
allowed-tools: Read Glob Grep SearchPlugins SearchSkills SearchMcpRegistry SuggestPluginInstall SuggestSkills ListSkills
---

## Việc cần làm

Ba bước, theo đúng thứ tự. Đừng bỏ bước 3.

### 1. Nhận diện dự án

Đọc dấu vết trong thư mục hiện tại, đừng hỏi người dùng thứ tự đoán được:

| Thấy file | Suy ra |
|---|---|
| `*.uproject`, `Content/` | Unreal Engine |
| `ProjectSettings/ProjectVersion.txt`, `Assets/` | Unity |
| `project.godot` | Godot |
| `package.json` | đọc `dependencies` để biết framework |
| `pubspec.yaml` | Flutter |
| `Cargo.toml` / `go.mod` / `pom.xml` / `*.csproj` | Rust / Go / Java / .NET |
| `requirements.txt`, `pyproject.toml` | Python — xem thư viện để đoán lĩnh vực |
| `docker-compose.yml`, `.github/workflows/` | hạ tầng, CI |

Không có dấu vết nào rõ ràng thì hỏi người dùng một câu ngắn về mục tiêu dự án.

### 2. Tìm

Gọi cả ba, vì mỗi nguồn cho ra loại khác nhau:

- `SearchPlugins` — bó skill có sẵn (ví dụ dự án Unity → plugin `unity` chính thức, 18 skill làm game).
- `SearchSkills` — skill lẻ trong tài khoản người dùng.
- `SearchMcpRegistry` — MCP nối tới dịch vụ ngoài (Figma, Linear, Sentry…), chỉ tìm khi dự án thật sự cần nối dịch vụ đó.

Từ khoá lấy từ chính dự án: tên engine, tên framework, lĩnh vực. Đừng dùng từ khoá chung chung như "code" hay "development".

### 3. Cân chi phí trước khi đề xuất — bước bắt buộc

**Mỗi skill được bật sẽ tốn token của MỌI phiên sau đó**, kể cả phiên không dùng tới, vì phần mô tả luôn nằm trong ngữ cảnh. Bật bừa 10 skill là mất khoảng 1.000 token mỗi phiên, vĩnh viễn.

Nên:

- Đề xuất **tối đa 2–3 thứ hợp nhất**, không liệt kê hết những gì tìm được.
- Mỗi đề xuất nói rõ **dùng vào việc gì trong dự án này**. Không gắn được vào việc cụ thể thì đừng đề xuất.
- Nói thẳng cái giá: bật thêm sẽ tốn token mỗi phiên, và nên tắt khi dự án xong.
- Bó plugin nhiều skill (như `unity` có 18 skill) thì nhắc người dùng rằng cả bó cùng tính chi phí.

Rồi mới gọi `SuggestPluginInstall` / `SuggestSkills` để hiện thẻ cài đặt.

## Trả lời

Tiếng Việt, ngắn. Nêu dự án nhận ra là gì và căn cứ nào, rồi 2–3 đề xuất, mỗi cái một dòng lý do. Cuối cùng nhắc một câu về chi phí token. Không dán JSON kết quả tìm kiếm ra màn hình.

Không tìm được gì hợp thì nói thẳng là không có, đừng gợi ý gượng ép.
