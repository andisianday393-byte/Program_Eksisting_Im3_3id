import { auth, db } from "./firebase.js";

import {
 onAuthStateChanged,
 signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
 collection,
 addDoc,
 getDocs,
 getDoc,
 updateDoc,
 deleteDoc,
 doc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/* =========================
AUTH
========================= */
let uploadedUrl = "";
let uploadedType = "";

onAuthStateChanged(auth, (user) => {
 if (!user) {
  location.href = "login.html";
 }
});

/* =========================
ELEMENT
========================= */
const orderInput =
document.getElementById("order");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("desc");
const typeInput = document.getElementById("type");
const visibleInput = document.getElementById("visible");
const saveBtn = document.getElementById("saveBtn");
const list = document.getElementById("list");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const previewContainer = document.getElementById("previewContainer");
const logoutBtn = document.getElementById("logoutBtn");

let editId = null;

/* =========================
HELPER
========================= */
function renderPreview(url, mediaType) {
 if (!url) {
  previewContainer.innerHTML = "";
  return;
 }

 if (mediaType === "video") {
  previewContainer.innerHTML = `
   <video class="preview" controls>
    <source src="${url}">
   </video>
  `;
  const video = previewContainer.querySelector("video");
  if (video) video.load();
 } else {
  previewContainer.innerHTML = `
   <img class="preview" src="${url}" alt="Preview">
  `;
 }
}

function getMediaMarkup(data) {
 if (data.type === "video") {
  return `
   <video
    src="${data.src}"
    style="
     width:100px;
     height:100px;
     object-fit:cover;
     border-radius:10px;
     background:#000;
    "
    controls
   ></video>
  `;
 }

 return `
  <img
   src="${data.src}"
   style="
    width:100px;
    height:100px;
    object-fit:cover;
    border-radius:10px;
   "
   alt="Media"
  >
 `;
}

/* =========================
UPLOAD CLOUDINARY
========================= */
uploadBtn.onclick = async () => {
 const file = fileInput.files[0];

 if (!file) {
  alert("Pilih file dahulu");
  return;
 }

 uploadStatus.innerHTML = "Uploading...";

 try {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "produk_marketplace");
  console.log("preset:", "produk_marketplace");
  console.log("file:", file.name, file.type);

  const res = await fetch(
   "https://api.cloudinary.com/v1_1/do0f3lr3b/auto/upload",
   {
    method: "POST",
    body: formData
   }
  );

  const data = await res.json();

  console.log("status:", res.status);
  console.log("response:", data);

  if (!res.ok) {
   throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  if (!data.secure_url) {
   throw new Error("secure_url tidak ada");
  }

  uploadedUrl = data.secure_url;
  uploadedType = file.type.startsWith("video") ? "video" : "image";
  renderPreview(uploadedUrl, uploadedType);

  uploadStatus.innerHTML = "Upload berhasil";
 } catch (err) {
  console.error(err);
  uploadStatus.innerHTML = err.message || "Upload gagal";
 }
};

/* =========================
SIMPAN
========================= */
saveBtn.onclick = async () => {
 if (!uploadedUrl) {
  alert("Silakan upload gambar/video terlebih dahulu");
  return;
 }

 const data = {
  title: titleInput.value.trim(),
  desc: descInput.value.trim(),
  src: uploadedUrl,
  type: typeInput.value || uploadedType || "image",
  visible: visibleInput.checked,
  order: Number(orderInput.value) || 999,
  createdAt: Date.now()
};

 try {
  if (editId) {
   await updateDoc(doc(db, "media", editId), data);
   alert("Program berhasil diupdate");
  } else {
   await addDoc(collection(db, "media"), data);
   alert("Program berhasil ditambahkan");
  }

  resetForm();
  await loadMedia();
 } catch (err) {
  console.error(err);
  alert("Gagal menyimpan data");
 }
};

/* =========================
LOAD DATA
========================= */
async function loadMedia() {
 const snap = await getDocs(collection(db, "media"));
 list.innerHTML = "";

 snap.forEach((d) => {
  const data = d.data();
  const mediaMarkup = getMediaMarkup(data);

  list.innerHTML += `
 <div class="media-item">
  <div class="row">
   ${mediaMarkup}
   <div style="flex:1">
    <h3> #${data.order || 999} - ${escapeHtml(data.title || "")} </h3>

    <div class="desc-preview">
     ${smartFormatDesc(data.desc || "")}
    </div>

    <p>${data.visible ? "Aktif" : "Disembunyikan"}</p>

    <div class="action-buttons">
     <button class="edit" onclick="editMedia('${d.id}')">Edit</button>
     <button class="delete" onclick="hapusMedia('${d.id}')">Hapus</button>
    </div>

    <br>

    <button
     class="toggle"
     onclick="toggleMedia('${d.id}', ${data.visible})"
    >
     ${data.visible ? "Sembunyikan" : "Tampilkan"}
    </button>
   </div>
  </div>
 </div>
 <hr>
`;
 });
}

function escapeHtml(str = "") {
 return str
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
}

  function smartFormatDesc(text = "") {

 const safe = escapeHtml(text)
  .replace(/\n/g, "<br>");

 if (text.length <= 150) {
  return safe;
 }

 return `
  <span class="short">
   ${safe.slice(0,150)}...
  </span>

  <span class="full">
   ${safe}
  </span>
 `;
}
  
list.addEventListener("click", (e) => {

 const desc = e.target.closest(".desc-preview");

 if (!desc) return;

 const item = desc.closest(".media-item");

 if (item) {
  item.classList.toggle("expanded");
 }

});

/* =========================
EDIT
========================= */
window.editMedia = async function (id) {
 try {
  const snap = await getDoc(doc(db, "media", id));

  if (!snap.exists()) {
   alert("Data tidak ditemukan");
   return;
  }

  const data = snap.data();

  titleInput.value = data.title || "";
  descInput.value = data.desc || "";
  uploadedUrl = data.src || "";
  uploadedType = data.type || "image";
  typeInput.value = data.type || "image";
  visibleInput.checked = !!data.visible;
  orderInput.value =
data.order || 999;
  renderPreview(uploadedUrl, uploadedType);

  editId = id;
  saveBtn.innerText = "Update Program";
 } catch (err) {
  console.error(err);
  alert("Gagal membuka data untuk edit");
 }
};

/* =========================
HAPUS
========================= */
window.hapusMedia = async function (id) {
 if (!confirm("Hapus program?")) return;

 try {
  await deleteDoc(doc(db, "media", id));
  await loadMedia();
 } catch (err) {
  console.error(err);
  alert("Gagal menghapus data");
 }
};

/* =========================
SHOW / HIDE
========================= */
window.toggleMedia = async function (id, visible) {
 try {
  await updateDoc(doc(db, "media", id), {
   visible: !visible
  });

  await loadMedia();
 } catch (err) {
  console.error(err);
  alert("Gagal mengubah status");
 }
};

/* =========================
RESET
========================= */
function resetForm() {
 editId = null;
 titleInput.value = "";
 descInput.value = "";
 uploadedUrl = "";
 uploadedType = "";
 typeInput.value = "image";
 visibleInput.checked = true;
  orderInput.value = 999;
 fileInput.value = "";
 previewContainer.innerHTML = "";
 uploadStatus.innerHTML = "";
 saveBtn.innerText = "Tambah Program";
}

/* =========================
LOGOUT
========================= */
if (logoutBtn) {
 logoutBtn.onclick = async () => {
  await signOut(auth);
 };
}

/* =========================
START
========================= */
loadMedia();