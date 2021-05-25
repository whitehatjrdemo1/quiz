class Game {
  constructor() {
    this.maxPlayers = 15;
    this.minPlayers = 2;
    this.totalQuestions = 3;
    this.questionWait = 5;
    this.answerWait = 5;
    this.waitTime = 10;
    this.questionNumber = 0;
    this.currentQuestion = null;
    this.allQuestions = null;
    this.difficulty = "easy";
    this.answerOptions = createRadio();
    this.questionEle = createElement("h2");
    this.roundPlayers = 0;
    this.messageEle = createElement("h2");
    this.maxRound = 3;
    this.playerScores = [];
  }

  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function (data) {
      gameState = data.val();
    });
  }
  update(state) {
    database.ref("/").update({
      gameState: state,
    });
  }
  getCounter() {
    var gameStateRef = database.ref("counter");
    gameStateRef.on("value", function (data) {
      counter = data.val();
    });
  }
  updateCounter(ctr) {
    database.ref("/").update({
      counter: ctr,
    });
  }

  // getRound() {
  //   var gameStateRef = database.ref("round");
  //   gameStateRef.on("value", (data) => {
  //     this.round = data.val();
  //   });
  // }
  // updateRound(rnd) {
  //   database.ref("/").update({
  //     round: rnd,
  //   });
  // }
  getQuestionNumber() {
    var gameStateRef = database.ref("questionNumber");
    gameStateRef.on("value", function (data) {
      this.questionNumber = data.val();
    });
  }

  async getQuestionAPI(num, level) {
    var tokenref = await fetch(
      "https://opentdb.com/api_token.php?command=request"
    );

    var tokenJSON = await tokenref.json();

    token = tokenJSON.token;

    var url =
      "https://opentdb.com/api.php?amount=" +
      num +
      "&this.difficulty=" +
      level +
      "&type=multiple&token=" +
      token;

    var response = await fetch(url);

    var responseJSON = await response.json();

    if (responseJSON.response_code == 4) {
      fetch("https://opentdb.com/api_token.php?command=reset&token=" + token);
    }
    var allQuestions = responseJSON.results;

    database.ref("/").update({
      allQuestions: allQuestions,
    });
  }
  async getQuestion() {
    var gameStateRef = await database.ref("allQuestions");

    gameStateRef.on("value", (data) => {
      this.allQuestions = data.val();
    });
  }

  async getSingleQuestion(count) {
    clear();

    this.currentQuestion = this.allQuestions[count - 1];
    if (this.currentQuestion) {
      answersArray = [
        this.currentQuestion.correct_answer,
        ...this.currentQuestion.incorrect_answers,
      ];

      answersArray = this.shuffleArray(answersArray);

      this.answerOptions.hide();
      this.answerOptions = createRadio();
      this.questionEle.show();
      this.questionEle.html(
        this.questionNumber + 1 + ". " + this.currentQuestion.question
      );
      this.questionEle.position(
        displayWidth / 2 - 350,
        displayHeight / 2 - 200
      );
      this.questionEle.style("color", "grey");
      this.answerOptions.show();

      this.answerOptions.style("columnCount", "1");
      this.answerOptions.style("columnWidth", "auto");

      this.answerOptions.option(answersArray[0]);
      this.answerOptions.option(answersArray[1]);
      this.answerOptions.option(answersArray[2]);
      this.answerOptions.option(answersArray[3]);
      this.answerOptions.style("width", "200px");
      this.answerOptions.position(width / 2, height / 2 + 100);
    }
  }

  async start() {
    if (gameState === 0) {
      player = new Player();
      var playerCountRef = await database.ref("playerCount").once("value");
      if (playerCountRef.exists()) {
        playerCount = playerCountRef.val();
        player.getCount();
      }
      form = new Form();
      form.display();
    }
  }
  play() {
    form.hide();
    //clear();
    textAlign(CENTER);
    this.displayScores(displayWidth - 500, 100, 15, this.playerScores);
    textSize(30);
    text("Round " + player.round, width / 2, height / 2 - 300);
    if (gameMode == "i") {
      this.initialize();
    }
    if (gameMode == "q") {
      this.displayQuestion();
    }
    if (gameMode == "w") {
      this.wait();
    }
    if (gameMode == "a") {
      this.displayAnswer();
    }
    if (gameMode == "rchange" || gameMode == "rchangedone") {
      // //eliminate players
      this.roundChange();
    }
  }

  initialize() {
    this.questionEle.hide();
    clear();

    text("Loading Questions", width / 2, height / 2);
    //var rand = Math.round(random(1, playerCount));
    if (this.allQuestions == null && player.index == 1) {
      this.getQuestionAPI(this.totalQuestions, this.difficulty);
    }
    this.getQuestion();
    if (player.round == 1) {
      this.gameRound1();
    } else if (player.round == 2) {
      this.gameRound2();
    } else if (player.round == 3) {
      this.gameRound3();
    } else if (player.round > this.maxRound) {
      gameState=2
    }

    this.currentQuestion = null;

    gameMode = "q";
  }
  displayQuestion() {
    if (this.allQuestions) {
      clear();

      this.getSingleQuestion(this.questionNumber + 1);
    }
    if (this.currentQuestion) {
      this.questionNumber++;

      qcounter = counter + this.questionWait;
      //game.updateQCounter(this.questionWait);

      gameMode = "w";
    }
  }
  wait() {
    if (this.currentQuestion) {
      textSize(30);
      textAlign(CENTER);
      text(
        "Answer in " + (qcounter + this.questionWait - counter) + " secs",
        width / 2,
        height / 2
      );
      givenAnswer = this.answerOptions.value();
      if (counter >= qcounter + this.questionWait) {
        gameMode = "a";
        acounter = counter + this.answerWait;

        // game.updateACounter(this.answerWait);
      }
    }
  }
  displayAnswer() {
    this.answerOptions.hide();

    if (givenAnswer == this.currentQuestion.correct_answer) {
      text("You Got That Right", width / 2, height / 2);
    } else {
      text("You Got That Wrong", width / 2, height / 2 + 50);
    }

    this.messageEle.show();

    this.messageEle.html(
      this.currentQuestion.correct_answer + " is the Correct Answer"
    );
    this.messageEle.position(width / 2, height / 2 + 100);
    text(
      "Next Question in " + (this.answerWait + acounter - counter) + " secs",
      width / 2,
      height / 2 + 250
    );

    if (counter >= acounter + this.answerWait) {
      gameMode = "q";
      this.messageEle.hide();

      if (givenAnswer == this.currentQuestion.correct_answer && player.active) {
        player.score += 10;
        player.update();
      }
      if (this.questionNumber == this.totalQuestions) {
        player.round++;
        console.log(player.round)
        player.update();
        gameMode = "rchange";
        this.questionEle.hide();

        //updateCounter(10);
        wcounter = this.waitTime + counter;
      }
      this.currentQuestion = null;
    }
  }
  roundChange() {
    if (gameMode == "rchange") {
      if (rounds === true) {
        gameMode = "rchangedone";
      }
      rounds = true;

      var index = 0;
      for (var plr in allPlayers) {
        index++;
        if (allPlayers[plr].round != player.round) {
          text(
            "Waiting for " +
              allPlayers[plr].name +
              " to finish round " +
              allPlayers[plr].round,
            width / 2,
            index * 100
          );
          rounds = false;
        }
      }
    } else if (gameMode === "rchangedone") {
      clear();
      this.roundPlayers = this.maxPlayers;
      this.currentQuestion = "";
      database.ref("allQuestions").remove();
      if (counter >= wcounter + this.waitTime - counter) {
        var playerScores = [];
        for (var plr in allPlayers) {
          if (allPlayers[plr].index && allPlayers[plr].active) {
            playerScores.push([
              allPlayers[plr].name,
              allPlayers[plr].score,
              allPlayers[plr].index,
            ]);
          }
        }
        this.playerScores = playerScores;
        this.playerScores.sort((a, b) => {
          b[1] - a[1];
        });
        if (player.round <= game.maxRound) {
          gameMode = "i";

          var roundPlayers = min(playerCount, this.roundPlayers);

          for (var i = roundPlayers; i < this.playerScores.length; i++) {
            if (player.index == this.playerScores[i][2] && player.active) {
              player.active = false;
              player.update();
            }
          }

          text("Round " + player.round, width / 2, height / 2 - 50);
        } 
      }
      this.displayScores(width / 2, height / 2, 50, this.playerScores);
    }
  }

  gameRound1() {
    this.maxPlayers = 15;
    this.minPlayers = 2;
    this.totalQuestions = 3;
    this.questionWait = 5;
    this.answerWait = 5;
    this.questionNumber = 0;
    this.difficulty = "easy";
  }
  gameRound2() {
    this.maxPlayers = 4;
    this.minPlayers = 4;
    this.totalQuestions = 3;
    this.questionWait = 5;
    this.answerWait = 5;
    this.questionNumber = 0;

    this.difficulty = "easy";
  }
  gameRound3() {
    this.maxPlayers = 2;
    this.minPlayers = 2;
    this.totalQuestions = 3;
    this.questionWait = 5;
    this.answerWait = 5;
    this.questionNumber = 0;

    this.difficulty = "easy";
  }
  displayScores(x, y, size, arr) {
    Player.getPlayerInfo();
    if (allPlayers !== undefined) {
      textSize(size);
      fill(255);
      if (gameMode != "rchange") {
        for (var plr in allPlayers) {
          y = y + 30;

          if (!allPlayers[plr].active) {
            fill("grey");
          } else if (allPlayers[plr].index === player.index) {
            fill("green");
          } else {
            fill("black");
          }
          text(allPlayers[plr].name + ": " + allPlayers[plr].score, x, y);
        }
      } else {
        // var arr=this.playerScores
        for (var i = 0; i < arr.length; i++) {
          y = y + 30;

          if (!arr[i].active) {
            fill("grey");
          } else if (arr[i].index === player.index) {
            fill("green");
          } else {
            fill("black");
          }
          text(arr[i].name + ": " + arr[i].score, x, y);
        }
      }
    }
  }
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  end() {
    clear();
    console.log(this.playerScores)
    this.playerScores.sort((a, b) => {
      b[1] - a[1];
    });
    text("Game Over!", width / 2, height / 2 - 200);
    this.displayScores(width / 2, height / 2, 50, this.playerScores);
    clear();
    console.log(this.playerScores)
   
    if (player.index == this.playerScores[0][2]) {
      text(
        "Congratulations!" +
          this.playerScores[0][0] +
          "You are the Winner of this Game",
        width / 2,
        height / 2 - 200
      );
    } else {
      text(
        "Sorry you lost!" + this.playerScores[0][0] + "is the Winner",
        width / 2,
        height / 2 - 200
      );
    }
    this.restart = createButton("Play Again");
    this.restart.position(width / 2, height / 2 + 100);
    this.restart.mousePressed(() => {
      game.update(0);
      player.updateCount(0);
      database.ref("players").remove();
      database.ref("allQuestions").remove();
      game.updateCounter(0);

      game.updateRound(1);
    });
  }
}
