'use strict';

function AssertException(message) {
    this.message = message;
}

AssertException.prototype.toString = function() {
    return 'AssertException: ' + this.message;
};

function assert(exp, message) {
    if (!exp) {
        throw new AssertException(message);
    }
}

function assertEquals(s1, s2) {
    if (s1 != s2) {
        throw new AssertException('Got \'' + s1 + '\', expected \'' + s2 + '\'');
    }
}

function out(s) {
    console.log(s);
};

var VERBOSE = false;

function verbose(s) {
    if (VERBOSE)
        console.log(s);
}

function sort_numerical_ascending(x, y) {
    return x - y;
}

function PedigreeException(message) {
    console.log('Throwing PedigreeException: ' + message);
    this.message = message;
}

var LARGE_LABEL_CHARS = 50; // A node with more than this many chars gets
// twice as much horizontal space for its text
var MED_LABEL_CHARS = 4; // A node with more than this many chars gets
// a little more horizontal space for its text

var MIN_HORIZONTAL_SPACE = 1.6;

// Extra space (each end) for med label
var EXTRA_MED_HORIZONTAL_SPACE = 2.75;
// Extra space (each end) for large label
var EXTRA_LARGE_HORIZONTAL_SPACE = 7.0;

var MIN_VERTICAL_SPACE = 2.5;

var MARGIN = 12;
var TOP = 44;
var LEFT = 88;

var pedigree = {};

var dialog_open = null;
var dialog_focusListener = null;
var dialog_keydownListener = null;

pedigree.initWithDefault = function(valueOrUndefined, defaultValue) {
    return typeof(valueOrUndefined) == 'undefined' ?
        defaultValue : valueOrUndefined;
};

pedigree.isValidGender = function(gender) {
    return (gender == 'male' ||
        gender == 'female' ||
        gender == 'nogender' ||
        gender == 'pregloss');
};

pedigree.Node = function(genderOrSourceJsonObject) {
    var src;
    if (typeof(genderOrSourceJsonObject) == 'object') {
        src = genderOrSourceJsonObject;
    } else {
        src = { 'gender': genderOrSourceJsonObject };
    }

    this.gender = src.gender;

    this.affected = pedigree.initWithDefault(src.affected, false);
    this.carrier = pedigree.initWithDefault(src.carrier, false);
    this.dead = pedigree.initWithDefault(src.dead, false);
    this.pregnancy = pedigree.initWithDefault(src.pregnancy, false);
    this.twin = pedigree.initWithDefault(src.twin, false);
    this.proband = pedigree.initWithDefault(src.proband, false);
    this.parents = pedigree.initWithDefault(src.parents, null);
    this.label = pedigree.initWithDefault(src.label, '');
    // 1 = default, 0 = nonexistant, 10 = "n" people
    this.multiple = pedigree.initWithDefault(src.multiple, 1);
};

pedigree.State = function(action, data, unions, x0, y0, text) {
    this.action = action;
    this.data = {};
    this.text = text;
    for (var y in data) {
        this.data[y] = [];
        for (var j = 0; j < data[y].length; j++) {
            this.data[y].push(new pedigree.Node(data[y][j]));
        }
    }
    this.unions = [];
    for (var i = 0; i < unions.length; i++) {
        this.unions.push(unions[i]);
    }
    this.x = x0;
    this.y = y0;
};

pedigree.Pedigree = function() {
    this.text = 'Pedigree Title';
    this.data = {};
    this.data[1] = [];
    this.unions = [];
    this.char_history = "  ";
    this.redo_history = [];
    this.undo_history = [];
    this.dirty = false;
    this.prev_parents = null;
    this.last_dot = false;
    this.initStorage();
};

pedigree.Pedigree.prototype.initStorage = function() {
    let now = new Date();
    this.storageKey = '' + now.getTime();
    localStorage.setItem(this.storageKey, JSON.stringify({
        'type': 'pedigree',
        'time': now.getTime(),
        'name': now.toDateString()
    }));

    let historyCount = 0;
    let argmin = null;
    let min = null;
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);

        let item = JSON.parse(localStorage.getItem(key));
        if (item.type != 'pedigree') {
            return;
        }
        historyCount++;
        if (min === null || item.time < min) {
            min = item.time;
            argmin = key;
        }
    }
    if (historyCount > 10) {
        localStorage.removeItem(argmin);
    }
};

pedigree.Pedigree.prototype.push = function(action, x, y) {
    if (x == undefined) {
        x = this.x;
    }
    if (y == undefined) {
        y = this.y;
    }
    var s = new pedigree.State(action, this.data, this.unions, x, y, this.text);
    this.undo_history.push(s);
    if (this.redo_history != []) {
        this.redo_history = [];
    }
    this.dirty = true;

    let item = JSON.parse(localStorage.getItem(this.storageKey));
    item.data = this.serialize();
    localStorage.setItem(this.storageKey, JSON.stringify(item));

    console.log('PUSH "' + action + '": length=' + this.undo_history.length + ': ' +
        this.describe_all());
};

pedigree.Pedigree.prototype.loadstate = function(s) {
    this.data = {};
    this.text = s.text;
    for (var y in s.data) {
        this.data[y] = [];
        for (var i = 0; i < s.data[y].length; i++) {
            this.data[y].push(new pedigree.Node(s.data[y][i]));
        }
    }
    this.unions = [];
    for (var i = 0; i < s.unions.length; i++) {
        this.unions.push(s.unions[i]);
    }
    console.log('After loadstate: ' + this.describe_all());
    return s;
};

pedigree.Pedigree.prototype.undo = function() {
    if (this.undo_history.length <= 1) {
        throw new PedigreeException("Nothing to undo.");
        return null;
    }

    var s = this.undo_history.pop();
    this.redo_history.push(s);
    out('Undoing ' + s.action);
    return this.loadstate(this.undo_history[this.undo_history.length - 1]);
};

pedigree.Pedigree.prototype.redo = function() {
    if (this.redo_history == []) {
        throw new PedigreeException("Nothing to redo.");
        return null;
    }

    var s = this.redo_history.pop();
    this.undo_history.push(s);
    out('Redoing ' + s.action);
    return this.loadstate(s);
};

pedigree.Pedigree.prototype.move = function(x1, y1, x2, y2) {
    console.log('move ' + JSON.stringify([x1, y1, x2, y2]));
    console.log('unions before: ' + JSON.stringify(this.unions));
    var u2 = [];
    for (var i = 0; i < this.unions.length; i++) {
        var u = this.unions[i];
        var xx1 = u[0];
        var yy1 = u[1];
        var xx2 = u[2];
        var yy2 = u[3];
        if (xx1 == x1 && yy1 == y1) {
            xx1 = x2;
            yy1 = y2;
        }
        if (xx2 == x1 && yy2 == y1) {
            xx2 = x2;
            yy2 = y2;
        }
        u2.push([xx1, yy1, xx2, yy2]);
    }
    this.unions = u2;
    console.log('unions after: ' + JSON.stringify(this.unions));
    for (var row_y in this.data) {
        var row = this.data[row_y];
        for (var col_x = 0; col_x < row.length; col_x++) {
            var n = row[col_x];
            if (n.parents != null) {
                var xx1 = n.parents[0];
                var yy1 = n.parents[1];
                var xx2 = n.parents[2];
                var yy2 = n.parents[3];
                if (xx1 == x1 && yy1 == y1) {
                    xx1 = x2;
                    yy1 = y2;
                }
                if (xx2 == x1 && yy2 == y1) {
                    xx2 = x2;
                    yy2 = y2;
                }
                n.parents = [xx1, yy1, xx2, yy2];
            }
        }
    }
};

pedigree.Pedigree.prototype.deletenode = function(x, y) {
    if (x == -1)
        return;

    // Delete unions containing this node
    var oldunions = this.unions;
    this.unions = [];
    for (var i = 0; i < oldunions.length; i++) {
        var u = oldunions[i];
        var xx1 = u[0];
        var yy1 = u[1];
        var xx2 = u[2];
        var yy2 = u[3];
        if (xx1 == x && yy1 == y) {
            out('Deleting union with ' + yy2 + ' ' + (xx2 + 1));
        } else if (xx2 == x && yy2 == y) {
            out('Deleting union with ' + yy1 + ' ' + (xx1 + 1));
        } else {
            this.unions.push([xx1, yy1, xx2, yy2]);
        }
    }
    // Delete parent fields containing this node
    for (var y1 in this.data) {
        var row = this.data[y1];
        for (var x1 = 0; x1 < row.length; x1++) {
            var n = row[x1];
            if (n.parents) {
                var xx1 = n.parents[0];
                var yy1 = n.parents[1];
                var xx2 = n.parents[2];
                var yy2 = n.parents[3];
                if (xx1 == x && yy1 == y) {
                    xx1 = null;
                    yy1 = null;
                    out('Deleting parent of ' + y1 + ' ' + (x1 + 1));
                } else if (xx2 == x && yy2 == y) {
                    xx2 = null;
                    yy2 = null;
                    out('Deleting parent of ' + y1 + ' ' + (x1 + 1));
                }
                if (xx1 == null && yy1 == null && xx2 == null && yy2 == null) {
                    n.parents = null;
                } else {
                    n.parents = [xx1, yy1, xx2, yy2];
                }
            }
        }
    }
    // Move the rest of the row over
    var row = this.data[y];
    row.splice(x, 1);
    for (i = x + 1; i <= row.length; i++) {
        this.move(i, y, i - 1, y);
    }
    out('Successfully deleted ' + y + ' ' + (x + 1) + ' from the tree.');
    this.push('deleting ' + y + ' ' + (x + 1));
    this.x--;
};

