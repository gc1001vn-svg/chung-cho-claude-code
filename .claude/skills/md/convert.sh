#!/usr/bin/env bash
# Chuyen file bat ky sang Markdown chuan de tiet kiem token.
# Dung: convert.sh [duong-dan ...] | convert.sh all | convert.sh   (mac dinh: dot upload moi nhat)
set -uo pipefail

# Trong repo git thi luu canh repo; ngoai repo thi luu tam -> dung duoc o moi noi
ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
OUTDIR="${ROOT:-${TMPDIR:-/tmp}}/.mdcache"
mkdir -p "$OUTDIR"

# Container co the bi dung lai va mat markitdown -> tu cai lai, khong de lenh chet
if ! command -v markitdown >/dev/null 2>&1; then
  echo "Chua co markitdown, dang cai (lan dau, khoang 1 phut)..." >&2
  pip install --quiet "markitdown[all]" >&2 2>/dev/null \
    || pip install --quiet --break-system-packages "markitdown[all]" >&2 2>/dev/null
  command -v markitdown >/dev/null 2>&1 || {
    echo "Khong cai duoc markitdown. Kiem tra mang cua moi truong." >&2; exit 3; }
  echo "Da cai xong markitdown." >&2
fi

# markitdown xu ly duoc; phan con lai bao ro thay vi that bai am tham
SUPPORTED='pdf|docx|doc|pptx|ppt|xlsx|xls|csv|tsv|html|htm|xml|json|txt|md|epub|rtf|odt|zip|msg|jpg|jpeg|png|gif|bmp|webp|tiff'

human() { awk -v b="$1" 'BEGIN{ s="B KB MB GB"; split(s,u," "); i=1;
  while (b>=1024 && i<4){ b/=1024; i++ } printf (i==1?"%d %s":"%.1f %s"), b, u[i] }'; }

# Ten file .md cho mot nguon. Phai kem duoi file: bao-cao.pdf va bao-cao.xlsx
# la hai tai lieu khac nhau, khong duoc do chung vao mot .md.
outname() {
  local b e t
  b=$(basename "$1")
  e=$(echo "${b##*.}" | tr 'A-Z' 'a-z')
  t=$(echo "${b%.*}" | sed -E 's/^[0-9a-f]{8}-//' | sed -E 's/[^A-Za-z0-9._-]+/_/g' | cut -c1-60)
  echo "$OUTDIR/$t.$e.md"
}

