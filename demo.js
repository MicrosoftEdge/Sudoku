function solveSudoku(inputBoard, stats) {
  
  var stats = stats || {};
  stats['easy'] = true;
  var board = JSON.parse(JSON.stringify(inputBoard));
  var possibilities = [[], [], [], [], [], [], [], [], []];
  
  for(var i = 0; i < 9; i++) {
    for(var j = 0; j < 9; j++) {
      possibilities[i][j] = [false, true, true, true, true, true, true, true, true, true];
    }
  }
  
  var solved = false;
  var impossible = false;
  var mutated = false;
  var needCheckFreedoms = false;
  
  //TODO: check input is a valid puzzle
  
  var loopCount = 0;
  
  outerLoop: while(!solved && !impossible) {
    solved = true;
    mutated = false;
    loopCount++;
    
    var leastFree = [];
    var leastRemaining = 9;
    
    for(var i = 0; i < 9; i++) {
      for(var j = 0; j < 9; j++) {
        
        if(board[i][j] === 0) {
          
          solved = false;
          var currentPos = possibilities[i][j];
          
          var zoneRow;
          var zoneCol;
          
          if(loopCount === 1) {
            zoneRow = getZone(i) * 3;
            zoneCol = getZone(j) * 3;
            currentPos[10] = zoneRow;
            currentPos[11] = zoneCol;
          } else {
            zoneRow = currentPos[10];
            zoneCol = currentPos[11];
          }
          
          var wasMutated =  reducePossibilities(board, i, j, currentPos, zoneRow, zoneCol);
          
          if(wasMutated) {
            mutated = true;
          }
          
          
          // check if the contraints above left us with only one valid option
          var remaining = 0;
          var lastDigit = 0;
        
          for(var k = 1; k <= 9; k++) {
            if(currentPos[k]) {
              remaining++;
              lastDigit = k;
            }
          }
        
          if(remaining === 0) {
            //console.log("no remaining " + i + " " + j);
            impossible = true;
            break outerLoop;
          }
          else if(remaining === 1) {
            board[i][j] = lastDigit;
            mutated = true;
            continue;
          }

          if(needCheckFreedoms) {
            var solution = checkFreedoms(board, i, j, possibilities, zoneRow, zoneCol);
            
            if(solution !== 0) {
              
              board[i][j] = solution;
              mutated = true;
              continue;
            }

            if(remaining === leastRemaining) {
              leastFree.push([i,j]);
            }
            else if(remaining < leastRemaining) {
              leastRemaining = remaining;
              leastFree = [[i,j]];
            }
          }
          
        }
      }
    }
    
    if(mutated === false && solved === false) {
      
      // time to break out freedom checking
      if(needCheckFreedoms === false) {
        needCheckFreedoms = true;
        stats['medium'] = true;
        continue;
      }
      
      // we're stuck, time to start guessing
      return solveByGuessing(board, possibilities, leastFree, stats);
      
    }
  }
  
  if(impossible) {
    //window.console && console.log("board is impossible");
    return null;
  }
  else {
    return board;
  }
}

function getZone(i) {
  if(i < 3) {
    return 0;
  }
  else if(i < 6) {
    return 1;
  }
  else {
    return 2;
  }
}


function reducePossibilities(board, row, column, currentPos, zoneRow, zoneCol) {

  var mutated = false;

  //eliminate items already taken in the column and row
  for(var k = 0; k < 9; k++) {
    if(currentPos[board[row][k]] || currentPos[board[k][column]]) {
      mutated = true;
    }
    currentPos[board[row][k]] = false;
    currentPos[board[k][column]] = false;
  }
  
  //eliminate items already taken in the region
  for(var x = zoneRow; x <= (zoneRow + 2); x++) {
    for(var y = zoneCol; y <= (zoneCol + 2); y++) {
      var zoneDigit = board[x][y];
      
      if(currentPos[zoneDigit]) {
        mutated = true;
      }
      
      currentPos[zoneDigit] = false;
    }
  }
  
  return mutated;
}

