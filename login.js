import { auth }
from "./firebase.js";

import {
 signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

document
.getElementById("loginBtn")
.onclick = async ()=>{

 try{

  await signInWithEmailAndPassword(
   auth,
   document.getElementById("email").value,
   document.getElementById("password").value
  );

  location.href =
  "admin.html";

 }catch(err){

  alert(
   "Email atau Password salah"
  );

 }

};