pedigree.Pedigree.prototype.addnode = function(n, x, y) {
    var row = this.data[y];
    row.splice(x, 0, n);
    for (var i = row.length - 1; i > x; i--) {
        this.move(i - 1, y, i, y);
    }
};

pedigree.Pedigree.prototype.grabchild = function(x, y) {
    // Check that this isn't the last row.
    if (this.data[y + 1] == undefined ||
        this.data[y + 1].length == 0) {
        throw new PedigreeException('No children in the next row.');
        return;
    }

    var parents_str = y + ' ' + (x + 1);
    var parents = [x, y, null, null];
    for (var i = 0; i < this.unions.length; i++) {
        var x1 = this.unions[i][0];
        var y1 = this.unions[i][1];
        var x2 = this.unions[i][2];
        var y2 = this.unions[i][3];
        if ((x1 == x && y1 == y) || (x2 == x && y2 == y)) {
            parents = [x1, y1, x2, y2];
            parents_str = y1 + ' ' + (x1 + 1) + ' and ' +
                y2 + ' ' + (x2 + 1);
        }
    }

    // Next row, where we'll grab the child.
    var row = this.data[y + 1];
    var found = false;
    for (var x0 = 0; x0 < row.length && !found; x0++) {
        if (row[x0].parents)
            continue;
        out('Grabbing ' + (y + 1) + ' ' + (x0 + 1) +
            ' as a child of ' + parents_str);
        row[x0].parents = parents;
        this.push('grabbing ' + (y + 1) + ' ' + (x0 + 1) +
            ' as a child of ' + parents_str);
        found = true;
    }

    if (!found) {
        throw new PedigreeException(
            'None of the children in the next row are parentless.');
    }
};

pedigree.Pedigree.prototype.union = function(x, y) {
    if (x == -1) {
        // Error: beginning of row
        return;
    }
    var row = this.data[y];
    var n = row[x];
    var other_gender;
    if (n.gender == 'male') {
        other_gender = 'female';
    } else if (n.gender == 'female') {
        other_gender = 'male';
    } else {
        // Error: can't union a person without a M/F gender
        return;
    }

    for (var i = 0; i < this.unions.length; i++) {
        var u = this.unions[i];
        var x1 = u[0];
        var y1 = u[1];
        var x2 = u[2];
        var y2 = u[3];
        if ((x1 == x && y1 == y) || (x2 == x && y2 == y)) {
            // Already unioned, delete it.
            this.unions.splice(i, 1);
            this.push('deleting union between ' + y1 + ' ' + (x1 + 1) + ' and ' +
                y2 + ' ' + (x2 + 1), x, y);
            return;
        }
    }

    var x2 = null;
    var y2 = null;
    if (x > 0 && row[x - 1].gender == other_gender) {
        x2 = x - 1;
        y2 = y;
    } else if (x < row.length - 1 && row[x + 1].gender == other_gender) {
        x2 = x + 1;
        y2 = y;
    } else {
        // Error: nobody to union with
        return;
    }

    this.unions.push([x, y, x2, y2]);
    this.push('creating union between ' + y + ' ' + (x + 1) + ' and ' +
        y2 + ' ' + (x2 + 1));
};

pedigree.Pedigree.prototype.insertNewRowAtTop = function() {
    var rows = [];
    for (var row in this.data) {
        rows.push(typeof(row) == 'string' ? parseInt(row, 10) : row);
    }
    rows.sort(function(a, b) { return b - a; });
    for (var i = 0; i < rows.length; i++) {
        var y1 = rows[i];
        var rowLen = this.data[y1].length;
        for (var x1 = 0; x1 < rowLen; x1++) {
            this.move(x1, y1, x1, y1 + 1);
        }
        this.data[y1 + 1] = this.data[y1];
        delete this.data[y1];
    }
    this.data[1] = [];
    this.x = -1;
    this.push('inserting new row at top');
};

pedigree.Pedigree.prototype.format_counts = function(count_list) {
    var str = '';
    for (var i = 0; i < count_list.length; i++) {
        var count_tuple = count_list[i];
        if (str != '')
            str += ', ';
        var count = count_tuple[0];
        var singular = count_tuple[1];
        var plural;
        if (count_tuple.length == 2) {
            plural = singular + 's';
        } else {
            plural = count_tuple[2];
        }

        str += count + ' ';
        if (count == 1)
            str += singular;
        else
            str += plural;
    }
    return str + '.';
};

pedigree.Pedigree.prototype.describe_all = function() {
    var str = this.text + '\n\n';

    var proband_count = 0;
    var affected_count = 0;
    var carrier_count = 0;
    var pregnancy_count = 0;
    var twin_count = 0;
    var dead_count = 0;
    var male_count = 0;
    var female_count = 0;
    var nogender_count = 0;
    var pregloss_count = 0;
    var row_count = 0;
    var node_count = 0;
    var person_count = 0;
    for (var y1 in this.data) {
        row = this.data[y1];
        row_count++;
        for (var x1 = 0; x1 < row.length; x1++) {
            var n = row[x1];
            n.connections = 0;
            node_count++;
            person_count += n.multiple;
            if (n.gender == 'male')
                male_count += n.multiple;
            if (n.gender == 'female')
                female_count += n.multiple;
            if (n.gender == 'nogender')
                nogender_count += n.multiple;
            if (n.gender == 'pregloss')
                pregloss_count += n.multiple;
            if (n.proband)
                proband_count += n.multiple;
            if (n.affected)
                affected_count += n.multiple;
            if (n.pregnancy)
                pregnancy_count += n.multiple;
            if (n.twin)
                twin_count += n.multiple;
            if (n.carrier)
                carrier_count += n.multiple;
            if (n.dead)
                dead_count += n.multiple;
        }
    }

    // print main stats                                                                               
    if (node_count == 0) {
        str += 'The pedigree is completely empty.\n';
        return str;
    }

    str += this.format_counts(
        [
            [node_count, 'node'],
            [person_count, 'person', 'people'],
            [row_count, 'row'],
            [male_count, 'male'],
            [female_count, 'female'],
            [nogender_count, 'person of unknown gender',
                'people of unknown gender'
            ],
            [pregloss_count, 'pregnancy loss',
                'pregnancy losses'
            ],
            [proband_count, 'proband'],
            [pregnancy_count, 'pregnancy', 'pregnancies'],
            [twin_count, 'twin'],
            [affected_count, 'affected person', 'affected people'],
            [carrier_count, 'carrier'],
            [dead_count, 'dead person', 'dead people']
        ]);
    str += '\n';

    // count the number of connections (parents, children, unions)
    // each person has.
    for (var row_y in this.data) {
        var row = this.data[row_y];
        for (var col_x = 0; col_x < row.length; col_x++) {
            var n = row[col_x];
            if (n.parents != null) {
                var x1 = n.parents[0];
                var y1 = n.parents[1];
                var x2 = n.parents[2];
                var y2 = n.parents[3];
                n.connections++;
                if (x1 != null && y1 != null)
                    this.data[y1][x1].connections++;
                if (x2 != null && y2 != null)
                    this.data[y2][x2].connections++;
            }
        }
    }
    for (var i = 0; i < this.unions.length; i++) {
        var x1 = this.unions[i][0];
        var y1 = this.unions[i][1];
        var x2 = this.unions[i][2];
        var y2 = this.unions[i][3];
        this.data[y1][x1].connections++;
        this.data[y2][x2].connections++;
    }

    // print disconnected people
    var no_connection_count = 0;
    for (row_y in this.data) {
        var row = this.data[row_y];
        for (var col_x = 0; col_x < row.length; col_x++) {
            var n = row[col_x];
            if (n.connections == 0)
                no_connection_count++;
        }
    }

    str += '\n';

    if (no_connection_count == 0) {
        str += 'Everyone in the pedigree is connected to at least one other.\n';
    } else if (no_connection_count == node_count) {
        str += 'Nobody in the pedigree is connected to anyone else.\n';
    } else if (no_connection_count == 1) {
        str += 'The following person is not connected:\n';
    } else {
        str += 'The following ' + no_connection_count +
            ' people are not connected:\n';
    }

    if (no_connection_count > 0 && no_connection_count < node_count) {
        for (row_y in this.data) {
            var row = this.data[row_y];
            for (var col_x = 0; col_x < row.length; col_x++) {
                var n = row[col_x];
                if (n.connections == 0)
                    str += ('  ' + y1 + ' ' + (x1 + 1)) + '\n';
            }
        }
    }

    return str;
};

