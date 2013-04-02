pedigree.UI = function(pedigree) {
  this.pedigree = pedigree;
  this.buildInterface();
};

pedigree.UI.prototype.posStr = function(opt_x, opt_y) {
  if (opt_x != undefined && opt_y != undefined)
    return (opt_y + ' ' + (opt_x + 1));
  else
    return this.pedigree.y + ' ' + (this.pedigree.x + 1);
};

pedigree.UI.prototype.recover = function() {
  if (this.pedigree.undo_history.length - 1 > this.beforeCommandUndoIndex) {
    console.log('WILL UNDO to recover');
    this.pedigree.undo();
  } else {
    console.log('WILL LOAD TOP OF STACK to recover');
    this.pedigree.loadstate(this.pedigree.undo_history[this.beforeCommandUndoIndex]);
  }
  this.pedigree.x = this.beforeCommandX;
  this.pedigree.y = this.beforeCommandY;
  this.container.innerHTML = '';
  this.pedigree.plot();
  this.pedigree.renderHtml(this.innerDoc, this.container);
  this.navigate(0, 0);
};

pedigree.UI.prototype.replot = function() {
  console.log('replot inner doc: ' + this.innerDoc.body.outerHTML);

  try {
    this.container.innerHTML = '';
    this.pedigree.plot();
    this.pedigree.renderHtml(this.innerDoc, this.container);
    this.navigate(0, 0);
  } catch (e) {
    console.log('Replot recover because ' + e.message);
    this.recover();
    if (e instanceof PedigreeException) {
      pedigree.messageDialog(e.message);
    } else {
      throw e;
    }
  }

  console.log('End of replot inner doc: ' + this.innerDoc.body.outerHTML);
};

pedigree.UI.prototype.edit = function() {
  var x = this.pedigree.x;
  var y = this.pedigree.y;
  var row = this.pedigree.data[y];
  var n = row[x];

  if (x == -1)
    return;

  pedigree.textareaDialog(
      'Enter a new description for ' + this.posStr(x, y),
      n.label,
      (function(result) {
        if (result != null) {
          n.label = result;
          this.pedigree.push('changing description of ' + this.posStr(x, y));
          this.replot();
        }
      }).bind(this));
};

pedigree.UI.prototype.editPageTitle = function() {
  pedigree.textareaDialog(
      'Enter the text to go at the top of the page.',
      this.pedigree.text,
      (function(result) {
        if (result != null) {
          this.pedigree.text = result;
          this.pedigree.push('changing text at top of page');
          this.replot();
        }
      }).bind(this));
};

pedigree.UI.prototype.save = function() {
  this.pedigree.plot();
  this.pedigree.renderPdf();
};

pedigree.UI.prototype.validateCoords = function(coords) {
  var x = coords[0];
  var y = coords[1];
  return (this.pedigree.data[y] && this.pedigree.data[y][x]);
};

pedigree.UI.prototype.jump = function() {
  pedigree.coordinatesDialog(
      'Enter the coordinates to jump to, of the form "3 2", separated by a comma or space.',
      this.validateCoords.bind(this),
      (function(result) {
        var x = result[0];
        var y = result[1];
        this.navigate(x - this.pedigree.x, y - this.pedigree.y);
      }).bind(this));      
};

pedigree.UI.prototype.createNewPedigree = function() {
  this.pedigree = new pedigree.Pedigree();
  this.container.innerHTML = '';
  this.init();
};

pedigree.UI.prototype.promptForNewPedigree = function() {
  if (!this.pedigree.dirty) {
    this.createNewPedigree();
  }
  pedigree.yesNoDialog(
      'Clear this pedigree and start a new one?',
      'Start New Pedigree',
      'Cancel',
      null,
      (function() {
        // Yes.
        this.createNewPedigree();
      }).bind(this),
      (function() {
        // No: do nothing.
      }).bind(this),
      null);
};

pedigree.UI.prototype.setParents = function(numParents, fx, fy, mx, my) {
  var x = this.pedigree.x;
  var y = this.pedigree.y;
  this.prevParents = [numParents, fx, fy, mx, my];
  this.pedigree.data[y][x].parents = [fx, fy, mx, my];
  this.pedigree.push('adding parents of ' + this.posStr(x, y));
  this.replot();
};

