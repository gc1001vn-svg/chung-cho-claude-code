#!/usr/bin/env bash
# Lenh do MAC DINH, do cong-cu/cai_dat.mjs tao khi repo chua co lenh do nao.
# Chay: bash scripts/do.sh — in "Số đo: <dat>/<tong> thước đạt", thoat 1 neu con hong.
#
# SUA THOAI MAI: cai_dat.mjs khong bao gio ghi de file nay khi no da co. Moi repo
# tu them thuoc rieng vao day (xem quoc-chien/scripts/do.sh lam mau).
#
# VI SAO CO FILE NAY: hook `chan_bao_xong` doi moi cau bao xong phai kem dong
# "Số đo:". Repo moi khong co lenh nao sinh ra so do that -> moi lan bao xong deu
# phai ghi "Số đo: không cần", tuc la thuoc do bi vo hieu ngay tu repo dau tien.
set -uo pipefail

GOC="$(cd "$(dirname "$0")/.." && pwd)"
cd "$GOC" || exit 1

dat=0
tong=0
log="$(mktemp)"
trap 'rm -f "$log" "$log.html"' EXIT

chay() {
  tong=$((tong + 1))
  printf '%-28s' "$1"
  if eval "$2" >"$log" 2>&1; then
    echo "DAT"
    dat=$((dat + 1))
  else
    echo "HONG"
    tail -20 "$log" | sed 's/^/    /'
  fi
}

# Thuoc npm chi chay khi package.json CO khai bao script do. Repo moi thuong chua
# co cai nao — goi bua thi thuoc nao cung hong, so do thanh vo nghia.
co_script() {
  [ -f package.json ] || return 1
  node -e 'const s=JSON.parse(require("fs").readFileSync("package.json","utf8")).scripts||{};process.exit(s[process.argv[1]]?0:1)' "$1" 2>/dev/null
}
for s in lint typecheck test build; do
  co_script "$s" && chay "$s" "npm run --silent $s"
done

# Thuoc rieng repo: convert.py doi duoc mot file HTML that. Hong "No module" thi chua cai thu vien.
chay "convert:html" 'printf "<h1>Xin chao</h1>" > "$log.html" && python3 convert.py "$log.html" | grep -qx "# Xin chao"'

# Ba thuoc nay cai_dat.mjs luon chep vao, nen repo nao cung do duoc.
[ -f scripts/check_token.mjs ] && chay "check:token" "node scripts/check_token.mjs"
[ -f scripts/check_ke_hoach.mjs ] && chay "check:kehoach" "node scripts/check_ke_hoach.mjs"
[ -f scripts/check_hook.mjs ] && chay "check:hook" "node scripts/check_hook.mjs"
[ -f scripts/check_nguong.mjs ] && chay "check:nguong" "node scripts/check_nguong.mjs"
[ -f scripts/check_cap.mjs ] && chay "check:cap" "node scripts/check_cap.mjs"
[ -f scripts/check_ten.mjs ] && chay "check:ten" "node scripts/check_ten.mjs"

if [ "$tong" -eq 0 ]; then
  echo "Số đo: chưa có thước nào — thêm thước vào scripts/do.sh"
  exit 1
fi

echo "Số đo: ${dat}/${tong} thước đạt"
[ "$dat" -eq "$tong" ]
