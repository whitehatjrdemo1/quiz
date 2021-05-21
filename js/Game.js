class Game {
  constructor() {
    this.round = 1;
    this.maxPlayers = 15;
    this.minPlayers = 5;
    this.totalQuestions = 10;
    this.questionWait = 10;
    this.answerWait = 10;
    this.questionNumber = 0;
    this.currentQuestion = null;
    this.allQuestions = [];
    this.difficulty = "easy";
    this.gameMode = "i";
    this.answerOptions = createRadio();
    this.questionEle = createElement("h2");
    this.roundPlayers = 0;
  }
  updateServerTime() {
    var sessionsRef = firebase.database().ref("sessions");
    sessionsRef.push({
      startedAt: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  getServerTime() {
    database.ref("startedAt").on("value", function (data) {
      timer = data.val();
    });
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
      wcounter = data.val();
    });
  }

  updateCounter(ctr) {
    database.ref("/").update({
      counter: ctr,
    });
  }
  getRound() {
    var gameStateRef = database.ref("round");
    gameStateRef.on("value", (data) => {
      this.round = data.val();
    });
  }
  updateRound(rnd) {
    database.ref("/").update({
      round: rnd,
    });
  }
  getQuestionNumber() {
    var gameStateRef = database.ref("questionNumber");
    gameStateRef.on("value", function (data) {
      this.questionNumber = data.val();
    });
  }

  async getQuestion(num, level) {
    var tokenref = await fetch(
      "https://opentdb.com/api_token.php?command=request"
    );

    var tokenJSON = await tokenref.json();

    token = tokenJSON.token;
    console.log(token);

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
    //console.log(responseJSON);
    this.allQuestions = responseJSON.results;

    database.ref("/").update({
      allQuestions: this.allQuestions,
    });
  }

  async getSingleQuestion(count) {
    clear();
    console.log("get single q");
    while (this.currentQuestion == null) {
      var gameStateRef = await database.ref("allQuestions/" + [count - 1]);

      var currentQuestionRef = await gameStateRef.once("value");
      if (currentQuestionRef.exists()) {
        this.currentQuestion = currentQuestionRef.val();
      }
    }

    if (this.currentQuestion) {
      answersArray = [
        this.currentQuestion.correct_answer,
        ...this.currentQuestion.incorrect_answers,
      ];
      console.log(answersArray);

      answersArray = this.shuffleArray(answersArray);
      console.log(answersArray);

      this.answerOptions.hide();
      this.answerOptions = createRadio();

      this.questionEle.html(
        (this.questionNumber+1) + ". " + this.currentQuestion.question
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
    this.getRound();
    //clear();
    this.displayScores(displayWidth - 500, 100, 15);
    textSize(30);
    text("Round " + this.round, width / 2, height / 2 - 300);
    if (this.gameMode == "i") {
      this.initialize();
    }
    if (this.gameMode == "q") {
      this.displayQuestion();
    }
    if (this.gameMode == "w") {
      this.wait();
    }
    if (this.gameMode == "a") {
      this.displayAnswer();
    }
    if (this.gameMode == "rchange") {
      // //eliminate players
      this.roundChange();
    }
  }

  initialize() {
    if (player.index == 1) {
      console.log("get q");
      this.getQuestion(this.totalQuestions, this.difficulty);
    }
    if (this.round == 1) {
      this.gameRound1();
    } else if (this.round == 2) {
      this.gameRound2();
    } else if (this.round == 3) {
      this.game.round3();
    }

    this.currentQuestion = null;

    this.gameMode = "q";
  }
  displayQuestion() {
    //getQ = true;
    if (this.currentQuestion == null) {
      this.getSingleQuestion(this.questionNumber+1);
    }
    if (this.currentQuestion) {
      this.questionNumber++;

      qcounter = this.questionWait;
      qtimer = setInterval(function () {
        qcounter--;
      }, 1000);
      this.gameMode = "w";
    }
  }
  wait() {
    if (this.currentQuestion) {
      textSize(30);

      textAlign(CENTER);
      text("Answer in " + qcounter + " secs", width / 2, height / 2);
      givenAnswer = this.answerOptions.value();
      if (qcounter <= 0) {
        this.gameMode = "a";
        clearInterval(qtimer);
        acounter = this.answerWait;
        atimer = setInterval(function () {
          acounter--;
        }, 1000);
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
    text(
      this.currentQuestion.correct_answer + " is the Correct Answer",
      width / 2,
      height / 2 + 100
    );
    text("Next Question in " + acounter + " secs", width / 2, height / 2 + 150);

    if (acounter == 0) {
      this.gameMode = "q";
      clearInterval(atimer);
      if (givenAnswer == this.currentQuestion.correct_answer) {
        player.score += 10;
        player.update();
      }
      if (this.questionNumber === this.totalQuestions-1) {
        var num = this.round + 1;
        this.updateRound(num);
        this.gameMode = "rchange";
        clearInterval(atimer);
        wcounter = 10;
        wtimer = setInterval(function () {
          var ctr = wcounter - 1;
          game.updateCounter(ctr);
        }, 1000);
      }
      this.currentQuestion = null;
    }
  }
  roundChange() {
    this.roundPlayers = this.maxPlayers;
    for (var plr in allPlayers) {
      console.log(playerScores);
      if (allPlayers[plr].index) {
        playerScores = [
          ...[
            allPlayers[plr].name,
            allPlayers[plr].score,
            allPlayers[plr].index,
          ],
        ];
      }
    }
    playerScores.sort((a, b) => {
      b[1] - a[1];
    });
    for (var i = this.roundPlayers; i < playerScores.length; i++) {
      if (player.index == playerScores[i][2]) {
        player.index = null;
        player.update();
      }
    }
    //reassign player index
    for (var i = 0; i < this.roundPlayers - 1; i++) {
      if (player.index == playerScores[i][2]) {
        player.index = i;
        player.update();
      }
    }
    text("Round " + this.round, width / 2, height / 2 - 100);
    this.displayScores(width / 2, height / 2, 50);
    if (rcounter <= 0) {
      clearInterval(rtimer);
      this.gameMode = "i";
      this.allQuestions = [];
    }
  }
  gameRound1() {
    this.maxPlayers = 15;
    this.minPlayers = 5;
    this.totalQuestions = 10;
    this.questionWait = 10;
    this.answerWait = 10;
    this.questionNumber = 0;
    this.difficulty = "easy";
  }
  gameRound2() {
    this.maxPlayers = 4;
    this.minPlayers = 4;
    this.totalQuestions = 10;
    this.questionWait = 10;
    this.answerWait = 10;
    this.questionNumber = 0;

    this.difficulty = "easy";
  }
  gameRound3() {
    this.maxPlayers = 2;
    this.minPlayers = 2;
    this.totalQuestions = 10;
    this.questionWait = 10;
    this.answerWait = 10;
    this.questionNumber = 0;

    this.difficulty = "easy";
  }
  displayScores(x, y, size) {
    Player.getPlayerInfo();
    if (allPlayers !== undefined) {
      textSize(size);
      fill(255);

      var index = 0;

      for (var plr in allPlayers) {
        index = index + 1;

        y = y + 30;

        if (index === player.index) {
          fill("green");
        } else if (player.index == "") {
          fill("grey");
        } else {
          fill("black");
        }
        text(allPlayers[plr].name + ": " + allPlayers[plr].score, x, y);
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
    console.log("Game Ended");
  }
}
