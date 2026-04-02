const firebaseConfig = {
  apiKey: "AIzaSyCvzWuH2c62LJz4xUZCzhXhRjrW-7Do8Yk",
  authDomain: "vchat-8d791.firebaseapp.com",
  projectId: "vchat-8d791",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let userData = {};
let currentChannel = "general";

// AUTH
function signup(){
  auth.createUserWithEmailAndPassword(email.value,password.value)
    .then(u=>u.user.sendEmailVerification());
}

function login(){
  auth.signInWithEmailAndPassword(email.value,password.value);
}

// PROFILE
async function saveProfile(){
  await db.collection("users").doc(auth.currentUser.uid).set({
    username: username.value,
    pfp: pfp.value
  });
  profile.style.display="none";
  startApp();
}

// AUTH STATE
auth.onAuthStateChanged(async user=>{
  if(user){
    if(!user.emailVerified){
      auth.signOut();
      return;
    }

    const doc = await db.collection("users").doc(user.uid).get();

    if(!doc.exists){
      profile.style.display="flex";
    } else {
      userData = doc.data();
      auth.style.display="none";
      startApp();
    }
  }
});

// START
function startApp(){
  loadChannels();
  listenMessages();
}

// CHANNELS
function loadChannels(){
  channels.innerHTML="";
  ["general","random","dev"].forEach(c=>{
    const div=document.createElement("div");
    div.className="channel";
    div.textContent="# "+c;
    div.onclick=()=>{currentChannel=c;listenMessages();}
    channels.appendChild(div);
  });
}

// SEND
form.addEventListener("submit", async e=>{
  e.preventDefault();
  if(!input.value) return;

  await db.collection("messages").add({
    ...userData,
    text: input.value,
    channel: currentChannel,
    time: Date.now(),
    uid: auth.currentUser.uid
  });

  input.value="";
});

// LISTEN
function listenMessages(){
  db.collection("messages")
    .where("channel","==",currentChannel)
    .orderBy("time")
    .onSnapshot(snap=>{
      messages.innerHTML="";
      snap.forEach(doc=>{
        const m = doc.data();

        const div=document.createElement("div");
        div.className="msg";

        div.innerHTML = `
          <img src="${m.pfp}">
          <div class="msg-content">
            <b>${m.username}</b><br>
            ${m.text}
          </div>
        `;

        // DELETE (owner only)
        if(m.uid === auth.currentUser.uid){
          div.onclick = ()=> doc.ref.delete();
        }

        messages.appendChild(div);
      });
    });
}
