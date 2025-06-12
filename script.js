let data;
let score = 100;
let year = 1;
let budget = 100;
let maxYear = 5;
let situationIndex = 0;
let interval;
let selectedActions = [];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame() {
  showScreen('game-screen');
  score = 100;
  year = 1;
  budget = 100;
  selectedActions = [];
  document.getElementById('log').innerHTML = '';
  fetch('data.json')
    .then(res => res.json())
    .then(json => {
      data = json;
      updateUI();
      log("ゲーム開始！");
      interval = setInterval(nextTurn, 60000); // 本番は60000、開発中なら 5000
      nextTurn();
    });
}

function updateUI() {
  document.getElementById('year').textContent = year;
  document.getElementById('score').textContent = score;
  document.getElementById('budget').textContent = budget;

  const list = document.getElementById('selected-actions');
  list.innerHTML = "";
  selectedActions.forEach(action => {
    const li = document.createElement("li");
    li.textContent = action;
    list.appendChild(li);
  });

  const choices = document.getElementById('choices');
  choices.innerHTML = "";
  data.actions.forEach(act => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `${act.name}（¥${act.cost}万）`;
    btn.onclick = () => {
      if (budget >= act.cost) {
        budget -= act.cost;
        selectedActions.push(act.name);
        updateUI();
      } else {
        log("予算が足りません！");
      }
    };
    choices.appendChild(btn);
  });
}

function log(message) {
  const logDiv = document.getElementById('log');
  const p = document.createElement("p");
  p.textContent = message;
  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function nextTurn() {
  if (year > maxYear) {
    clearInterval(interval);
    endGame();
    return;
  }

  const situation = data.situations[situationIndex % data.situations.length];
  situationIndex++;
  log(`【状況】${situation.text}`);

  if (situation.type === "attack") {
    if (selectedActions.includes(situation.answer)) {
      log("→ 対策により攻撃を防げました！");
    } else {
      log("→ 攻撃成功。スコア -15");
      score -= 15;
    }
  }

  if (situation.type === "warning" && !selectedActions.includes(situation.answer)) {
    log("→ 無視すると危険！スコア -5");
    score -= 5;
  }

  year++;
  budget += 50;
  updateUI();
}

function endGame() {
  showScreen('result-screen');
  document.getElementById('final-score').textContent = `${score} 点`;
}