pedigree.Pedigree.prototype.describe = function(x, y) {
    var row = this.data[y];
    if (row == []) {
        return 'Row ' + y + ' is empty.';
    } else if (x == -1) {
        return 'Beginning of row ' + y + ', length ' + row.length;
    }

    var n = row[x];
    var str = y + ' ' + (x + 1) + ' is';

    if (n.proband) {
        str += ' the proband and is';
    }
    if (n.multiple == 10) {
        str += ' nx';
    } else if (n.multiple > 1) {
        str += ' ' + n.multiple + 'x';
    }
    if (n.affected) {
        str += ' an affected';
    }

    if (n.multiple == 0) {
        str += ' a nonexistant child';
    } else {
        if (n.gender == 'male') {
            str += ' male';
        }
        if (n.gender == 'female') {
            str += ' female';
        }
        if (n.gender == 'nogender') {
            str += ' person of unknown gender';
        }
        if (n.gender == 'pregloss') {
            str += ' pregnancy loss';
        }
    }

    if (n.pregnancy) {
        str += ', a pregnancy';
    }
    if (n.twin) {
        str += ', a twin with the following sibling';
    }
    if (n.carrier) {
        str += ', a carrier';
    }
    if (n.dead) {
        str += ', dead';
    }

    // union
    var ustr = '';
    var found_unions = {};
    for (var i = 0; i < this.unions.length; i++) {
        var x1 = this.unions[i][0];
        var y1 = this.unions[i][1];
        var x2 = this.unions[i][2];
        var y2 = this.unions[i][3];
        var x1_y1_str = x1 + ',' + y1;
        var x2_y2_str = x2 + ',' + y2;
        if (x1 == x && y1 == y && found_unions[x2_y2_str] == undefined) {
            found_unions[x2_y2_str] = 1;
            if (ustr == '') {
                ustr = ', in union with ' + y2 + ' ' + (x2 + 1);
            } else {
                ustr += ' and ' + y2 + ' ' + (x2 + 1);
            }
        }
        if (x2 == x && y2 == y && found_unions[x1_y1_str] == undefined) {
            found_unions[x1_y1_str] = 1;
            if (ustr == '') {
                ustr = ', in union with ' + y1 + ' ' + (x1 + 1);
            } else {
                ustr += ' and ' + y1 + ' ' + (x1 + 1);
            }
        }
    }
    str += ustr;

    // parents
    if (n.parents) {
        var fx = n.parents[0];
        var fy = n.parents[1];
        var mx = n.parents[2];
        var my = n.parents[3];
        if (fx != null && fy != null && mx != null && my != null) {
            str += ', child of ' + fy + ' ' + (fx + 1) +
                ' and ' + my + ' ' + (mx + 1);
        } else if (fx != null && fy != null) {
            str += ', child of ' + fy + ' ' + (fx + 1);
        } else if (mx != null && my != null) {
            str += ', child of ' + my + ' ' + (mx + 1);
        }
    }

    // children
    var children = 0;
    var nochildren = 0;
    for (var row_y in this.data) {
        var check_row = this.data[row_y];
        for (var col_x = 0; col_x < check_row.length; col_x++) {
            var person = check_row[col_x];
            if (person.parents != null) {
                fx = person.parents[0];
                fy = person.parents[1];
                mx = person.parents[2];
                my = person.parents[3];

                if ((fx == x && fy == y) || (mx == x && my == y)) {
                    if (person.multiple == 0) {
                        nochildren++;
                    } else {
                        children++;
                    }
                }
            }
        }
    }

    if (children == 1) {
        str += ', with 1 child';
    } else if (children > 1) {
        str += ', with ' + children + ' children';
    } else if (nochildren > 0) {
        str += ', marked explicitly as having no children';
    }

    str += '.';
    if (n.label != '') {
        str += ' ' + n.label;
    }
    return str;
};

// Return the length of the first string in a list, or zero if empty.
pedigree.Pedigree.prototype.pathlen = function(l) {
    if (l.length == 0) {
        return 0;
    } else {
        return l[0].length;
    }
};

// See longdescribe, below, to understand the format of r
pedigree.Pedigree.prototype.recursive_describe_relation = function(r) {
    if (r == 'p') {
        return 'the proband';
    }

    // Table should be in order of the longest chain to the shortest.
    var table = [
        [/[MFU][MFU][MFU][mfx][mfx][mfx]$/, 'a second cousin of '],
        [/[MFU][MFU][mfx][mfx]$/, 'a first cousin of '],
        [/M[MF]M$/, 'a paternal great grandfather of '],
        [/M[MF]F$/, 'a paternal great grandmother of '],
        [/F[MF]M$/, 'a maternal great grandfather of '],
        [/F[MF]F$/, 'a maternal great grandmother of '],
        [/[mfx][mfx]m$/, 'a great grandson of '],
        [/[mfx][mfx]f$/, 'a great granddaughter of '],
        [/[mfx][mfx]x$/, 'a great grandchild of '],
        [/M[MFU]m$/, 'a paternal uncle of '],
        [/M[MFU]f$/, 'a paternal aunt of '],
        [/F[MFU]m$/, 'a maternal uncle of '],
        [/F[MFU]f$/, 'a maternal aunt of '],
        [/MM$/, 'the paternal grandfather of '],
        [/MF$/, 'the paternal grandmother of '],
        [/MU$/, 'the paternal grandparents of '],
        [/FM$/, 'the maternal grandfather of '],
        [/FF$/, 'the maternal grandmother of '],
        [/FU$/, 'the maternal grandparents of '],
        [/[mfx]m$/, 'a grandson of '],
        [/[mfx]f$/, 'a granddaughter of '],
        [/[mfx]x$/, 'a grandchild of '],
        [/[MFU]m$/, 'a brother of '],
        [/[MFU]f$/, 'a sister of '],
        [/[MFU]x$/, 'a sibling of '],
        [/M$/, 'the father of '],
        [/F$/, 'the mother of '],
        [/U$/, 'the parents of '],
        [/m$/, 'a son of '],
        [/f$/, 'a daughter of '],
        [/x$/, 'a child of ']
    ];

    for (var i = 0; i < table.length; i++) {
        var result = table[i][0].exec(r);
        if (result) {
            return (table[i][1] +
                this.recursive_describe_relation(
                    r.substr(0, r.length - result[0].length)));
        }
    }
    return r;
};

pedigree.Pedigree.prototype.longdescribe = function(ax, ay) {
    var row = this.data[ay];
    if (row == []) {
        return 'Row ' + ay + ' is empty.';
    } else if (ax == -1) {
        return 'Beginning of row ' + ay + ', length ' + row.length;
    }

    // Find the proband
    var px = -1;
    var py = -1;
    for (var y in this.data) {
        row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            if (n.proband) {
                if (px != -1 || py != -1) {
                    return 'Multiple probands were found, at ' +
                        py + ' ' + (px + 1) + ' and ' + y + ' ' + (x + 1) + '. ' +
                        'Please fix this before trying to determine relations.';
                }
                px = x;
                py = y;
            }
        }
    }

    if (ay == py && ax == px) {
        return ay + ' ' + (ax + 1) + ' is the proband.';
    }

    // Do a breadth-first search from the proband, building up a vector
    // of relations that trace the path from the proband:
    //   "M" for male parent,
    //   "F" for female parent,
    //   "U" for both parents,
    //   "X" for unknown parent,
    //   "m" for male child,
    //   "f" for female child,
    //   "x" for unknown child

    // For example, "MM" would be the paternal grandfather, and "Mf", "Ff",
    // and "Uf" would all be a sister.

    // BFS 1: Clear all
    for (y in this.data) {
        row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            n.relations = [];
        }
    }

    // BFS 2: Enqueue the proband, then do a BFS
    var r = 'p';
    var queue = [
        [px, py, r]
    ];
    this.data[py][px].relations.push(r);
    while (queue.length > 0) {
        var front = queue.shift();
        x = front[0];
        y = front[1];
        r = front[2];
        var n = this.data[y][x];

        if (n.parents) {
            var fx = n.parents[0];
            var fy = n.parents[1];
            var mx = n.parents[2];
            var my = n.parents[3];
            if (fx != null && fy != null) {
                var f = this.data[fy][fx];
                var pathlen = this.pathlen(f.relations);
                if (pathlen == 0 || pathlen == r.length + 1) {
                    f.relations.push(r + 'M');
                    queue.push([fx, fy, r + 'M']);
                }
            }
            if (mx != null && my != null) {
                var m = this.data[my][mx];
                pathlen = this.pathlen(m.relations);
                if (pathlen == 0 || pathlen == r.length + 1) {
                    m.relations.push(r + 'F');
                    queue.push([mx, my, r + 'F']);
                }
            }
        }

        if (this.data[y + 1] != undefined) {
            var cy = y + 1;
            for (var cx = 0; cx < this.data[cy].length; cx++) {
                var c = this.data[cy][cx];
                pathlen = this.pathlen(c.relations);
                if (pathlen > 0 && pathlen != r.length + 1) {
                    continue;
                }
                var g;
                if (c.gender == 'male') {
                    g = 'm';
                } else if (c.gender == 'female') {
                    g = 'f';
                } else {
                    g = 'x';
                }

                if (c.parents != null) {
                    fx = c.parents[0];
                    fy = c.parents[1];
                    mx = c.parents[2];
                    my = c.parents[3];
                    if ((fx == x && fy == y) || (mx == x && my == y)) {
                        c.relations.push(r + g);
                        queue.push([cx, cy, r + g]);
                    }
                }
            }
        }
    }

    var relations = this.data[ay][ax].relations;
    if (relations.length == 0) {
        return ay + ' ' + (ax + 1) + ' is not related to the proband.';
    }
    pathlen = this.pathlen(relations);

    // Do some simplifying: for each position in the path, if both
    // M and F appear, and everything up to that point is the same,
    // replace that position with U (both parents), and get rid of
    // duplicates.
    for (var p = 1; p < pathlen; p++) {
        var prefix = relations[0].substr(0, p);
        var Mcount = 0;
        var Fcount = 0;
        var Ocount = 0;
        var prefix_ok = true;
        for (var r_index = 0; r_index < relations.length; r_index++) {
            r = relations[r_index];
            if (r.substr(0, p) != prefix) {
                prefix_ok = false;
                break;
            }
            if (r[p] == 'M') {
                Mcount++;
            } else if (r[p] == 'F') {
                Fcount++;
            } else {
                Ocount++;
            }
        }

        if (Mcount > 0 & Fcount > 0 && Ocount == 0 && prefix_ok) {
            var new_relations = [];
            for (r_index = 0; r_index < relations.length; r_index++) {
                r = relations[r_index];
                if (r[p] == 'M') {
                    new_relations.push(r.substr(0, p) + 'U' + r.substr(p + 1));
                }
            }
            relations = new_relations;
        }
    }

    // Remove duplicates.
    new_relations = [];
    for (r_index = 0; r_index < relations.length; r_index++) {
        r = relations[r_index];
        if (new_relations.indexOf(r) == -1) {
            new_relations.push(r);
        }
    }
    relations = new_relations;

    var strs = [];
    for (r_index = 0; r_index < relations.length; r_index++) {
        r = relations[r_index];
        var str = this.recursive_describe_relation(r);
        strs.push(str);
    }

    return ay + ' ' + (ax + 1) + ' is ' + strs.join(', and ');
};

