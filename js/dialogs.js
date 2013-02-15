//
// Common dialog globals
//

pedigree.dialogOpen = null;
pedigree.dialogFocusListener = null;
pedigree.dialogKeydownListener = null;
pedigree.restoreFocusFromDialog = null;

//
// Common dialog methods
//

pedigree.createDialog = function() {
  var dialog = document.createElement('dialog');
  dialog.setAttribute('role', 'alertdialog');
  dialog.className = 'dialog';
  document.body.appendChild(dialog);
  pedigree.dialogOpen = dialog;
  return dialog;
};

pedigree.addCloseButton = function(parent, title) {
  var button = document.createElement('button');
  button.innerText = title;
  button.addEventListener('click', function() {
    pedigree.closeDialog();
  }, false);
  parent.appendChild(button);
  return button;    
};

pedigree.trapFocusInDialog = function(dialog, firstControl, lastControl) {
  pedigree.dialogFocusListener = function() {
    window.setTimeout(function() {
      if (!pedigree.dialogOpen) {
        return;
      }

      var inDialog = false;
      var t = document.activeElement;
      console.log('target: ' + t);
      while (t && !inDialog) {
        if (t == dialog) {
          inDialog = true;
        }
        t = t.parentElement;
      }
      console.log('Focus listener: inDialog=' + inDialog);
      if (!inDialog) {
        firstControl.focus();
      }
    }, 0);
  };
  document.addEventListener('focus', pedigree.dialogFocusListener, true);
  document.addEventListener('blur', pedigree.dialogFocusListener, true);

  var sentinel = document.createElement('div');
  sentinel.tabIndex = 0;
  sentinel.style.position = 'relative';
  sentinel.style.left = '-9999px';
  sentinel.addEventListener('focus', function() {
    lastControl.focus();
  }, false);
  dialog.appendChild(sentinel);
};

pedigree.closeDialogOnEscape = function() {
  pedigree.dialogKeydownListener = function(evt) {
    if (evt.keyCode == 27) { // Escape
      pedigree.closeDialog();
    }
  };
  window.addEventListener('keydown', pedigree.dialogKeydownListener, true);
};

pedigree.closeDialog = function() {
  console.log('CLOSE');
  if (!pedigree.dialogOpen) {
    return;
  }

  pedigree.dialogOpen.parentElement.removeChild(pedigree.dialogOpen);
  window.removeEventListener('focus', pedigree.dialogFocusListener, true);
  window.removeEventListener('blur', pedigree.dialogFocusListener, true);
  window.removeEventListener('keydown', pedigree.dialogKeydownListener, true);

  pedigree.dialogOpen = null;

  if (pedigree.restoreFocusFromDialog) {
    pedigree.restoreFocusFromDialog();
  }
};

//
// Specific dialogs
//

pedigree.textareaDialog = function(
    question, initialText, callback) {
  var dialog = pedigree.createDialog();

  var textLabel = document.createElement('label');
  dialog.appendChild(textLabel);

  var textDiv = document.createElement('div');
  textDiv.innerText = question;
  textLabel.appendChild(textDiv);

  var textarea = document.createElement('textarea');
  textarea.value = initialText;
  textarea.addEventListener('keydown', function(evt) {
    if (evt.keyCode == 13) {
      var result = textarea.value;
      pedigree.closeDialog();
      callback(result);
      evt.stopPropagation();
      evt.preventDefault();
    }
  }, false);
  textLabel.appendChild(textarea);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = document.createElement('button');
  ok.innerText = 'OK';
  ok.addEventListener('click', function() {
    var result = textarea.value;
    pedigree.closeDialog();
    callback(result);
  }, false);
  buttonRow.appendChild(ok);

  var cancel = pedigree.addCloseButton(buttonRow, 'Cancel');

  pedigree.trapFocusInDialog(dialog, textarea, cancel);
  pedigree.closeDialogOnEscape();

  dialog.style.display = 'block';

  window.setTimeout(function() {
    textarea.focus();
  }, 0);
};

