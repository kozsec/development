let data;
let score = 100;
let year = 1;
let budget = 100;
let selectedActions = {};
let situationIndex = 0;
let maxYear = 5;
let interval;
let timerInterval;
let totalTime = 300; // 5分 = 300秒

document.getElementById('start-btn').onclick = () => startGame();
document.getElementById('howto-btn').onclick = () => showScreen('howto-screen');
document.getElementById('start-from-howto').onclick = () => startGame();
document.getElementById('restart-btn').onclick = () => {
  resetGame();
  showScreen('start-screen');
};

function showScreen(id) {
  ['start-screen', 'howto-screen', 'game-screen', 'result-screen'].forEach(screenId => {
    document.getElementById(screenId).style.display = (screenId === id) ? 'block' : 'none';
  });
}

function startGame() {
  showScreen('game-screen');
  score = 100;
  year = 1;
  budget = 100;
  selectedActions = {};
  situationIndex = 0;
  document.getElementById('log').innerHTML = '';
  totalTime = 300;
  updateTimerDisplay(totalTime);

  fetch('data.json')
    .then(res => res.json())
    .then(json => {
      data = json;
      updateUI();
      log("ゲーム開始！");
      clearInterval(interval);
      clearInterval(timerInterval);

      interval = setInterval(nextTurn, 60000); // 1分ごとにターン
      timerInterval = setInterval(() => {
        totalTime--;
        if (totalTime < 0) {
          clearInterval(interval);
          clearInterval(timerInterval);
          endGame();
          return;
        }
        updateTimerDisplay(totalTime);
      }, 1000);

      nextTurn();
    });
}

function updateTimerDisplay(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  document.getElementById('timer').textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function log(message, isSituation = false) {
  const now = new Date();
  const timeStr = `[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}] `;

  const logDiv = document.getElementById('log');
  const p = document.createElement("p");

  if (isSituation) {
    p.className = "situation-log";
    p.innerHTML = timeStr + message;
  } else {
    p.textContent = timeStr + message;
  }

  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function nextTurn() {
  if (year > maxYear) {
    clearInterval(interval);
    clearInterval(timerInterval);
    endGame();
    return;
  }

  const situation = data.situations[situationIndex % data.situations.length];
  situationIndex++;

  // 状況付与を太字黄色テーブルでログに
  log(`【状況】${situation.text}`, true);

  if (situation.type === "attack") {
    const level = selectedActions[situation.answer] || 0;
    if (level >= (situation.requiredLevel || 1)) {
      log(`→ 「${situation.answer}」Lv.${level}で防御成功！`);
    } else {
      log(`→ 防御失敗。必要Lv.${situation.requiredLevel}、現在Lv.${level} → スコア -15`);
      score -= 15;
    }
  } else if (situation.type === "warning") {
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
          log(`対策「${act.name}」をLv.${level + 1}に強化しました。`);
        } else {
          log("予算が足りません！");
        }
      }
    };
    choices.appendChild(btn);
  });
}

function endGame() {
  showScreen('result-screen');
  document.getElementById('final-score').textContent = score > 0 ? score : 0;
}

function resetGame() {
  clearInterval(interval);
  clearInterval(timerInterval);
  score = 100;
  year = 1;
  budget = 100;
  selectedActions = {};
  situationIndex = 0;
  totalTime = 300;
  document.getElementById('log').innerHTML = '';
}
