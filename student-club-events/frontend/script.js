"use strict";

const CLUBS = [
  { id: "it", name: "CLB Công nghệ IT", cat: "Học thuật", icon: "💻", color: "blue", members: 120, desc: "Học lập trình, công nghệ và xây dựng các dự án thực tế." },
  { id: "fb", name: "CLB Bóng đá", cat: "Thể thao", icon: "⚽", color: "green", members: 85, desc: "Rèn luyện sức khỏe, giao lưu và xây dựng tinh thần đồng đội." },
  { id: "media", name: "CLB Truyền thông", cat: "Nghệ thuật", icon: "🎤", color: "purple", members: 64, desc: "Sáng tạo nội dung, thiết kế và tổ chức chương trình." },
  { id: "en", name: "CLB Tiếng Anh", cat: "Học thuật", icon: "🌎", color: "orange", members: 97, desc: "Luyện giao tiếp, thuyết trình và nâng cao tiếng Anh." },
  { id: "music", name: "CLB Âm nhạc", cat: "Nghệ thuật", icon: "🎸", color: "red", members: 72, desc: "Biểu diễn, sáng tác và giao lưu cùng những người yêu nhạc." },
  { id: "volunteer", name: "CLB Tình nguyện", cat: "Cộng đồng", icon: "🤝", color: "green", members: 140, desc: "Tham gia hoạt động xã hội, mùa hè xanh và hiến máu nhân đạo." },
  { id: "chess", name: "CLB Cờ vua", cat: "Thể thao", icon: "♟️", color: "yellow", members: 38, desc: "Luyện tư duy chiến thuật, thi đấu giao hữu hằng tuần." },
  { id: "startup", name: "CLB Khởi nghiệp", cat: "Học thuật", icon: "🚀", color: "orange", members: 56, desc: "Biến ý tưởng thành dự án, gặp gỡ nhà đầu tư và mentor." }
];

// Ngày dùng định dạng YYYY-MM-DD; sự kiện đã qua sẽ tự ẩn.
const EVENTS = [
  { id: "ai", title: "Workshop AI dành cho sinh viên", date: "2026-11-07", place: "Phòng A101", time: "08:00 - 11:00", club: "it", slots: 50, taken: 38 },
  { id: "cup", title: "Giải bóng đá sinh viên", date: "2026-11-14", place: "Sân vận động trường", time: "15:00 - 18:00", club: "fb", slots: 120, taken: 96 },
  { id: "mc", title: "Lớp kỹ năng dẫn chương trình", date: "2026-11-21", place: "Hội trường B", time: "13:30 - 16:30", club: "media", slots: 40, taken: 40 }
];

const DETAILS = {
  it: { schedule: "Thứ 4 hằng tuần, 18:00 · Phòng B203", fee: "Miễn phí", contact: "it@studenthub.edu.vn" },
  fb: { schedule: "Thứ 3 và thứ 6, 16:30 · Sân vận động trường", fee: "100.000đ/học kỳ", contact: "bongda@studenthub.edu.vn" },
  media: { schedule: "Thứ 5 hằng tuần, 17:30 · Phòng Media", fee: "Miễn phí", contact: "media@studenthub.edu.vn" },
  en: { schedule: "Thứ 7 hằng tuần, 09:00 · Phòng C104", fee: "50.000đ/học kỳ", contact: "english@studenthub.edu.vn" },
  music: { schedule: "Thứ 2 và thứ 5, 18:30 · Phòng nhạc", fee: "Miễn phí", contact: "music@studenthub.edu.vn" },
  volunteer: { schedule: "Chủ nhật đầu tháng, 07:00 · Cổng chính", fee: "Miễn phí", contact: "volunteer@studenthub.edu.vn" },
  chess: { schedule: "Thứ 6 hằng tuần, 17:00 · Phòng A205", fee: "Miễn phí", contact: "chess@studenthub.edu.vn" },
  startup: { schedule: "Thứ 7 hai tuần một lần, 14:00 · Phòng khởi nghiệp", fee: "Miễn phí", contact: "startup@studenthub.edu.vn" }
};