pedigree.UI.prototype.handleOneParent = function() {
  pedigree.coordinatesDialog(
      'Specify the parent of ' + this.posStr(),
      this.validateCoords.bind(this),
      (function(result) {
        var x = result[0];
        var y = result[1];
        this.setParents(1, x, y, null, null);
      }).bind(this));
};

pedigree.UI.prototype.handleSecondOfTwoParents = function(fx, fy) {
  pedigree.coordinatesDialog(
      'Now please specify the mother of ' + this.posStr() + '.',
      this.validateCoords.bind(this),
      (function(result) {
        var mx = result[0];
        var my = result[1];
        var m = this.pedigree.data[my][mx];
        if (m.gender != 'female') {
          pedigree.messageDialog(this.posStr(mx, my) + ' is not female.');
          return;
        }

        this.setParents(2, fx, fy, mx, my);
      }).bind(this));
};

pedigree.UI.prototype.gotFirstOfTwoParents = function(fx, fy) {
  for (var i = 0; i < this.pedigree.unions.length; i++) {
    var ux1 = this.pedigree.unions[i][0];
    var uy1 = this.pedigree.unions[i][1];
    var ux2 = this.pedigree.unions[i][2];
    var uy2 = this.pedigree.unions[i][3];
    if (ux1 == fx && uy1 == fy) {
      pedigree.yesNoDialog(
          'Is ' + this.posStr(ux2, uy2) + ' the mother?',
          'Yes',
          'No',
          'Cancel',
      (function() {
        // Yes.
        this.setParents(2, ux1, uy1, ux2, uy2);
      }).bind(this),
      (function() {
        // No.
        this.handleSecondOfTwoParents(fx, fy);
      }).bind(this),
      (function() {
        // Cancel.
      }).bind(this));
      return;
    } else if (ux2 == fx && uy2 == fy) {
      pedigree.yesNoDialog(
          'Is ' + this.posStr(ux1, uy1) + ' the mother?',
          'Yes',
          'No',
          'Cancel',
      (function() {
        // Yes.
        this.setParents(2, ux1, uy1, ux2, uy2);
      }).bind(this),
      (function() {
        // No.
        this.handleSecondOfTwoParents(fx, fy);
      }).bind(this),
      (function() {
        // Cancel.
      }).bind(this));
      return;
    }
  }

  this.handleSecondOfTwoParents(fx, fy);
};

pedigree.UI.prototype.handleFirstOfTwoParents = function() {
  pedigree.coordinatesDialog(
      'Please specify the father of ' + this.posStr() + ' first.',
      this.validateCoords.bind(this),
      (function(result) {
        var fx = result[0];
        var fy = result[1];
        var f = this.pedigree.data[fy][fx];
        if (f.gender != 'male') {
          pedigree.messageDialog(this.posStr(fx, fy) + ' is not male.');
          return;
        }

        this.gotFirstOfTwoParents(fx, fy);
      }).bind(this));      
};

pedigree.UI.prototype.deleteParents = function() {
  var x = this.pedigree.x;
  var y = this.pedigree.y;
  this.pedigree.data[y][x].parents = null;
  this.pedigree.push('deleting parents of ' + this.posStr());
  this.replot();
};

pedigree.UI.prototype.parents = function() {
  var x = this.pedigree.x;
  var y = this.pedigree.y;
  if (y == 1) {
    pedigree.messageDialog(
        'You are in the top row, there are no parents to specify. ' +
        'Press up arrow to create a row for this person\'s parents.');
    return;
  }

  if (this.last_dot && this.prevParents != null) {
    var numParents = this.prevParents[0];
    var fx = this.prevParents[1];
    var fy = this.prevParents[2];
    var mx = this.prevParents[3];
    var my = this.prevParents[4];
    if (numParents == 1) {
      out('Using ' + this.posStr(fx, fy) + ' as the parent again.');
    } else if (numParents == 2) {
      out('Using ' + this.posStr(fx, fy) + ' and ' +
          this.posStr(mx, my) + ' as the parents again.');
    }
    this.setParents(numParents, fx, fy, mx, my);
    return;
  }

  var clearPrompt = null;
  if (this.pedigree.data[y][x].parents) {
    clearPrompt = 'Clear existing parents';
  }
  pedigree.yesNoDialog(
      'Set parents of ' + this.posStr(x, y) + ':',
      '1 parent',
      '2 parents',
      clearPrompt,
      (function() {
        this.handleOneParent();
      }).bind(this),
      (function() {
        this.handleFirstOfTwoParents();
      }).bind(this),
      (function() {
        this.deleteParents();
      }).bind(this));
};