// Return true if the line segment from a0 to a1 intersects the
// segment from b0 to b1; they may appear in any order.
pedigree.Pedigree.prototype.segments_intersect = function(a0, a1, b0, b1) {
    var aL = Math.min(a0, a1);
    var aR = Math.max(a0, a1);
    var bL = Math.min(b0, b1);
    var bR = Math.max(b0, b1);
    return (aL <= bR && aR >= bL);
};

// Step 2: Calculate text extent for each node
pedigree.Pedigree.prototype.textwidth = function(s) {
    return s.length * 5.7;
};

pedigree.Pedigree.prototype.splittext = function(text, max_width) {
    var lines = [];
    var tokens = text.split(' ');
    var line = tokens.shift();
    while (tokens.length > 0) {
        while (this.textwidth(line + ' ' + tokens[0]) < max_width) {
            if (line.length > 0 && line[line.length - 1] == ';')
                break;
            line += ' ' + tokens.shift();
            if (tokens.length == 0)
                break;
        }
        if (tokens.length == 0)
            break;
        if (line.length > 0 && line[line.length - 1] == ';') {
            line = line.substr(0, line.length - 1);
        }
        lines.push(line);
        line = tokens.shift();
    }
    if (line.length > 0 && line[line.length - 1] == ';') {
        line = line.substr(0, line.length - 1);
    }
    lines.push(line);
    return lines;
};

