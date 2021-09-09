//
// Common dialog globals
//

var dialogs = {};

dialogs.dialogOpen = null;
dialogs.dialogFocusListener = null;
dialogs.dialogKeydownListener = null;
dialogs.restoreFocusFromDialog = null;

//
// Common dialog methods
//

dialogs.createDialog = function() {
    var dialog = document.createElement('dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', 'dialogtitle');
    dialog.className = 'dialog';
    document.body.appendChild(dialog);
    dialogs.dialogOpen = dialog;
    return dialog;
};

dialogs.addCloseButton = function(parent, title) {
    var button = document.createElement('button');
    button.innerHTML = title;
    button.addEventListener('click', function() {
        dialogs.closeDialog();
    });
    parent.appendChild(button);
    return button;
};

dialogs.trapFocusInDialog = function(dialog, firstControl, lastControl) {
    dialogs.dialogFocusListener = function() {
        window.setTimeout(function() {
            if (!dialogs.dialogOpen) {
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
    document.addEventListener('focus', dialogs.dialogFocusListener, true);
    document.addEventListener('blur', dialogs.dialogFocusListener, true);
    document.addEventListener('focusout', dialogs.dialogFocusListener, true);

    var sentinel = document.createElement('div');
    sentinel.tabIndex = 0;
    sentinel.style.position = 'relative';
    sentinel.style.left = '-9999px';

    sentinel.addEventListener('focus', function() {
        lastControl.focus();
    });
    dialog.appendChild(sentinel);
};

dialogs.addStandardDialogKeydownHandler = function() {
    dialogs.dialogKeydownListener = function(evt) {
        if (!dialogs.dialogOpen) {
            return;
        }
        if (evt.keyCode == 27) { // Escape
            dialogs.closeDialog();
            return;
        }
        var text = dialogs.dialogOpen.querySelectorAll('input,textarea');
        if (text.length) {
            return;
        }
        var buttons = dialogs.dialogOpen.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            console.log('Button ' + i + ': ' + buttons[i].innerHTML.charCodeAt(0));
            if (evt.keyCode == buttons[i].innerHTML.charCodeAt(0)) {
                buttons[i].click();
            }
        }
    };
    window.addEventListener('keydown', dialogs.dialogKeydownListener, true);
};

dialogs.closeDialog = function() {
    console.log('CLOSE');
    if (!dialogs.dialogOpen) {
        return;
    }

    dialogs.dialogOpen.parentElement.removeChild(dialogs.dialogOpen);
    window.removeEventListener('focus', dialogs.dialogFocusListener, true);
    window.removeEventListener('blur', dialogs.dialogFocusListener, true);
    window.removeEventListener('keydown', dialogs.dialogKeydownListener, true);

    dialogs.dialogOpen = null;

    if (dialogs.restoreFocusFromDialog) {
        dialogs.restoreFocusFromDialog();
    }
};

//
// Specific dialogs
//

dialogs.textareaDialog = function(
    question, initialText, callback) {
    var dialog = dialogs.createDialog();

    var textLabel = document.createElement('label');
    dialog.appendChild(textLabel);

    var textDiv = document.createElement('div');
    textDiv.id = 'dialogtitle';
    textDiv.innerHTML = question;
    textLabel.appendChild(textDiv);

    var textarea = document.createElement('textarea');
    textarea.setAttribute('rows', '5');
    textarea.value = initialText;
    textarea.addEventListener('keydown', function(evt) {
        if (evt.keyCode == 13) {
            var result = textarea.value;
            dialogs.closeDialog();
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
        dialogs.closeDialog();
        callback(result);
    });
    buttonRow.appendChild(ok);

    var cancel = dialogs.addCloseButton(buttonRow, 'Cancel');

    dialogs.trapFocusInDialog(dialog, textarea, cancel);
    dialogs.addStandardDialogKeydownHandler();

    dialog.style.display = 'block';

    window.setTimeout(function() {
        textarea.focus();
    }, 0);
};

dialogs.coordinatesDialog = function(
    question, validate, callback) {
    var dialog = dialogs.createDialog();

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
            dialogs.closeDialog();
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
        dialogs.closeDialog();
        if (result && validate(result)) {
            callback(result);
        }
    });
    buttonRow.appendChild(ok);

    var cancel = dialogs.addCloseButton(buttonRow, 'Cancel');

    dialogs.trapFocusInDialog(dialog, textbox, cancel);
    dialogs.addStandardDialogKeydownHandler();

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

dialogs.loadDialog = function(recents, callback) {
    var dialog = dialogs.createDialog();

    var dialogTitle = document.createElement('h2');
    dialogTitle.innerText = 'Load Pedigree';
    dialogTitle.id = 'dialogtitle';
    dialog.appendChild(dialogTitle);

    var textLabel = document.createElement('label');
    dialog.appendChild(textLabel);

    var textDiv = document.createElement('div');
    textDiv.innerHTML = 'Choose a file from disk';
    textLabel.appendChild(textDiv);

    var picker = document.createElement('input');
    picker.type = 'file';
    picker.addEventListener('keydown', function(evt) {

    });
    textLabel.appendChild(picker);

    var select;
    if (recents && recents.length) {
        var selectLabel = document.createElement('label');
        dialog.appendChild(selectLabel);

        var textDiv = document.createElement('div');
        textDiv.innerHTML = 'Or choose a recent pedigree';
        selectLabel.appendChild(textDiv);

        select = document.createElement('select');
        select.size = recents.length;
        for (let i = 0; i < recents.length; i++) {
            let o = document.createElement('option');
            o.value = recents[i].key;
            o.innerText = recents[i].name;
            select.appendChild(o);
        }
        selectLabel.appendChild(select);
    }

    var buttonRow = document.createElement('div');
    dialog.appendChild(buttonRow);

    var ok = document.createElement('button');
    ok.innerHTML = 'OK';
    ok.addEventListener('click', function() {
        dialogs.closeDialog();

        if (select && select.selectedIndex >= 0) {
            let key = select.value;
            let item = JSON.parse(localStorage.getItem(key));
            callback(item.name, JSON.stringify(item.data, null, 4));
        } else {
            let files = picker.files;
            let f = files[0];
            let name = f.name.split('.')[0];
            let reader = new FileReader();
            reader.onload = function(event) {
                callback(name, event.target.result);
            };
            reader.readAsText(f);
        }
    });
    buttonRow.appendChild(ok);

    var cancel = dialogs.addCloseButton(buttonRow, 'Cancel');

    dialogs.trapFocusInDialog(dialog, picker, cancel);
    dialogs.addStandardDialogKeydownHandler();

    ok.disabled = true;

    function update() {
        window.setTimeout(function() {
            ok.disabled = !picker.value && (!select || select.selectedIndex == -1);
            if (picker.value && select) {
                select.selectedIndex = -1;
            }
        }, 0);
    }

    picker.addEventListener('change', update);

    if (select) {
        select.addEventListener('change', update);
    }

    dialog.style.display = 'block';

    window.setTimeout(function() {
        picker.focus();
    }, 0);
};

dialogs.messageDialog = function(message) {
    var dialog = dialogs.createDialog();

    var textDiv = document.createElement('h2');
    textDiv.id = 'dialogtitle';
    textDiv.innerHTML = message;
    dialog.appendChild(textDiv);

    var buttonRow = document.createElement('div');
    dialog.appendChild(buttonRow);

    var ok = dialogs.addCloseButton(buttonRow, 'OK');

    dialogs.trapFocusInDialog(dialog, ok, ok);
    dialogs.addStandardDialogKeydownHandler();

    dialog.style.display = 'block';

    window.setTimeout(function() {
        ok.focus();
    }, 0);
};

dialogs.yesNoDialog = function(
    question,
    yesText, noText, maybeText,
    yesCallback, noCallback, maybeCallback) {
    var dialog = dialogs.createDialog();

    var textDiv = document.createElement('h2');
    textDiv.id = 'dialogtitle';
    textDiv.innerHTML = question;
    dialog.appendChild(textDiv);

    var buttonRow = document.createElement('div');
    dialog.appendChild(buttonRow);

    var yes = document.createElement('button');
    yes.innerHTML = yesText;
    yes.addEventListener('click', function() {
        dialogs.closeDialog();
        yesCallback();
    });
    buttonRow.appendChild(yes);

    var no = document.createElement('button');
    no.innerHTML = noText;
    no.addEventListener('click', function() {
        dialogs.closeDialog();
        noCallback();
    });
    buttonRow.appendChild(no);

    if (maybeText) {
        var maybe = document.createElement('button');
        maybe.innerHTML = maybeText;
        maybe.addEventListener('click', function() {
            dialogs.closeDialog();
            maybeCallback();
        });
        buttonRow.appendChild(maybe);
    }

    dialogs.trapFocusInDialog(dialog, yes, maybe ? maybe : no);
    dialogs.addStandardDialogKeydownHandler();

    dialog.style.display = 'block';

    window.setTimeout(function() {
        yes.focus();
    }, 0);
};

export default dialogs;