pedigree.UI.prototype.insertRowAtTop = function() {
  this.pedigree.insertNewRowAtTop();
  this.navigate(0, 0 - this.pedigree.y);
  this.replot();
};

pedigree.UI.prototype.insertRowAtBottom = function() {
  var y = this.pedigree.y;
  while (this.pedigree.data[y])
    y++;
  this.pedigree.data[y] = [];
  this.replot();
  this.navigate(0, y - this.pedigree.y);
};

pedigree.UI.prototype.promptInsertRowAtTop = function() {
  pedigree.yesNoDialog(
      'Insert new row at top?',
      'Yes',
      'No',
      null,
      (function() {
        // Yes.
        this.insertRowAtTop();
      }).bind(this),
      (function() {
        // No: do nothing.
      }).bind(this),
      null);
};

pedigree.UI.prototype.addFemale = function() {
  this.pedigree.x += 1;
  this.pedigree.addnode(new pedigree.Node('female'),
                        this.pedigree.x, this.pedigree.y);
  this.pedigree.push('adding female at ' + this.posStr());
  this.replot();
};

pedigree.UI.prototype.addMale = function() {
  this.pedigree.x += 1;
  this.pedigree.addnode(new pedigree.Node('male'),
                        this.pedigree.x, this.pedigree.y);
  this.pedigree.push('adding male at ' + this.posStr());
  this.replot();
};

pedigree.UI.prototype.addNogender = function() {
  this.pedigree.x += 1;
  this.pedigree.addnode(new pedigree.Node('nogender'), this.pedigree.x, this.pedigree.y);
  this.pedigree.push('adding unknown gender at ' + this.posStr());
  this.replot();
};

pedigree.UI.prototype.addPregloss = function() {
  this.pedigree.x += 1;
  this.pedigree.addnode(new pedigree.Node('pregloss'), this.pedigree.x, this.pedigree.y);
  this.pedigree.push('adding pregnancy loss at ' + this.posStr());
  this.replot();
};

pedigree.UI.prototype.toggleCarrier = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    row[this.pedigree.x].carrier = !row[this.pedigree.x].carrier;
    this.pedigree.push('changing carrier status of ' + this.posStr());
    this.replot();
  }
};

pedigree.UI.prototype.toggleAffected = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    row[this.pedigree.x].affected = !row[this.pedigree.x].affected;
    this.pedigree.push('changing affectedness of ' + this.posStr());
    this.replot();
  }
};

pedigree.UI.prototype.toggleProband = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    row[this.pedigree.x].proband = !row[this.pedigree.x].proband;
    this.pedigree.push('changing proband status of ' + this.posStr());
    this.replot();
  }
};

pedigree.UI.prototype.toggleTwin = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    row[this.pedigree.x].twin = !row[this.pedigree.x].twin;
    this.pedigree.push('changing twin status of ' + this.posStr());
    this.replot();
  }
};

pedigree.UI.prototype.toggleDead = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    if (row[this.pedigree.x].dead) {
      this.pedigree.push('bringing ' + this.posStr() + ' back to life');
      row[this.pedigree.x].dead = false;
    } else {
      this.pedigree.push('killing ' + this.posStr());
      row[this.pedigree.x].dead = true;
    }
    this.replot();
  }
};

pedigree.UI.prototype.togglePregnancy = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    row[this.pedigree.x].pregnancy = !row[this.pedigree.x].pregnancy;
    this.pedigree.push('changing pregnancy status of ' + this.posStr());
    this.replot();
  }
};