function checkFreedoms(board, i, j, possibilities, zoneRow, zoneCol) {

  var answer = 0;
  var currentPos = possibilities[i][j];
  //see if only one square can realize a possibility
          
  var uniquePosRow = currentPos.slice(0);
  var uniquePosCol = currentPos.slice(0);
  var uniquePosCube = currentPos.slice(0);
  
  for(var k = 0; k < 9; k++) {
    for(var l = 1; l <= 9; l++) {
      if(board[i][k] === 0 && possibilities[i][k][l] && k !== j) {
        uniquePosRow[l] = false;
      }
      if(board[k][j] === 0 && possibilities[k][j][l] && k !== i) {
        uniquePosCol[l] = false;
      }
    }
  }
  
  var remainingRow = 0;
  var remainingCol = 0;
  var lastDigitRow = 0;
  var lastDigitCol = 0;

  for(var k = 1; k <= 9; k++) {
    if(uniquePosRow[k]) {
      remainingRow++;
      lastDigitRow = k;
    }
    if(uniquePosCol[k]) {
      remainingCol++;
      lastDigitCol = k;
    }
  }
  
  if(remainingRow === 1) {
    answer = lastDigitRow;
    return answer;
  }
  
  if(remainingCol === 1) {
    answer = lastDigitCol;
    return answer;
  }
  
  for(var x = zoneRow; x <= (zoneRow + 2); x++) {
    for(var y = zoneCol; y <= (zoneCol + 2); y++) {
      for(var l = 1; l <= 9; l++) {
        if(board[x][y] === 0 && possibilities[x][y][l] && (x !== i || y !== j)) {
          uniquePosCube[l] = false;
        }
      }
    }
  }
  
  var remainingCube = 0;
  var lastDigitCube = 0;

  for(var k = 1; k <= 9; k++) {
    if(uniquePosCube[k]) {
      remainingCube++;
      lastDigitCube = k;
    }
  }
  
  if(remainingCube == 1) {
    answer = lastDigitCube;
  }
  
  return answer;
  
}

function solveByGuessing(board, possibilities, leastFree, stats) {
  if(leastFree.length < 1) {
    return null;
  }
  
  if('hard' in stats) {
    stats['vhard'] = true;
  }
  else {
    stats['hard'] = true;
  }
  
  // choose a space with the least # of possibilities
  var randIndex = getRandom(leastFree.length);
  var randSpot = leastFree[randIndex];
  
  var guesses = [];
  var currentPos = possibilities[randSpot[0]][randSpot[1]];
  
  for(var i = 1; i <= 9; i++) {
    if(currentPos[i]) {
      guesses.push(i);
    }
  }
  
  shuffleArray(guesses);
  
  for(var i = 0; i < guesses.length; i++) {
    board[randSpot[0]][randSpot[1]] = guesses[i];
    var result = solveSudoku(board, stats);
    if(result != null) {
      return result;
    }
  }
  
  // board is impossible
  return null;
}


// returns a random number in the range 0 to limit - 1 inclusive
function getRandom(limit) {
  return Math.floor(Math.random() * limit);
}