const $ = (s) => document.querySelector(s);
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

let joined = store.get("sh_clubs");
let registered = store.get("sh_events");
let profile = store.get("sh_profile");
let filterCat = "Tất cả";
let pending = null; // { type, id }

/* ---------- Render ---------- */
function renderChips() {
  const cats = ["Tất cả", ...new Set(CLUBS.map((c) => c.cat))];
  $("#chips").innerHTML = cats.map((c) =>
    `<button class="chip" aria-pressed="${c === filterCat}" data-cat="${c}">${c}</button>`).join("");
}

function renderClubs() {
  const kw = normalize($("#clubSearch").value.trim());
  const list = CLUBS.filter((c) =>
    (filterCat === "Tất cả" || c.cat === filterCat) &&
    normalize(`${c.name} ${c.cat} ${c.desc}`).includes(kw));
  $("#clubGrid").innerHTML = list.map((c) => {
    const on = joined[c.id];
    return `<article class="club-card">
      <div class="club-icon ${c.color}" aria-hidden="true">${c.icon}</div>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      <div class="members">👥 ${c.members + (on ? 1 : 0)} thành viên · ${c.cat}</div>
      <div class="card-actions"><button class="btn ${on ? "done" : ""}" data-club="${c.id}">${on ? "✓ Đã tham gia · Rời" : "Tham gia"}</button><button class="btn btn-light" data-detail="${c.id}">Chi tiết</button></div>
    </article>`;
  }).join("");
  $("#clubEmpty").hidden = list.length > 0;
}

function daysLeft(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00") - today) / 86400000);
}