pedigree.UI.prototype.init = function() {
  if (this.pedigree.y == undefined) {
    this.pedigree.y = 1;
    this.pedigree.x = -1;
  }
  this.pedigree.push('Initial state.');

  this.pedigree.plot();
  this.pedigree.renderHtml(this.innerDoc, this.container);

  var element = this.getElement(this.pedigree.x, this.pedigree.y);
  element.tabIndex = 0;
  addClass(element, 'selected');
  element.focus();
};

pedigree.UI.prototype.undo = function() {
  var undo_result = this.pedigree.undo();
  if (undo_result) {
    this.pedigree.x = undo_result.x;
    this.pedigree.y = undo_result.y;
    this.replot();
  }
};

pedigree.UI.prototype.redo = function() {
  var redo_result = this.pedigree.redo();
  if (redo_result) {
    this.pedigree.x = redo_result.x;
    this.pedigree.y = redo_result.y;
    this.replot();
  }
};

pedigree.UI.prototype.moveLeft = function() {
  this.navigate(-1, 0);
};

pedigree.UI.prototype.moveRight = function() {
  this.navigate(1, 0);
};

pedigree.UI.prototype.moveUp = function() {
  if (this.pedigree.y == 1) {
    this.promptInsertRowAtTop();
  } else {
    var rowmax = 2;
    for (var row in this.pedigree.data) {
      if (row > rowmax)
        rowmax = row;
    }
    if (this.pedigree.data[this.pedigree.y].length == 0 &&
        this.pedigree.y == rowmax) {
      delete this.pedigree.data[this.pedigree.y];
      this.pedigree.y -= 1;
      this.replot();
    } else {
      this.navigate(0, -1);
    }
  }
};

pedigree.UI.prototype.moveDown = function() {
  if (this.pedigree.data[this.pedigree.y + 1] == undefined) {
    this.pedigree.data[this.pedigree.y + 1] = [];
    this.replot();
  }
  this.navigate(0, 1);
};

pedigree.UI.prototype.deleteCurrentNode = function() {
  this.pedigree.deletenode(this.pedigree.x, this.pedigree.y);
  this.replot();
};

pedigree.UI.prototype.union = function() {
  this.pedigree.union(this.pedigree.x, this.pedigree.y);
  this.replot();
};

pedigree.UI.prototype.grabChild = function() {
  this.pedigree.grabchild(this.pedigree.x, this.pedigree.y);
  this.replot();
};

pedigree.UI.prototype.nPeople = function() {
  if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
    var row = this.pedigree.data[this.pedigree.y];
    row[this.pedigree.x].multiple = 10;
    this.pedigree.push('setting ' + this.posStr() + ' to n people');
    this.replot();
  }
};

pedigree.UI.prototype.describeAll = function() {
  pedigree.messageDialog(
      this.pedigree.describe_all());
};

pedigree.UI.prototype.describe = function() {
  pedigree.messageDialog(
      this.pedigree.describe(this.pedigree.x, this.pedigree.y));
};

pedigree.UI.prototype.longDescribe = function() {
  pedigree.messageDialog(
      this.pedigree.longdescribe(this.pedigree.x, this.pedigree.y));
};

pedigree.UI.prototype.executeCommand = function(cmd) {
  this.beforeCommandX = this.pedigree.x;
  this.beforeCommandY = this.pedigree.y;
  this.beforeCommandUndoIndex = this.pedigree.undo_history.length - 1;
  try {
    (cmd.bind(this))();
  } catch (e) {
    console.log('executeCommand recover because ' + e.message);
    this.recover();
    if (e instanceof PedigreeException) {
      pedigree.messageDialog(e.message);
    } else {
      throw e;
    }
  }
};