pedigree.Pedigree.prototype.plot = function() {
    var rows = [];
    for (var row_index in this.data) {
        rows.push(parseInt(row_index, 10));
    }
    rows.sort(sort_numerical_ascending);

    // Step 1: Initialize fields
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            n.index = x;
            n.sibling_line = null;
            n.parent_line = null;
            n.siblings = [x];
            n.children = [];
            n.right_union = null;
            n.left_union = null;
            n.Xoff = 0;
            if (n.parents != null) {
                var x1 = n.parents[0];
                var y1 = n.parents[1];
                var x2 = n.parents[2];
                var y2 = n.parents[3];
                if ((y1 != null && y1 != y - 1) || (y2 != null && y2 != y - 1)) {
                    throw new PedigreeException(
                        'A parent of ' + y + ' ' + (x + 1) +
                        ' is not in the row above, cannot draw this.');
                    return false;
                }
            }
        }
    }

    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            n.label_lines = [];
            if (n.label == null || n.label == '') {
                continue;
            }
            if (n.label.length > LARGE_LABEL_CHARS) {
                n.label_lines = this.splittext(n.label, 140);
            } else {
                n.label_lines = this.splittext(n.label, 80);
            }
        }
    }

    // Step 3: Insert unions
    function union_key(y, x1, x2) {
        return y + ',' + x1 + ',' + x2;
    }

    var unions = {};
    for (var u_index = 0; u_index < this.unions.length; u_index++) {
        var u = this.unions[u_index];
        var x1 = u[0];
        var y1 = u[1];
        var x2 = u[2];
        var y2 = u[3];
        if (y1 != y2) {
            throw new PedigreeException(
                y1 + ' ' + (x1 + 1) + ' is in union with ' +
                y2 + ' ' + (x2 + 1) + ' in a different row.');
            return false;
        }
        if (x1 > x2) {
            var tmp = x1;
            x1 = x2;
            x2 = tmp;
        }
        if (x2 != x1 + 1) {
            throw new PedigreeException(
                y1 + ' ' + (x1 + 1) + ' is in union with ' +
                y2 + ' ' + (x2 + 1) + ', but they are not adjacent.');
            return false;
        }
        var uobj = {};
        unions[union_key(y1, x1, x2)] = uobj;
        uobj.children = [];
        uobj.parent_line = null;
        this.data[y1][x1].right_union = uobj;
        this.data[y1][x2].left_union = uobj;
        uobj.left = x1;
        uobj.right = x2;
    }

    // Step 4: Append children to each Parent or Union
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            if (n.parents != null) {
                var x1 = n.parents[0];
                var y1 = n.parents[1];
                var x2 = n.parents[2];
                var y2 = n.parents[3];
                if (x1 == null || (x1 != null && x2 != null && x1 > x2)) {
                    var tmp = x1;
                    x1 = x2;
                    x2 = tmp;
                }
                var did_union = false;
                if (x1 != null && x2 != null) {
                    if (unions[union_key(y1, x1, x2)] != undefined) {
                        var uobj = unions[union_key(y1, x1, x2)];
                        uobj.children.push(n.index);
                        did_union = true;
                    }
                }

                if (x1 != null && !did_union) {
                    this.data[y1][x1].children.push(n.index);
                }
                if (x2 != null && !did_union) {
                    this.data[y2][x2].children.push(n.index)
                }
            }
        }
    }

    // Step 5: Sort children, set siblings, sort siblings
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            n.children.sort(sort_numerical_ascending);
            for (var ci1 = 0; ci1 < n.children.length; ci1++) {
                var c1 = n.children[ci1];
                var child = this.data[y + 1][c1];
                for (var ci2 = 0; ci2 < n.children.length; ci2++) {
                    var c2 = n.children[ci2];
                    if (child.siblings.indexOf(c2) == -1) {
                        child.siblings.push(c2);
                    }
                }
            }
            var uobj = n.right_union;
            if (uobj != null) {
                uobj.children.sort(sort_numerical_ascending);
                for (ci1 = 0; ci1 < uobj.children.length; ci1++) {
                    var c1 = uobj.children[ci1];
                    var child = this.data[y + 1][c1];
                    for (ci2 = 0; ci2 < uobj.children.length; ci2++) {
                        var c2 = uobj.children[ci2];


                        if (child.siblings.indexOf(c2) == -1) {


                            child.siblings.push(c2);


                        }
                    }
                }
            }
            n.siblings.sort(sort_numerical_ascending);
        }
    }

    // Step 6: Come up with the group for each person - their
    // siblings plus siblings' spouses
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            n.group = [];
            for (var ci = 0; ci < n.siblings.length; ci++) {
                var c = n.siblings[ci];
                if (n.group.indexOf(c) == -1) {
                    n.group.push(c);
                }
                if (row[c].left_union != null && n.group.indexOf(c - 1) == -1) {
                    n.group.push(c - 1);
                }
                if (row[c].right_union != null && n.group.indexOf(c + 1) == -1) {
                    n.group.push(c + 1);
                }
                n.group.sort(sort_numerical_ascending);
            }
        }
    }

    // Step 7: Add extra space between adjacent people in a row who
    // aren't in the same group, && add extra space after people
    // who have direct children (i.e. children not through a union)
    // because their text goes off to the right.  Add extra space
    // for anyone with more than a trivial amount of text.
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        var next = 0.0;
        for (var x = 0; x < row.length; x++) {
            row[x].Xoff += next;
            var spacing = 0.0;
            var nchild = false;
            if (x > 0 &&
                row[x - 1].group.indexOf(row[x]) == -1 &&
                row[x].group.indexOf(row[x - 1]) == -1) {
                spacing += 0.5;
            }
            if (row[x].children.length > 0) {
                spacing += 1.0;
                nchild = true;
            }
            if (row[x].label.length > LARGE_LABEL_CHARS) {
                spacing += EXTRA_LARGE_HORIZONTAL_SPACE;
            } else if (row[x].proband || row[x].label.length > MED_LABEL_CHARS) {
                spacing += EXTRA_MED_HORIZONTAL_SPACE;
            }

            if (x == 0 || nchild) {
                // Xoff doesn't matter at the beginning of the line, or when
                // the text will be all to the right
                next = 1.5 * spacing;
            } else {
                // Normally, equal spacing before && after
                row[x].Xoff += spacing;
                next = spacing;
            }
        }
    }

    // Layout time!  Do one row at a time, starting from the bottom.
    // Try to lay out each parent centered around the center point of
    // the children.  If the parent would have to slide too far to the
    // left in order to do this, check to see if the parent's child group
    // is independent of the child group of all people to the left of
    // the parent.  If so, push this parent's child group to the right
    // and try again.  Otherwise, lay out the parent where it belongs.

    var sanity_count = 0;
    var sanity_moves = [];
    while (true) {
        sanity_count++;
        verbose('Trial ' + sanity_count);
        if (sanity_count == 20) {
            var sanmap = {};
            for (var move_i = 0; move_i < sanity_moves.length; move_i++) {
                var move = sanity_moves[move_i];
                var move_key = move.join(',');
                if (sanmap[move_key] == undefined) {
                    sanmap[move_key] = 1;
                } else {
                    sanmap[move_key]++;
                }
            }

            var errStr = 'Sorry, it is not possible to layout this pedigree. ';
            var found_count = 0;
            var ymax = -1;
            var found_x = 0;
            var found_y = 0;
            for (move_i = 0; move_i < sanity_moves.length; move_i++) {
                var move = sanity_moves[move_i];
                var move_key = move.join(',');
                var count = sanmap[move_key];
                if (count > 2) {
                    var y0 = move[0];
                    var x0 = move[1];
                    var y1 = move[2];
                    var x1 = move[2];
                    if (y0 > ymax) {
                        ymax = y0;
                        found_x = x0;
                        found_y = y0;
                        found_count = 1;
                    } else if (y0 == ymax) {
                        found_count += 1;
                    }
                }
            }
            if (found_count == 1) {
                errStr += 'The problem appears to be near ' +
                    found_y + ' ' + (found_x + 1) + '.';
            }
            throw new PedigreeException(errStr);
        }

        // Reset positions
        for (row_index = 0; row_index < rows.length; row_index++) {
            var y = rows[row_index];
            var row = this.data[y];
            for (var x = 0; x < row.length; x++) {
                row[x].placed = false;
            }
        }

        this.Xmax = 0;
        var ok = true;

        // Lay out from bottom up.
        for (row_index = rows.length - 1; row_index >= 0; row_index--) {
            if (!ok)
                break;

            var X = 0;
            var y = rows[row_index];
            var row = this.data[y];
            var n_next = null;
            for (var x = 0; x < row.length; x++) {
                verbose(y + ' ' + (x + 1));
                var n = row[x];
                if (x + 1 < row.length) {
                    n_next = row[x + 1];
                }
                if (x == 0) {
                    X = n.Xoff;
                } else {
                    X += (MIN_HORIZONTAL_SPACE + n.Xoff);
                }
                if (n.placed) {
                    X = n.X;
                    verbose('  leaving at ' + n.X);
                    continue;
                }

                // Old: always placed person next to their partner - decided
                // against this, now will possibly place them far from their
                // partner to center them on their children

                if (y < rows[rows.length - 1]) {
                    var childrow = this.data[y + 1];
                    verbose('childrow: length=' + childrow.length);
                }
                if (n.children.length > 0) {
                    var X0 = childrow[n.children[0]].X;
                    var X1 = childrow[n.children[n.children.length - 1]].X;
                    var Xctr = 0.5 * (X0 + X1);
                    verbose('X0=' + X0 + ' X1=' + X1 + ' Xctr=' + Xctr);
                    if (Xctr < X - 0.01) { // epsilon fudge factor
                        verbose('  is at ' + X +
                            ', but ctr of its children is at ' + Xctr);

                        // See if there's an overlap with folks on left
                        var rightmost = -1;
                        for (var xleft = 0; xleft < x - 1; xleft++) {
                            if (row[xleft].children.length > 0) {
                                var rightmost_group = childrow[row[xleft].children[0]].group;
                                var rightmost_0 = rightmost_group[rightmost_group.length - 1];
                                rightmost = Math.max(rightmost, rightmost_0);
                            }
                            var uobj2 = row[xleft].right_union;
                            if (uobj2 != null && uobj2.children.length > 0) {
                                rightmost_group = childrow[uobj2.children[0]].group;
                                rightmost_0 = rightmost_group[rightmost_group.length - 1];
                                rightmost = Math.max(rightmost, rightmost_0);
                            }
                        }
                        var g0 = childrow[n.children[0]].group[0];
                        if (rightmost < g0) {
                            childrow[g0].Xoff += (X - Xctr);
                            verbose('  (1) moving ' + (y + 1) + ' ' + g0 +
                                ' by ' + (X - Xctr));
                            sanity_moves.push([y, x + 1, y + 1, 1 + g0]);
                            ok = false;
                        } else {
                            Xctr = X;
                        }
                    }
                    n.X = Xctr;
                    X = n.X;
                    n.placed = true;
                    verbose('  case with children complete, moved to ' + n.X);
                    continue;
                }

                if (n.right_union != null && n.right_union.children.length > 0) {
                    // Placing a person directly above the center of their children
                    var uobj = n.right_union;
                    var X0 = childrow[uobj.children[0]].X;
                    var X1 = childrow[uobj.children[uobj.children.length - 1]].X;
                    var Xoff0 = childrow[uobj.children[0]].Xoff;
                    var Xoff1 = childrow[uobj.children[uobj.children.length - 1]].Xoff;
                    var Xctr = 0.5 * (X0 + X1) -
                        ((MIN_HORIZONTAL_SPACE + n_next.Xoff) / 2.0);
                    if (Xctr < X - 0.01) { // epsilon fudge factor
                        // See if there's an overlap with folks on left
                        var rightmost = -1;
                        for (var xleft = 0; xleft < x - 1; xleft++) {
                            if (row[xleft].children.length > 0) {
                                var rightmost_group = childrow[row[xleft].children[0]].group;
                                var rightmost_0 = rightmost_group[rightmost_group.length - 1];
                                rightmost = Math.max(rightmost, rightmost_0);
                            }
                            var uobj2 = row[xleft].right_union;
                            if (uobj2 != null && uobj2.children.length > 0) {
                                var rightmost_group = childrow[uobj2.children[0]].group;
                                var rightmost_0 = rightmost_group[rightmost_group.length - 1];
                                rightmost = Math.max(rightmost, rightmost_0);
                            }
                        }
                        var g0 = childrow[uobj.children[0]].group[0];
                        if (rightmost < g0) {
                            childrow[g0].Xoff += X - Xctr;
                            verbose('  (2) moving ' + (y + 1) + ' ' + g0 + ' by ' +
                                (X - Xctr));
                            sanity_moves.push([y, x + 1, y + 1, 1 + g0]);
                            ok = false;
                        } else {
                            Xctr = X;
                        }
                    }
                    n.X = Xctr;
                    X = n.X;
                    verbose('  case with union complete, moved to ' + n.X);
                    n.placed = true;
                    continue;
                }
                n.X = X;
                n.placed = true;
                verbose('  default complete, moved to ' + n.X);
                continue;
            }
            if (X + 5 > this.Xmax) {
                this.Xmax = X + 5;
            }
        }
        if (ok) {
            break;
        }
    }

    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        for (var x = 0; x < row.length; x++) {
            if (row[x].X == undefined) {
                row[x].X = 0;
            }
        }
    }

    // For each row, figure out the sibling line y-position
    // and the parent line y-position (the parent line is not
    // relevant if the parent or union is perfectly centered on
    // the siblings

    this.rowobjs = {};

    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        verbose('Sibling and parent lines (horizontal lines) for row ' + y);
        var robj = {};
        robj.num_parent_lines = 0;
        robj.num_sibling_lines = 0;

        this.rowobjs[y] = robj;

        var max_label_lines = 0;
        for (var x = 0; x < row.length; x++) {
            var num_lines = row[x].label_lines.length;
            if (num_lines > max_label_lines) {
                max_label_lines = num_lines;
            }
        }

        // We pretend that a certain number of 'conflicts' exist between
        // parent lines && the text; every two lines of text equals a
        // conflict.
        var num_label_conflicts = Math.floor((max_label_lines + 2) * 2 / 3);
        verbose('Row ' + y + ': label conflicts = ' + num_label_conflicts);

        var sibling_lines = [];
        var parent_lines = [];
        for (var x = 0; x < row.length; x++) {
            verbose(y + ' ' + (x + 1));
            var n = row[x];
            if (n.sibling_line == null) {
                var conflicts = [];
                for (var si = 0; si < sibling_lines.length; si++) {
                    var first = sibling_lines[si][0];
                    var last = sibling_lines[si][1];
                    var line = sibling_lines[si][2];
                    if (n.siblings[0] <= last &&
                        n.siblings[n.siblings.length - 1] >= first) {
                        if (conflicts.indexOf(line) == -1) {
                            conflicts.push(line);
                        }
                    }
                }
                n.sibling_line = 0;
                while (conflicts.indexOf(n.sibling_line) >= 0) {
                    n.sibling_line += 1;
                }
                sibling_lines.push(
                    [n.siblings[0], n.siblings[n.siblings.length - 1], n.sibling_line]);
                for (si = 0; si < n.siblings.length; si++) {
                    var sib = n.siblings[si];
                    row[sib].sibling_line = n.sibling_line;
                }
            }
            if (n.parent_line == null && n.children.length > 0) {
                console.log('Parent conflict 1');
                var conflicts = [];
                for (var sj = 0; sj < num_label_conflicts; sj++) {
                    conflicts.push(sj);
                    console.log('Parent conflict 2 label');
                }
                verbose('    Base conflicts: ' + conflicts);
                // Check for overlapping lines using link structure only
                for (var pi = 0; pi < parent_lines.length; pi++) {
                    var index = parent_lines[pi][0];
                    var first = parent_lines[pi][1];
                    var last = parent_lines[pi][2];
                    var line = parent_lines[pi][3];
                    if (n.children[0] <= last &&
                        n.children[n.children.length - 1] >= first) {
                        verbose('    ' + y + ' ' + (x + 1) +
                            ' conflicts with parent line for ' +
                            first + ' and ' + last);
                        if (conflicts.indexOf(line) == -1) {
                            conflicts.push(line);
                            console.log('Parent conflict 3 link structure');
                        }
                    }
                }
                // Check for overlapping lines using positions
                for (var pi = 0; pi < parent_lines.length; pi++) {
                    var index = parent_lines[pi][0];
                    var first = parent_lines[pi][1];
                    var last = parent_lines[pi][2];
                    var line = parent_lines[pi][3];
                    var nextrow = this.data[y + 1];
                    var other_X = row[index].X;
                    var other_ctr = 0.5 * (nextrow[first].X + nextrow[last].X);
                    var this_X = n.X;
                    var this_ctr = 0.5 * (nextrow[n.children[0]].X +
                        nextrow[n.children[n.children.length - 1]].X);
                    if (this.segments_intersect(other_X, other_ctr, this_X, this_ctr)) {
                        verbose('    ' + y + ' ' + (x + 1) +
                            ' overlaps parent line for ' +
                            first + ' and ' + last);
                        if (conflicts.indexOf(line) == -1) {
                            conflicts.push(line);
                            console.log('Parent conflict 4 positions');
                        }
                    }
                }

                n.parent_line = 0;
                while (conflicts.indexOf(n.parent_line) >= 0) {
                    n.parent_line++;
                }
                verbose('    Choosing parent line ' + n.parent_line);
                parent_lines.push(
                    [x, n.children[0],
                        n.children[n.children.length - 1],
                        n.parent_line
                    ]);
                verbose('    ' + JSON.stringify(parent_lines));
            }
            var uobj = n.right_union;
            if (uobj && uobj.parent_line == null && uobj.children.length > 0) {
                var conflicts = [];
                for (var sj = 0; sj < num_label_conflicts; sj++) {
                    conflicts.push(sj);
                }
                for (var pi = 0; pi < parent_lines.length; pi++) {
                    var index = parent_lines[pi][0];
                    var first = parent_lines[pi][1];
                    var last = parent_lines[pi][2];
                    var line = parent_lines[pi][3];
                    if (uobj.children[0] <= last &&
                        uobj.children[uobj.children.length - 1] >= first) {
                        if (conflicts.indexOf(line) == -1) {
                            conflicts.push(line);
                        }
                    }
                }
                uobj.parent_line = 0;
                while (conflicts.indexOf(uobj.parent_line) >= 0) {
                    uobj.parent_line++;
                }
                verbose('    X2: Choosing parent line ' + uobj.parent_line);
                parent_lines.push(
                    [x,
                        uobj.children[0],
                        uobj.children[uobj.children.length - 1],
                        uobj.parent_line
                    ]);
            }
        }
        for (si = 0; si < sibling_lines.length; si++) {
            var first = sibling_lines[si][0];
            var last = sibling_lines[si][1];
            var line = sibling_lines[si][2];
            if (line + 1 > robj.num_sibling_lines) {
                robj.num_sibling_lines = line + 1;
            }
        }
        for (pi = 0; pi < parent_lines.length; pi++) {
            var index = parent_lines[pi][0];
            var first = parent_lines[pi][1];
            var last = parent_lines[pi][2];
            var line = parent_lines[pi][3];
            if (line + 1 > robj.num_parent_lines) {
                robj.num_parent_lines = line + 1;
            }
        }
        if (robj.num_parent_lines < num_label_conflicts) {
            robj.num_parent_lines = num_label_conflicts;
        }
        verbose('  Sibling lines: ' + JSON.stringify(sibling_lines));
        verbose('  Parent lines: ' + JSON.stringify(parent_lines));
    }

    // Compute height and Y position of each row
    var Y = 0;
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        var max_lines = 0;
        var base_ht = MIN_VERTICAL_SPACE;
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            if (n.proband) {
                base_ht += 1;
                break;
            }
        }
        var robj = this.rowobjs[y];
        robj.height = base_ht + robj.num_parent_lines + robj.num_sibling_lines;
        robj.Y = Math.floor(Y);
        verbose('Row ' + y + ': Y=' + robj.Y +
            ' height=' + robj.height +
            ' parent_lines=' + robj.num_parent_lines +
            ' sibling_lines=' + robj.num_sibling_lines);
        robj.num_parent_lines = 0;
        robj.num_sibling_lines = 0;
        Y += robj.height;
    }
    this.Ymax = Y;

    // Debug: print everyone's position
    if (VERBOSE) {
        for (row_index = 0; row_index < rows.length; row_index++) {
            var y = rows[row_index];
            var row = this.data[y];
            var robj = this.rowobjs[y];
            for (var x = 0; x < row.length; x++) {
                var n = row[x];
                out(y + ' ' + (x + 1) + ': ' + n.X + ', ' + robj.Y);
                if (n.right_union != null)
                    out('  UNION');
            }
        }
    }
};