function renderEvents() {
  const list = EVENTS.filter((e) => daysLeft(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  $("#eventList").innerHTML = list.map((e) => {
    const d = new Date(e.date + "T00:00:00"), n = daysLeft(e.date), on = registered[e.id];
    const free = e.slots - e.taken - (on ? 1 : 0), wd = d.toLocaleDateString("vi-VN", { weekday: "long" });
    const left = n === 0 ? "Diễn ra hôm nay" : `Còn ${n} ngày`;
    return `<article class="event-card">
      <div class="date"><strong>${String(d.getDate()).padStart(2, "0")}</strong><span>THÁNG ${d.getMonth() + 1}</span></div>
      <div class="event-info">
        <h3>${e.title}</h3>
        <p>📍 ${e.place}</p>
        <p>🕒 ${wd}, ${e.time}</p>
        <p>🎟️ ${free > 0 ? "Còn " + free + " chỗ" : "Hết chỗ"}</p>
        <p class="left">${left}</p>
      </div>
      <button class="btn ${on ? "done" : ""}" data-event="${e.id}" ${!on && free <= 0 ? "disabled" : ""}>${on ? "✓ Đã đăng ký · Hủy" : free <= 0 ? "Hết chỗ" : "Đăng ký"}</button>
    </article>`;
  }).join("");
  $("#eventEmpty").hidden = list.length > 0;
  $("#statEvents").textContent = list.length;
  renderMe();
}

function renderStats() {
  $("#statClubs").textContent = CLUBS.length;
  $("#statJoined").textContent = Object.keys(joined).length;
}

/* ---------- Hoạt động của tôi, chi tiết CLB, lịch ---------- */
function renderMe() {
  const cl = CLUBS.filter((c) => joined[c.id]);
  const ev = EVENTS.filter((e) => registered[e.id] && daysLeft(e.date) >= 0);
  if (!cl.length && !ev.length) {
    $("#meBox").innerHTML = '<p class="empty">Bạn chưa tham gia câu lạc bộ hay đăng ký sự kiện nào. Hãy bắt đầu từ mục Câu lạc bộ.</p>';
    return;
  }
  $("#meBox").innerHTML = '<div class="me-grid">' +
    cl.map((c) => `<div class="me-item"><strong>${c.icon} ${c.name}</strong><p class="muted">${DETAILS[c.id].schedule}</p><button class="btn btn-light sm" data-detail="${c.id}">Chi tiết</button></div>`).join("") +
    ev.map((e) => `<div class="me-item"><strong>📅 ${e.title}</strong><p class="muted">${new Date(e.date + "T00:00:00").toLocaleDateString("vi-VN")} · ${e.time}<br>📍 ${e.place}</p><button class="btn btn-light sm" data-ics="${e.id}">Thêm vào lịch</button></div>`).join("") +
    "</div>";
}

function downloadIcs(e) {
  const [a, b] = e.time.split(" - ");
  const at = (t) => e.date.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
  const text = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Student Hub//VI", "BEGIN:VEVENT",
    "UID:" + e.id + "@studenthub", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""),
    "DTSTART:" + at(a), "DTEND:" + at(b), "SUMMARY:" + e.title, "LOCATION:" + e.place,
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  link.download = e.id + ".ics";
  link.click();
  URL.revokeObjectURL(link.href);
}

const detail = $("#detail");
let detailId = null;
function clubAction(id) {
  if (!joined[id]) return openDialog("club", id);
  if (confirm("Bạn muốn rời câu lạc bộ này?")) {
    delete joined[id]; store.set("sh_clubs", joined);
    toast("Đã rời câu lạc bộ."); renderClubs(); renderStats();
  }
}
function openDetail(id) {
  detailId = id;
  const c = CLUBS.find((x) => x.id === id), d = DETAILS[id], on = joined[id];
  const evs = EVENTS.filter((e) => e.club === id && daysLeft(e.date) >= 0);
  $("#detailBody").innerHTML = `<div class="club-icon ${c.color}" aria-hidden="true">${c.icon}</div>
    <h3>${c.name}</h3><p class="muted">${c.cat} · ${c.members + (on ? 1 : 0)} thành viên</p>
    <p style="margin-top:10px">${c.desc}</p>
    <div class="dl"><div>🗓️ ${d.schedule}</div><div>💰 ${d.fee}</div>
    <div>✉️ <a href="mailto:${d.contact}">${d.contact}</a></div>
    ${evs.length ? "<div>🎟️ Sự kiện sắp tới: " + evs.map((e) => e.title).join(", ") + "</div>" : ""}</div>`;
  $("#detailJoin").textContent = on ? "✓ Đã tham gia · Rời" : "Tham gia";
  detail.showModal();
}
$("#closeDetail").addEventListener("click", () => detail.close());
detail.addEventListener("click", (e) => { if (e.target === detail) detail.close(); });
$("#detailJoin").addEventListener("click", () => { detail.close(); clubAction(detailId); });
$("#meBox").addEventListener("click", (e) => {
  const d = e.target.closest("[data-detail]"), i = e.target.closest("[data-ics]");
  if (d) openDetail(d.dataset.detail);
  if (i) downloadIcs(EVENTS.find((x) => x.id === i.dataset.ics));
});

/* ---------- Toast ---------- */
let timer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove("show"), 3000);
}

/* ---------- Dialog ---------- */
const dlg = $("#dialog"), form = $("#form");