pedigree.UI.prototype.run = function() {
  this.init();

  var keydownMap = {
     8: this.deleteCurrentNode,  // Backspace
    13: this.edit,               // Enter
    37: this.moveLeft,           // Left arrow
    38: this.moveUp,             // Up arrow
    39: this.moveRight,          // Right arrow
    40: this.moveDown            // Down arrow
  };

  var keypressAsciiMap = {
    'L': this.longDescribe,
    'N': this.nPeople,
    'P': this.togglePregnancy,
    'T': this.toggleTwin,
    'U': this.addNogender,
    'a': this.toggleAffected,
    'b': this.addPregloss,
    'c': this.toggleCarrier,
    'd': this.describe,
    'f': this.addFemale,
    'g': this.grabChild,
    'k': this.toggleDead,
    'm': this.addMale,
    'p': this.parents,
    'u': this.union,
    'x': this.toggleProband
  };

  var globalKeypressAsciiMap = {
    'j': this.jump,
    'n': this.promptForNewPedigree,
    's': this.save,
    't': this.editPageTitle,
    'w': this.describeAll,
    'y': this.redo,
    'z': this.undo,
    'M': this.focusMenuBar,
    '/': this.focusMenuBar
  };

  /*
      case '?':
        // Help
        break;
      case 'l'.charCodeAt(0):
        // Load
        break;
      case 'q'.charCodeAt(0):
        // Quit
        break;
      case 's'.charCodeAt(0):
        // Save
        break;
  */

  var keypressMap = {};
  for (var asciiKey in keypressAsciiMap) {
    keypressMap[asciiKey.charCodeAt(0)] = keypressAsciiMap[asciiKey];
  };

  var globalKeypressMap = {};
  for (asciiKey in globalKeypressAsciiMap) {
    globalKeypressMap[asciiKey.charCodeAt(0)] =
        globalKeypressAsciiMap[asciiKey];
  };

  addEventListenerWrap(this.container, 'click', (function(evt) {
    evt = evt || window.event;
    if (pedigree.dialogOpen) {
      pedigree.closeDialog();
      return;
    }
    var t = evt.target || evt.srcElement;
    while (t && t.getAttribute) {
      if (t.getAttributeNode('px') != null && t.getAttributeNode('py') != null) {
        var newx = Math.floor(t.getAttribute('px'));
        var newy = Math.floor(t.getAttribute('py'));
        this.navigate(newx - this.pedigree.x, newy - this.pedigree.y);
        cancelEventWrap(evt);
        break;
      }
      t = t.parentNode;
    }
  }).bind(this), false);

  addEventListenerWrap(this.container, 'keydown', (function(evt) {
    evt = evt || window.event;
    console.log('KEYDOWN ' + evt.keyCode);
    if (pedigree.dialogOpen) {
      return;
    }
    var cmd = keydownMap[evt.keyCode];
    if (cmd != undefined) {
      this.executeCommand(cmd);
      cancelEventWrap(evt);
    }
  }).bind(this), false);

  addEventListenerWrap(this.container, 'keypress', (function(evt) {
    evt = evt || window.event;
    if (pedigree.dialogOpen) {
      return;
    }
    console.log('KEYPRESS ' + evt.charCode);
    var handled = false;
    var cmd = keypressMap[evt.keyCode];
    if (cmd != undefined) {
      this.executeCommand(cmd);
      handled = true;
    }

    if (evt.charCode == '.'.charCodeAt(0)) {
      this.last_dot = true;
    } else {
      this.last_dot = false;
    }

    if (evt.charCode >= '0'.charCodeAt(0) && evt.charCode <= '9'.charCodeAt(0)) {
      var multiple = evt.charCode - '0'.charCodeAt(0);
      if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
        var row = this.pedigree.data[this.pedigree.y];
        row[this.pedigree.x].multiple = multiple;
        if (multiple == 0) {
          this.pedigree.push('making ' + this.posStr() + ' a nonexistant child');
        } else if (multiple == 1) {
          this.pedigree.push('setting ' + this.posStr() + ' to 1 person');
        } else {
          this.pedigree.push('setting ' + this.posStr() + ' to ' + multiple + ' people');
        }
        this.replot();
        handled = true;
      }
    }

    if (handled) {
      cancelEventWrap(evt);
    }
  }).bind(this), false);

  function globalKeyPressHandler(evt) {
    evt = evt || window.event;
    if (pedigree.dialogOpen) {
      return;
    }
    if (evt.altKey || evt.ctrlKey || evt.metaKey) {
      return;
    }
    var cmd = globalKeypressMap[evt.keyCode];
    if (cmd != undefined) {
      this.executeCommand(cmd);
      cancelEventWrap(evt);
    }
  }

  addEventListenerWrap(document, 'keypress', globalKeyPressHandler.bind(this), false);
  addEventListenerWrap(this.innerDoc, 'keypress', globalKeyPressHandler.bind(this), false);

  var currentFocus = document.activeElement;
  addClass(currentFocus, 'focus');

  function globalFocusHandler(evt) {
    removeClass(currentFocus, 'focus');
    evt = evt || window.event;
    currentFocus = evt.target || evt.srcElement;
    addClass(currentFocus, 'focus');    
  }

  addEventListenerWrap(document, 'focusin', globalFocusHandler.bind(this), false);
};

