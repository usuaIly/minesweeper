class Minesweeper {
  width = 0; 
  height = 0; 
  minesCount = 0; 
  started = false; 
  finished = false; 


  ui = {
    root: null, 
    button: null, 
    counterDigits: [], 
    timerDigits: [], 
  };


  cells = [];
  minesCounter = 0;
  secondsCounter = 0;
  secondsInterval = null;


  digitsPositions = [-126, 0, -14, -28, -42, -56, -70, -84, -98, -112];

  constructor(el, width, height, minesCount) {
    this.ui.root = el;
    this.width = width;
    this.height = height;
    this.minesCount = minesCount;
  }



  buildUI() {
    this.ui.root.innerHTML = '';
    this.ui.root.className = 'minesweeper__root';


    let panel = createUIElement('minesweeper__panel', this.ui.root);

    let counterWrap = createUIElement('minesweeper__digits', panel);
    this.ui.counterDigits = [];
    this.ui.counterDigits.push(createUIElement('minesweeper__digit', counterWrap));
    this.ui.counterDigits.push(createUIElement('minesweeper__digit', counterWrap));
    this.ui.counterDigits.push(createUIElement('minesweeper__digit', counterWrap));


    this.ui.button = createUIElement('minesweeper__start-button', panel);


    let timerWrap = createUIElement('minesweeper__digits', panel);
    this.ui.timerDigits = [];
    this.ui.timerDigits.push(createUIElement('minesweeper__digit', timerWrap));
    this.ui.timerDigits.push(createUIElement('minesweeper__digit', timerWrap));
    this.ui.timerDigits.push(createUIElement('minesweeper__digit', timerWrap));
    

    this.cells = [];
    
    let field = createUIElement('minesweeper__field', this.ui.root);
    for (let y = 0; y < this.height; y++) {
      let row = createUIElement('minesweeper__row', field);
      for (let x = 0; x < this.width; x++) {
        let index = this.cells.length;
        
        let cell = new Cell(index, this);
        
        this.cells.push(cell);
        
        row.appendChild(cell.el);
      }
    }

    field.addEventListener('mouseup', (event) => {
      event.preventDefault();
      
      if (this.finished) {
        return;
      }

      const cell = event.target.__cell_obj || null;
      if (!cell) {
        return;
      }

      if (!this.started) {
        this.start(cell);
      }

      if (event.which == 3) {
        event.preventDefault();
        if (!cell.isOpened) {
          if (!cell.isMarked) {
            cell.setMarked();
          } else if (!cell.isUnknown) {
            cell.setUnknown();
          } else {
            cell.setDefault();
          }
        }
        return;
      }

      cell.open();

      if (cell.isMine) {
        this.gameOver();
      }
    });
  }


  start(ignoredCell) {
    this.resetAll();
    
    let cellsCount = this.cells.length;
    
    let leftMines = this.minesCount;
    
    while (leftMines > 0) {
      let randomIndex = rand(0, cellsCount - 1);
      let cell = this.cells[randomIndex];
      if (cell && cell !== ignoredCell && !cell.isMine) {
        cell.putMine();
        leftMines--;
      }
    }
    
    window.clearInterval(this.secondsInterval);
    this.secondsCounter = 0;
    this.updateSecondsCounter();
    this.secondsInterval = window.setInterval((function () {
      this.secondsCounter++;
      this.updateSecondsCounter();
    }).bind(this), 1000);
    
    this.finished = false;
    this.started = true;
  }

  gameOver() {
    window.clearInterval(this.secondsInterval);
    this.finished = true;
    this.showAll(cell);
  }

  resetAll() {
    this.cells.forEach(cell => cell.reset());
  }

  showAll(ignoredCell) {
    this.cells.forEach(cell => {
      if (cell !== ignoredCell) {
        cell.show();
      }
    });
  }

  updateSecondsCounter() {    
    let hundreds = Math.floor(this.secondsCounter / 100) % 10;
    let tens = Math.floor(this.secondsCounter / 10) % 10;
    let units = this.secondsCounter % 10;

    this.ui.timerDigits[0].style.backgroundPosition = this.digitsPositions[hundreds] + 'px 0';
    this.ui.timerDigits[1].style.backgroundPosition = this.digitsPositions[tens] + 'px 0';
    this.ui.timerDigits[2].style.backgroundPosition = this.digitsPositions[units] + 'px 0';
  }
}


