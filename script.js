const DB_NAME = "AlfieUniversalStorage";
const FILE_STORE = "files";
const LOG_STORE = "logs";
let db;

// 1. Setup Database
const request = indexedDB.open(DB_NAME, 1);
request.onupgradeneeded = (e) => {
  const d = e.target.result;
  d.createObjectStore(FILE_STORE, { keyPath: "name" });
  d.createObjectStore(LOG_STORE, { keyPath: "id", autoIncrement: true });
};
request.onsuccess = (e) => { db = e.target.result; };

// 2. Logging
function logAction(msg) {
  const tx = db.transaction(LOG_STORE, "readwrite");
  tx.objectStore(LOG_STORE).add({ msg, time: new Date().toLocaleTimeString() });
  updateLogUI();
}

// 3. Auth
function checkPass() {
  const input = document.getElementById('passInput');
  if (input.value === "Alfie0901") {
    logAction("Successful Login");
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('storage-screen').style.display = 'block';
    updateUI();
  } else {
    logAction(`Failed Attempt: ${input.value}`);
    alert("Access Denied");
  }
}

function logout() {
  logAction("Logged Out");
  document.getElementById('passInput').value = "";
  document.getElementById('storage-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'block';
}

// 4. Files
async function uploadFile() {
  const picker = document.getElementById('fileInput');
  if (!picker.files[0]) return;
  
  const file = picker.files[0];
  const tx = db.transaction(FILE_STORE, "readwrite");
  tx.objectStore(FILE_STORE).put(file);
  
  tx.oncomplete = () => {
    logAction(`Uploaded: ${file.name}`);
    picker.value = "";
    updateUI();
  };
}

function deleteFile(name) {
  if (!confirm("Delete permanently?")) return;
  const tx = db.transaction(FILE_STORE, "readwrite");
  tx.objectStore(FILE_STORE).delete(name);
  tx.oncomplete = () => {
    logAction(`Deleted: ${name}`);
    updateUI();
  };
}

// 5. UI Updates
async function updateUI() {
  const list = document.getElementById('fileList');
  list.innerHTML = "";
  
  const tx = db.transaction(FILE_STORE, "readonly");
  tx.objectStore(FILE_STORE).openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const f = cursor.value;
      const url = URL.createObjectURL(f);
      const li = document.createElement('li');
      li.innerHTML = `<span>${f.name}</span><div class="actions">
        <a href="${url}" download="${f.name}">Get</a>
        <button class="del-btn" onclick="deleteFile('${f.name}')">X</button>
      </div>`;
      list.appendChild(li);
      cursor.continue();
    }
  };
  
  updateStorageMeter();
  updateLogUI();
}

async function updateStorageMeter() {
  if (navigator.storage && navigator.storage.estimate) {
    const {usage, quota} = await navigator.storage.estimate();
    const used = (usage / (1024 * 1024)).toFixed(1);
    const total = (quota / (1024 * 1024)).toFixed(0);
    document.getElementById('usage-val').innerText = used;
    document.getElementById('limit-val').innerText = total;
    document.getElementById('progress-bar').style.width = (usage/quota*100) + "%";
  }
}

function updateLogUI() {
  const logBox = document.getElementById('logList');
  logBox.innerHTML = "";
  db.transaction(LOG_STORE, "readonly").objectStore(LOG_STORE).openCursor(null, "prev").onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      logBox.innerHTML += `<div>[${cursor.value.time}] ${cursor.value.msg}</div>`;
      cursor.continue();
    }
  };
}

function clearLogs() {
  db.transaction(LOG_STORE, "readwrite").objectStore(LOG_STORE).clear();
  updateLogUI();
}