pedigree.UI.prototype.getElement = function(x, y) {
  if (x >= 0) {
    return this.pedigree.data[y][x].element;
  } else {
    return this.pedigree.rowobjs[y].rowmarker;
  }
};

pedigree.UI.prototype.navigate = function(dx, dy) {
  try {
    var element = this.getElement(this.pedigree.x, this.pedigree.y);
    element.tabIndex = -1;
    removeClass(element, 'selected');
  } catch (ignore) {
  }

  if (this.pedigree.data[this.pedigree.y + dy] != undefined) {
    this.pedigree.y += dy;
  }
  this.pedigree.x += dx;
  if (this.pedigree.x < -1) {
    this.pedigree.x = -1;
  }
  if (this.pedigree.x >= this.pedigree.data[this.pedigree.y].length) {
    this.pedigree.x = this.pedigree.data[this.pedigree.y].length - 1;
  }

  var element = this.getElement(this.pedigree.x, this.pedigree.y);
  element.tabIndex = 0;
  addClass(element, 'selected');
  element.focus();
};

pedigree.UI.prototype.addToolbarButton = function(name, imgClass, clickHandler) {
  var button = document.createElement('button');
  this.toolbar.appendChild(button);

  var img = document.createElement('div');
  img.className = 'img ' + imgClass;
  button.appendChild(img);

  var overlay = document.createElement('div');
  overlay.className = 'overlay ' + imgClass;
  img.appendChild(overlay);

  var img2 = document.createElement('div');
  img2.className = 'img2 ' + imgClass;
  button.appendChild(img2);

  var text = document.createElement('div');
  text.className = 'caption';
  text.innerHTML = name;
  button.appendChild(text);

  if (clickHandler) {
    addEventListenerWrap(button, 'click', this.executeCommand.bind(this, clickHandler), false);
  }
};

pedigree.UI.prototype.addToolbarSpacer = function() {
  var divider = document.createElement('div');
  divider.style.height = '20px';
  this.toolbar.appendChild(divider);
};

