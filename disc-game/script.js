const rows = 6;
const cols = 7;
let board = [];
let nettime = 300;
let movetime = 30;
let timerid = null;
let player = "red";
let blockplayer = "yellow";
let phase = "block";
let blockedcol = null;
let round = 0;
let timelowplayed = false;
let gameover = false;

const scores = {
  Red: 0,
  Yellow: 0
};

const history = [];

const placesound = document.getElementById('place-sound');
const timelowsound = document.getElementById('time-low-sound');
const winsound = document.getElementById('win-sound');
const blocksound = document.getElementById('block-sound');

let leaderboard = JSON.parse(localStorage.getItem('discBattleLeaderboard'));
if (!leaderboard) {
  leaderboard = {
    player1Wins: 0,
    player2Wins: 0
  };
}
showLeaderboard();

for (let r = 0; r < rows; r++) {
  let row = [];
  for (let c = 0; c < cols; c++) {
    row.push(0);
  }
  board.push(row);
}

function showLeaderboard() {
  document.querySelector(".display-score").innerHTML = "Player 1 Wins: " + leaderboard.player1Wins + " | Player 2 Wins: " + leaderboard.player2Wins;
}

function updateTimer() {
  let mins = Math.floor(nettime / 60);
  let secs = nettime % 60;
  if (secs < 10) {
    secs = "0" + secs;
  }
  document.querySelector(".net-timer").innerHTML = mins + ":" + secs;

  let movetimer = document.querySelector(".move-timer");
  movetimer.style.backgroundColor = player;
  movetimer.innerHTML = movetime;

  if (movetime <= 5 && !timelowplayed) {
    timelowsound.play();
    timelowplayed = true;
  }

  if (nettime <= 0) {
    if (scores.Red > scores.Yellow) {
      alert("Red won!");
      winsound.play();
    } else if (scores.Red < scores.Yellow) {
      alert("Yellow won!");
      winsound.play();
    } else {
      alert("Match drawn");
    }
    gameover = true;
    location.reload();
  } else if (movetime <= 0 && player === "red") {
    alert("Yellow won!");
    scores.Yellow++;
    leaderboard.player2Wins++;
    winsound.play();
    localStorage.setItem('discBattleLeaderboard', JSON.stringify(leaderboard));
    showLeaderboard();
    gameover = true;
    location.reload();
  } else if (movetime <= 0 && player === "yellow") {
    alert("Red won!");
    scores.Red++;
    leaderboard.player1Wins++;
    winsound.play();
    localStorage.setItem('discBattleLeaderboard', JSON.stringify(leaderboard));
    showLeaderboard();
    gameover = true;
    location.reload();
  }
}

function startTimer() {
  if (timerid) {
    clearInterval(timerid);
  }
  timelowplayed = false;
  timerid = setInterval(function() {
    movetime--;
    nettime--;
    updateTimer();
  }, 1000);
}

function pauseOrResume() {
  let pausebtn = document.getElementById("pause-button");
  if (pausebtn.classList.contains("pause")) {
    startTimer();
    pausebtn.classList.remove("pause");
    pausebtn.innerHTML = "Pause";
  } else {
    clearInterval(timerid);
    pausebtn.classList.add("pause");
    pausebtn.innerHTML = "Resume";
  }
}

function saveState() {
  let boardcopy = [];
  for (let r = 0; r < rows; r++) {
    let rowcopy = [];
    for (let c = 0; c < cols; c++) {
      rowcopy.push(board[r][c]);
    }
    boardcopy.push(rowcopy);
  }

  let state = {
    board: boardcopy,
    blockedcol: blockedcol,
    player: player,
    blockplayer: blockplayer,
    phase: phase,
    movetime: movetime,
    round: round
  };
  history.push(state);
}

function undoMove() {
  if (history.length === 0) {
    return;
  }

  let laststate = history.pop();
  board = laststate.board;
  blockedcol = laststate.blockedcol;
  player = laststate.player;
  blockplayer = laststate.blockplayer;
  phase = laststate.phase;
  movetime = laststate.movetime;
  round = laststate.round;

  if (phase === "block") {
    document.querySelector(".status").innerHTML = blockplayer === "red" ? "Player 1 (Red), choose a column to block for Player 2." : "Player 2 (Yellow), choose a column to block for Player 1.";
  } else {
    document.querySelector(".status").innerHTML = player === "red" ? "Player 1 (Red), drop your disc." : "Player 2 (Yellow), drop your disc.";
  }

  showBoard();
  startTimer();
}

