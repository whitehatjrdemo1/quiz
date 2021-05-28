class Player {
  constructor() {
    this.index = null;
    this.name = null;
    this.score = 0;
    this.active = true;
    this.round = 1;
  }

  getCount() {
    var playerCountRef = database.ref("playerCount");
    playerCountRef.on("value", (data) => {
      playerCount = data.val();
    });
  }

  updateCount(count) {
    database.ref("/").update({
      playerCount: count,
    });
  }
  update() {
    var playerIndex = "players/player" + this.index;
    database.ref(playerIndex).update({
      name: this.name,
      score: this.score,
      index: this.index,
      active: this.active,
      round: this.round,
    });
  }
  updateTime(counter, ans) {
    console.log(counter + "," + ans);
    var playerIndex = "players/player" + this.index;
    database.ref(playerIndex).update({
      timestamp: counter,
      lastAnswer: ans ? ans : "",
    });
  }

  static getPlayerInfo() {
    var playerInfoRef = database.ref("players");
    playerInfoRef.on("value", (data) => {
      allPlayers = data.val();
    });
  }

  getCarsAtEnd() {
    database.ref("carsAtEnd").on("value", (data) => {
      carsAtEnd = data.val();
    });
  }

  static updateCarsAtEnd(count) {
    database.ref("/").update({
      carsAtEnd: count,
    });
  }
}