pedigree.UI.prototype.addMenu = function(title) {
  var menuTitle = document.createElement('div');
  menuTitle.innerHTML = title;
  menuTitle.className = 'menu_title';
  menuTitle.setAttribute('role', 'menuitem');
  menuTitle.tabIndex = 0;
  this.menuContainer.appendChild(menuTitle);

  var menuWrap = document.createElement('div');
  menuWrap.className = 'menu_wrap';
  menuWrap.style.visibility = 'hidden';
  menuTitle.appendChild(menuWrap);

  var menu = document.createElement('div');
  menu.className = 'menu';
  menu.setAttribute('role', 'menu');
  menuWrap.appendChild(menu);

  function openMenu() {
    console.log('Opening menu ' + title);
    menuTitle.className = 'menu_title open';
    menuWrap.style.visibility = 'visible';
    menuWrap.setAttribute('aria-hidden', 'false');
    menu.firstChild.focus();
  }

  function hideMenu() {
    menuWrap.style.visibility = 'hidden';
    menuWrap.setAttribute('aria-hidden', 'true');
    menuTitle.className = 'menu_title';
  }

  function closeMenu() {
    hideMenu();
    menuTitle.focus();    
  }

  function toggleMenu() {
    if (menuWrap.style.visibility == 'hidden')
      openMenu();
    else
      closeMenu();
  }


  addEventListenerWrap(menuTitle, 'keydown', (function(evt) {
    evt = evt || window.event;
    switch(evt.keyCode) {
      case 13:  // Enter
      case 32:  // Space
        toggleMenu();
        break;
      case 40:  // Down arrow
        openMenu();
        break;
      case 27:  // Escape
        if (menuWrap.style.visibility == 'hidden')
          this.navigate(0, 0);
        else
          closeMenu();
        break;
      case 37:  // Left arrow
        if (menuTitle.previousSibling)
          menuTitle.previousSibling.focus();
        break;
      case 39:  // Right arrow
        if (menuTitle.nextSibling)
          menuTitle.nextSibling.focus();
        break;
    }
  }).bind(this), false);

  addEventListenerWrap(menuTitle, 'click', function() {
    toggleMenu();
  }, false);

  function onFocusChange() {
    var e = document.activeElement;
    while (e) {
      if (e == menuTitle)
        break;
      e = e.parentElement;
    }
    if (e != menuTitle) {
      hideMenu();
    }
  }
  addEventListenerWrap(document, 'focus', function() {
    window.setTimeout(function() {
      onFocusChange();
    }, 0);
  }, true);
  addEventListenerWrap(document, 'focusout', function() {
    window.setTimeout(function() {
      onFocusChange();
    }, 0);
  }, true);

  return menu;
};

pedigree.UI.prototype.addMenuItem = function(menu, title, command) {
  var menuWrap = menu.parentElement;
  var menuTitle = menu.parentElement.parentElement;

  var menuItem = document.createElement('div');
  menuItem.innerHTML = title;
  menuItem.className = 'menu_item';
  menuItem.setAttribute('role', 'menuitem');
  menuItem.tabIndex = 0;
  menu.appendChild(menuItem);

  addEventListenerWrap(menuItem, 'keydown', (function(evt) {
    evt = evt || window.event;
    switch(evt.keyCode) {
      case 38:  // Up arrow
        if (menuItem.previousSibling)
          menuItem.previousSibling.focus();
        break;
      case 40:  // Down arrow
        if (menuItem.nextSibling)
          menuItem.nextSibling.focus();
        break;
      case 13:  // Enter
      case 32:  // Space
        this.executeCommand(command);
        break;
      default:
        return false;
    }
    cancelEventWrap(evt);
  }).bind(this), false);

  addEventListenerWrap(menuItem, 'click', (function(evt) {
    evt = evt || window.event;
    this.executeCommand(command);
    cancelEventWrap(evt);
  }).bind(this), false);
};

pedigree.UI.prototype.focusMenuBar = function() {
  this.fileMenu.parentElement.parentElement.focus();
};