pedigree.Pedigree.prototype.html_makediagonalline = function(element, x0, y0, x1, y1) {
    if (x1 < x0) {
        var tmp = x0;
        x0 = x1;
        x1 = tmp;
        tmp = y0;
        y0 = y1;
        y1 = tmp;
    }
    element.className = 'diagonal_line';
    var length = Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
    element.style.width = length + 'px';
    if (element.style.MozTransform != undefined ||
        element.style.WebkitTransform != undefined ||
        element.style.OTransform != undefined ||
        element.style.transform != undefined) {
        var angle = Math.atan((y1 - y0) / (x1 - x0));
        element.style.top = y0 + 0.5 * length * Math.sin(angle) + 'px';
        element.style.left = x0 - 0.5 * length * (1 - Math.cos(angle)) + 'px';
        element.style.MozTransform = 'rotate(' + angle + 'rad)';
        element.style.WebkitTransform = 'rotate(' + angle + 'rad)';
        element.style.OTransform = 'rotate(' + angle + 'rad)';
    } else {
        // IE.
        element.style.top = (y1 > y0) ? y0 + 'px' : y1 + 'px';
        element.style.left = x0 + 'px';
        var nCos = (x1 - x0) / length;
        var nSin = (y1 - y0) / length;
        element.style.filter =
            'progid:DXImageTransform.Microsoft.Matrix(' +
            'sizingMethod="auto expand", ' +
            'M11=' + nCos + ', M12=' + -1 * nSin +
            ', M21=' + nSin + ', M22=' + nCos + ')';
    }
};

pedigree.Pedigree.prototype.html_makeline = function(x0, x1, y0, y1, debug_label) {
    verbose('makeline ' + x0 + ', ' + y0 + ' : ' + x1 + ', ' + y1 +
        ' ' + debug_label);
    var element = this.doc.createElement('div');
    if (debug_label) {
        element.setAttribute('name', debug_label);
    }
    if (y0 == y1) {
        if (x1 < x0) {
            var tmp = x1;
            x1 = x0;
            x0 = tmp;
        }
        element.className = 'hline';
        element.style['left'] = (this.scale * x0 + this.leftOffset) + 'px';
        element.style['top'] = (this.scale * y0 + this.topOffset) + 'px';
        element.style['width'] = (this.scale * (x1 - x0)) + 'px';
    } else if (x0 == x1) {
        if (y1 < y0) {
            var tmp = y1;
            y1 = y0;
            y0 = tmp;
        }
        element.className = 'vline';
        element.style['left'] = (this.scale * x0 + this.leftOffset) + 'px';
        element.style['top'] = (this.scale * y0 + this.topOffset) + 'px';
        element.style['height'] = (this.scale * (y1 - y0)) + 'px';
    } else {
        this.makediagonalline(element,
            this.scale * x0 + this.leftOffset, this.scale * y0 + this.topOffset,
            this.scale * x1 + this.leftOffset, this.scale * y1 + this.topOffset);
    }
    this.container.appendChild(element);
};

