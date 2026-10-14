#!/usr/bin/env node
// Hook PreToolUse: chan lenh Bash co vong lap KHONG CO TRAN.
// Ban dung chung cho moi du an cua gc1001vn-svg.
//
// Cai vao mot du an: `node /home/user/ghi-nho/cong-cu/cai_dat.mjs <repo>`.
//
// ---------------------------------------------------------------------------
// VI SAO CO FILE NAY
//
// 21/09/2026: mot vong `until ... curl ... sleep 15 ... done` cho CI xong. URL
// dung SHA NGAN, GitHub tra mang rong chu khong bao loi, nen dieu kien thoat
// khong bao gio dung. Treo 40 phut, ~160 `curl` thua, va chi phat hien khi chu
// du an gui anh man hinh "Running 40m 01s". Chu du an noi lan nay la TAI DIEN.
//
// Bai hoc KHONG phai "nho dung SHA du 40 ky tu" — no la mot truong hop. Cai
// hong that: mot vong lap doi dieu kien ngoai (mang, API, file) ma khong co
// tran thi bat ky thay doi nao ben ngoai cung lam no treo mai. Ghi mot dong vao
// tai lieu da thu roi, va no van tai dien. Nen chan bang may.
//
// LUAT: vong lap phai co MOT trong hai thu —
//   1. `timeout <giay>` boc ngoai, hoac
//   2. so vong dem duoc (`for i in $(seq 1 N)`, `for i in {1..N}`).
// Khong co thi chan, va bao ra ba cach thay the re hon.
//
// KHONG CHAN DUOC GI: shell co nhieu cach viet vong lap ma doc chuoi khong bat
// het (`xargs`, script roi, `watch`, de quy). Day la cai NHAC bat duoc dung cai
// khuon da lam hong that, khong phai cai khoa.

import { bat, thoat } from './hook_chung.mjs';

const ID = 'chan_vong_vo_han';

