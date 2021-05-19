class Game {
  constructor() {}

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

  updateCounter(counter) {
    database.ref("/").update({
      counter: counter,
    });
  }
  getRound() {
    var gameStateRef = database.ref("round");
    gameStateRef.on("value", function (data) {
      round = data.val();
    });
  }
  updateRound(round) {
    database.ref("/").update({
      round: round,
    });
  }
  getQuestionNumber() {
    var gameStateRef = database.ref("questionNumber");
    gameStateRef.on("value", function (data) {
      questionNumber = data.val();
    });
  }

  async getQuestion(num, level) {
    var tokenref = fetch("https://opentdb.com/api_token.php?command=request");

    var tokenJSON = tokenref.json();

    token = tokenJSON.token;

    var url =
      "https://opentdb.com/api.php?amount=" +
      num +
      "&difficulty=" +
      level +
      "&type=multiple&token=" +
      token;
    var response = await fetch(url);

    var responseJSON = await response.json();

    if (responseJSON.response_code == 4) {
      fetch("https://opentdb.com/api_token.php?command=reset&token=" + token);
    }
    console.log(responseJSON);
    allQuestions = responseJSON.results;

    database.ref("/").update({
      allQuestions: allQuestions,
    });
  }

  async getSingleQuestion(count) {
    var gameStateRef = database.ref("allQuestions/" + [count]);
    gameStateRef
      .once("value")
      .then(function (data) {
        currentQuestion = data.val();
      })
      .then(() => {
        answersArray = [
          currentQuestion.correct_answer,
          ...currentQuestion.incorrect_answers,
        ];
        console.log(answersArray);

        this.shuffleArray(answersArray);
        clear();
        console.log(answersArray);

        question.html(questionNumber+ ". "+ currentQuestion.question);
        question.position(displayWidth / 2 - 350, displayHeight / 2 - 200);
        //question.style("columnWidth", "auto");
        
        answerOptions = createRadio();
        answerOptions.style("columnCount", "1");
        answerOptions.option(answersArray[0]);
        answerOptions.option(answersArray[1]);
        answerOptions.option(answersArray[2]);
        answerOptions.option(answersArray[3]);
        answerOptions.style("width", "200px");
        answerOptions.position(width / 2, height / 2 + 100);
      });
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
    console.log(playerCount);
    if (player.index == 1) {
      console.log("get q");
      this.getQuestion(2, "easy");
    }
    this.getround()
    question = createElement("h2");
  }

  play() {
    form.hide();
    this.displayScores(displayWidth - 500, 100, 15);
    if (gameMode == "q") {
      questionNumber++;

      this.getSingleQuestion(questionNumber);
      qcounter = 20;
      qtimer = setInterval(function () {
        qcounter--;
      }, 1000);

      gameMode = "w";
    }
    if (gameMode == "w") {
      if (currentQuestion) {
        textSize(30);

        textAlign(CENTER);
        text(
          "Answer in " + qcounter + " secs",
          width / 2,
          height / 2
        );
        givenAnswer = answerOptions.value();
        if (qcounter <= 0) {
          gameMode = "a";
          clearInterval(qtimer);
          acounter = 10;
          atimer = setInterval(function () {
            acounter--;
          }, 1000);
        }
      }
    }
    if (gameMode == "a") {
      answerOptions.hide();
      if (givenAnswer == currentQuestion.correct_answer) {
        text("You Got That Right", width / 2, height / 2);
      } else {
        text("You Got That Wrong", width / 2, height / 2 + 50);
      }
      text(
        currentQuestion.correct_answer + " is the Correct Answer",
        width / 2,
        height / 2 + 100
      );
      text(
        "Next Question in " + acounter + " secs",
        width / 2,
        height / 2 + 150
      );

      if (acounter == 0) {
        gameMode = "q";
        clearInterval(atimer);
        if (givenAnswer == currentQuestion.correct_answer) {
          player.score += 10;
          player.update();
        }
        if (questionNumber === 2) {
          var num = round+1;
          this.updateRound(num);
          gameMode = "rchange";
          clearInterval(atimer);
          wcounter = 10;
          wtimer = setInterval(function () {
            var ctr = wcounter - 1;
            this.updateCounter(ctr);
          }, 1000);
        }
      }
     
    }
    if (gameMode == "rchange") {
      var playerScores = [];
      if (round == 2) {
        roundPlayers = 4;
      } else if (round == 3) {
        roundPlayers = 2;
      }

      //eliminate players
      for (plr in allPlayers) {
        playerScores.append([plr.name, plr.score, plr.index]);
      }
      playerScores.sort((a, b) => {
        b.score - a.score;
      });
      for (var i = roundPlayers; i < playerScores.length; i++) {
        if (player.index == playerScores[i].index) {
          player.index = "";
          player.update();
        }
      }
      //reassign player index
      for (var i = 0; i < roundPlayers - 1; i++) {
        if (player.index == playerScores[i].index) {
          player.index = i;
          player.update();
        }
      }
      text("Round " + round, width / 2, height / 2 - 100);
      this.displayScores(width / 2, height / 2, 50);
      if (rcounter <= 0) {
        if (player.index == 1) {
          this.getQuestion();
          clearInterval(rtimer);
        }
        gameMode = "q";
      }
    }
  }
  displayScores(x, y, size) {
    Player.getPlayerInfo();
    if (allPlayers !== undefined) {
      background(rgb(198, 135, 103));
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
          fill("white");
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
    console.log(arr);
  }
  end() {
    console.log("Game Ended");
    console.log(player.rank);
    if (allPlayers !== undefined) {
      background(rgb(198, 135, 103));
      image(track, 0, -displayHeight * 4, displayWidth, displayHeight * 5);

      //var display_position = 100;

      //index of the array
      var index = 0;

      //x and y position of the cars
      var x = 200;
      var y;

      for (var plr in allPlayers) {
        //add 1 to the index for every loop
        index = index + 1;
        if (allPlayers[plr].rank != 0) {
          var element = createElement("h3");
          element.html(allPlayers[plr].name + " " + allPlayers[plr].rank);
          element.position(displayWidth / 2, allPlayers[plr].rank * 30);
          if (index == player.index) {
            element.style("color", "yellow");
          }
        }
        //position the cars a little away from each other in x direction
        x = x + 225;
        //use data form the database to display the cars in y direction
        y = displayHeight - allPlayers[plr].distance;
        cars[index - 1].x = x;
        cars[index - 1].y = y;

        if (index === player.index) {
          cars[index - 1].shapeColor = "red";
          camera.position.x = displayWidth / 2;
          camera.position.y = cars[index - 1].y;
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);
        }

        //textSize(30);
        //text(allPlayers[plr].name + ": " + allPlayers[plr].distance, 120,display_position)
      }
    }
  }
}