pedigree.Pedigree.prototype.html_makerowcontainer = function(y, robj) {
    var row_container = this.doc.createElement('div');
    row_container.setAttribute('role', 'row');
    row_container.className = 'row';
    this.container.appendChild(row_container);
    robj.rowmarker = this.makerowmarker(y, robj);
    row_container.appendChild(robj.rowmarker);
    return row_container;
};

pedigree.Pedigree.prototype.pdf_makeline = function(x0, x1, y0, y1, debug_label) {
    verbose('makeline ' + x0 + ', ' + y0 + ' : ' + x1 + ', ' + y1 +
        ' ' + debug_label);
    var xx0 = (this.scale * x0 - this.margin) + this.leftOffset;
    var yy0 = (this.scale * y0 - this.margin) + this.topOffset;
    var xx1 = (this.scale * x1 - this.margin) + this.leftOffset;
    var yy1 = (this.scale * y1 - this.margin) + this.topOffset;

    this.pdf.lines([
            [xx1 - xx0, yy1 - yy0]
        ],
        xx0, yy0);
};

pedigree.Pedigree.prototype.pdf_makediagonalline = function(element, x0, y0, x1, y1) {
    this.pdf_makeline(x0, x1, y0, y1, 'diagonal');
};

pedigree.Pedigree.prototype.pdf_makerowcontainer = function(y, robj) {
    return null;
};

pedigree.Pedigree.prototype.makechildlines = function(
    Xtop, Ytop, Xcenter, Yparent, Ysibling, Ychild, children, debug_label) {
    verbose('makechildlines ' + debug_label);
    // Parent to center of sibling line
    this.makeline(Xtop, Xtop, Ytop, Yparent, debug_label + ' A');
    this.makeline(Xtop, Xcenter, Yparent, Yparent, debug_label + ' B');
    this.makeline(Xcenter, Xcenter, Yparent, Ysibling, debug_label + ' C');
    // Sibling line
    var siblingLeft = children[0].X;
    var siblingRight = children[children.length - 1].X;
    if (children.length > 1) {
        if (children[0].twin) {
            siblingLeft = 0.5 * (children[0].X + children[1].X);
        }
        if (children[children.length - 2].twin) {
            siblingRight = 0.5 * (children[children.length - 2].X +
                children[children.length - 1].X);
        }
        this.makeline(2.5 + siblingLeft, 2.5 + siblingRight,
            Ysibling, Ysibling, debug_label + ' D');
    }
    // Lines from the sibling line to each child
    for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c.multiple == 0) {
            this.makeline(2.0 + c.X, 3.0 + c.X,
                Ysibling, Ysibling,
                debug_label + ' S' + i);
            continue;
        }
        if (c.twin && i + 1 < children.length) {
            var topX = 0.5 * (c.X + children[i + 1].X);
        } else if (i > 0 && children[i - 1].twin) {
            topX = 0.5 * (c.X + children[i - 1].X);
        } else {
            topX = c.X;
        }
        this.makeline(2.5 + topX, 2.5 + c.X,
            Ysibling, Ychild - 0.02,
            debug_label + ' S' + i);
    }
};

pedigree.Pedigree.prototype.html_makerowmarker = function(y, robj) {
    var element = this.doc.createElement('div');
    element.id = 'r' + y;
    element.tabIndex = -1;
    var Y = robj.Y;
    var X = -1.5;
    var left = (this.scale * X - MARGIN) + this.leftOffset;
    var top = (this.scale * Y - MARGIN) + this.topOffset;
    element.style['left'] = left + 'px';
    element.style['top'] = top + 'px';
    element.className = 'scale' + this.scale + ' rowmarker';
    element.setAttribute('px', '0');
    element.setAttribute('py', y);
    element.setAttribute('role', 'gridcell');

    var text = this.doc.createElement('div');
    text.setAttribute('aria-hidden', 'true');
    text.innerHTML = y;
    element.appendChild(text);

    var accessible_label = this.doc.createElement('div');
    accessible_label.className = 'accessible_label';
    accessible_label.innerHTML = 'Beginning of row ' + y +
        ' with ' + this.data[y].length + ' items';
    element.appendChild(accessible_label);

    return element;
};

pedigree.Pedigree.prototype.pdf_makerowmarker = function(y, robj) {
    return null;
};

pedigree.Pedigree.prototype.html_maketitle = function() {
    var element = this.doc.createElement('div');
    element.id = 'title';
    var left = this.leftOffset;
    var top = this.topOffset;
    element.style['left'] = this.leftOffset + 'px';
    element.style['top'] = TOP + 'px';
    for (var i = 0; i < this.text_lines.length; i++) {
        element.appendChild(this.doc.createTextNode(this.text_lines[i]));
        element.appendChild(this.doc.createElement('br'));
    }
    return element;
};

pedigree.Pedigree.prototype.pdf_maketitle = function() {
    var scale = this.scale;
    var left = 5.5 * 72;
    var top = 0.75 * 72;
    this.pdf.setFontSize(8);
    for (var i = 0; i < this.text_lines.length; i++) {
        var line = this.text_lines[i];
        var width = 7 * this.pdf.getStringUnitWidth(line);
        this.pdf.text(line, left - width / 2, top + i * scale);
    }
    return null;
};

pedigree.Pedigree.prototype.html_makeperson = function(n, x, y, X, Y, coords) {
    var element = this.doc.createElement('div');
    element.tabIndex = -1;
    var left = (this.scale * (X + 2.0) - MARGIN) + this.leftOffset;
    var top = (this.scale * Y - MARGIN) + this.topOffset;
    element.style['left'] = left + 'px';
    element.style['top'] = top + 'px';
    var classes = [];
    classes.push('scale' + this.scale);
    element.setAttribute('px', x);
    element.setAttribute('py', y);
    element.setAttribute('role', 'gridcell');
    if (n.multiple == 0) {
        classes.push('nonexistant');
    } else {
        classes.push(n.gender);
        if (n.affected) {
            classes.push('affected');
        }
        if (n.carrier) {
            classes.push('carrier');
            var carrier_dot = this.doc.createElement('div');
            carrier_dot.className = 'carrier_dot';
            element.appendChild(carrier_dot);
        }
        if (n.proband) {
            classes.push('proband');
            var proband_arrow = this.doc.createElement('div');
            proband_arrow.className = 'proband_arrow';
            element.appendChild(proband_arrow);
        }
        if (n.dead) {
            classes.push('dead');
            var dead_slash = this.doc.createElement('div');
            dead_slash.className = 'dead_slash';
            element.appendChild(dead_slash);
        }
    }

    element.className = classes.join(' ');

    var highlight = this.doc.createElement('div');
    highlight.className = 'highlight';
    element.appendChild(highlight);

    var coords_label = this.doc.createElement('div');
    coords_label.className = 'coords';
    coords_label.innerHTML = coords;
    coords_label.setAttribute('aria-hidden', 'true');
    element.appendChild(coords_label);

    var ctr_label = this.doc.createElement('div');
    ctr_label.className = 'ctr_label';
    ctr_label.setAttribute('aria-hidden', 'true');
    element.appendChild(ctr_label);
    if (n.pregnancy) {
        ctr_label.innerHTML = 'P';
    } else if (n.multiple == 10) {
        ctr_label.innerHTML = 'n';
    } else if (n.multiple > 1) {
        ctr_label.innerHTML = n.multiple;
    }

    var text_label = this.doc.createElement('div');
    text_label.className = 'text_label';
    var text = this.doc.createTextNode(n.label);
    text_label.appendChild(text);
    text_label.setAttribute('aria-hidden', 'true');
    element.appendChild(text_label);

    var accessible_label = this.doc.createElement('div');
    accessible_label.className = 'accessible_label';
    accessible_label.innerHTML = this.describe(x, y);
    element.appendChild(accessible_label);

    return element;
};

