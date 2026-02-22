// ==============================
// GLOBAL STATE
// ==============================

let username = "";
let score = 0;
let timeLeft = 60;
let timer = null;
let hideTimeout = null;
let gameStarted = false;
let currentTarget = null;

// ==============================
// ELEMENTS
// ==============================

const loginScreen = document.getElementById("login-screen");
const guidePopup = document.getElementById("guide-popup");
const gameScreen = document.getElementById("game-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");

const startBtn = document.getElementById("start-btn");
const guideOkBtn = document.getElementById("guide-ok-btn");

const usernameInput = document.getElementById("username");
const gameArea = document.getElementById("game-area");
const target = document.getElementById("target");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

const leaderboardList = document.getElementById("leaderboard-list");
const personalBestText = document.getElementById("personal-best");
const yourRankText = document.getElementById("your-rank");

const footer = document.getElementById("game-footer");

// ==============================
// TARGET TYPES
// ==============================

const targets = [
  { img: "assets/one.png", score: 1, size: 70 },
  { img: "assets/two.png", score: 3, size: 50 },
  { img: "assets/three.png", score: -2, size: 65 }
];

// ==============================
// START BUTTON
// ==============================

startBtn.onclick = () => {
  const enteredName = usernameInput.value.trim();

  if (!enteredName) {
    alert("Enter username");
    return;
  }

  username = enteredName;
  guidePopup.style.display = "flex";
};

// ==============================
// GUIDE CONFIRM
// ==============================

guideOkBtn.onclick = () => {
  guidePopup.style.display = "none";
  startGame();
};

// ==============================
// START GAME
// ==============================

function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  footer.classList.add("hide-footer");

  loginScreen.style.display = "none";
  leaderboardScreen.style.display = "none";
  gameScreen.style.display = "flex";

  score = 0;
  timeLeft = 60;

  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time: 60s";

  moveTarget();

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}s`;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// ==============================
// MOVE TARGET
// ==============================

function moveTarget() {
  if (timeLeft <= 0) return;

  currentTarget = targets[Math.floor(Math.random() * targets.length)];

  target.src = currentTarget.img;
  target.style.width = currentTarget.size + "px";
  target.style.height = currentTarget.size + "px";
  target.style.display = "block";

  const area = gameArea.getBoundingClientRect();

  target.style.left =
    Math.random() * (area.width - currentTarget.size) + "px";

  target.style.top =
    Math.random() * (area.height - currentTarget.size) + "px";

  hideTimeout = setTimeout(() => {
    target.style.display = "none";
    moveTarget();
  }, 800);
}

// ==============================
// TARGET CLICK
// ==============================

target.onclick = (e) => {
  e.stopPropagation();
  if (!currentTarget) return;

  score = Math.max(0, score + currentTarget.score);
  scoreDisplay.textContent = `Score: ${score}`;

  clearTimeout(hideTimeout);
  moveTarget();
};

// ==============================
// END GAME
// ==============================

function endGame() {
  clearInterval(timer);
  clearTimeout(hideTimeout);

  gameStarted = false;
  target.style.display = "none";

  gameScreen.style.display = "none";
  leaderboardScreen.style.display = "flex";

  footer.classList.remove("hide-footer");

  saveScore();
}

// ==============================
// SAVE SCORE
// ==============================

function saveScore() {
  if (!username) return;

  const ref = db.collection("leaderboard").doc(username);

  ref.get()
    .then(doc => {
      if (!doc.exists || score > doc.data().score) {
        return ref.set({ score: score });
      }
    })
    .then(() => {
      loadLeaderboard();
    })
    .catch(error => {
      console.error("Save error:", error);
      leaderboardList.innerHTML =
        "<li>⚠ Permission error. Check Firestore rules.</li>";
    });
}

// ==============================
// LOAD LEADERBOARD
// ==============================

function loadLeaderboard() {
  leaderboardList.innerHTML = "<li>Loading...</li>";

  db.collection("leaderboard")
    .orderBy("score", "desc")
    .get()
    .then(snapshot => {
      leaderboardList.innerHTML = "";

      if (snapshot.empty) {
        leaderboardList.innerHTML = "<li>No scores yet</li>";
        return;
      }

      let rank = 1;
      let foundUser = false;

      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${rank}. ${doc.id} - ${doc.data().score}`;

        if (username && doc.id === username) {
          li.style.color = "#00ffcc";
          personalBestText.textContent = `Your Best: ${doc.data().score}`;
          yourRankText.textContent = `Your Rank: ${rank}`;
          foundUser = true;
        }

        leaderboardList.appendChild(li);
        rank++;
      });

      if (!foundUser) {
        personalBestText.textContent = "";
        yourRankText.textContent = "";
      }
    })
    .catch(error => {
      console.error("Leaderboard load error:", error);
      leaderboardList.innerHTML =
        "<li>⚠ Missing index or permission error.</li>";
    });
}