// shuffle an array Fisher-Yates style
function shuffleArray(array) {
  var i = array.length;
  
  if(i !== 0) {
    while(--i) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}

// for benchmarking, use a random generator from a seed
(function() {

  // some dummy value to start with
  var last = 31337;
  var randomBackup = Math.random;

  // Linear Congruential Generator
  var fakeRandom = function() {
    var a = 214013;
    var c = 2531011;
    //2^32
    var m = 4294967296;
    
    var next = (a * last + c) % m;
    
    last = next;
    return next / m;
  }
  
  Math.enableFakeRandom = function() {
    Math.random = fakeRandom;
  }
  
  Math.disableFakeRandom = function() {
    Math.random = randomBackup;
  }
  
  Math.fakeRandomSeed = function(seed) {
    last = seed;
  }
  
})();


function generatePuzzle(difficulty) {
  
  if(difficulty !== 1 && difficulty !== 2 && 
    difficulty !== 3 && difficulty !== 4  && 
    difficulty !== 5) {
      
    difficulty = 1;
  }
  
  var solvedPuzzle = solveSudoku(emptyPuzzle);
  
  var indexes = new Array(81);
  
  for(var i = 0; i < 81; i++) {
    indexes[i] = i;
  }
  
  shuffleArray(indexes);
  
  var knownCount = 81;
  
  for(var i = 0; i < 81; i++) {
    
    if(knownCount <= 25) {
      break;
    }
    
    //easy check
    if(difficulty == 1 && knownCount <= 35) {
      break;
    }
    
    var index = indexes[i];
    
    var row = Math.floor(index / 9);
    var col = index % 9;
    var currentValue = solvedPuzzle[row][col];
    var state = {};
    solvedPuzzle[row][col] = 0;
    var resolvedPuzzle = solveSudoku(solvedPuzzle, state);
    
    // some clarity -- what the solver considers 'medium' is hard for most users
    var undo = false;
    if(difficulty <= 2 && state.medium) {
      undo = true;
    } else if(difficulty <= 3 && state.hard) {
      undo = true;
    } else if(difficulty <= 4 && state.vhard) {
      undo = true;
    }
    
    if(undo) {
      solvedPuzzle[row][col] = currentValue;
    }
    else {
      knownCount--;
    }
    
    
  }
  
  return solvedPuzzle;
  
}


function verifySolution(board, onlyFullySolved) {
  
  var resp = {};
  resp['valid'] = false;
  
  if(board === null) {
    window.console && console.log("Not a board");
    resp['invalidBoard'] = "Board was null";
    return resp;
  }
  
  var rows = [];
  var cols = [];
  var cubes = [ [[], [], []], [[], [], []], [[], [], []]];
  for(var i = 0; i < 9; i++) {
    rows.push([]);
    cols.push([]);
  }
  
  for(var i = 0; i < 9; i++) {
    for(var j = 0; j < 9; j++) {
      var digit = board[i][j];
      
      if(digit === 0) {
        if(onlyFullySolved) {
          resp['notFullySolved'] = "Board still has unknowns";
          return resp;
        } else {
          continue;
        }
      }
      
      if(digit in rows[i]) {
        resp['badRow'] = i;
        return resp;
      }
      else {
        rows[i][digit] = true;
      }
      
      if(digit in cols[j]) {
        resp['badCol'] = j;
        return resp;
      }
      else {
        cols[j][digit] = true;
      }
      
      var cube = cubes[getZone(i)][getZone(j)];
      
      if(digit in cube) {
        resp['badCube'] = [getZone(i) * 3, getZone(j) * 3];
        return resp;
      }
      else {
        cube[digit] = true;
      }

    }
  }
  
  resp['valid'] = true;
  return resp;
}

var easyPuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

var easyPuzzle2 = [
  [1, 6, 0, 0, 0, 3, 0, 0, 0],
  [2, 0, 0, 7, 0, 6, 0, 1, 4],
  [0, 4, 5, 0, 8, 1, 0, 0, 7],
  [5, 0, 8, 4, 0, 0, 0, 0, 0],
  [0, 0, 4, 3, 0, 8, 9, 0, 0],
  [0, 0, 0, 0, 0, 7, 2, 0, 8],
  [8, 0, 0, 6, 3, 0, 1, 9, 0],
  [6, 3, 0, 1, 0, 5, 0, 0, 2],
  [0, 0, 0, 8, 0, 0, 0, 3, 6]
];

var easyPuzzle3 = [
  [8, 1, 0, 0, 2, 9, 0, 0, 0],
  [4, 0, 6, 0, 7, 3, 0, 5, 1],
  [0, 7, 0, 0, 0, 0, 8, 0, 2],
  [0, 0, 4, 5, 0, 0, 0, 0, 6],
  [7, 6, 0, 0, 0, 0, 0, 1, 3],
  [1, 0, 0, 0, 0, 6, 2, 0, 0],
  [2, 0, 7, 0, 0, 0, 0, 8, 0],
  [6, 9, 0, 2, 8, 0, 3, 0, 5],
  [0, 0, 0, 9, 6, 0, 0, 2, 4]
];

var solvedPuzzle = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

var invalidPuzzle = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [8, 2, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

var hardPuzzle = [
  [0, 0, 3, 0, 0, 8, 0, 0, 0],
  [0, 4, 0, 0, 0, 0, 0, 0, 0],
  [0, 8, 0, 3, 5, 0, 9, 0, 0],
  [8, 0, 5, 0, 0, 6, 0, 0, 0],
  [1, 0, 0, 7, 3, 2, 0, 0, 8],
  [0, 0, 0, 8, 0, 0, 3, 0, 1],
  [0, 0, 8, 0, 1, 4, 0, 7, 0],
  [0, 0, 0, 0, 0, 0, 0, 5, 0],
  [0, 0, 0, 9, 0, 0, 2, 0, 0]
];

var mediumPuzzle = [
  [0, 8, 3, 7, 0, 0, 0, 9, 0],
  [0, 0, 7, 0, 5, 0, 6, 4, 0],
  [0, 0, 0, 9, 0, 0, 0, 0, 3],
  [0, 0, 0, 1, 0, 0, 0, 0, 7],
  [0, 6, 9, 2, 0, 4, 3, 8, 0],
  [7, 0, 0, 0, 0, 9, 0, 0, 0],
  [9, 0, 0, 0, 0, 3, 0, 0, 0],
  [0, 5, 6, 0, 2, 0, 4, 0, 0],
  [0, 1, 0, 0, 0, 7, 5, 3, 0]
];

var emptyPuzzle = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

function stressTest() {
  
  var intervalCount = 0;
  var intervalId = window.setInterval(function() {
    intervalCount++;
    if(intervalCount  > 500) {
      window.console && console.log("finished");
      window.clearInterval(intervalId);
    }
    var newPuzzle = solveSudoku(emptyPuzzle);
    var resp = verifySolution(newPuzzle);
    
    if(resp['valid'] === false) {
      window.console && console.log("Boo! " + intervalCount);
      printBoard(newPuzzle);
    }
    
  }, 1);
  
}

function cellInputHandler(event) {
  if(!this.value.match(/^[1-9]$/)) {
    this.value = "";
  }
}

function renderBoard(board) {
  for(var i = 0; i < 9; i++) {
    for(var j = 0; j < 9; j++) {
      var id = "" + i + j;
      var el = document.getElementById(id);
      var val = board[i][j];
      var child;
      var elClass;
      
      if(val === 0) {
        child = document.createElement("input");
        child.setAttribute('maxlength', 1);
        child.addEventListener('keyup', cellInputHandler, false);
        child.addEventListener('blur', cellInputHandler, false);
        elClass = "editValue";
      }
      else {
        child = document.createElement("span");
        child.textContent = val;
        elClass = "staticValue"; 
      }
      
      el.innerHTML = "";
      el.setAttribute("class", elClass);
      el.appendChild(child);
    }
  }
}

// render the board a special way when the algorithm solves it for the user
// make it look like the user entered it in
function renderSolvedBoard(board) {
  for(var i = 0; i < 9; i++) {
    for(var j = 0; j < 9; j++) {
      var id = "" + i + j;
      var el = document.getElementById(id);
      var val = board[i][j];
      var child = el.children[0];
      if(child.tagName === 'INPUT') {
        child.value = val;
      }
    }
  }
}

function getCurrentBoard() {
  
  var board = new Array(9);
  
  for(var i = 0; i < 9; i++) {
    for(var j = 0; j < 9; j++) {
      if(j === 0) {
        board[i] = new Array(9);
      }
      var id = "" + i + j;
      var el = document.getElementById(id);
      var child = el.children[0];
      var value = "0";
      if(child.tagName === 'INPUT') {
        value = child.value;
      }
      else if(child.tagName == 'SPAN') {
        value = child.textContent;
      }
      if(value.match(/^[1-9]$/)) {
        value = parseInt(value);
      } else {
        //TODO: prompt user for invalid chars
        value = 0;
      }
      board[i][j] = value;
    }
  }
  
  return board;
}

function printBoard(board) {
  for(var i = 0; i < 9; i++) {
    var line = "";
    for(var j = 0; j < 9; j++) {
      line += " " + board[i][j];
    }
    window.console && console.log(line);
  }
}

function solveTest(level, after) {

  var easyCount = 2000;
  var hardCount = 200;

  switch(level) {
    case 1:
      easyCount = 475;
      hardCount = 25;
      break;
    case 2:
      easyCount = 2375;
      hardCount = 125;
      break;
    case 3:
      easyCount = 4750;
      hardCount = 250;
      break;
  }
  
  Math.enableFakeRandom();
  Math.fakeRandomSeed(31337);
  
  renderBoard(easyPuzzle);
  
  var timeElapsed = 0;
  
  var tests = [];
  tests.push(function() {
    timeElapsed += solveTestHelper(easyPuzzle, easyCount);
  });
  tests.push(function() {
    timeElapsed += solveTestHelper(easyPuzzle2, easyCount);
  });
  tests.push(function() {
    timeElapsed += solveTestHelper(mediumPuzzle, hardCount);
  });
  tests.push(function() {
    timeElapsed += solveTestHelper(hardPuzzle, hardCount);
  });
  tests.push(function() {
    Math.disableFakeRandom();
    document.getElementById("timeFinished").textContent = timeElapsed.toFixed(3) + "s";
  });
  tests.push(after);
  
  var current = 0;
  
  var timeoutFunc = function() {
    if(current < tests.length) {
      tests[current]();
      current++;
      window.setTimeout(timeoutFunc, 300);
    }
  }
  
  window.setTimeout(timeoutFunc, 300);
  
}

function solveTestHelper(puzzle, iterations) {
  var solution = null;
  var start = new Date();
  for(var i = 0; i < iterations; i++) {
    solution = solveSudoku(puzzle);
  }
  var end = new Date();
  renderBoard(puzzle);
  renderSolvedBoard(solution);
  var timeElapsed = (end.getTime() - start.getTime()) / 1000;
  return timeElapsed;
}

function initialize() {
  // hook up buttons
  
  var currentPuzzle = generatePuzzle();
  renderBoard(currentPuzzle);
  
  var amazeButton = document.getElementById('amazeButton');
  var calculatingDiv = document.getElementById('calculating');
  var finishedCalculatingDiv = document.getElementById('finishedCalculating');
  var winBlock = document.getElementById('youWon');
  var noErrorsSpan = document.getElementById('noErrors');
  var errorsFoundSpan = document.getElementById('errorsFound');
  var difficulty = document.getElementById('difficulty');
  var currentErrors = [];
  var amazing = false;
  
  var clearErrors = function() {
  
    errorsFoundSpan.style.display = 'none';
    noErrorsSpan.style.display = 'none';
    
    for(var i = 0; i < currentErrors.length; i++) {
      currentErrors[i].setAttribute('class', currentErrors[i].getAttribute('class').replace(" error", ''))
    }
    currentErrors = [];
  }
  
  amazeButton.addEventListener('click', function() {
    if(!amazing) {
      var level = parseInt(difficulty.options[difficulty.selectedIndex].value);
      amazing = true;
      clearErrors();
      finishedCalculatingDiv.style.display = 'none';
      calculatingDiv.style.display = 'block';
 
      solveTest(level, function() {
        finishedCalculatingDiv.style.display = 'block';
        calculatingDiv.style.display = 'none';
        amazing = false;
        currentPuzzle = hardPuzzle;
      });
    }
  }, false);
  
  var checkButton = document.getElementById('checkButton');
  
  checkButton.addEventListener('click', function() {
    
    clearErrors();
    
    var board = getCurrentBoard();
    var result = verifySolution(board);
    if(result['valid']) {
    
      var validMessages = [ "LOOKIN GOOD", "KEEP GOING", "AWESOME", "EXCELLENT", 
        "NICE", "SWEET", "LOOKS GOOD TO ME"];
      
      if(verifySolution(board, true)['valid']) {
        winBlock.style.display = 'block';
      }
      else {
        var randIndex = getRandom(validMessages.length);
        noErrorsSpan.textContent = validMessages[randIndex];
        noErrorsSpan.style.display = 'block';
      }
    }
    else {
      if('badRow' in result) {
        var row = result['badRow'];
        for(var i = 0; i < 9; i++) {
          var id = "" + row + i;
          var el = document.getElementById(id);
          el.setAttribute("class", el.getAttribute('class') + " error");
          currentErrors.push(el);
        }
      }
      else if('badCol' in result) {
        var col = result['badCol'];
        for(var i = 0; i < 9; i++) {
          var id = "" + i + col;
          var el = document.getElementById(id);
          el.setAttribute("class", el.getAttribute('class') + " error");
          currentErrors.push(el);
        }
      }
      else if('badCube' in result) {
        var cubeRow = result['badCube'][0];
        var cubeCol = result['badCube'][1];
        for(var x = cubeRow + 2; x >= cubeRow; x--) {
          for(var y = cubeCol + 2; y >= cubeCol; y--) {
            var id = "" + x + y;
            var el = document.getElementById(id);
            el.setAttribute("class", el.getAttribute('class') + " error");
            currentErrors.push(el);
          }
        }
        
      }
      errorsFoundSpan.style.display = 'block';
    }
    
    
  }, false);
  
  var winCloseButton = document.getElementById('winCloseButton');
  
  winCloseButton.addEventListener('click', function() {
    winBlock.style.display = 'none';
  }, false);
  
  var winNewGameButton = document.getElementById('winNewGameButton');
  
  winNewGameButton.addEventListener('click', function() {
    clearErrors();
    var value = parseInt(difficulty.options[difficulty.selectedIndex].value);
    currentPuzzle = generatePuzzle(value);
    renderBoard(currentPuzzle);
    winBlock.style.display = 'none';
  }, false);
  
  var newGameButton = document.getElementById('newGameButton');
  
  newGameButton.addEventListener('click', function() {
    clearErrors();
    var value = parseInt(difficulty.options[difficulty.selectedIndex].value);
    currentPuzzle = generatePuzzle(value);
    renderBoard(currentPuzzle);
  }, false);
  
  var solveButton = document.getElementById('solveButton');
  
  solveButton.addEventListener('click', function() {
    clearErrors();
    renderSolvedBoard(solveSudoku(currentPuzzle));
  }, false);
  
  addEventListener('mouseup', function(event) {
    if(event.which === 1) {
      noErrorsSpan.style.display = 'none';
    }
  }, false);
  
}

addEventListener('DOMContentLoaded', initialize, false);