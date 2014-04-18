function AICommander() {
  var self = this;

  this.events = {};
  this.think_rate = 100;

  this.storage_manager = new LocalStorageManager()

  setInterval(function() {
    self.think();
  }, this.think_rate);

  setTimeout(function() {
    self.emit("keepPlaying");
  }, 1000);
}

AICommander.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

AICommander.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

AICommander.prototype.getGameGrid = function() {
  var state = this.storage_manager.getGameState();
  if (state == null) {
    return null;
  } else {
    return new Grid(state.grid.size, state.grid.cells);
  }
};

AICommander.prototype.think = function () {

  var grid = this.getGameGrid();
  if (grid == null) {
    return;
  }

  var best = this.findBest(grid, 4);
  console.log(best);

  if (best.move === -1) {
    this.emit("move", Math.floor(Math.random()*4));
  } else {
    this.emit("move", best.move);
  }

};

AICommander.prototype.findBest = function (grid, depth) {

  var self = this;

  if (depth <= 0) {
    return {
      score: this.scoreGrid(grid),
    };
  }

  var best = {
    move: -1,
    score: 0,
  };

  for (var move = 0; move < 4; ++move) {

    var clone = grid.clone();
    clone.move(move);

    if (!clone.equals(grid)) {

      var weight = 0;
      var score = 0;

      clone.availableCells().forEach(function(pos) {

        // Add a 2
        var two = new Tile(pos, 2);
        clone.insertTile(two);

        // score += 0.9 * self.findBest(clone, depth - 1).score;
        score += self.findBest(clone, depth - 1).score;

        clone.removeTile(two);

        // // Add a 4
        // var four = new Tile(pos, 4);
        // clone.insertTile(four);

        // score += 0.1 * self.findBest(clone, depth - 1).score;

        // clone.removeTile(four);

        weight += 1;
      });

      score /= weight;

      if (score > best.score) {
        best.score = score;
        best.move = move;
      }
    }
  }

  return best;
};

AICommander.prototype.scoreGrid = function (grid) {

  var x = 0;
  var y = 0;
  var direction = 1;
  var sum = 0;
  var grand_total = 0;

  for (; y < 4; ++y) {
    for (; x >= 0 && x < 4; x += direction) {
      var cell = grid.cells[x][y];
      if (cell != null) {
        sum += cell.value;
      }
      grand_total += sum;
    }
    direction *= -1;
    x += direction;
  }

  return grand_total;
};

AICommander.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

AICommander.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

AICommander.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};
