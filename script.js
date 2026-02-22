// -------- Elements --------
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

// -------- State --------
let username = "";
let score = 0;
let timeLeft = 60;
let timer;
let hideTimeout;
let gameStarted = false;

// -------- Targets --------
const targets = [
  { img: "assets/one.png", score: 1, size: 70 },
  { img: "assets/two.png", score: 3, size: 50 },
  { img: "assets/three.png", score: -2, size: 65 }
];

let currentTarget;

// -------- Start --------
startBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return alert("Enter username");

  guidePopup.style.display = "flex";
};

// -------- Guide Confirm --------
guideOkBtn.onclick = () => {
  guidePopup.style.display = "none";
  startGame();
};

// -------- Game Start --------
function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  // Hide footer when gameplay starts
  footer.classList.add("hide-footer");

  loginScreen.style.display = "none";
  gameScreen.style.display = "flex";

  score = 0;
  timeLeft = 60;
  scoreDisplay.textContent = "Score: 0";
  timerDisplay.textContent = "Time: 60s";

  moveTarget();

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

// -------- Target Movement --------
function moveTarget() {
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
    if (timeLeft > 0) moveTarget();
  }, 800);
}

// -------- Target Click --------
target.onclick = (e) => {
  e.stopPropagation();

  score = Math.max(0, score + currentTarget.score);
  scoreDisplay.textContent = `Score: ${score}`;

  clearTimeout(hideTimeout);
  moveTarget();
};

// -------- End Game --------
function endGame() {
  clearInterval(timer);
  clearTimeout(hideTimeout);

  gameScreen.style.display = "none";
  leaderboardScreen.style.display = "flex";

  // Show footer again on leaderboard
  footer.classList.remove("hide-footer");

  saveScore();
}

// -------- Firebase --------
function saveScore() {
  const ref = db.collection("leaderboard").doc(username);

  ref.get().then(doc => {
    if (!doc.exists || score > doc.data().score) {
      ref.set({ score });
    }
  }).finally(loadLeaderboard);
}

function loadLeaderboard() {
  db.collection("leaderboard")
    .orderBy("score", "desc")
    .get()
    .then(snapshot => {
      leaderboardList.innerHTML = "";
      let rank = 1;

      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${rank}. ${doc.id} - ${doc.data().score}`;

        if (doc.id === username) {
          li.style.color = "#0f0";
          personalBestText.textContent = `Your Best: ${doc.data().score}`;
          yourRankText.textContent = `Your Rank: ${rank}`;
        }

        leaderboardList.appendChild(li);
        rank++;
      });
    });
}