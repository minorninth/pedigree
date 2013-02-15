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

pedigree.UI.prototype.replot = function() {
  this.container.innerHTML = '';
  this.pedigree.plot(this.innerDoc, this.container);
  this.navigate(0, 0);
};

pedigree.UI.prototype.edit = function(x, y) {
  var row = this.pedigree.data[y];
  var n = row[x];
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

pedigree.UI.prototype.promptInsertRowAtTop = function() {
  pedigree.yesNoDialog(
      'Insert new row at top?',
      'Yes',
      'No',
      null,
      (function() {
        // Yes.
        this.pedigree.insertNewRowAtTop();
        this.replot();
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

  this.pedigree.plot(this.innerDoc, this.container);

  var element = this.getElement(this.pedigree.x, this.pedigree.y);
  element.tabIndex = 0;
  element.classList.add('selected');
  element.focus();
};

pedigree.UI.prototype.run = function() {
  this.init();

  this.container.addEventListener('click', (function(evt) {
    if (pedigree.dialogOpen) {
      pedigree.closeDialog();
      return;
    }
    var t = evt.target;
    while (t) {
      if (t.hasAttribute('px') && t.hasAttribute('py')) {
        var newx = Math.floor(t.getAttribute('px'));
        var newy = Math.floor(t.getAttribute('py'));
        this.navigate(newx - this.pedigree.x, newy - this.pedigree.y);
        evt.stopPropagation();
        evt.preventDefault();
        break;
      }
      t = t.parentElement;
    }
  }).bind(this), false);
  this.container.addEventListener('keydown', (function(evt) {
    console.log('KEYDOWN ' + evt.keyCode);
    if (pedigree.dialogOpen) {
      return;
    }
    var handled = false;
    switch(evt.keyCode) {
      case 37:  // Left arrow
        this.navigate(-1, 0);
        handled = true;
        break;
      case 38:  // Up arrow
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
        handled = true;
        break;
      case 39:  // Right arrow
        this.navigate(1, 0);
        handled = true;
        break;
      case 40:  // Down arrow
        if (this.pedigree.data[this.pedigree.y + 1] == undefined) {
          this.pedigree.data[this.pedigree.y + 1] = [];
          this.replot();
        }
        this.navigate(0, 1);
        handled = true;
        break;
      case 8:  // Backspace
        this.pedigree.deletenode(this.pedigree.x, this.pedigree.y);
        this.replot();
        handled = true;
        break;
      case 13:  // Enter
        this.edit(this.pedigree.x, this.pedigree.y);
        handled = true;
        break;
    }
    if (handled) {
      evt.stopPropagation();
      evt.preventDefault();
    }
  }).bind(this), false);
  this.container.addEventListener('keypress', (function(evt) {
    if (pedigree.dialogOpen) {
      return;
    }
    console.log('KEYPRESS ' + evt.charCode);
    var handled = false;
    switch(evt.charCode) {
      case 'f'.charCodeAt(0):
        this.addFemale();
        handled = true;
        break;
      case 'm'.charCodeAt(0):
        this.addMale();
        handled = true;
        break;
      case 'U'.charCodeAt(0):
        this.addNogender();
        handled = true;
        break;
      case 'b'.charCodeAt(0):
        this.addPregloss();
        handled = true;
        break;
      case 'u'.charCodeAt(0):
        this.pedigree.union(this.pedigree.x, this.pedigree.y);
        this.replot();
        handled = true;
        break;
      case 'z'.charCodeAt(0):
        var undo_result = this.pedigree.undo();
        if (undo_result) {
          this.pedigree.x = undo_result.x;
          this.pedigree.y = undo_result.y;
          this.replot();
        }
        handled = true;
        break;
      case 'y'.charCodeAt(0):
        var redo_result = this.pedigree.redo();
        if (redo_result) {
          this.pedigree.x = redo_result.x;
          this.pedigree.y = redo_result.y;
          this.replot();
        }
        handled = true;
        break;
      case 'g'.charCodeAt(0):
        this.pedigree.grabchild(this.pedigree.x, this.pedigree.y);
        handled = true;
        break;
      case 'x'.charCodeAt(0):
        this.toggleProband();
        handled = true;
        break;
      case 'c'.charCodeAt(0):
        this.toggleCarrier();
        handled = true;
        break;
      case 'a'.charCodeAt(0):
        this.toggleAffected();
        handled = true;
        break;
      case 'T'.charCodeAt(0):
        this.toggleTwin();
        handled = true;
        break;
      case 'P'.charCodeAt(0):
        this.togglePregnancy();
        handled = true;
        break;
      case 'N'.charCodeAt(0):
        if (this.pedigree.x >= 0 && this.pedigree.x < this.pedigree.data[this.pedigree.y].length) {
          var row = this.pedigree.data[this.pedigree.y];
          row[this.pedigree.x].multiple = 10;
          this.pedigree.push('setting ' + this.posStr() + ' to n people');
          this.replot();
        }
        handled = true;
        break;
      case 'k'.charCodeAt(0):
        this.toggleDead();
        handled = true;
        break;
      case 'L'.charCodeAt(0):
        pedigree.messageDialog(
            this.pedigree.longdescribe(this.pedigree.x, this.pedigree.y));
        handled = true;
        break;
      case 'd'.charCodeAt(0):
        pedigree.messageDialog(
            this.pedigree.describe(this.pedigree.x, this.pedigree.y));
        break;
      case 'w'.charCodeAt(0):
        pedigree.messageDialog(
            this.pedigree.describe_all());
        break;
      case 't'.charCodeAt(0):
        this.editPageTitle();
        break;

      case 'j'.charCodeAt(0):
        this.jump();
        break;

      case 'n'.charCodeAt(0):
        this.promptForNewPedigree();
        break;

      case 'p'.charCodeAt(0):
        this.parents();
        break;

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
      evt.stopPropagation();
      evt.preventDefault();
    }
  }).bind(this), false);
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
    element.classList.remove('selected');
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
  element.classList.add('selected');
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
  text.innerText = name;
  button.appendChild(text);

  if (clickHandler) {
    button.addEventListener('click', clickHandler.bind(this), false);
  }
};

pedigree.UI.prototype.addToolbarSpacer = function() {
  var divider = document.createElement('div');
  divider.style.height = '20px';
  this.toolbar.appendChild(divider);
};

pedigree.UI.prototype.buildInterface = function() {
  this.header = document.createElement('div');
  this.header.className = 'header';
  this.header.innerText = 'Header';
  document.body.appendChild(this.header);

  this.toolbar = document.createElement('div');
  this.toolbar.className = 'toolbar';
  document.body.appendChild(this.toolbar);

  this.addToolbarButton('Male', 'male', this.addMale);
  this.addToolbarButton('Female', 'female', this.addFemale);
  this.addToolbarButton('No Gender', 'nogender', this.addNogender);
  this.addToolbarButton('Preg. Loss', 'pregloss', this.addPregloss);

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

  this.innerDoc = frame.contentWindow.document;

  this.container = this.innerDoc.createElement('div');
  this.container.id = 'pedigree';
  this.container.className = 'pedigree';
  this.container.setAttribute('role', 'grid');
  this.container.setAttribute('aria-label', 'Pedigree');

  this.innerDoc.body.appendChild(this.container);

  var style = this.innerDoc.createElement('link');
  style.setAttribute('rel', 'stylesheet');
  style.setAttribute('href', 'pedigree.css');
  this.innerDoc.head.appendChild(style);

  this.footer = document.createElement('div');
  this.footer.className = 'footer';
  this.footer.innerText = 'Footer';
  document.body.appendChild(this.footer);

  pedigree.restoreFocusFromDialog = (function() {
    try {
      this.getElement(this.pedigree.x, this.pedigree.y).focus();
    } catch (x) {
    }
  }.bind(this));
};