/** Vong lap khong co dieu kien thoat tu than no. */
const VONG_HO = [
  /\bwhile\s+true\b/,
  /\bwhile\s+:\s*;/,
  /\buntil\s+/,
  /\bwhile\s+\[/,
  /\bwhile\s+\[\[/,
  // Ra 07/10: cung khuon `until` gay treo 40 phut, viet nguoc lai.
  /\bwhile\s+!/,
  /\bwhile\s+(curl|wget|test|git|grep|pgrep|nc)\b/,
];

/** Co tran thi cho qua. */
const CO_TRAN = [
  /\btimeout\s+\d+/,           // timeout 600 bash -c '...'
  /\bfor\s+\w+\s+in\s+\$\(seq/, // for i in $(seq 1 55)
  /\bfor\s+\w+\s+in\s+\{\d+\.\.\d+\}/, // for i in {1..55}
];

/** Chi doi khi vong lap CHO thu gi do — ngu, goi mang, doc file. */
const CO_CHO = [/\bsleep\b/, /\bcurl\b/, /\bwget\b/, /\bgit\s+(fetch|ls-remote)\b/];

/**
 * Bo than heredoc truoc khi do. Than heredoc la DU LIEU, khong phai lenh:
 * `git commit -F - <<'EOF' ... EOF` mang ca doan van ta cai vong lap hong, va
 * ban dau file nay chan dung cai commit tao ra chinh no (21/09). Chan nham la
 * cach nhanh nhat de mot lop bao ve bi tat han.
 */
function boHeredoc(lenh) {
  const dong = lenh.split('\n');
  const giu = [];
  let ket = null;
  for (const d of dong) {
    if (ket !== null) {
      if (d.trim() === ket) ket = null;
      continue;
    }
    const khop = /<<-?\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w]*))/.exec(d);
    giu.push(d);
    if (khop) ket = khop[1] ?? khop[2] ?? khop[3];
  }
  return giu.join('\n');
}

process.on('uncaughtException', () => process.exit(0));
process.on('unhandledRejection', () => process.exit(0));

if (!bat(ID, ['nhe', 'thuong', 'chat'])) process.exit(0);

let raw = '';
process.stdin.on('error', () => process.exit(0));
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let tho;
  try {
    tho = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  if (tho.tool_name !== 'Bash') process.exit(0);
  const tho_lenh = typeof tho.tool_input?.command === 'string' ? tho.tool_input.command : '';
  if (!tho_lenh) process.exit(0);
  const lenh = boHeredoc(tho_lenh);

  // `pkill -f <mau>` khop luon dong lenh Bash dang chay no (mau nam nguyen chu trong do) -> giet chinh shell,
  // ma 144: 2 lan mat luot chay nen 09/10 (`pkill -f "stryker"`). Mau co `[` (`"[s]tryker"`) hay bien (`$P`) thi khong tu khop.
  const k = /\bpkill\b[^|;&\n]*?\s-\w*f\w*\s+(?:"([^"]+)"|'([^']+)'|([^\s;|&)]+))/.exec(lenh);
  const mau = k ? (k[1] ?? k[2] ?? k[3] ?? '') : '';
  if (mau && !/[[$]/.test(mau)) {
    const an = `"[${mau[0]}]${mau.slice(1)}"`;
    return thoat(2, {
      loi: `\`pkill -f ${mau}\` khop luon dong lenh nay nen giet chinh shell (ma 144, 2 lan 09/10). ` +
        `Viet \`pkill -f ${an}\` hoac \`kill $(pgrep -f ${an})\`.`,
    });
  }

  // Ma cua ong `a | tail` la ma cua `tail`: `do.sh | tail -1 && git push` day kho khi thuoc dang do (10/10, dot 9).
  // Cung loi: `a | tail; ma=$?`. Chi tinh khi cuoi ong la lenh loc, xem — `printf … | node hook; ma=$?` lay dung ma can.
  // Co `pipefail` thi cho qua. Ruot chuoi nhay khong tinh — `-m "a | b"` khong phai ong.
  if (!/\bpipefail\b/.test(lenh)) {
    const khung = lenh.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, (s) => s.replace(/[|;&\n]/g, ' '));
    const loc = (p) => p.includes('|') && /^\s*(tail|head|tee|cat|grep|egrep|sed|awk|cut|sort|uniq|wc|tr)\b/.test(p.split('|').pop());
    const doan = khung.split(/;|\n|\|\|/);
    const nuot = doan.some((d, i) => {
      const phan = d.split('&&');
      const j = phan.findIndex((p) => /\bgit\b.*\b(push|commit)\b/.test(p));
      return (j > 0 && phan.slice(0, j).some(loc)) || (d.includes('$?') && i > 0 && loc(doan[i - 1].split('&&').pop()));
    });
    if (nuot) {
      return thoat(2, {
        loi: 'Ong `|` lay ma cua lenh CUOI (`tail`, `grep`), nen `&& git push` / `$?` sau no khong biet lenh dau do — ' +
          '10/10 day kho khi `do.sh` dang do. Ghi ra file: `<lenh do> > f 2>&1; ma=$?; tail -3 f; ' +
          '[ $ma -eq 0 ] && git push`, hoac them `set -o pipefail;` dau lenh.',
      });
    }
  }

  // Viec nen (`run_in_background`) va agent con TU BAO khi xong; ngu cho chung la phi luot. 10/10 (dot 9 mon 1):
  // 4 lan/gio, vong cho agent con chay tiep 85 s sau khi bao cao da ve. Vong cho may chu len (`sleep 1`) khong dinh.
  const ngu = /^\s*sleep\s+(\d+)/.exec(lenh);
  if ((ngu && Number(ngu[1]) >= 30) || (/\bsleep\b/.test(lenh) && /\/tasks\/\S*\.output\b/.test(lenh))) {
    return thoat(2, {
      loi: 'Dung ngu cho viec nen, agent con: chung tu bao khi xong — ket thuc luot ma cho (10/10 vong cho thua 85 s). ' +
        'Cho CI: `bash /home/user/ghi-nho/cong-cu/cho_ci.sh` chay nen.',
    });
  }

  const coVong = VONG_HO.some((r) => r.test(lenh));
  if (!coVong) process.exit(0);
  if (!CO_CHO.some((r) => r.test(lenh))) process.exit(0);
  if (CO_TRAN.some((r) => r.test(lenh))) process.exit(0);

  thoat(2, {
    loi:
      'Vong lap nay khong co tran: dieu kien thoat doi thu ben ngoai (mang, API, file) ma ' +
      'khong co gi bat no dung. Dieu kien sai mot chut la treo mai — 21/09 mot vong ' +
      '`until ... curl ... sleep` treo 40 phut vi URL dung SHA ngan, API tra mang rong.\n' +
      'Chon mot trong ba:\n' +
      '  1. Hoi thang mot lan, khong vong lap. Trang thai CI doc bang ' +
      '`mcp__github__actions_list` voi `workflow_runs_filter`; muon cho thi hoi lai o luot sau.\n' +
      '  2. Dat tran so vong: `for i in $(seq 1 40); do <kiem> && break; sleep 15; done`.\n' +
      '  3. Boc `timeout`: `timeout 600 bash -c \'until <kiem>; do sleep 15; done\'`.\n' +
      'Muon tat lop nhac nay thi ghi `chan_vong_vo_han` vao `.claude/hook_phien.txt` — ' +
      'co ghi la co dau vet.',
  });
});