pedigree.coordinatesDialog = function(
    question, validate, callback) {
  var dialog = pedigree.createDialog();

  var textLabel = document.createElement('label');
  dialog.appendChild(textLabel);

  var textDiv = document.createElement('div');
  textDiv.innerText = question;
  textLabel.appendChild(textDiv);

  function parseValue(str) {
    str = str.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    var tokens;
    if (str.indexOf(',') > 0)
      tokens = str.split(',');
    else
      tokens = str.split(' ');
    if (tokens.length != 2) {
      return null;
    }
    try {
      var y = parseInt(tokens[0], 10);
      var x = parseInt(tokens[1], 10);
      if (x >= 1 && y >= 1)
        return [x - 1, y];
      else
        return null;
    } catch (x) {
      return null;
    }
  }

  var textbox = document.createElement('input');
  textbox.type = 'text';
  textbox.addEventListener('keydown', function(evt) {
    if (evt.keyCode == 13) {
      var result = parseValue(textbox.value);
      pedigree.closeDialog();
      if (result && validate(result)) {
        callback(result);
      }
    }
  }, false);
  textLabel.appendChild(textbox);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = document.createElement('button');
  ok.innerText = 'OK';
  ok.addEventListener('click', function() {
    var result = parseValue(textbox.value);
    pedigree.closeDialog();
    if (result && validate(result)) {
      callback(result);
    }
  }, false);
  buttonRow.appendChild(ok);

  var cancel = pedigree.addCloseButton(buttonRow, 'Cancel');

  pedigree.trapFocusInDialog(dialog, textbox, cancel);
  pedigree.closeDialogOnEscape();

  var result = parseValue(textbox.value);
  ok.disabled = !result || !validate(result);

  textbox.addEventListener('keydown', function(evt) {
    window.setTimeout(function() {
      var result = parseValue(textbox.value);
      ok.disabled = !result || !validate(result);
    }, 0);
  }, false);

  dialog.style.display = 'block';

  window.setTimeout(function() {
    textbox.focus();
  }, 0);
};

pedigree.messageDialog = function(message) {
  var dialog = pedigree.createDialog();

  var textDiv = document.createElement('h2');
  textDiv.innerText = message;
  dialog.appendChild(textDiv);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = pedigree.addCloseButton(buttonRow, 'OK');

  pedigree.trapFocusInDialog(dialog, ok, ok);
  pedigree.closeDialogOnEscape();

  dialog.style.display = 'block';

  window.setTimeout(function() {
    ok.focus();
  }, 0);
};

pedigree.yesNoDialog = function(
    question,
    yesText, noText, maybeText,
    yesCallback, noCallback, maybeCallback) {
  var dialog = pedigree.createDialog();

  var textDiv = document.createElement('h2');
  textDiv.innerText = question;
  dialog.appendChild(textDiv);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var yes = document.createElement('button');
  yes.innerText = yesText;
  yes.addEventListener('click', function() {
    pedigree.closeDialog();
    yesCallback();
  }, false);
  buttonRow.appendChild(yes);

  var no = document.createElement('button');
  no.innerText = noText;
  no.addEventListener('click', function() {
    pedigree.closeDialog();
    noCallback();
  }, false);
  buttonRow.appendChild(no);

  if (maybeText) {
    var maybe = document.createElement('button');
    maybe.innerText = maybeText;
    maybe.addEventListener('click', function() {
      pedigree.closeDialog();
      maybeCallback();
    }, false);
    buttonRow.appendChild(maybe);
  }

  pedigree.trapFocusInDialog(dialog, yes, maybe ? maybe : no);
  pedigree.closeDialogOnEscape();

  dialog.style.display = 'block';

  window.setTimeout(function() {
    yes.focus();
  }, 0);
};