function showBoard() {
  let boarddiv = document.getElementById('board');
  boarddiv.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cell = document.createElement('button');
      cell.className = "cell";
      cell.id = "cell-" + r + "-" + c;
      cell.setAttribute('data-row', r);
      cell.setAttribute('data-col', c);
      if (board[r][c] !== 0) {
        if (board[r][c] === 1) {
          cell.style.backgroundColor = "red";
        } else {
          cell.style.backgroundColor = "yellow";
        }
      } else {
        cell.style.backgroundColor = document.body.classList.contains("light-mode") ? "#bbbbbb" : "#555555";
      }
      cell.style.border = document.body.classList.contains("light-mode") ? "2px solid #bbbbbb" : "2px solid #555555";
      if (c === blockedcol) {
        cell.style.backgroundColor = document.body.classList.contains("light-mode") ? "#333333" : "black";
        cell.style.borderColor = document.body.classList.contains("light-mode") ? "#333333" : "black";
        cell.classList.add('blocked');
      }
      cell.onclick = clickCell;
      boarddiv.appendChild(cell);
    }
    boarddiv.appendChild(document.createElement('br'));
  }
}

function clickCell(event) {
  let pausebtn = document.getElementById("pause-button");
  if (pausebtn.classList.contains("pause") || gameover) {
    return;
  }

  let col = parseInt(event.target.getAttribute('data-col'));
  let row = parseInt(event.target.getAttribute('data-row'));

  saveState();

  if (phase === "block") {
    let availcols = getAvailCols();
    let validcols = [];
    for (let i = 0; i < availcols.length; i++) {
      let tempblock = availcols[i];
      let remainingcols = [];
      for (let j = 0; j < availcols.length; j++) {
        if (availcols[j] !== tempblock) {
          remainingcols.push(availcols[j]);
        }
      }
      if (remainingcols.length > 0) {
        validcols.push(tempblock);
      }
    }

    let isvalidcol = false;
    for (let i = 0; i < validcols.length; i++) {
      if (validcols[i] === col) {
        isvalidcol = true;
        break;
      }
    }

    if (!isvalidcol) {
      alert("Can't block this column. At least one column must remain playable.");
      history.pop();
      return;
    }

    blockedcol = col;
    phase = "play";
    blocksound.play();
    document.querySelector(".status").innerHTML = player === "red" ? "Player 1 (Red), drop your disc." : "Player 2 (Yellow), drop your disc.";
    showBoard();
    return;
  }

  if (col === blockedcol) {
    alert("This column is blocked for this turn!");
    history.pop();
    return;
  }

  let lowrow = getLowRow(col);
  if (lowrow === -1) {
    history.pop();
    return;
  }

  board[lowrow][col] = player === "red" ? 1 : 2;
  placesound.play();
  round++;

  if (checkWin(lowrow, col)) {
    alert(player === "red" ? "Player 1 wins by connecting 4!" : "Player 2 wins by connecting 4!");
    winsound.play();
    if (player === "red") {
      scores.Red++;
      leaderboard.player1Wins++;
    } else {
      scores.Yellow++;
      leaderboard.player2Wins++;
    }
    localStorage.setItem('discBattleLeaderboard', JSON.stringify(leaderboard));
    showLeaderboard();
    gameover = true;
    location.reload();
    return;
  }

  if (isBoardFull()) {
    alert("It's a draw!");
    gameover = true;
    location.reload();
    return;
  }

  player = player === "red" ? "yellow" : "red";
  blockplayer = blockplayer === "red" ? "yellow" : "red";
  blockedcol = null;
  phase = "block";
  document.querySelector(".status").innerHTML = blockplayer === "red" ? "Player 1 (Red), choose a column to block for Player 2." : "Player 2 (Yellow), choose a column to block for Player 1.";
  showBoard();
  movetime = 30;
  startTimer();
}

function getLowRow(col) {
  for (let r = rows - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      return r;
    }
  }
  return -1;
}

function isBoardFull() {
  for (let c = 0; c < cols; c++) {
    if (board[0][c] === 0) {
      return false;
    }
  }
  return true;
}

function getAvailCols() {
  let columns = [];
  for (let c = 0; c < cols; c++) {
    if (getLowRow(c) !== -1) {
      columns.push(c);
    }
  }
  return columns;
}

function checkWin(row, col) {
  let color = board[row][col];
  let dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (let d = 0; d < dirs.length; d++) {
    let dr = dirs[d][0];
    let dc = dirs[d][1];
    let count = 1;

    for (let k = 1; k <= 3; k++) {
      let newrow = row + dr * k;
      let newcol = col + dc * k;
      if (newrow >= 0 && newrow < rows && newcol >= 0 && newcol < cols && board[newrow][newcol] === color) {
        count++;
      } else {
        break;
      }
    }

    for (let k = 1; k <= 3; k++) {
      let newrow = row - dr * k;
      let newcol = col - dc * k;
      if (newrow >= 0 && newrow < rows && newcol >= 0 && newcol < cols && board[newrow][newcol] === color) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 4) {
      return true;
    }
  }
  return false;
}

function toggleMode() {
  let body = document.body;
  body.classList.toggle("light-mode");
  let islight = body.classList.contains("light-mode");
  localStorage.setItem("theme", islight ? "light" : "dark");
  showBoard();
}

let savedtheme = localStorage.getItem("theme");
if (savedtheme === "light") {
  document.body.classList.add("light-mode");
}

showBoard();
startTimer();
