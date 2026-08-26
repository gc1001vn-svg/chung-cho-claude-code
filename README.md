# chung-cho-claude-code

Chuyển tài liệu (PDF, file Office, ảnh, HTML, ...) và trang web sang Markdown
bằng [markitdown](https://github.com/microsoft/markitdown) của Microsoft.

## Cài đặt

```bash
pip install -r requirements.txt
```

## Sử dụng

In Markdown ra stdout:

```bash
python convert.py bao-cao.pdf
python convert.py https://example.com/trang.html
```

Ghi ra một file:

```bash
python convert.py bao-cao.pdf -o bao-cao.md
```

Chuyển nhiều nguồn cùng lúc — khi có từ hai nguồn trở lên, `-o` là **thư mục**
nhận mỗi nguồn một file `.md` (tên file lấy theo tên nguồn):

```bash
python convert.py *.docx *.pdf -o markdown/
# wrote markdown/hop-dong.md
# wrote markdown/bao-cao.md
```

Không có `-o` thì tất cả nguồn được in nối tiếp ra stdout, cách nhau một dòng trống.

### Tuỳ chọn

| Tuỳ chọn | Ý nghĩa |
| --- | --- |
| `-o`, `--output PATH` | File đích (một nguồn) hoặc thư mục đích (nhiều nguồn) |
| `-q`, `--quiet` | Không in dòng `wrote <file>` khi ghi ra file |
| `--version` | In phiên bản |
| `-h`, `--help` | Trợ giúp |

### Xử lý lỗi

Một nguồn lỗi không làm dừng các nguồn còn lại: lỗi được in ra stderr, các nguồn
khác vẫn được chuyển, và lệnh kết thúc với mã thoát `1` nếu có ít nhất một lỗi.

```bash
python convert.py khong-co.pdf bao-cao.pdf
# error: no such file: khong-co.pdf
# (nội dung Markdown của bao-cao.pdf)
# exit code 1
```

## Chạy test

```bash
pip install pytest
python -m pytest
```

Bộ test dùng converter giả nên chạy được mà không cần cài `markitdown`.