pedigree.UI.prototype.buildInterface = function() {
  this.header = document.createElement('div');
  this.header.className = 'header';
  document.body.appendChild(this.header);

  this.appTitle = document.createElement('div');
  this.appTitle.className = 'app_title';
  this.appTitle.innerHTML = '<div>Pedigree Editor</div>';
  this.header.appendChild(this.appTitle);

  this.menuContainer = document.createElement('div');
  this.menuContainer.className = 'menu_container';
  this.menuContainer.setAttribute('role', 'menubar');
  this.header.appendChild(this.menuContainer);

  this.pedigreeTitle = document.createElement('div');
  this.pedigreeTitle.className = 'pedigree_title';
  this.pedigreeTitle.innerHTML = '<table><tr><td>Pedigree Title.</td></tr></table>';
  this.header.appendChild(this.pedigreeTitle);

  this.loginStatus = document.createElement('div');
  this.loginStatus.className = 'login_status';
  this.loginStatus.innerHTML = '<div><a href="#">Not signed in.</a></div>';
  this.header.appendChild(this.loginStatus);

  this.fileMenu = this.addMenu('File');
  this.editMenu = this.addMenu('Edit');
  this.pedigreeMenu = this.addMenu('Pedigree');
  this.viewMenu = this.addMenu('View');

  this.addMenuItem(this.fileMenu, 'New Pedigree...', this.promptForNewPedigree);
  this.addMenuItem(this.fileMenu, 'Set Title...', this.editPageTitle);
  this.addMenuItem(this.fileMenu, 'Open...');
  this.addMenuItem(this.fileMenu, 'Save', this.save);

  this.addMenuItem(this.editMenu, 'Undo', this.undo);
  this.addMenuItem(this.editMenu, 'Redo', this.redo);
  this.addMenuItem(this.editMenu, 'Delete person', this.deleteCurrentNode);
  this.addMenuItem(this.editMenu, 'Edit person\'s text', this.edit);
  this.addMenuItem(this.editMenu, 'Describe person', this.describe);
  this.addMenuItem(this.editMenu, 'Describe relation to proband', this.longDescribe);

  this.addMenuItem(this.pedigreeMenu, 'Insert row above', this.insertRowAtTop);
  this.addMenuItem(this.pedigreeMenu, 'Insert row below', this.insertRowAtBottom);
  this.addMenuItem(this.pedigreeMenu, 'Jump', this.jump);
  this.addMenuItem(this.pedigreeMenu, 'Describe entire pedgiree', this.describeAll);

  this.addMenuItem(this.viewMenu, 'Zoom...');

  this.toolbar = document.createElement('div');
  this.toolbar.className = 'toolbar';
  document.body.appendChild(this.toolbar);

  this.addToolbarButton('Male', 'male', this.addMale);
  this.addToolbarButton('Female', 'female', this.addFemale);
  this.addToolbarButton('No Gender', 'nogender', this.addNogender);
  this.addToolbarButton('Preg. Loss', 'pregloss', this.addPregloss);

  this.addToolbarSpacer();

  this.addToolbarButton('Union', 'union', this.union);
  this.addToolbarButton('Grab Child', 'grab', this.grabChild);

  this.addToolbarSpacer();

  this.addToolbarButton('Carrier', 'carrier', this.toggleCarrier);
  this.addToolbarButton('Affected', 'affected', this.toggleAffected);
  this.addToolbarButton('Dead', 'dead', this.toggleDead);
  this.addToolbarButton('Proband', 'proband', this.toggleProband);
  this.addToolbarButton('Twin', 'twin', this.toggleTwin);
  this.addToolbarButton('Pregnancy', 'pregnancy', this.togglePregnancy);

  var frame_wrapper = document.createElement('div');
  frame_wrapper.className = 'pedigree_frame_wrapper';
  document.body.appendChild(frame_wrapper);

  var frame = document.createElement('iframe');
  frame.name = 'Pedigree';
  frame.className = 'pedigree_frame';
  frame_wrapper.appendChild(frame);

  window.setTimeout((function() {
    this.innerDoc = frame.contentWindow.document;
    console.log('innerDoc: ' + this.innerDoc);
    console.log('innerDoc.body: ' + this.innerDoc.body);

    this.container = this.innerDoc.createElement('div');
    this.container.id = 'pedigree';
    this.container.className = 'pedigree';
    this.container.setAttribute('role', 'grid');
    this.container.setAttribute('aria-label', 'Pedigree');

    this.innerDoc.body.appendChild(this.container);

    console.log('New inner doc: ' + this.innerDoc.body.outerHTML);

    var style = this.innerDoc.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', 'pedigree.css');
    this.innerDoc.getElementsByTagName('head')[0].appendChild(style);

    var footer = document.createElement('div');
    footer.className = 'footer';
    footer.setAttribute('aria-live', 'polite');
    document.body.appendChild(footer);
    this.footer = footer;

    window.out = function(msg) {
      window.clearTimeout(window.lastFooterTimeoutId);
      window.setTimeout(function() {
        footer.innerHTML = msg;
        window.lastFooterTimeoutId = window.setTimeout(function() {
          footer.innerHTML = '';
        }, 5000);
      }, 100);
    };

    pedigree.restoreFocusFromDialog = (function() {
      try {
        this.getElement(this.pedigree.x, this.pedigree.y).focus();
      } catch (x) {
      }
    }.bind(this));
  }).bind(this), 0);
};
