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
  wcounter,
  qcounter,
  rcounter,
  wtimer,
  counter = 10;
var gameMode = "i";
var timer;
var rounds;

var form, player, game;

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
  textAlign(CENTER);
  fill("black");
  if (playerCount === game.minPlayers && gameState == 0) {
    gameState = -1;
    game.update(-1);
    wtimer = setInterval(() => {
      var ctr = counter + 1;
      game.updateCounter(ctr);
    }, 1000);
  }
  if (gameState == -1) {
    text(
      "waiting for more players to join in the next " + counter + " seconds",
      width / 2,
      height / 2
    );
    if (counter >= game.waitTime) {
      game.update(1);
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
