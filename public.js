import { db } from "./firebase.js";

import {
 collection,
 query,
 orderBy,
 getDocs
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

window.mediaItems = [];

async function loadMedia(){

 try{

  const q = query(
   collection(db,"media")
  );

  const snap =
  await getDocs(q);

  window.mediaItems = [];

  snap.forEach(doc=>{

   const data = doc.data();

   if(data.visible){

    window.mediaItems.push({
      id: doc.id,
      ...data
    });

   }

  });
window.mediaItems.sort(
 (a,b)=>
 (a.order || 999) -
 (b.order || 999)
);
  renderCards();

 }catch(err){

  console.error(
   "Gagal load media:",
   err
  );

 }

}

function renderCards(){
 const container = document.getElementById("gridContainer");
 if(!container) return;

 container.innerHTML = "";

 window.mediaItems.forEach((item,index)=>{
  const card = document.createElement("div");
  card.className = item.tall ? "card card-tall" : "card";

  let mediaHtml = "";

  if(item.type === "video"){
   mediaHtml = `
    <img
     src="${item.poster || ''}"
     class="video-thumb"
     onclick="openFullscreen(${index})">
   `;
  }else{
   mediaHtml = `
    <img
     src="${item.src}"
     class="media-placeholder"
     onclick="openFullscreen(${index})">
   `;
  }

  card.innerHTML = `
 ${mediaHtml}

 <div class="card-body">

  <h3>${escapeHtml(item.title || "")}</h3>

  <small class="tap-hint">
   Ketuk untuk membuka ▼
  </small>

  <div class="card-desc">
   <div class="desc-block">
    ${smartFormatDesc(item.desc || "")}
   </div>
  </div>

  ${
   item.link
   ? `<a href="${item.link}" target="_blank" class="btn-link">Lihat File</a>`
   : ""
  }

 </div>
`;
   
 card.addEventListener("click", (e) => {

 if (e.target.closest("a")) return;

 const desc =
 card.querySelector(".card-desc");

 const expanded =
 card.classList.toggle("expanded");

 if (desc) {
  desc.scrollTop = 0;
 }

 const hint =
 card.querySelector(".tap-hint");

 if (hint) {
  hint.textContent = expanded
   ? "Ketuk untuk menutup ▲"
   : "Ketuk untuk membuka ▼";
 }

});
   
container.appendChild(card);

}); // tutup forEach
const images =
container.querySelectorAll("img");

Promise.all(
 [...images].map(img => {

  if(img.complete){
   return Promise.resolve();
  }

  return new Promise(resolve => {
   img.onload = resolve;
   img.onerror = resolve;
  });

 })
).then(() => {

 window.dispatchEvent(
  new Event("contentReady")
 );

});
} // tutup renderCards

function escapeHtml(str = "") {
 return str
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
}

function smartFormatDesc(text = "") {

  const lines = text
    .replace(/\r/g, "")       // hapus carriage return
    .split("\n")              // pecah per baris
    .map(line => line.trim());

  const titleSet = new Set([
    "jenis kendala yang dapat ditangani",
    "saluran bantuan (hubungi)",
    "ketentuan bagi pic circle"
  ]);

  let html = "";
  let inList = false;

  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (const line of lines) {

    if (!line) {
      closeList();
      continue;
    }

    const lower = line.toLowerCase();

    // Bullet: • atau -
    const isBullet = /^[•-]\s+/.test(line);

    const isHeading =
      titleSet.has(lower) ||
      (
        line.length < 90 &&
        !isBullet &&
        !/[.!?]$/.test(line) &&
        /[A-Za-z]/.test(line)
      );

    if (isBullet) {

      if (!inList) {
        html += "<ul>";
        inList = true;
      }

      html += `<li>${escapeHtml(
        line.replace(/^[•-]\s+/, "")
      )}</li>`;

      continue;
    }

    closeList();

    if (isHeading) {
      html += `<h4>${escapeHtml(line)}</h4>`;
    } else {
      html += `<p>${escapeHtml(line)}</p>`;
    }
  }

  closeList();

  return html;
}
loadMedia();

window.addEventListener(
 "contentReady",
 () => {

   const loading =
   document.getElementById(
    "loadingScreen"
   );

   setTimeout(() => {

     loading.classList.add("hide");

     setTimeout(() => {
       loading.remove();
     }, 400);

   }, 500);

 });