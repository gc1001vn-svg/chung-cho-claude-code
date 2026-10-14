# Bo tieu de / chan trang lap lai o moi trang PDF, chi giu lan xuat hien dau tien.
# Chay hai luot tren cung mot file: luot 1 dem, luot 2 loc.
#
# Mot dong bi coi la "khung trang" khi thoa DU ca bon dieu kien:
#   1. dai tu 25 ky tu tro len   -> loai tru cac o tra loi ngan lap lai ("Dat", "Khong")
#   2. lap lai tu 3 lan tro len  -> mot lan trung khong bi dung toi
#   3. khong phai dong bang (|), tieu de (#), gach dau dong (-, *, >) hay muc danh so
#   4. giong nhau TUNG KY TU (chi bo qua khac biet ve khoang trang)
#
# Co y KHONG quy chu so ve mot dang: neu coi "Trang 1/12" va "Trang 2/12" la mot
# thi "Thiet bi so 12 - dat" va "Thiet bi so 13 - khong dat" cung bi gop lam mot,
# tuc la mat du lieu. Doi lai, chan trang co so trang se khong bi bo — chap nhan
# duoc, vi tieu de dau trang (thuong giong het nhau) moi la phan dai va lap nhieu.

function norm(s) {
    gsub(/^[ \t]+|[ \t]+$/, "", s)
    gsub(/[ \t]+/, " ", s)
    return s
}

function eligible(s,   t) {
    t = s
    gsub(/^[ \t]+|[ \t]+$/, "", t)
    if (length(t) < 25) return 0
    if (t ~ /^[|#>*-]/) return 0
    if (t ~ /^[0-9]+[.)]/) return 0
    return 1
}

NR == FNR {
    if (eligible($0)) seen[norm($0)]++
    next
}

{
    if (eligible($0)) {
        k = norm($0)
        if (seen[k] >= 3) {
            if (printed[k]++) next
        }
    }
    print
}
