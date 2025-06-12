let data;
let score = 100;
let year = 1;
let budget = 100;
let maxYear = 5;
let situationIndex = 0;
let interval;
let selectedActions = {}; // { 対策名: レベル }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startGame() {
  showScreen('game-screen');
  score = 100;
  year = 1;
  budget = 100;
  selectedActions = {};
  document.getElementById('log').innerHTML = '';
  fetch('data.json')
    .then(res => res.json())
    .then(json => {
      data = json;
      updateUI();
      log("ゲーム開始！");
      interval = setInterval(nextTurn, 60000); // 開発中は 5000 にしてもOK
      nextTurn();
    });
}

function updateUI() {
  document.getElementById('year').textContent = year;
  document.getElementById('score').textContent = score;
  document.getElementById('budget').textContent = budget;

  const list = document.getElementById('selected-actions');
  list.innerHTML = "";
  for (let [name, level] of Object.entries(selectedActions)) {
    const li = document.createElement("li");
    li.textContent = `${name}（Lv.${level}）`;
    list.appendChild(li);
  }

  const choices = document.getElementById('choices');
  choices.innerHTML = "";
  data.actions.forEach(act => {
    const level = selectedActions[act.name] || 0;
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `${act.name}（Lv.${level} / 5） - ¥${act.cost}`;
    btn.disabled = level >= 5;
    btn.onclick = () => {
      if (level < 5) {
        if (budget >= act.cost) {
          budget -= act.cost;
          selectedActions[act.name] = level + 1;
          updateUI();
        } else {
          log("予算が足りません！");
        }
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
    const level = selectedActions[situation.answer] || 0;
    if (level >= (situation.requiredLevel || 1)) {
      log(`→ 「${situation.answer}」Lv.${level}で防御成功！`);
    } else {
      log(`→ 防御失敗。必要Lv.${situation.requiredLevel}、現在Lv.${level} → スコア -15`);
      score -= 15;
    }
  }

  if (situation.type === "warning") {
    const level = selectedActions[situation.answer] || 0;
    if (level < (situation.requiredLevel || 1)) {
      log(`→ 対策不足。必要Lv.${situation.requiredLevel} → スコア -5`);
      score -= 5;
    } else {
      log("→ 警告に適切に対応済み。");
    }
  }

  year++;
  budget += 50;
  updateUI();
}

function endGame() {
  showScreen('result-screen');
  document.getElementById('final-score').textContent = `${score} 点`;
}