function openDialog(type, id) {
  pending = { type, id };
  const club = CLUBS.find((c) => c.id === id), ev = EVENTS.find((e) => e.id === id);
  const cfg = {
    club: ["Tham gia " + (club && club.name), "Điền thông tin để ban chủ nhiệm liên hệ với bạn.", "Xác nhận tham gia"],
    event: ["Đăng ký " + (ev && ev.title), "Thông tin xác nhận sẽ được gửi qua email.", "Xác nhận đăng ký"],
    login: ["Đăng nhập", "Lưu thông tin để lần sau không phải nhập lại.", "Đăng nhập"]
  }[type];
  $("#dlgTitle").textContent = cfg[0];
  $("#dlgDesc").textContent = cfg[1];
  $("#submitBtn").textContent = cfg[2];
  $("#mssvRow").hidden = type === "login";
  $("#formError").textContent = "";
  form.name.value = profile.name || "";
  form.mssv.value = profile.mssv || "";
  form.email.value = profile.email || "";
  dlg.showModal();
  form.name.focus();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.name.value.trim(), mssv = form.mssv.value.trim(), email = form.email.value.trim();
  let err = "";
  if (name.length < 2) err = "Vui lòng nhập họ và tên.";
  else if (pending.type !== "login" && !/^\d{6,12}$/.test(mssv)) err = "MSSV gồm 6-12 chữ số.";
  else if (!/^\S+@\S+\.\S+$/.test(email)) err = "Email chưa đúng định dạng.";
  if (err) { $("#formError").textContent = err; return; }

  profile = { name, mssv: mssv || profile.mssv || "", email };
  store.set("sh_profile", profile);
  if (pending.type === "club") {
    joined[pending.id] = true; store.set("sh_clubs", joined);
    toast("Đã gửi yêu cầu tham gia " + CLUBS.find((c) => c.id === pending.id).name);
  } else if (pending.type === "event") {
    registered[pending.id] = true; store.set("sh_events", registered);
    toast("Đăng ký thành công: " + EVENTS.find((x) => x.id === pending.id).title);
  } else {
    store.set("sh_login", { on: true });
    $("#loginBtn").textContent = "👤 " + name.split(" ").pop();
    toast("Xin chào, " + name + "!");
  }
  dlg.close();
  renderClubs(); renderEvents(); renderStats();
});

$("#cancelBtn").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

/* ---------- Events ---------- */
let st;
$("#clubSearch").addEventListener("input", () => { clearTimeout(st); st = setTimeout(renderClubs, 150); });
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  filterCat = b.dataset.cat; renderChips(); renderClubs();
});
$("#clubGrid").addEventListener("click", (e) => {
  const d = e.target.closest("[data-detail]");
  if (d) return openDetail(d.dataset.detail);
  const b = e.target.closest("[data-club]");
  if (!b) return;
  if (joined[b.dataset.club]) {
    if (confirm("Bạn muốn rời câu lạc bộ này?")) { delete joined[b.dataset.club]; store.set("sh_clubs", joined); toast("Đã rời câu lạc bộ."); renderClubs(); renderStats(); }
  }
  else openDialog("club", b.dataset.club);
});
$("#eventList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-event]");
  if (!b) return;
  if (registered[b.dataset.event]) {
    if (confirm("Bạn muốn hủy đăng ký sự kiện này?")) { delete registered[b.dataset.event]; store.set("sh_events", registered); toast("Đã hủy đăng ký."); renderEvents(); }
  }
  else openDialog("event", b.dataset.event);
});
$("#loginBtn").addEventListener("click", () => {
  if (store.get("sh_login").on) {
    if (confirm("Bạn muốn đăng xuất?")) { store.set("sh_login", {}); $("#loginBtn").textContent = "Đăng nhập"; toast("Đã đăng xuất."); }
  } else openDialog("login");
});

/* Giao diện sáng/tối */
const root = document.documentElement;
function syncTheme() { $("#themeBtn").textContent = root.dataset.theme === "dark" ? "☀️" : "🌙"; }
$("#themeBtn").addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("sh_theme", root.dataset.theme); } catch {}
  syncTheme();
});

/* Menu mobile */
const menu = $("#menu"), toggle = $("#menuToggle");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", false); }
});

/* Đánh dấu mục menu đang xem */
const links = [...menu.querySelectorAll("a")];
const obs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.hash === "#" + en.target.id));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => obs.observe(s));

/* Khởi tạo */
syncTheme();
if (store.get("sh_login").on && profile.name) $("#loginBtn").textContent = "👤 " + profile.name.split(" ").pop();
renderChips(); renderClubs(); renderEvents(); renderStats();