pedigree.Pedigree.prototype.pdf_makeperson = function(
    n, x, y, X, Y, coords) {
    this.pdf.setLineWidth(0.5);
    var scale = this.scale;
    var WIDTH = 1 * this.scale;
    var HEIGHT = 1 * this.scale;
    var HALF = 0.5 * this.scale;
    var left = (this.scale * (X + 2.0) - this.margin) + this.leftOffset;
    var top = (this.scale * Y - this.margin) + this.topOffset;

    if (n.affected) {
        this.pdf.setFillColor(200);
    } else {
        this.pdf.setFillColor(255);
    }

    if (n.multiple != 0) {
        if (n.gender == 'male') {
            this.pdf.rect(left, top, WIDTH, HEIGHT, 'FD');
        } else if (n.gender == 'female') {
            this.pdf.circle(left + HALF, top + HALF, HALF, 'FD');
        } else if (n.gender == 'nogender') {
            this.pdf.triangle(left + HALF, top,
                left + WIDTH, top + HALF,
                left, top + HALF, 'F');
            this.pdf.triangle(left + HALF, top + HEIGHT,
                left + WIDTH, top + HALF,
                left, top + HALF, 'F');
            this.pdf.lines([
                    [HALF, HALF],
                    [-HALF, HALF],
                    [-HALF, -HALF],
                    [HALF, -HALF]
                ],
                left + HALF, top);
        } else if (n.gender == 'pregloss') {
            this.pdf.triangle(left + HALF, top,
                left + WIDTH, top + HALF,
                left, top + HALF, 'FD');
        }

        if (n.dead) {
            this.pdf.lines([
                    [1.2 * scale, -1.2 * scale]
                ],
                left - 0.1 * scale, top + 1.1 * scale);
        }
    }

    this.pdf.setFontSize(7);
    var ctr_label = '';
    if (n.pregnancy) {
        ctr_label = 'P';
    } else if (n.multiple == 10) {
        ctr_label = 'n';
    } else if (n.multiple > 1) {
        ctr_label = '' + n.multiple;
    }
    if (ctr_label) {
        this.pdf.text(ctr_label, left + 0.3 * scale, top + 0.75 * scale);
    }

    if (n.label) {
        for (var i = 0; i < n.label_lines.length; i++) {
            var line = n.label_lines[i];
            var width = 7 * this.pdf.getStringUnitWidth(line);
            this.pdf.text(line, left + HALF - width / 2, top + 2 * scale + i * scale);
        }
    }

    if (n.carrier) {
        var R = WIDTH / 10.0;
        this.pdf.setFillColor(0);
        this.pdf.circle(left + HALF, top + HALF, R, 'FD');
    }

    if (n.proband) {
        this.pdf.setLineWidth(1.0);
        this.pdf.lines([
                [-1.0 * scale, 0.4 * scale]
            ],
            left - 0.25 * scale, top + 0.65 * scale);
        this.pdf.lines([
                [-0.35 * scale, -0.15 * scale]
            ],
            left - 0.25 * scale, top + 0.65 * scale);
        this.pdf.lines([
                [-0.15 * scale, 0.35 * scale]
            ],
            left - 0.25 * scale, top + 0.65 * scale);
        this.pdf.setLineWidth(1.0);
    }
};

pedigree.Pedigree.prototype.renderHtml = function(doc, container) {
    this.doc = doc;
    this.container = container;
    this.makediagonalline = this.html_makediagonalline;
    this.makeline = this.html_makeline;
    this.makerowcontainer = this.html_makerowcontainer;
    this.makerowmarker = this.html_makerowmarker;
    this.makeperson = this.html_makeperson;
    this.maketitle = this.html_maketitle;
    this.scale = 20;

    this.text_lines = this.splittext(this.text, 600);
    this.line_height = 0.2;
    this.text_height = 1.1 * (this.text_lines.length + 1);

    this.leftOffset = LEFT;
    this.topOffset = TOP + this.scale * this.text_height;

    this.render();
};

pedigree.Pedigree.prototype.serialize = function() {
    let allowed = [
        'data', 'text', 'unions',
        'gender', 'affected', 'carrier', 'dead',
        'pregnancy', 'twin', 'proband', 'parents',
        'label', 'multiple'
    ];
    for (var row_index in this.data) {
        allowed.push(row_index);
    }

    return JSON.parse(JSON.stringify(this, allowed, 4));
};

pedigree.Pedigree.prototype.save = function(filename) {
    this.setName(filename);
    let data = JSON.stringify(this.serialize(), null, 4);
    var blob = new Blob([data], { type: 'text/json' });
    var elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
};

pedigree.Pedigree.prototype.setName = function(filename) {
    let item = JSON.parse(localStorage.getItem(this.storageKey));
    item.name = filename.split('.')[0];
    item.data = this.serialize();
    localStorage.setItem(this.storageKey, JSON.stringify(item));
};

var inpdf = 0;

pedigree.Pedigree.prototype.renderPdf = function(filename) {
    this.pdf = new jspdf.jsPDF('landscape', 'pt', 'letter');

    /**
      pdf.setProperties({
        title: '',
        subject: '',
        author: '',
        keywords: '',
        creator: '',
      });
    **/

    this.makediagonalline = this.pdf_makediagonalline;
    this.makeline = this.pdf_makeline;
    this.makerowcontainer = this.pdf_makerowcontainer;
    this.makerowmarker = this.pdf_makerowmarker;
    this.makeperson = this.pdf_makeperson;
    this.maketitle = this.pdf_maketitle;

    // Set up figure
    var Xmargin = 0.75;
    var Ymargin = 0.75;

    this.text_lines = this.splittext(this.text, 600);
    var line_height_guess = 1.5;
    var text_height_guess = 2.5 + line_height_guess * this.text_lines.length;

    var pages = 1;
    var landscape = true;
    var Xpage = 11.0;
    var Ypage = 8.5;
    var Xinnerpage = Xpage - (2 * pages) * Xmargin;
    var Yinnerpage = Ypage - (2 * pages) * Ymargin;
    this.margin = 12;
    this.scale = 10;

    //if scale < 0.1 && pages < 3 {
    //  // Return false, which forces the calling function
    //  // to call again with multiple pages.
    //  return false;
    // }

    this.text_height = 1.2 * this.scale * (this.text_lines.length + 2);

    this.leftOffset = LEFT;
    this.topOffset = TOP + this.text_height;
    inpdf = 1;
    this.render();
    inpdf = 0;

    if (this.Xmax * this.scale / 72. + (2 * Xmargin) > Xpage) {
        this.pdf.addPage();
        this.pdf.text('Page 2', 1 * 72, 1 * 72);
        this.leftOffset = LEFT - 9 * 72;
        this.render();
    }

    this.pdf.save(filename);
};

pedigree.Pedigree.prototype.render = function() {
    var rows = [];
    for (var row_index in this.data) {
        rows.push(parseInt(row_index, 10));
    }
    rows.sort(sort_numerical_ascending);

    if (this.leftOffset > 0) {
        var title_element = this.maketitle();
        if (title_element) {
            this.container.appendChild(title_element);
        }
    }

    // Main drawing loop
    for (row_index = 0; row_index < rows.length; row_index++) {
        var y = rows[row_index];
        var row = this.data[y];
        var robj = this.rowobjs[y];

        var row_container = this.makerowcontainer(y, robj);
        for (var x = 0; x < row.length; x++) {
            var n = row[x];
            var element = this.makeperson(n, x, y, n.X, robj.Y, y + ' ' + (x + 1));
            if (element) {
                n.element = element;
                row_container.appendChild(n.element);
            }
            if (n.right_union != null) {
                this.makeline(n.X + 3.0, row[x + 1].X + 2.0,
                    robj.Y + 0.5, robj.Y + 0.5,
                    'Union of ' + y + ' ' + (x + 1) + ' and ' +
                    y + ' ' + (x + 2));
                var uobj = n.right_union;
                if (uobj.children.length > 0) {
                    var child_nodes = [];
                    for (var ci = 0; ci < uobj.children.length; ci++) {
                        var c = uobj.children[ci];
                        child_nodes.push(this.data[y + 1][c]);
                    }
                    var Xcenter = 2.5 + 0.5 * (child_nodes[0].X +
                        child_nodes[child_nodes.length - 1].X);
                    var Ysibling = this.rowobjs[y + 1].Y - 1 -
                        child_nodes[0].sibling_line;
                    var debug_label = 'Child lines from union of ' + y + ' ' + (x + 1) +
                        ' and ' + y + ' ' + (x + 2);
                    this.makechildlines(
                        2.5 + 0.5 * (n.X + row[x + 1].X), // Xtop
                        robj.Y + 0.5, // Ytop
                        Xcenter, // Xcenter
                        robj.Y + 1.5 + uobj.parent_line, // Yparent
                        Ysibling, // Ysibling
                        this.rowobjs[y + 1].Y, // Ychild
                        child_nodes, // children
                        debug_label);
                }
            }
            if (n.children.length > 0) {
                var child_nodes = [];
                for (var ci = 0; ci < n.children.length; ci++) {
                    var c = n.children[ci];
                    child_nodes.push(this.data[y + 1][c]);
                }
                var Xcenter = 2.5 + 0.5 * (child_nodes[0].X +
                    child_nodes[child_nodes.length - 1].X);
                var Ysibling = this.rowobjs[y + 1].Y - 1 - child_nodes[0].sibling_line;
                var debug_label = 'Child lines from ' + y + ' ' + (x + 1);
                this.makechildlines(
                    2.5 + n.X, // Xtop
                    robj.Y + 1.0, // Ytop
                    Xcenter, // Xcenter
                    robj.Y + 1.5 + n.parent_line, // Yparent
                    Ysibling, // Ysibling
                    this.rowobjs[y + 1].Y, // Ychild
                    child_nodes, // children
                    debug_label);
            }
        }
    }
};

export default pedigree;

// Indentation settings for Vim and Emacs.
//
// Local Variables:
// js2-basic-offset: 2
// indent-tabs-mode: nil
// End:
//
// vim: et sts=2 sw=2