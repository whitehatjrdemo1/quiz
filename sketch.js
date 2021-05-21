var canvas, backgroundImage;
var token;
var gameState = 0;
var playerCount;
var allPlayers;
var distance = 0;
var database;
var round = 1,
  questionEle,
  questionType,
  answerOptions,
  givenAnswer,
  answersArray = [];
var acounter,
  qcounter,
  atimer,
  qtimer,
  rtimer,
  rcounter,
  wtimer,
  wcounter = 10;
var gameMode = "i";
var roundPlayers,
  playerScores = [];
var timer;
var form, player, game;

function preload() {
  ground = loadImage("../images/ground.png");
}

function setup() {
  canvas = createCanvas(displayWidth - 100, displayHeight - 100);
  database = firebase.database();
  game = new Game();
  game.getState();
  game.getCounter();
  game.start();
}

function draw() {
  background(rgb(198, 135, 103));

  if (playerCount === game.minPlayers && gameState == 0) {
    gameState = -1;
    game.update(-1);
    wtimer = setInterval(() => {
      var ctr = wcounter - 1;
      game.updateCounter(ctr);
    }, 1000);
  }
  if (gameState == -1) {
    text(
      "waiting for more players to join in the next " + wcounter + " seconds",
      width / 2,
      height / 2
    );
    if (wcounter <= 0) {
      game.update(1);
      clearInterval(wtimer);
    }
  }
  if (gameState === 1) {
    clear();
    game.play();
  }
  if (gameState === 2) {
    game.end();
  }
}
