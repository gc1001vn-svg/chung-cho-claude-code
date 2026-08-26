# Don bang Markdown do markitdown sinh ra tu bang tinh:
#  - bo cot khong co tieu de (rong hoac "Unnamed: N") va moi o deu rong/NaN
#  - bo dong ma moi o deu rong/NaN
#  - thay o "NaN" (o trong cua bang tinh) bang o rong
# Cac phan khac cua tai lieu duoc giu nguyen tung ky tu.

function trim(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); return s }
function is_blank(s) { return s == "" || s == "NaN" }
function is_sep(s) { return s ~ /^:?-+:?$/ }
function is_noname(s) { return s == "" || s ~ /^Unnamed:[ ]*[0-9]+$/ }

function split_row(line, cells,   body, n, i) {
    body = line
    sub(/^[ \t]*\|/, "", body)
    sub(/\|[ \t]*$/, "", body)
    n = split(body, cells, /\|/)
    for (i = 1; i <= n; i++) cells[i] = trim(cells[i])
    return n
}

function flush_table(   r, c, i, n, ncol, keep, cells, out, first, any) {
    if (nrow == 0) return

    ncol = 0
    for (r = 1; r <= nrow; r++) if (ncell[r] > ncol) ncol = ncell[r]

    # cot nao dang giu lai
    for (c = 1; c <= ncol; c++) {
        keep[c] = 1
        if (!is_noname(cell[1, c])) continue          # co tieu de that -> giu
        any = 0
        for (r = 1; r <= nrow; r++) {
            if (r == seprow) continue
            if (r == 1) continue
            if (!is_blank(cell[r, c])) { any = 1; break }
        }
        if (!any) keep[c] = 0
    }

    for (r = 1; r <= nrow; r++) {
        # bo dong rong hoan toan (tru dong tieu de va dong ngan cach)
        if (r != 1 && r != seprow) {
            any = 0
            for (c = 1; c <= ncol; c++)
                if (keep[c] && !is_blank(cell[r, c])) { any = 1; break }
            if (!any) continue
        }
        out = ""; first = 1
        for (c = 1; c <= ncol; c++) {
            if (!keep[c]) continue
            i = cell[r, c]
            if (r != seprow && i == "NaN") i = ""
            if (r == seprow && i == "") i = "---"
            out = out "| " i " "
            first = 0
        }
        if (first) continue
        print out "|"
    }
    nrow = 0; seprow = 0
}

/^[ \t]*\|/ {
    nrow++
    ncell[nrow] = split_row($0, tmp)
    for (i = 1; i <= ncell[nrow]; i++) cell[nrow, i] = tmp[i]
    if (seprow == 0 && nrow > 1) {
        allsep = 1
        for (i = 1; i <= ncell[nrow]; i++) if (!is_sep(cell[nrow, i])) { allsep = 0; break }
        if (allsep) seprow = nrow
    }
    next
}

{ flush_table(); print }

END { flush_table() }
