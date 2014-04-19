function AICommander() {
  var self = this;

  this.events = {};
  this.delay = 50;

  this.storage_manager = new LocalStorageManager()

  setTimeout(function() {
    self.think();
  }, this.delay);

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

  var best = this.findBest(grid, 40000, 1);
  console.log(best);

  if (best.move === -1) {
    this.emit("move", Math.floor(Math.random()*4));
  } else {
    this.emit("move", best.move);
  }

  var self = this;
  setTimeout(function() {
    self.think();
  }, self.delay);

};

AICommander.prototype.findBest = function (grid, quota, depth) {

  var self = this;

  if (quota <= 1) {
    return {
      score: this.scoreGrid(grid) - depth * 2.2 * 8,
    };
  }

  var best = {
    move: -1,
    score: 0,
  };

  var two = new Tile({x:0, y:y}, 2);

  for (var move = 0; move < 4; ++move) {

    var clone = grid.clone();
    clone.move(move);

    if (!clone.equals(grid)) {

      var weight = 0;
      var score = 0;

      var empty = 0;
      for (var y = 0; y < 4; ++y) {
        for (var x = 0; x < 4; ++x) {
          if (clone.cells[x][y] == null) {
            empty++;
          }
        }
      }

      var new_quota = quota / (4 * empty);

      for (var y = 0; y < 4; ++y) {
        for (var x = 0; x < 4; ++x) {
          if (clone.cells[x][y] == null) {
            two.x = x;
            two.y = y;
            clone.insertTile(two);
            score += self.findBest(clone, new_quota, depth + 1).score;
            weight += 1;
            clone.removeTile(two);
          }
        }
      }

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
