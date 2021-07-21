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
  button.innerHTML = title;
  button.addEventListener('click', function() {
    pedigree.closeDialog();
  });
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
      if (!inDialog) {
        firstControl.focus();
      }
    }, 0);
  };
  document.addEventListener('focus', pedigree.dialogFocusListener, true);
  document.addEventListener('blur', pedigree.dialogFocusListener, true);
  document.addEventListener('focusout', pedigree.dialogFocusListener, true);

  var sentinel = document.createElement('div');
  sentinel.tabIndex = 0;
  sentinel.style.position = 'relative';
  sentinel.style.left = '-9999px';

  sentinel.addEventListener('focus', function() {
    lastControl.focus();
  });
  dialog.appendChild(sentinel);
};

pedigree.addStandardDialogKeydownHandler = function() {
  pedigree.dialogKeydownListener = function(evt) {
    if (!pedigree.dialogOpen) {
      return;
    }
    if (evt.keyCode == 27) { // Escape
      pedigree.closeDialog();
      return;
    }
    var text = pedigree.dialogOpen.querySelectorAll('input,textarea');
    if (text.length) {
      return;
    }
    var buttons = pedigree.dialogOpen.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      console.log('Button ' + i + ': ' + buttons[i].innerHTML.charCodeAt(0));
      if (evt.keyCode == buttons[i].innerHTML.charCodeAt(0)) {
        buttons[i].click();
      }
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
  textDiv.innerHTML = question;
  textLabel.appendChild(textDiv);

  var textarea = document.createElement('textarea');
  textarea.setAttribute('rows', '5');
  textarea.value = initialText;
  textarea.addEventListener('keydown', function(evt) {
    if (evt.keyCode == 13) {
      var result = textarea.value;
      pedigree.closeDialog();
      callback(result);
      evt.stopPropagation();
      evt.preventDefault();
    }
  });
  textLabel.appendChild(textarea);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = document.createElement('button');
  ok.innerHTML = 'OK';
  ok.addEventListener('click', function() {
    var result = textarea.value;
    pedigree.closeDialog();
    callback(result);
  });
  buttonRow.appendChild(ok);

  var cancel = pedigree.addCloseButton(buttonRow, 'Cancel');

  pedigree.trapFocusInDialog(dialog, textarea, cancel);
  pedigree.addStandardDialogKeydownHandler();

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
  textDiv.innerHTML = question;
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
  });
  textLabel.appendChild(textbox);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = document.createElement('button');
  ok.innerHTML = 'OK';
  ok.addEventListener('click', function() {
    var result = parseValue(textbox.value);
    pedigree.closeDialog();
    if (result && validate(result)) {
      callback(result);
    }
  });
  buttonRow.appendChild(ok);

  var cancel = pedigree.addCloseButton(buttonRow, 'Cancel');

  pedigree.trapFocusInDialog(dialog, textbox, cancel);
  pedigree.addStandardDialogKeydownHandler();

  var result = parseValue(textbox.value);
  ok.disabled = !result || !validate(result);

  textbox.addEventListener('keydown', function(evt) {
    window.setTimeout(function() {
      var result = parseValue(textbox.value);
      ok.disabled = !result || !validate(result);
    }, 0);
  });

  dialog.style.display = 'block';

  window.setTimeout(function() {
    textbox.focus();
  }, 0);
};

pedigree.loadDialog = function(callback) {
  var dialog = pedigree.createDialog();

  var textLabel = document.createElement('label');
  dialog.appendChild(textLabel);

  var textDiv = document.createElement('div');
  textDiv.innerHTML = 'Choose a pedigree file to load';
  textLabel.appendChild(textDiv);

  var picker = document.createElement('input');
  picker.type = 'file';
  picker.addEventListener('keydown', function(evt) {

  });
  textLabel.appendChild(picker);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = document.createElement('button');
  ok.innerHTML = 'OK';
  ok.addEventListener('click', function() {
    pedigree.closeDialog();
    let files = picker.files;
    let filename = files[0];
    let reader = new FileReader();
    reader.onload = function(event) {
      callback(event.target.result);
    };
    reader.readAsText(filename);
  });
  buttonRow.appendChild(ok);

  var cancel = pedigree.addCloseButton(buttonRow, 'Cancel');

  pedigree.trapFocusInDialog(dialog, picker, cancel);
  pedigree.addStandardDialogKeydownHandler();

  ok.disabled = true;

  picker.addEventListener('change', function(evt) {
    window.setTimeout(function() {
      var result = picker.value;
      ok.disabled = !result;
    }, 0);
  });

  dialog.style.display = 'block';

  window.setTimeout(function() {
    picker.focus();
  }, 0);
};

pedigree.messageDialog = function(message) {
  var dialog = pedigree.createDialog();

  var textDiv = document.createElement('h2');
  textDiv.innerHTML = message;
  dialog.appendChild(textDiv);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var ok = pedigree.addCloseButton(buttonRow, 'OK');

  pedigree.trapFocusInDialog(dialog, ok, ok);
  pedigree.addStandardDialogKeydownHandler();

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
  textDiv.innerHTML = question;
  dialog.appendChild(textDiv);

  var buttonRow = document.createElement('div');
  dialog.appendChild(buttonRow);

  var yes = document.createElement('button');
  yes.innerHTML = yesText;
  yes.addEventListener('click', function() {
    pedigree.closeDialog();
    yesCallback();
  });
  buttonRow.appendChild(yes);

  var no = document.createElement('button');
  no.innerHTML = noText;
  no.addEventListener('click', function() {
    pedigree.closeDialog();
    noCallback();
  });
  buttonRow.appendChild(no);

  if (maybeText) {
    var maybe = document.createElement('button');
    maybe.innerHTML = maybeText;
    maybe.addEventListener('click', function() {
      pedigree.closeDialog();
      maybeCallback();
    });
    buttonRow.appendChild(maybe);
  }

  pedigree.trapFocusInDialog(dialog, yes, maybe ? maybe : no);
  pedigree.addStandardDialogKeydownHandler();

  dialog.style.display = 'block';

  window.setTimeout(function() {
    yes.focus();
  }, 0);
};