class Cell {
  index = 0; 
  game = null; 
  el = null; 
  isOpened = false; 
  isMine = false; 
  isMarked = false; 
  isUnknown = false; 
  cellsNumberPositions = [0, 0, -17, -34, -51, -68, -85, -102, -119]; 
  baseClass = 'minesweeper__cell minesweeper__cell--'; 

  constructor(index, game) {
    this.index = index;
    this.game = game;
    this.el = createUIElement('minesweeper__cell'); 
    this.el.__cell_obj = this; 
  }

  reset() {
    this.setDefault();
    this.isOpened = false;
    this.isMine = false;
  }

  setDefault() {
    this.isMarked = false;
    this.isUnknown = false;
    this.el.className = this.baseClass + 'closed';
  }

  setMarked() {
    this.isMarked = true;
    this.isUnknown = false;
    this.el.className = this.baseClass + 'marked';
  }

  setUnknown() {
    this.isMarked = false;
    this.isUnknown = true;
    this.el.className = this.baseClass + 'unknown';
  }

  putMine() {
    this.isMine = true;
  }

  open() {
    if (this.isMine) {
      this.isOpened = true;
      this.el.className = this.baseClass + 'exploded';
    } else {
      this.openSafe();
    }
  }

  openSafe() {
    if (this.isMine || this.isOpened) {
      return;
    }

    this.isOpened = true;
    this.el.className = this.baseClass + 'opened';

    let nearCells = this.getNearCells();

    let nearMinesCount = nearCells.filter(cell => cell.isMine).length;
    
    if (nearMinesCount > 0) {
      let bgPositionX = this.cellsNumberPositions[nearMinesCount];
      this.el.style.backgroundPosition = bgPositionX + 'px -68px';
    } else {
      nearCells.forEach(cell => cell.openSafe());
    }
  }

  show() {
    if (this.isMine) {
      this.el.className = this.baseClass + 'mined';
    } else if (this.isMarked) {
      this.el.className = this.baseClass + 'mistake';
    } else {
      this.el.className = this.baseClass + 'opened';
    }
  }

  getNearCells() {
    const [x, y] = this.indexToCoords(this.index);

    let indexes = [
      this.coordsToIndex(x - 1, y - 1),
      this.coordsToIndex(x - 1, y),
      this.coordsToIndex(x - 1, y + 1),
      this.coordsToIndex(x, y - 1),
      this.coordsToIndex(x, y + 1),
      this.coordsToIndex(x + 1, y - 1),
      this.coordsToIndex(x + 1, y),
      this.coordsToIndex(x + 1, y + 1),
    ];

    let cells = indexes.map(index => {
      if (index != null) {
        return this.game.cells[index] || null;
      }
    }).filter(cell => cell != null); 

    return cells;
  }

  coordsToIndex(x, y) {
    if (x < 1 || y < 1 || x > this.game.width || y > this.game.height) {
      return null;
    }
    return (y - 1) * this.game.width + x - 1;
  }

  indexToCoords(i) {
    let y = Math.floor(i / this.game.width);
    let x = i - (this.game.width * y);
    return [x + 1, y + 1];
  }
}

function createUIElement(className, parent) {
  const el = document.createElement('div');
  el.className = className;
    if (parent) {
    parent.appendChild(el);
  }
  return el;
}

function rand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.oncontextmenu = function () {
  return false;
}

  let containerElement = document.getElementById('minesweeper');
  const app = new Minesweeper(containerElement, 16, 16, 40);
  

  app.buildUI();