# ---- chon file nguon ----
declare -a SRC=()
UPDIR=$(ls -dt /root/.claude/uploads/*/ 2>/dev/null | head -1)

if [ "$#" -gt 0 ] && [ "$1" != "all" ] && [ "$1" != "tat-ca" ]; then
  for a in "$@"; do
    if [ -f "$a" ]; then SRC+=("$a")
    elif [ -n "$UPDIR" ] && compgen -G "$UPDIR*$a*" >/dev/null; then
      while IFS= read -r m; do SRC+=("$m"); done < <(ls -t "$UPDIR"*"$a"* 2>/dev/null)
    else echo "! Khong tim thay: $a" >&2; fi
  done
else
  if [ -z "$UPDIR" ]; then
    echo "Khong co thu muc upload. Hay dua duong dan file: /md duong/dan/file.pdf" >&2; exit 2
  fi
  if [ "$#" -gt 0 ]; then                      # all: moi file da tai len
    while IFS= read -r f; do SRC+=("$f"); done < <(ls -t "$UPDIR"* 2>/dev/null)
  else                                          # mac dinh: dot tai len moi nhat (cach nhau <5 phut)
    newest=$(ls -t "$UPDIR"* 2>/dev/null | head -1)
    [ -z "$newest" ] && { echo "Chua co file nao duoc tai len." >&2; exit 2; }
    tnew=$(stat -c %Y "$newest")
    while IFS= read -r f; do
      t=$(stat -c %Y "$f"); [ $((tnew - t)) -le 300 ] && SRC+=("$f")
    done < <(ls -t "$UPDIR"* 2>/dev/null)
  fi
fi

[ "${#SRC[@]}" -eq 0 ] && { echo "Khong co file nao de chuyen." >&2; exit 2; }

# ---- chuyen doi ----
tong_goc=0; tong_md=0; tong_tok=0; n_ok=0
for f in "${SRC[@]}"; do
  base=$(basename "$f")
  ext="${base##*.}"; ext=$(echo "$ext" | tr 'A-Z' 'a-z')
  # bo tien to bam cua he thong upload (vd 478f161f-ten_that.pdf)
  out=$(outname "$f")
  sz=$(stat -c %s "$f")

  if ! echo "$ext" | grep -qE "^($SUPPORTED)$"; then
    echo "BO QUA  $base  — markitdown khong doc duoc dinh dang .$ext"
    [ "$ext" = "mp4" ] || [ "$ext" = "mov" ] && echo "        (video: hay mo ta noi dung hoac cat anh man hinh de toi xem)"
    continue
  fi

  st="OK     "
  src_abs=$(readlink -f "$f")
  if [ -f "$out" ] && [ "$out" -nt "$f" ] \
     && [ "$(cat "$out.src" 2>/dev/null)" = "$src_abs" ]; then
    st="SAN CO "
  else
    if ! markitdown "$f" > "$out.raw" 2>"$out.err"; then
      # .doc cu doi khi that bai -> chuyen qua docx bang libreoffice roi thu lai
      if [ "$ext" = "doc" ] || [ "$ext" = "ppt" ] || [ "$ext" = "xls" ]; then
        tmp=$(mktemp -d)
        soffice --headless -env:UserInstallation="file://$tmp/p" \
          --convert-to "${ext}x" --outdir "$tmp" "$f" >/dev/null 2>&1
        conv=$(ls "$tmp"/*."${ext}x" 2>/dev/null | head -1)
        [ -n "$conv" ] && markitdown "$conv" > "$out.raw" 2>>"$out.err"
        rm -rf "$tmp"
      fi
    fi
    if [ ! -s "$out.raw" ]; then
      echo "LOI     $base — $(tail -1 "$out.err" 2>/dev/null | cut -c1-90)"
      rm -f "$out.raw" "$out.err"; continue
    fi
    # don rac lam phinh token: anh nhung base64, khoang trang thua, dong trong lien tiep
    skill_dir=$(dirname "${BASH_SOURCE[0]}")
    # anh nhung base64 -> mot chu; bo ky tu ngat trang cua pdfminer; bo khoang trang cuoi dong
    sed -E 's#data:[a-zA-Z/+.-]+;base64,[A-Za-z0-9+/=]{20,}#(anh)#g' "$out.raw" \
      | tr -d '\f' \
      | sed -E 's/[[:space:]]+$//' \
      | awk -f "$skill_dir/clean.awk" \
      | cat -s > "$out.tmp"
    # bo tieu de/chan trang lap lai (can hai luot nen phai qua file trung gian)
    awk -f "$skill_dir/dedup.awk" "$out.tmp" "$out.tmp" > "$out"
    echo "$src_abs" > "$out.src"
    rm -f "$out.raw" "$out.err" "$out.tmp"
  fi

  msz=$(stat -c %s "$out"); tok=$((msz / 3))
  tong_goc=$((tong_goc + sz)); tong_md=$((tong_md + msz)); tong_tok=$((tong_tok + tok)); n_ok=$((n_ok + 1))
  printf "%s %s\n        %s -> %s  (~%s token)\n        %s\n" \
    "$st" "$base" "$(human "$sz")" "$(human "$msz")" "$tok" "$out"
done

[ "$n_ok" -eq 0 ] && exit 1
echo "---"
printf "TONG: %d file | %s -> %s | ~%s token\n" \
  "$n_ok" "$(human "$tong_goc")" "$(human "$tong_md")" "$tong_tok"

# ---- dan bai de doc chon loc thay vi nap ca file ----
echo "--- DAN BAI ---"
for f in "${SRC[@]}"; do
  o=$(outname "$f"); [ -f "$o" ] || continue
  echo "# $(basename "$o")"
  if grep -qE '^#{1,4} ' "$o"; then
    grep -nE '^#{1,4} ' "$o" | head -25 | cut -c1-110
  else
    grep -nE '\S' "$o" | head -10 | cut -c1-110
  fi
done
