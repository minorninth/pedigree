import "./pedigree_button.js"
import "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js";
import pedigree from "./pedigree.js"
import dialogs from "./dialogs.js"

Vue.component("pedigree-ui", {
    template: `
    <div>
      <div class="header">
        <div class="app_title">
          <div id="filename">Pedigree Editor</div>
        </div>
        <div id="menu_container" role="menubar"/>
      </div>
      <div class="toolbar">
        <div style="height: 172px;">
          <pedigree-button buttontype="male" caption="Male" shortcut="M" v-on:click="male()"/>
          <pedigree-button buttontype="female" caption="Female" shortcut="F" v-on:click="female()"/>
          <pedigree-button buttontype="nogender" caption="No Gender" shortcut="Shift+U" v-on:click="nogender()"/>
          <pedigree-button buttontype="pregloss" caption="Preg. Loss" shortcut="B"  v-on:click="pregloss()"/>
        </div>
        <div style="height: 96px;">
          <pedigree-button buttontype="union" caption="Union" shortcut="U" v-on:click="union()"/>
          <pedigree-button buttontype="grab" caption="Grab Child" shortcut="G" v-on:click="grab()"/>
        </div>
        <div style="height: 224px;">
          <pedigree-button buttontype="carrier" caption="Carrier" shortcut="C" v-on:click="carrier()"/>
          <pedigree-button buttontype="affected" caption="Affected" shortcut="A" v-on:click="affected()"/>
          <pedigree-button buttontype="dead" caption="Dead" shortcut="K" v-on:click="dead()"/>
          <pedigree-button buttontype="proband" caption="Proband" shortcut="X" v-on:click="proband()"/>
          <pedigree-button buttontype="twin" caption="Twin" shortcut="Shift+T" v-on:click="twin()"/>
          <pedigree-button buttontype="pregnancy" caption="Pregnancy" shortcut="Shift+P" v-on:click="pregnancy()"/>
        </div>
        <div class="tip">
          Hold Shift to learn keyboard shortcuts.
        </div>
      </div>
      <div id="pedigree"></div>
      <div id="footer" aria-live="polite"></div>
    </div>
  `,
    mounted() {
        this.pedigree = new pedigree.Pedigree();
        this.buildInterface();
        setTimeout(() => {
            this.run();
        }, 0);
    },
    methods: {
        male: function() {
            this.addMale();
        },
        female: function() {
            this.addFemale();
        },
        nogender: function() {
            this.addNogender();
        },
        pregloss: function() {
            this.addPregloss();
        },
        union: function() {
            this.union();
        },
        grab: function() {
            this.grabChild();
        },
        carrier: function() {
            this.toggleCarrier();
        },
        affected: function() {
            this.toggleAffected();
        },
        dead: function() {
            this.toggleDead();
        },
        proband: function() {
            this.toggleProband();
        },
        twin: function() {
            this.toggleTwin();
        },
        pregnancy: function() {
            this.togglePregnancy();
        },
        posStr: function(opt_x, opt_y) {
            if (opt_x != undefined && opt_y != undefined)
                return opt_y + " " + (opt_x + 1);
            else return this.pedigree.y + " " + (this.pedigree.x + 1);
        },
        recover: function() {
            if (this.pedigree.undo_history.length - 1 > this.beforeCommandUndoIndex) {
                console.log("WILL UNDO to recover");
                this.pedigree.undo();
            } else {
                console.log("WILL LOAD TOP OF STACK to recover");
                this.pedigree.loadstate(
                    this.pedigree.undo_history[this.beforeCommandUndoIndex]
                );
            }
            this.pedigree.x = this.beforeCommandX;
            this.pedigree.y = this.beforeCommandY;
            this.container.innerHTML = "";
            this.pedigree.plot();
            this.pedigree.renderHtml(document, this.container);
            this.navigate(0, 0);
        },
        replot: function() {
            try {
                this.container.innerHTML = "";
                this.pedigree.plot();
                this.pedigree.renderHtml(document, this.container);
                this.navigate(0, 0);
            } catch (e) {
                console.log("Replot recover because " + e.message);
                this.recover();
                if (e.message) {
                    dialogs.messageDialog(e.message);
                } else {
                    throw e;
                }
            }
        },
        edit: function() {
            var x = this.pedigree.x;
            var y = this.pedigree.y;
            var row = this.pedigree.data[y];
            var n = row[x];

            if (x == -1) return;

            dialogs.textareaDialog(
                "Enter a new description for " + this.posStr(x, y),
                n.label,
                (result) => {
                    if (result != null) {
                        n.label = result;
                        this.pedigree.push("changing description of " + this.posStr(x, y));
                        this.replot();
                    }
                }
            );
        },
        editPageTitle: function() {
            dialogs.textareaDialog(
                "Enter the text to go at the top of the page.",
                this.pedigree.text,
                (result) => {
                    if (result != null) {
                        this.pedigree.text = result;
                        this.pedigree.push("changing text at top of page");
                        this.replot();
                    }
                }
            );
        },
        setFilename: function(filename) {
            this.filename = filename;
            if (filename) {
                document.getElementById('filename').innerText = filename;
            } else {
                document.getElementById('filename').innerText = "Untitled";
            }
        },
        ensureFilename: function(completion) {
            if (this.filename) {
                completion();
                return;
            }
            dialogs.textareaDialog(
                "Enter a filename for this pedigree.",
                '',
                (result) => {
                    if (result != null) {
                        this.setFilename(result);
                        completion();
                    }
                }
            );
        },
        exportPdf: function() {
            this.ensureFilename(() => {
                let filename = this.filename + '.pdf';
                out('Saving ' + filename);
                this.pedigree.renderPdf(filename);
            });
        },
        save: function() {
            this.ensureFilename(() => {
                let filename = this.filename + '.json';
                out('Saving ' + filename);
                this.pedigree.save(filename);
            });
        },
        load: function() {
            let recents = [];
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                if (key == this.pedigree.storageKey) {
                    continue;
                }

                let item = JSON.parse(localStorage.getItem(key));
                if (item.type == 'pedigree' && item.data && item.data.data['1'].length) {
                    recents.push({ key: key, name: item.name, time: item.time });
                }
            }
            recents.sort((a, b) => (a.time > b.time) ? -1 : 1);

            dialogs.loadDialog(recents, (filename, result) => {
                this.setFilename(filename);
                let newdata = JSON.parse(result);
                this.pedigree = new pedigree.Pedigree();
                for (let rowindex in newdata.data) {
                    let cells = [];
                    for (let j = 0; j < newdata.data[rowindex].length; j++) {
                        cells.push(new pedigree.Node(newdata.data[rowindex][j]));
                    }
                    this.pedigree.data[rowindex] = cells;
                }
                this.pedigree.unions = newdata.unions;
                this.pedigree.text = newdata.text;
                this.pedigree.y = 1;
                this.pedigree.x = -1;
                this.pedigree.setName(filename);

                this.container.innerHTML = "";
                this.replot();
            });
        },
        validateCoords: function(coords) {
            var x = coords[0];
            var y = coords[1];
            return this.pedigree.data[y] && this.pedigree.data[y][x];
        },
        jump: function() {
            dialogs.coordinatesDialog(
                'Enter the coordinates to jump to, of the form "3 2", separated by a comma or space.',
                this.validateCoords.bind(this),
                (result) => {
                    var x = result[0];
                    var y = result[1];
                    this.navigate(x - this.pedigree.x, y - this.pedigree.y);
                }
            );
        },
        createNewPedigree: function() {
            this.pedigree = new pedigree.Pedigree();
            this.container.innerHTML = "";
            this.setFilename(null);
            this.init();
        },
        promptForNewPedigree: function() {
            if (!this.pedigree.dirty) {
                this.createNewPedigree();
                return;
            }
            dialogs.yesNoDialog(
                "Clear this pedigree and start a new one?",
                "Start New Pedigree",
                "Cancel",
                null,
                () => {
                    // Yes.
                    this.createNewPedigree();
                },
                () => {
                    // No: do nothing.
                },
                null
            );
        },
        setParents: function(numParents, fx, fy, mx, my) {
            var x = this.pedigree.x;
            var y = this.pedigree.y;
            this.prevParents = [numParents, fx, fy, mx, my];
            this.pedigree.data[y][x].parents = [fx, fy, mx, my];
            this.pedigree.push("adding parents of " + this.posStr(x, y));
            this.replot();
        },
        handleOneParent: function() {
            dialogs.coordinatesDialog(
                "Specify the parent of " + this.posStr(),
                this.validateCoords.bind(this),
                (result) => {
                    var x = result[0];
                    var y = result[1];
                    this.setParents(1, x, y, null, null);
                }
            );
        },
        handleSecondOfTwoParents: function(fx, fy) {
            dialogs.coordinatesDialog(
                "Now please specify the mother of " + this.posStr() + ".",
                this.validateCoords.bind(this),
                (result) => {
                    var mx = result[0];
                    var my = result[1];
                    var m = this.pedigree.data[my][mx];
                    if (m.gender != "female") {
                        dialogs.messageDialog(this.posStr(mx, my) + " is not female.");
                        return;
                    }

                    this.setParents(2, fx, fy, mx, my);
                }
            );
        },
        gotFirstOfTwoParents: function(fx, fy) {
            for (var i = 0; i < this.pedigree.unions.length; i++) {
                var ux1 = this.pedigree.unions[i][0];
                var uy1 = this.pedigree.unions[i][1];
                var ux2 = this.pedigree.unions[i][2];
                var uy2 = this.pedigree.unions[i][3];
                if (ux1 == fx && uy1 == fy) {
                    dialogs.yesNoDialog(
                        "Is " + this.posStr(ux2, uy2) + " the mother?",
                        "Yes",
                        "No",
                        "Cancel",
                        () => {
                            // Yes.
                            this.setParents(2, ux1, uy1, ux2, uy2);
                        },
                        () => {
                            // No.
                            this.handleSecondOfTwoParents(fx, fy);
                        },
                        () => {
                            // Cancel.
                        }
                    );
                    return;
                } else if (ux2 == fx && uy2 == fy) {
                    dialogs.yesNoDialog(
                        "Is " + this.posStr(ux1, uy1) + " the mother?",
                        "Yes",
                        "No",
                        "Cancel",
                        () => {
                            // Yes.
                            this.setParents(2, ux1, uy1, ux2, uy2);
                        },
                        () => {
                            // No.
                            this.handleSecondOfTwoParents(fx, fy);
                        },
                        () => {
                            // Cancel.
                        }
                    );
                    return;
                }
            }

            this.handleSecondOfTwoParents(fx, fy);
        },
        handleFirstOfTwoParents: function() {
            dialogs.coordinatesDialog(
                "Please specify the father of " + this.posStr() + " first.",
                this.validateCoords.bind(this),
                (result) => {
                    var fx = result[0];
                    var fy = result[1];
                    var f = this.pedigree.data[fy][fx];
                    if (f.gender != "male") {
                        dialogs.messageDialog(this.posStr(fx, fy) + " is not male.");
                        return;
                    }

                    this.gotFirstOfTwoParents(fx, fy);
                }
            );
        },
        deleteParents: function() {
            var x = this.pedigree.x;
            var y = this.pedigree.y;
            this.pedigree.data[y][x].parents = null;
            this.pedigree.push("deleting parents of " + this.posStr());
            this.replot();
        },
        parents: function() {
            var x = this.pedigree.x;
            var y = this.pedigree.y;
            if (y == 1) {
                dialogs.messageDialog(
                    "You are in the top row, there are no parents to specify. " +
                    "Press up arrow to create a row for this person's parents."
                );
                return;
            }

            if (this.last_dot && this.prevParents != null) {
                var numParents = this.prevParents[0];
                var fx = this.prevParents[1];
                var fy = this.prevParents[2];
                var mx = this.prevParents[3];
                var my = this.prevParents[4];
                if (numParents == 1) {
                    out("Using " + this.posStr(fx, fy) + " as the parent again.");
                } else if (numParents == 2) {
                    out(
                        "Using " +
                        this.posStr(fx, fy) +
                        " and " +
                        this.posStr(mx, my) +
                        " as the parents again."
                    );
                }
                this.setParents(numParents, fx, fy, mx, my);
                return;
            }

            var clearPrompt = null;
            if (this.pedigree.data[y][x].parents) {
                clearPrompt = "Clear existing parents";
            }
            dialogs.yesNoDialog(
                "Set parents of " + this.posStr(x, y) + ":",
                "1 parent",
                "2 parents",
                clearPrompt,
                () => {
                    this.handleOneParent();
                },
                () => {
                    this.handleFirstOfTwoParents();
                },
                () => {
                    this.deleteParents();
                }
            );
        },
        insertRowAtTop: function() {
            this.pedigree.insertNewRowAtTop();
            this.navigate(0, 0 - this.pedigree.y);
            this.replot();
        },
        insertRowAtBottom: function() {
            var y = this.pedigree.y;
            while (this.pedigree.data[y]) y++;
            this.pedigree.data[y] = [];
            this.replot();
            this.navigate(0, y - this.pedigree.y);
        },
        promptInsertRowAtTop: function() {
            dialogs.yesNoDialog(
                "Insert new row at top?",
                "Yes",
                "No",
                null,
                () => {
                    // Yes.
                    this.insertRowAtTop();
                },
                () => {
                    // No: do nothing.
                },
                null
            );
        },
        addFemale: function() {
            this.pedigree.x += 1;
            this.pedigree.addnode(
                new pedigree.Node("female"),
                this.pedigree.x,
                this.pedigree.y
            );
            this.pedigree.push("adding female at " + this.posStr());
            this.replot();
        },
        addMale: function() {
            this.pedigree.x += 1;
            this.pedigree.addnode(
                new pedigree.Node("male"),
                this.pedigree.x,
                this.pedigree.y
            );
            this.pedigree.push("adding male at " + this.posStr());
            this.replot();
        },
        addNogender: function() {
            this.pedigree.x += 1;
            this.pedigree.addnode(
                new pedigree.Node("nogender"),
                this.pedigree.x,
                this.pedigree.y
            );
            this.pedigree.push("adding unknown gender at " + this.posStr());
            this.replot();
        },
        addPregloss: function() {
            this.pedigree.x += 1;
            this.pedigree.addnode(
                new pedigree.Node("pregloss"),
                this.pedigree.x,
                this.pedigree.y
            );
            this.pedigree.push("adding pregnancy loss at " + this.posStr());
            this.replot();
        },
        toggleCarrier: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                row[this.pedigree.x].carrier = !row[this.pedigree.x].carrier;
                this.pedigree.push("changing carrier status of " + this.posStr());
                this.replot();
            }
        },
        toggleAffected: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                row[this.pedigree.x].affected = !row[this.pedigree.x].affected;
                this.pedigree.push("changing affectedness of " + this.posStr());
                this.replot();
            }
        },
        toggleProband: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                row[this.pedigree.x].proband = !row[this.pedigree.x].proband;
                this.pedigree.push("changing proband status of " + this.posStr());
                this.replot();
            }
        },
        toggleTwin: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                row[this.pedigree.x].twin = !row[this.pedigree.x].twin;
                this.pedigree.push("changing twin status of " + this.posStr());
                this.replot();
            }
        },
        toggleDead: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                if (row[this.pedigree.x].dead) {
                    this.pedigree.push("bringing " + this.posStr() + " back to life");
                    row[this.pedigree.x].dead = false;
                } else {
                    this.pedigree.push("killing " + this.posStr());
                    row[this.pedigree.x].dead = true;
                }
                this.replot();
            }
        },
        togglePregnancy: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                row[this.pedigree.x].pregnancy = !row[this.pedigree.x].pregnancy;
                this.pedigree.push("changing pregnancy status of " + this.posStr());
                this.replot();
            }
        },
        init: function() {
            if (this.pedigree.y == undefined) {
                this.pedigree.y = 1;
                this.pedigree.x = -1;
            }
            this.pedigree.push("Initial state.");

            this.pedigree.plot();
            this.pedigree.renderHtml(document, this.container);

            var element = this.getElement(this.pedigree.x, this.pedigree.y);
            element.tabIndex = 0;
            element.classList.add("selected");
            element.focus();
        },
        undo: function() {
            var undo_result = this.pedigree.undo();
            if (undo_result) {
                this.pedigree.x = undo_result.x;
                this.pedigree.y = undo_result.y;
                this.replot();
            }
        },
        redo: function() {
            var redo_result = this.pedigree.redo();
            if (redo_result) {
                this.pedigree.x = redo_result.x;
                this.pedigree.y = redo_result.y;
                this.replot();
            }
        },
        moveLeft: function() {
            this.navigate(-1, 0);
        },
        moveRight: function() {
            this.navigate(1, 0);
        },
        moveUp: function() {
            if (this.pedigree.y == 1) {
                this.promptInsertRowAtTop();
            } else {
                var rowmax = 2;
                for (var row in this.pedigree.data) {
                    if (row > rowmax) rowmax = row;
                }
                if (
                    this.pedigree.data[this.pedigree.y].length == 0 &&
                    this.pedigree.y == rowmax
                ) {
                    delete this.pedigree.data[this.pedigree.y];
                    this.pedigree.y -= 1;
                    this.replot();
                } else {
                    this.navigate(0, -1);
                }
            }
        },
        moveDown: function() {
            if (this.pedigree.data[this.pedigree.y + 1] == undefined) {
                this.pedigree.data[this.pedigree.y + 1] = [];
                this.replot();
            }
            this.navigate(0, 1);
        },
        deleteCurrentNode: function() {
            this.pedigree.deletenode(this.pedigree.x, this.pedigree.y);
            this.replot();
        },
        union: function() {
            this.pedigree.union(this.pedigree.x, this.pedigree.y);
            this.replot();
        },
        grabChild: function() {
            this.pedigree.grabchild(this.pedigree.x, this.pedigree.y);
            this.replot();
        },
        nPeople: function() {
            if (
                this.pedigree.x >= 0 &&
                this.pedigree.x < this.pedigree.data[this.pedigree.y].length
            ) {
                var row = this.pedigree.data[this.pedigree.y];
                row[this.pedigree.x].multiple = 10;
                this.pedigree.push("setting " + this.posStr() + " to n people");
                this.replot();
            }
        },
        describeAll: function() {
            dialogs.messageDialog(this.pedigree.describe_all());
        },
        describe: function() {
            dialogs.messageDialog(
                this.pedigree.describe(this.pedigree.x, this.pedigree.y)
            );
        },
        longDescribe: function() {
            dialogs.messageDialog(
                this.pedigree.longdescribe(this.pedigree.x, this.pedigree.y)
            );
        },
        executeCommand: function(cmd) {
            this.beforeCommandX = this.pedigree.x;
            this.beforeCommandY = this.pedigree.y;
            this.beforeCommandUndoIndex = this.pedigree.undo_history.length - 1;
            try {
                cmd.bind(this)();
            } catch (e) {
                console.log("executeCommand recover because " + e.message);
                this.recover();
                if (e.message) {
                    dialogs.messageDialog(e.message);
                } else {
                    throw e;
                }
            }
        },
        run: function() {
            this.filename = null;
            this.init();

            var keydownMap = {
                8: this.deleteCurrentNode, // Backspace
                13: this.edit, // Enter
                37: this.moveLeft, // Left arrow
                38: this.moveUp, // Up arrow
                39: this.moveRight, // Right arrow
                40: this.moveDown, // Down arrow
            };

            var keypressAsciiMap = {
                L: this.longDescribe,
                N: this.nPeople,
                P: this.togglePregnancy,
                T: this.toggleTwin,
                U: this.addNogender,
                a: this.toggleAffected,
                b: this.addPregloss,
                c: this.toggleCarrier,
                d: this.describe,
                f: this.addFemale,
                g: this.grabChild,
                k: this.toggleDead,
                m: this.addMale,
                p: this.parents,
                u: this.union,
                x: this.toggleProband,
            };

            var globalKeypressAsciiMap = {
                e: this.exportPdf,
                j: this.jump,
                n: this.promptForNewPedigree,
                l: this.load,
                s: this.save,
                t: this.editPageTitle,
                w: this.describeAll,
                y: this.redo,
                z: this.undo,
                M: this.focusMenuBar,
                "/": this.focusMenuBar,
            };

            var keypressMap = {};
            for (var asciiKey in keypressAsciiMap) {
                keypressMap[asciiKey.charCodeAt(0)] = keypressAsciiMap[asciiKey];
            }

            var globalKeypressMap = {};
            for (asciiKey in globalKeypressAsciiMap) {
                globalKeypressMap[asciiKey.charCodeAt(0)] =
                    globalKeypressAsciiMap[asciiKey];
            }

            console.log('Adding event listener to ' + this.container);
            this.container.addEventListener(
                "mousedown",
                (evt) => {
                    console.log('Click ' + evt);
                    if (dialogs.dialogOpen) {
                        dialogs.closeDialog();
                        return;
                    }
                    var t = evt.target;
                    console.log('Click on ' + t);
                    while (t && t.getAttribute) {
                        if (
                            t.getAttributeNode("px") != null &&
                            t.getAttributeNode("py") != null
                        ) {
                            var newx = Math.floor(t.getAttribute("px"));
                            var newy = Math.floor(t.getAttribute("py"));
                            this.navigate(newx - this.pedigree.x, newy - this.pedigree.y);
                            evt.stopPropagation();
                            evt.preventDefault();
                            break;
                        }
                        t = t.parentNode;
                    }
                },
                true
            );

            this.container.addEventListener(
                "keydown",
                (evt) => {
                    console.log("KEYDOWN " + evt.keyCode);
                    if (dialogs.dialogOpen) {
                        return;
                    }
                    var cmd = keydownMap[evt.keyCode];
                    if (cmd != undefined) {
                        this.executeCommand(cmd);
                        evt.stopPropagation();
                        evt.preventDefault();
                    }
                },
                false
            );

            this.container.addEventListener(
                "keypress",
                (evt) => {
                    evt = evt || window.event;
                    if (dialogs.dialogOpen) {
                        return;
                    }
                    console.log("KEYPRESS " + evt.charCode);
                    var handled = false;
                    var cmd = keypressMap[evt.keyCode];
                    if (cmd != undefined) {
                        this.executeCommand(cmd);
                        handled = true;
                    }

                    if (evt.charCode == ".".charCodeAt(0)) {
                        this.last_dot = true;
                    } else {
                        this.last_dot = false;
                    }

                    if (
                        evt.charCode >= "0".charCodeAt(0) &&
                        evt.charCode <= "9".charCodeAt(0)
                    ) {
                        var multiple = evt.charCode - "0".charCodeAt(0);
                        if (
                            this.pedigree.x >= 0 &&
                            this.pedigree.x < this.pedigree.data[this.pedigree.y].length
                        ) {
                            var row = this.pedigree.data[this.pedigree.y];
                            row[this.pedigree.x].multiple = multiple;
                            if (multiple == 0) {
                                this.pedigree.push(
                                    "making " + this.posStr() + " a nonexistant child"
                                );
                            } else if (multiple == 1) {
                                this.pedigree.push("setting " + this.posStr() + " to 1 person");
                            } else {
                                this.pedigree.push(
                                    "setting " + this.posStr() + " to " + multiple + " people"
                                );
                            }
                            this.replot();
                            handled = true;
                        }
                    }

                    if (handled) {
                        evt.stopPropagation();
                        evt.preventDefault();
                    }
                },
                false
            );

            function globalKeyPressHandler(evt) {
                evt = evt || window.event;
                if (dialogs.dialogOpen) {
                    return;
                }
                if (evt.altKey || evt.ctrlKey || evt.metaKey) {
                    return;
                }
                var cmd = globalKeypressMap[evt.keyCode];
                if (cmd != undefined) {
                    this.executeCommand(cmd);
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            }

            document.addEventListener(
                "keypress",
                globalKeyPressHandler.bind(this),
                false
            );

            function globalKeyUpDownHandler(evt) {
                let toolbar = document.querySelector('.toolbar');
                if (evt.key == 'Shift') {
                    if (evt.type == 'keydown')
                        toolbar.classList.add('showshortcuts');
                    else
                        toolbar.classList.remove('showshortcuts');
                }
            }
            document.addEventListener("keydown", globalKeyUpDownHandler.bind(this), false);
            document.addEventListener("keyup", globalKeyUpDownHandler.bind(this), false);
        },
        getElement: function(x, y) {
            if (x >= 0) {
                return this.pedigree.data[y][x].element;
            } else {
                return this.pedigree.rowobjs[y].rowmarker;
            }
        },
        navigate: function(dx, dy) {
            try {
                var element = this.getElement(this.pedigree.x, this.pedigree.y);
                element.tabIndex = -1;
                element.classList.remove("selected");
            } catch (ignore) {}

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
            element.classList.add("selected");
            element.focus();
        },
        addToolbarButton: function(name, imgClass, clickHandler) {
            var button = document.createElement("button");
            this.toolbar.appendChild(button);

            var img = document.createElement("div");
            img.className = "img " + imgClass;
            button.appendChild(img);

            var overlay = document.createElement("div");
            overlay.className = "overlay " + imgClass;
            img.appendChild(overlay);

            var img2 = document.createElement("div");
            img2.className = "img2 " + imgClass;
            button.appendChild(img2);

            var text = document.createElement("div");
            text.className = "caption";
            text.innerHTML = name;
            button.appendChild(text);

            if (clickHandler) {
                button.addEventListener(
                    "click",
                    this.executeCommand.bind(this, clickHandler),
                    false
                );
            }
        },
        addToolbarSpacer: function() {
            var divider = document.createElement("div");
            divider.style.height = "20px";
            this.toolbar.appendChild(divider);
        },
        addMenu: function(title) {
            var menuTitle = document.createElement("div");
            menuTitle.innerHTML = title;
            menuTitle.className = "menu_title";
            menuTitle.setAttribute("role", "menuitem");
            menuTitle.tabIndex = 0;
            this.menuContainer.appendChild(menuTitle);

            var menuWrap = document.createElement("div");
            menuWrap.className = "menu_wrap";
            menuWrap.style.visibility = "hidden";
            menuTitle.appendChild(menuWrap);

            var menu = document.createElement("div");
            menu.className = "menu";
            menu.setAttribute("role", "menu");
            menuWrap.appendChild(menu);

            function openMenu() {
                console.log("Opening menu " + title);
                menuTitle.className = "menu_title open";
                menuWrap.style.visibility = "visible";
                menuWrap.setAttribute("aria-hidden", "false");
                menu.firstChild.focus();
            }

            function hideMenu() {
                menuWrap.style.visibility = "hidden";
                menuWrap.setAttribute("aria-hidden", "true");
                menuTitle.className = "menu_title";
            }

            function closeMenu() {
                hideMenu();
                menuTitle.focus();
            }

            function toggleMenu() {
                if (menuWrap.style.visibility == "hidden") openMenu();
                else closeMenu();
            }

            menuTitle.addEventListener(
                "keydown",
                (evt) => {
                    evt = evt || window.event;
                    switch (evt.keyCode) {
                        case 13: // Enter
                        case 32: // Space
                            toggleMenu();
                            break;
                        case 40: // Down arrow
                            openMenu();
                            break;
                        case 27: // Escape
                            if (menuWrap.style.visibility == "hidden") this.navigate(0, 0);
                            else closeMenu();
                            break;
                        case 37: // Left arrow
                            if (menuTitle.previousSibling) menuTitle.previousSibling.focus();
                            break;
                        case 39: // Right arrow
                            if (menuTitle.nextSibling) menuTitle.nextSibling.focus();
                            break;
                    }
                },
                false
            );

            menuTitle.addEventListener(
                "click",
                function() {
                    toggleMenu();
                },
                false
            );

            function onFocusChange() {
                var e = document.activeElement;
                while (e) {
                    if (e == menuTitle) break;
                    e = e.parentElement;
                }
                if (e != menuTitle) {
                    hideMenu();
                }
            }
            document.addEventListener(
                "focus",
                function() {
                    window.setTimeout(function() {
                        onFocusChange();
                    }, 0);
                },
                true
            );
            document.addEventListener(
                "focusout",
                function() {
                    window.setTimeout(function() {
                        onFocusChange();
                    }, 0);
                },
                true
            );

            return menu;
        },
        addMenuItem: function(menu, title, command) {
            var menuWrap = menu.parentElement;
            var menuTitle = menu.parentElement.parentElement;

            var menuItem = document.createElement("div");
            menuItem.innerHTML = title;
            menuItem.className = "menu_item";
            menuItem.setAttribute("role", "menuitem");
            menuItem.tabIndex = 0;
            menu.appendChild(menuItem);

            menuItem.addEventListener(
                "keydown",
                (evt) => {
                    evt = evt || window.event;
                    switch (evt.keyCode) {
                        case 38: // Up arrow
                            if (menuItem.previousSibling) menuItem.previousSibling.focus();
                            break;
                        case 40: // Down arrow
                            if (menuItem.nextSibling) menuItem.nextSibling.focus();
                            break;
                        case 13: // Enter
                        case 32: // Space
                            this.executeCommand(command);
                            break;
                        default:
                            return false;
                    }
                    evt.stopPropagation();
                    evt.preventDefault();
                },
                false
            );

            menuItem.addEventListener(
                "click",
                (evt) => {
                    this.executeCommand(command);
                    evt.stopPropagation();
                    evt.preventDefault();
                },
                false
            );
        },
        focusMenuBar: function() {
            this.fileMenu.parentElement.parentElement.focus();
        },
        buildInterface: function() {
            this.menuContainer = document.getElementById("menu_container");
            this.menuContainer.setAttribute("role", "menubar");

            this.fileMenu = this.addMenu("File");
            this.editMenu = this.addMenu("Edit");
            this.pedigreeMenu = this.addMenu("Pedigree");

            this.addMenuItem(
                this.fileMenu,
                "New Pedigree...",
                this.promptForNewPedigree
            );
            this.addMenuItem(this.fileMenu, "Set Title...", this.editPageTitle);
            this.addMenuItem(this.fileMenu, "Load", this.load);
            this.addMenuItem(this.fileMenu, "Save", this.save);
            this.addMenuItem(this.fileMenu, "Export PDF", this.exportPdf);

            this.addMenuItem(this.editMenu, "Undo", this.undo);
            this.addMenuItem(this.editMenu, "Redo", this.redo);
            this.addMenuItem(this.editMenu, "Delete person", this.deleteCurrentNode);
            this.addMenuItem(this.editMenu, "Edit person's text", this.edit);
            this.addMenuItem(this.editMenu, "Describe person", this.describe);
            this.addMenuItem(
                this.editMenu,
                "Describe relation to proband",
                this.longDescribe
            );

            this.addMenuItem(
                this.pedigreeMenu,
                "Insert row above",
                this.insertRowAtTop
            );
            this.addMenuItem(
                this.pedigreeMenu,
                "Insert row below",
                this.insertRowAtBottom
            );
            this.addMenuItem(this.pedigreeMenu, "Jump", this.jump);
            this.addMenuItem(
                this.pedigreeMenu,
                "Describe entire pedgiree",
                this.describeAll
            );

            this.container = document.getElementById("pedigree");

            window.setTimeout(() => {
                this.container.className = "pedigree";
                this.container.setAttribute("role", "grid");
                this.container.setAttribute("aria-label", "Pedigree");

                this.footer = document.getElementById("footer");

                window.out = function(msg) {
                    console.log('OUT: ' + msg);
                    window.clearTimeout(window.lastFooterTimeoutId);
                    window.setTimeout(function() {
                        footer.innerHTML = msg;
                        window.lastFooterTimeoutId = window.setTimeout(function() {
                            footer.innerHTML = "";
                        }, 5000);
                    }, 100);
                };

                dialogs.restoreFocusFromDialog = () => {
                    try {
                        this.getElement(this.pedigree.x, this.pedigree.y).focus();
                    } catch (x) {}
                };
            }, 0);
        },
    },
});

// Indentation settings for Vim and Emacs.
//
// Local Variables:
// js2-basic-offset: 2
// indent-tabs-mode: nil
// End:
//
// vim: et sts=2 sw=2