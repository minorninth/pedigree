window.COV = {};
COV[0] = 1; 'use strict';

function AssertException(message) {
COV[1] = 1;    this.message = message;
}

AssertException.prototype.toString = function () {
COV[2] = 1;   return 'AssertException: ' + this.message;
COV[3] = 1; };

function assert(exp, message) {
  if (!exp) {
COV[4] = 1;     throw new AssertException(message);
  }
}

function assertEquals(s1, s2) {
  if (s1 != s2) {
COV[5] = 1;     throw new AssertException('Got \'' + s1 + '\', expected \'' + s2 + '\'');
  }
}

function out(s) {
COV[6] = 1;   console.log(s);
}

function verbose(s) {
COV[7] = 1;   console.log(s);
}

function sort_numerical_ascending(x, y) {
COV[8] = 1;   return x - y;
}

COV[9] = 1; var VERBOSE = true;

COV[10] = 1; var LARGE_LABEL_CHARS = 50;   // A node with more than this many chars gets
                              // twice as much horizontal space for its text
COV[11] = 1; var MED_LABEL_CHARS = 4;      // A node with more than this many chars gets
                              // a little more horizontal space for its text

COV[12] = 1; var MIN_HORIZONTAL_SPACE         = 1.6;

// Extra space (each end) for med label
COV[13] = 1; var EXTRA_MED_HORIZONTAL_SPACE   = 2.75;
// Extra space (each end) for large label
COV[14] = 1; var EXTRA_LARGE_HORIZONTAL_SPACE = 7.0;

COV[15] = 1; var MIN_VERTICAL_SPACE           = 2.5;

COV[16] = 1; var pedigree = {};

pedigree.initWithDefault = function(valueOrUndefined, defaultValue) {
COV[17] = 1;  return typeof(valueOrUndefined) == 'undefined' ?
       defaultValue : valueOrUndefined;
COV[18] = 1; };

pedigree.isValidGender = function(gender) {
COV[19] = 1;  return (gender == 'male' ||
          gender == 'female' ||
          gender == 'nogender' ||
           gender == 'pregloss');
COV[20] = 1; };

pedigree.Node = function(genderOrSourceJsonObject) {
COV[21] = 1;   var src;
  if (typeof(genderOrSourceJsonObject) == 'object') {
COV[22] = 1;     src = genderOrSourceJsonObject;
  } else {
COV[23] = 1;     src = { 'gender': genderOrSourceJsonObject };
  }

COV[24] = 1;   this.gender = src.gender;
COV[25] = 1;   console.log('gender: ' + src.gender);
COV[26] = 1;   //assert(pedigree.isValidGender(src.gender));

COV[27] = 1;   this.affected = pedigree.initWithDefault(src.affected, false);
COV[28] = 1;   this.carrier = pedigree.initWithDefault(src.carrier, false);
COV[29] = 1;   this.dead = pedigree.initWithDefault(src.dead, false);
COV[30] = 1;   this.pregnancy = pedigree.initWithDefault(src.pregnancy, false);
COV[31] = 1;   this.twin = pedigree.initWithDefault(src.twin, false);
COV[32] = 1;   this.proband = pedigree.initWithDefault(src.proband, false);
COV[33] = 1;   this.parents = pedigree.initWithDefault(src.parents, null);
COV[34] = 1;   this.label = pedigree.initWithDefault(src.label, '');
  // 1 = default, 0 = nonexistant, 10 = "n" people
COV[35] = 1;   this.multiple = pedigree.initWithDefault(src.multiple, 1);
COV[36] = 1; };

pedigree.State = function(action, data, unions, x0, y0, text) {
COV[37] = 1;   this.action = action;
COV[38] = 1;   this.data = {};
COV[39] = 1;   this.text = text;
  for (var y in data) {
COV[40] = 1;     this.data[y] = [];
COV[41] = 1;     for (var j = 0; j < data[y].length; j++) {
COV[42] = 1;       this.data[y].push(new pedigree.Node(data[y][j]));
    }
  }
COV[43] = 1;   this.unions = [];
COV[44] = 1;   for (var i = 0; i < unions.length; i++) {
COV[45] = 1;     this.unions.push(unions[i]);
  }
COV[46] = 1;   this.x = x0;
COV[47] = 1;   this.y = y0;
COV[48] = 1; };

pedigree.Pedigree = function() {
COV[49] = 1;   this.text = 'Created by Ronit Mazzoni';
COV[50] = 1;   this.data = {};
COV[51] = 1;   this.data[1] = [];
COV[52] = 1;   this.unions = [];
COV[53] = 1;   this.char_history = "  ";
COV[54] = 1;   this.redo_history = [];
COV[55] = 1;   this.undo_history = [0, 0];
COV[56] = 1;   this.dirty = false;
COV[57] = 1;   this.prev_parents = null;
COV[58] = 1;   this.last_dot = false;
COV[59] = 1; };

pedigree.Pedigree.prototype.push = function(action, x, y) {
COV[60] = 1;   var s = new pedigree.State(action, this.data, this.unions, x, y, this.text);
COV[61] = 1;   this.undo_history.push(s);
  if (this.redo_history != []) {
COV[62] = 1;     this.redo_history = [];
  }
COV[63] = 1;   this.dirty = true;
COV[64] = 1; };

pedigree.Pedigree.prototype.loadstate = function(s) {
COV[65] = 1;   this.data = {};
COV[66] = 1;   this.text = s.text;
  for (var y in s.data) {
COV[67] = 1;     this.data[y] = s.data[y];
  }
COV[68] = 1;   this.unions = [];
COV[69] = 1;   for (var i = 0; i < s.unions.length; i++) {
COV[70] = 1;     this.unions.push(s.unions[i]);
  }
COV[71] = 1;   return [s.x, s.y];
COV[72] = 1; };

pedigree.Pedigree.prototype.undo = function() {
  if (this.undo_history.length <= 1) {
COV[73] = 1;     out("Nothing to undo.");
COV[74] = 1;     return null;
  }

COV[75] = 1;   var s = this.undo_history.pop();
COV[76] = 1;   this.redo_history.append(s);
COV[77] = 1;   out('Undoing ' + a.action);
COV[78] = 1;   return this.loadstate(this.undo_history[this.undo_history.length - 1]);
COV[79] = 1; };

pedigree.Pedigree.prototype.redo = function() {
  if (this.redo_history == []) {
COV[80] = 1;     out("Nothing to redo.");
COV[81] = 1;     return null;
  }

COV[82] = 1;   var s = this.redo_history.pop();
COV[83] = 1;   this.undo_history.append(s);
COV[84] = 1;   out('Redoing ' + a.action);
COV[85] = 1;   return this.loadstate(s);
COV[86] = 1; };

pedigree.Pedigree.prototype.move = function(x1, y1, x2, y2) {
COV[87] = 1;   console.log('move ' + JSON.stringify([x1, y1, x2, y2]));
COV[88] = 1;   console.log('unions before: ' + JSON.stringify(this.unions));
COV[89] = 1;   var u2 = [];
COV[90] = 1;   for (var i = 0; i < this.unions.length; i++) {
COV[91] = 1;     var u = this.unions[i];
COV[92] = 1;     var xx1 = u[0];
COV[93] = 1;     var yy1 = u[1];
COV[94] = 1;     var xx2 = u[2];
COV[95] = 1;     var yy2 = u[3];
    if (xx1 == x1 && yy1 == y1) {
COV[96] = 1;       xx1 = x2;
COV[97] = 1;       yy1 = y2;
    }
    if (xx2 == x1 && yy2==y1) {
COV[98] = 1;       xx2 = x2;
COV[99] = 1;       yy2 = y2;
    }
COV[100] = 1;     u2.push([xx1, yy1, xx2, yy2]);
  }
COV[101] = 1;   this.unions = u2;
COV[102] = 1;   console.log('unions after: ' + JSON.stringify(this.unions));
  for (var row_y in this.data) {
COV[103] = 1;     var row = this.data[row_y];
COV[104] = 1;     for (var col_x = 0; col_x < row.length; col_x++) {
COV[105] = 1;       var n = row[col_x];
      if (n.parents != null) {
COV[106] = 1;         var xx1 = n.parents[0];
COV[107] = 1;         var yy1 = n.parents[1];
COV[108] = 1;         var xx2 = n.parents[2];
COV[109] = 1;         var yy2 = n.parents[3];
        if (xx1 == x1 && yy1 == y1) {
COV[110] = 1;           xx1 = x2;
COV[111] = 1;           yy1 = y2;
        }
        if (xx2 == x1 && yy2 == y1) {
COV[112] = 1;           xx2 = x2;
COV[113] = 1;           yy2 = y2;
        }
COV[114] = 1;         n.parents = [xx1, yy1, xx2, yy2];
      }
    }
  }
COV[115] = 1; };

pedigree.Pedigree.prototype.addnode = function(n, x, y) {
COV[116] = 1;   var row = this.data[y];
COV[117] = 1;   row.splice(x, 0, n);
COV[118] = 1;   for (var i = row.length - 1; i > x; i--) {
COV[119] = 1;     this.move(i - 1, y, i, y);
  }
COV[120] = 1; };

pedigree.Pedigree.prototype.union = function(x, y) {
  if (x == -1) {
    // Error: beginning of row
COV[121] = 1;     return;
  }
COV[122] = 1;   var row = this.data[y];
COV[123] = 1;   var n = row[x];
COV[124] = 1;   var other_gender;
  if (n.gender == 'male') {
COV[125] = 1;     other_gender = 'female';
  } else if (n.gender == 'female') {
COV[126] = 1;     other_gender = 'male';
  } else {
    // Error: can't union a person without a M/F gender
COV[127] = 1;     return;
  }

COV[128] = 1;   for (var i = 0; i < this.unions.length; i++) {
COV[129] = 1;     var u = this.unions[i];
COV[130] = 1;     var x1 = u[0];
COV[131] = 1;     var y1 = u[1];
COV[132] = 1;     var x2 = u[2];
COV[133] = 1;     var y2 = u[3];
    if ((x1 == x && y1 ==y) || (x2 == x && y2 == y)) {
      // Already unioned, delete it.
COV[134] = 1;       this.unions.splice(i, 1);
COV[135] = 1;
      this.push('deleting union between ' + y1 + ' ' + (x1 + 1) + ' and ' +
                 y2 + ' ' + (x2 + 1), x, y);
COV[136] = 1;       return;
    }
  }

COV[137] = 1;   var x2 = null;
COV[138] = 1;   var y2 = null;
  if (x > 0 && row[x - 1].gender == other_gender) {
COV[139] = 1;     x2 = x - 1;
COV[140] = 1;     y2 = y;
  } else if (x < row.length - 1 && row[x + 1].gender == other_gender) {
COV[141] = 1;     x2 = x + 1;
COV[142] = 1;     y2 = y;
  } else {
    // Error: nobody to union with
COV[143] = 1;     return;
  }

COV[144] = 1;   this.unions.push([x, y, x2, y2]);
COV[145] = 1;  this.push('creating union between ' + y + ' ' + (x + 1) + ' and ' +
             y2 + ' ' + (x2 + 1));
COV[146] = 1; };

pedigree.Pedigree.prototype.out_counts = function(count_list) {
COV[147] = 1;   var str = '';
COV[148] = 1;   for (var i = 0; i < count_list.length; i++) {
COV[149] = 1;     var count_tuple = count_list[i];
    if (str != '')
COV[150] = 1;       str += ', ';
COV[151] = 1;     var count = count_tuple[0];
COV[152] = 1;     var singular = count_tuple[1];
COV[153] = 1;     var plural;
    if (count_tuple.length == 2) {
COV[154] = 1;       plural = singular + 's';
    } else {
COV[155] = 1;       plural = count_tuple[2];
    }

COV[156] = 1;     str += count + ' ';
    if (count == 1) {
COV[157] = 1;       str += singular;
    } else {
COV[158] = 1;       str += plural;
    }
  }
COV[159] = 1;   out(str + '.');
COV[160] = 1; };

pedigree.Pedigree.prototype.describe_all = function() {
COV[161] = 1;   out(this.text);

COV[162] = 1;   var proband_count = 0;
COV[163] = 1;   var affected_count = 0;
COV[164] = 1;   var carrier_count = 0;
COV[165] = 1;   var pregnancy_count = 0;
COV[166] = 1;   var twin_count = 0;
COV[167] = 1;   var dead_count = 0;
COV[168] = 1;   var male_count = 0;
COV[169] = 1;   var female_count = 0;
COV[170] = 1;   var nogender_count = 0;
COV[171] = 1;   var pregloss_count = 0;
COV[172] = 1;   var row_count = 0;
COV[173] = 1;   var node_count = 0;
COV[174] = 1;   var person_count = 0;
  for (var y1 in this.data) {
COV[175] = 1;     row = this.data[y1];
COV[176] = 1;     row_count++;
COV[177] = 1;     for (var x1 = 0; x1 < row.length; x1++) {
COV[178] = 1;       var n = row[x1];
COV[179] = 1;       n.connections = 0;
COV[180] = 1;       node_count++;
COV[181] = 1;       person_count += n.multiple;
      if (n.gender == 'male')
COV[182] = 1;         male_count += n.multiple;
      if (n.gender == 'female')
COV[183] = 1;         female_count += n.multiple;
      if (n.gender == 'nogender')
COV[184] = 1;         nogender_count += n.multiple;
      if (n.gender == 'pregloss')
COV[185] = 1;         pregloss_count += n.multiple;
      if (n.proband)
COV[186] = 1;         proband_count += n.multiple;
      if (n.affected)
COV[187] = 1;         affected_count += n.multiple;
      if (n.pregnancy)
COV[188] = 1;         pregnancy_count += n.multiple;
      if (n.twin)
COV[189] = 1;         twin_count += n.multiple;
      if (n.carrier)
COV[190] = 1;         carrier_count += n.multiple;
      if (n.dead)
COV[191] = 1;         dead_count += n.multiple;
    }
  }

  // print main stats                                                                               
  if (node_count == 0) {
COV[192] = 1;     out('The pedigree is completely empty.');
COV[193] = 1;     return;
  }

COV[194] = 1;
  this.out_counts(
      [[node_count, 'node'],
       [person_count, 'person', 'people'],
       [row_count, 'row'],
       [male_count, 'male'],
       [female_count, 'female'],
       [nogender_count, 'person of unknown gender',
      'people of unknown gender'],
       [pregloss_count, 'pregnancy loss',
        'pregnancy losses'],
       [proband_count, 'proband'],
       [pregnancy_count, 'pregnancy', 'pregnancies'],
       [twin_count, 'twin'],
       [affected_count, 'affected person', 'affected people'],
       [carrier_count, 'carrier'],
       [dead_count, 'dead person', 'dead people']]);

  // count the number of connections (parents, children, unions)
  // each person has.
  for (var row_y in this.data) {
COV[195] = 1;     var row = this.data[row_y];
COV[196] = 1;     for (var col_x = 0; col_x < row.length; col_x++) {
COV[197] = 1;       var n = row[col_x];
      if (n.parents != null) {
COV[198] = 1;         var x1 = n.parents[0];
COV[199] = 1;         var y1 = n.parents[1];
COV[200] = 1;         var x2 = n.parents[2];
COV[201] = 1;         var y2 = n.parents[3];
COV[202] = 1;         n.connections++;
        if (x1 != null && y1 != null)
COV[203] = 1;           this.data[y1][x1].connections++;
        if (x2 != null && y2 != null)
COV[204] = 1;           this.data[y2][x2].connections++;
      }
    }
  }
COV[205] = 1;   for (var i = 0; i < this.unions.length; i++) {
COV[206] = 1;     var x1 = this.unions[i][0];
COV[207] = 1;     var y1 = this.unions[i][1];
COV[208] = 1;     var x2 = this.unions[i][2];
COV[209] = 1;     var y2 = this.unions[i][3];
COV[210] = 1;     this.data[y1][x1].connections++;
COV[211] = 1;     this.data[y2][x2].connections++;
  }

  // print disconnected people
COV[212] = 1;   var no_connection_count = 0;
  for (row_y in this.data) {
COV[213] = 1;     var row = this.data[row_y];
COV[214] = 1;     for (var col_x = 0; col_x < row.length; col_x++) {
COV[215] = 1;       var n = row[col_x];
      if (n.connections == 0)
COV[216] = 1;         no_connection_count++;
    }
  }

  if (no_connection_count == 0) {
COV[217] = 1;     out('Everyone in the pedigree is connected to at least one other.');
  } else if (no_connection_count == node_count) {
COV[218] = 1;     out('Nobody in the pedigree is connected to anyone else.');
  } else if (no_connection_count == 1) {
COV[219] = 1;     out('The following person is not connected:');
  } else {
COV[220] = 1;     out('The following %d people are not connected:' + no_connection_count);
  }

  if (no_connection_count > 0 && no_connection_count < node_count) {
    for (row_y in this.data) {
COV[221] = 1;       var row = this.data[row_y];
COV[222] = 1;       for (var col_x = 0; col_x < row.length; col_x++) {
COV[223] = 1;         var n = row[col_x];
        if (n.connections == 0)
COV[224] = 1;           out('  ' + y1 + ' ' + (x1+1));
      }
    }
  }

COV[225] = 1;   out('');
COV[226] = 1; };

pedigree.Pedigree.prototype.describe = function(x, y) {
COV[227] = 1;   var row = this.data[y];
  if (row == []) {
COV[228] = 1;     out('Row ' + y + ' is empty.');
COV[229] = 1;     return;
  } else if (x==-1) {
COV[230] = 1;     out('Beginning of row ' + y + ', length ' + row.length);
COV[231] = 1;     return;
  }

COV[232] = 1;   var n = row[x];
COV[233] = 1;   var str = y + ' ' + (x + 1) + ' is';

  if (n.proband) {
COV[234] = 1;     str += ' the proband and is';
  }
  if (n.multiple == 10) {
COV[235] = 1;     str += ' nx';
  } else if (n.multiple > 1) {
COV[236] = 1;     str += ' ' + n.multiple + 'x';
  }
  if (n.affected) {
COV[237] = 1;     str += ' an affected';
  }

  if (n.multiple == 0) {
COV[238] = 1;     str += ' a nonexistant child';
  } else {
    if (n.gender == 'male') {
COV[239] = 1;       str += ' male';
    }
    if (n.gender == 'female') {
COV[240] = 1;       str += ' female';
    }
    if (n.gender == 'nogender') {
COV[241] = 1;       str += ' person of unknown gender';
    }
    if (n.gender == 'pregloss') {
COV[242] = 1;       str += ' pregnancy loss';
    }
  }

  if (n.pregnancy) {
COV[243] = 1;     str += ', a pregnancy';
  }
  if (n.twin) {
COV[244] = 1;     str += ', a twin with the following sibling';
  }
  if (n.carrier) {
COV[245] = 1;     str += ', a carrier';
  }
  if (n.dead) {
COV[246] = 1;     str += ', dead';
  }

  // union
COV[247] = 1;   var ustr = '';
COV[248] = 1;   var found_unions = {};
COV[249] = 1;   for (var i = 0; i < this.unions.length; i++) {
COV[250] = 1;     var x1 = this.unions[i][0];
COV[251] = 1;     var y1 = this.unions[i][1];
COV[252] = 1;     var x2 = this.unions[i][2];
COV[253] = 1;     var y2 = this.unions[i][3];
COV[254] = 1;     var x1_y1_str = x1 + ',' + y1;
COV[255] = 1;     var x2_y2_str = x2 + ',' + y2;
    if (x1 == x && y1 == y && found_unions[x2_y2_str] == undefined) {
COV[256] = 1;       found_unions[x2_y2_str] = 1;
      if (ustr == '') {
COV[257] = 1;         ustr = ', in union with ' + y2 + ' ' + (x2+1);
      } else {
COV[258] = 1;         ustr += ' and ' + y2 + ' ' + (x2+1);
      }
    }
    if (x2 == x && y2 == y && found_unions[x1_y1_str] == undefined) {
COV[259] = 1;       found_unions[x1_y1_str] = 1;
      if (ustr == '') {
COV[260] = 1;         ustr = ', in union with ' + y1 + ' ' + (x1+1);
      } else {
COV[261] = 1;         ustr += ' and ' + y1 + ' ' + (x1+1);
      }
    }
  }
COV[262] = 1;   str += ustr;

  // parents
  if (n.parents) {
COV[263] = 1;     var fx = n.parents[0];
COV[264] = 1;     var fy = n.parents[1];
COV[265] = 1;     var mx = n.parents[2];
COV[266] = 1;     var my = n.parents[3];
    if (fx != null && fy != null && mx != null && my != null) {
COV[267] = 1;      str += ', child of ' + fy + ' ' + (fx + 1) +
         ' and ' + my + ' ' + (mx + 1);
    } else if (fx != null && fy != null) {
COV[268] = 1;       str += ', child of ' + fy + ' ' + (fx + 1);
    } else if (mx != null && my != null) {
COV[269] = 1;       str += ', child of ' + my + ' ' + (mx + 1);
    }
  }

  // children
COV[270] = 1;   var children = 0;
COV[271] = 1;   var nochildren = 0;
  for (var row_y in this.data) {
COV[272] = 1;     var check_row = this.data[row_y];
COV[273] = 1;     for (var col_x = 0; col_x < check_row.length; col_x++) {
COV[274] = 1;       var person = check_row[col_x];
      if (person.parents != null) {
COV[275] = 1;         fx = person.parents[0];
COV[276] = 1;         fy = person.parents[1];
COV[277] = 1;         mx = person.parents[2];
COV[278] = 1;         my = person.parents[3];

        if ((fx == x && fy == y) || (mx == x && my == y)) {
          if (person.multiple == 0) {
COV[279] = 1;             nochildren++;
          } else {
COV[280] = 1;             children++;
          }
        }
      }
    }
  }

  if (children == 1) {
COV[281] = 1;     str += ', with 1 child';
  } else if (children > 1) {
COV[282] = 1;     str += ', with ' + children + ' children';
  } else if (nochildren > 0) {
COV[283] = 1;     str += ', marked explicitly as having no children';
  }

COV[284] = 1;   str += '.';
  if (n.label != '') {
COV[285] = 1;     str += ' ' + n.label;
  }
COV[286] = 1;   out(str);
COV[287] = 1; };

// Return the length of the first string in a list, or zero if empty.
pedigree.Pedigree.prototype.pathlen = function(l) {
  if (l.length == 0) {
COV[288] = 1;     return 0;
  } else {
COV[289] = 1;     return l[0].length;
  }
COV[290] = 1; };

// See longdescribe, below, to understand the format of r
pedigree.Pedigree.prototype.recursive_describe_relation = function(r) {
  if (r == 'p') {
COV[291] = 1;     return 'the proband';
  }

  // Table should be in order of the longest chain to the shortest.
COV[292] = 1;
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
      [/x$/, 'a child of ']];

COV[293] = 1;   for (var i = 0; i < table.length; i++) {
COV[294] = 1;     var result = table[i][0].exec(r);
    if (result) {
COV[295] = 1;
      return (table[i][1] +
              this.recursive_describe_relation(
                   r.substr(0, r.length - result[0].length)));
    }
  }
COV[296] = 1;   return r;
COV[297] = 1; };

pedigree.Pedigree.prototype.longdescribe = function(ax, ay) {
COV[298] = 1;   var row = this.data[ay];
  if (row == []) {
COV[299] = 1;     out('Row ' + ay + ' is empty.');
COV[300] = 1;     return;
  } else if (ax == -1) {
COV[301] = 1;     out('Beginning of row ' + ay + ', length ' + row.length);
COV[302] = 1;     return;
  }

  // Find the proband
COV[303] = 1;   var px = -1;
COV[304] = 1;   var py = -1;
  for (var y in this.data) {
COV[305] = 1;     row = this.data[y];
COV[306] = 1;     for (var x = 0; x < row.length; x++) {
COV[307] = 1;       var n = row[x];
      if (n.proband) {
        if (px != -1 || py != -1) {
COV[308] = 1;
          out('Multiple probands were found, at ' +
               py + ' ' + (px + 1) + ' and ' + y + ' ' + (x + 1));
COV[309] = 1;           out('Please fix this before trying to determine relations.');
COV[310] = 1;           return;
        }
COV[311] = 1;         px = x;
COV[312] = 1;         py = y;
      }
    }
  }

  if (ay == py && ax == px) {
COV[313] = 1;     out(ay + ' ' + (ax + 1) + ' is the proband.');
COV[314] = 1;     return;
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
COV[315] = 1;     row = this.data[y];
COV[316] = 1;     for (var x = 0; x < row.length; x++) {
COV[317] = 1;       var n = row[x];
COV[318] = 1;       n.relations = [];
    }
  }

  // BFS 2: Enqueue the proband, then do a BFS
COV[319] = 1;   var r = 'p';
COV[320] = 1;   var queue = [[px, py, r]];
COV[321] = 1;   this.data[py][px].relations.push(r);
  while (queue.length > 0) {
COV[322] = 1;     var front = queue.shift();
COV[323] = 1;     x = front[0];
COV[324] = 1;     y = front[1];
COV[325] = 1;     r = front[2];
COV[326] = 1;     var n = this.data[y][x];

    if (n.parents) {
COV[327] = 1;       var fx = n.parents[0];
COV[328] = 1;       var fy = n.parents[1];
COV[329] = 1;       var mx = n.parents[2];
COV[330] = 1;       var my = n.parents[3];
      if (fx != null && fy != null) {
COV[331] = 1;         var f = this.data[fy][fx];
COV[332] = 1;         var pathlen = this.pathlen(f.relations);
        if (pathlen == 0 || pathlen == r.length + 1) {
COV[333] = 1;           f.relations.push(r + 'M');
COV[334] = 1;           queue.push([fx, fy, r + 'M']);
        }
      }
      if (mx != null && my != null) {
COV[335] = 1;         var m = this.data[my][mx];
COV[336] = 1;         pathlen = this.pathlen(m.relations);
        if (pathlen == 0 || pathlen == r.length + 1) {
COV[337] = 1;           m.relations.push(r + 'F');
COV[338] = 1;           queue.push([mx, my, r + 'F']);
        }
      }
    }

    if (this.data[y + 1] != undefined) {
COV[339] = 1;       var cy = y + 1;
COV[340] = 1;       for (var cx = 0; cx < this.data[cy].length; cx++) {
COV[341] = 1;         var c = this.data[cy][cx];
COV[342] = 1;         pathlen = this.pathlen(c.relations);
        if (pathlen > 0 && pathlen != r.length + 1) {
COV[343] = 1;           continue;
        }
COV[344] = 1;         var g;
        if (c.gender == 'male') {
COV[345] = 1;           g = 'm';
        } else if (c.gender == 'female') {
COV[346] = 1;           g = 'f';
        } else {
COV[347] = 1;           g = 'x';
        }

        if (c.parents != null) {
COV[348] = 1;           fx = c.parents[0];
COV[349] = 1;           fy = c.parents[1];
COV[350] = 1;           mx = c.parents[2];
COV[351] = 1;           my = c.parents[3];
          if ((fx == x && fy == y) || (mx == x && my == y)) {
COV[352] = 1;             c.relations.push(r + g);
COV[353] = 1;             queue.push([cx, cy, r + g]);
          }
        }
      }
    }
  }

COV[354] = 1;   var relations = this.data[ay][ax].relations;
  if (relations.length == 0) {
COV[355] = 1;     out(ay + ' ' + (ax + 1) + ' is not related to the proband.');
COV[356] = 1;     return;
  }
COV[357] = 1;   pathlen = this.pathlen(relations);

  // Do some simplifying: for each position in the path, if both
  // M and F appear, and everything up to that point is the same,
  // replace that position with U (both parents), and get rid of
  // duplicates.
COV[358] = 1;   for (var p = 1; p < pathlen; p++) {
COV[359] = 1;     var prefix = relations[0].substr(0, p);
COV[360] = 1;     var Mcount = 0;
COV[361] = 1;     var Fcount = 0;
COV[362] = 1;     var Ocount = 0;
COV[363] = 1;     var prefix_ok = true;
COV[364] = 1;     for (var r_index = 0; r_index < relations.length; r_index++) {
COV[365] = 1;       r = relations[r_index];
      if (r.substr(0, p) != prefix) {
COV[366] = 1;         prefix_ok = false;
COV[367] = 1;         break;
      }
      if (r[p] == 'M') {
COV[368] = 1;         Mcount++;
      } else if (r[p] == 'F') {
COV[369] = 1;         Fcount++;
      } else {
COV[370] = 1;         Ocount++;
      }
    }

    if (Mcount > 0 & Fcount > 0 && Ocount == 0 && prefix_ok) {
COV[371] = 1;       var new_relations = [];
COV[372] = 1;       for (r_index = 0; r_index < relations.length; r_index++) {
COV[373] = 1;         r = relations[r_index];
        if (r[p] == 'M') {
COV[374] = 1;           new_relations.push(r.substr(0, p) + 'U' + r.substr(p + 1));
        }
      }
COV[375] = 1;       relations = new_relations;
    }
  }

  // Remove duplicates.
COV[376] = 1;   new_relations = [];
COV[377] = 1;   for (r_index = 0; r_index < relations.length; r_index++) {
COV[378] = 1;     r = relations[r_index];
    if (new_relations.indexOf(r) == -1) {
COV[379] = 1;       new_relations.push(r);
    }
  }
COV[380] = 1;   relations = new_relations;

COV[381] = 1;   var strs = [];
COV[382] = 1;   for (r_index = 0; r_index < relations.length; r_index++) {
COV[383] = 1;     r = relations[r_index];
COV[384] = 1;     var str = this.recursive_describe_relation(r);
COV[385] = 1;     strs.push(str);
  }

COV[386] = 1;   out(ay + ' ' + (ax + 1) + ' is ' + strs.join(', and '));
COV[387] = 1; };

// Return true if the line segment from a0 to a1 intersects the
COV[388] = 1; // segment from b0 to b1; they may appear in any order.
pedigree.Pedigree.prototype.segments_intersect = function(a0, a1, b0, b1) {
COV[389] = 1;   var aL = Math.min(a0, a1);
COV[390] = 1;   var aR = Math.max(a0, a1);
COV[391] = 1;   var bL = Math.min(b0, b1);
COV[392] = 1;   var bR = Math.max(b0, b1);
COV[393] = 1;   return (aL <= bR && aR >= bL);
COV[394] = 1; };

pedigree.Pedigree.prototype.plot = function() {
COV[395] = 1;   var rows = [];
  for (var row_index in this.data) {
COV[396] = 1;     rows.push(parseInt(row_index, 10));
  }
COV[397] = 1;   rows.sort(sort_numerical_ascending);

  // Step 1: Initialize fields
COV[398] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[399] = 1;     var y = rows[row_index];
COV[400] = 1;     var row = this.data[y];
COV[401] = 1;     for (var x = 0; x < row.length; x++) {
COV[402] = 1;       var n = row[x];
COV[403] = 1;       n.index = x;
COV[404] = 1;       n.sibling_line = null;
COV[405] = 1;       n.parent_line = null;
COV[406] = 1;       n.siblings = [x];
COV[407] = 1;       n.children = [];
COV[408] = 1;       n.right_union = null;
COV[409] = 1;       n.left_union = null;
COV[410] = 1;       n.Xoff = 0;
      if (n.parents != null) {
COV[411] = 1;         var x1 = n.parents[0];
COV[412] = 1;         var y1 = n.parents[1];
COV[413] = 1;         var x2 = n.parents[2];
COV[414] = 1;         var y2 = n.parents[3];
        if ((y1 != null && y1 != y - 1) || (y2 != null && y2 != y - 1)) {
COV[415] = 1;          out('A parent of ' + y + ' ' + (x + 1) +
               ' is not in the row above.');
COV[416] = 1;           out('Cannot layout.');
COV[417] = 1;           return false;
        }
      }
    }
  }

  // Step 2: Calculate text extent for each node
  function textwidth(s) {
COV[418] = 1;     return s.length * 5.7;
  }

  function splittext(text, max_width) {
COV[419] = 1;     var lines = [];
COV[420] = 1;     var tokens = text.split(' ');
COV[421] = 1;     var line = tokens.shift();
    while (tokens.length > 0) {
      while (textwidth(line + ' ' + tokens[0]) < max_width) {
COV[422] = 1;         if (line.length > 0 && line[line.length - 1] == ';')
COV[423] = 1;           break;
COV[424] = 1;         line += ' ' + tokens.shift();
        if (tokens.length == 0)
COV[425] = 1;           break;
      }
      if (tokens.length == 0)
COV[426] = 1;         break;
COV[427] = 1;       if (line.length > 0 && line[line.length - 1] == ';') {
COV[428] = 1;         line = line.substr(0, line.length - 1);
      }
COV[429] = 1;       lines.push(line);
COV[430] = 1;       line = tokens.shift();
    }
COV[431] = 1;     if (line.length > 0 && line[line.length - 1] == ';') {
COV[432] = 1;       line = line.substr(0, line.length - 1);
    }
COV[433] = 1;     lines.push(line);
COV[434] = 1;     return lines;
  }

COV[435] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[436] = 1;     var y = rows[row_index];
COV[437] = 1;     var row = this.data[y];
COV[438] = 1;     for (var x = 0; x < row.length; x++) {
COV[439] = 1;       var n = row[x];
COV[440] = 1;       n.label_lines = [];
      if (n.label == null || n.label == '') {
COV[441] = 1;         continue;
      }
      if (n.label.length > LARGE_LABEL_CHARS) {
COV[442] = 1;         n.label_lines = splittext(n.label, 140);
      } else {
COV[443] = 1;         n.label_lines = splittext(n.label, 80);
      }
    }
  }
    
  // Step 3: Insert unions
  function union_key(y, x1, x2) {
COV[444] = 1;     return y + ',' + x1 + ',' + x2;
  }

COV[445] = 1;   var unions = {};
COV[446] = 1;   for (var u_index = 0; u_index < this.unions.length; u_index++) {
COV[447] = 1;     var u = this.unions[u_index];
COV[448] = 1;     var x1 = u[0];
COV[449] = 1;     var y1 = u[1];
COV[450] = 1;     var x2 = u[2];
COV[451] = 1;     var y2 = u[3];
    if (y1 != y2) {
COV[452] = 1;      out(y1 + ' ' + (x1 + 1) + ' is in union with ' +
           y2 + ' ' + (x2 + 1) + ' in a different row.');
COV[453] = 1;       out('Cannot layout.');
COV[454] = 1;       return false;
    }
    if (x1 > x2) {
COV[455] = 1;       var tmp = x1;
COV[456] = 1;       x1 = x2;
COV[457] = 1;       x2 = tmp;
    }
    if (x2 != x1 + 1) {
COV[458] = 1;      out(y1 + ' ' + (x1 + 1) + ' is in union with ' +
           y2 + ' ' + (x2 + 1) + ', but they are not adjacent.');
COV[459] = 1;       out('Cannot layout.');
COV[460] = 1;       return false;
    }
COV[461] = 1;     var uobj = {};
COV[462] = 1;     unions[union_key(y1, x1, x2)] = uobj;
COV[463] = 1;     uobj.children = [];
COV[464] = 1;     uobj.parent_line = null;
COV[465] = 1;     this.data[y1][x1].right_union = uobj;
COV[466] = 1;     this.data[y1][x2].left_union = uobj;
COV[467] = 1;     uobj.left = x1;
COV[468] = 1;     uobj.right = x2;
  }

  // Step 4: Append children to each Parent or Union
COV[469] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[470] = 1;     var y = rows[row_index];
COV[471] = 1;     var row = this.data[y];
COV[472] = 1;     for (var x = 0; x < row.length; x++) {
COV[473] = 1;       var n = row[x];
      if (n.parents != null) {
COV[474] = 1;         var x1 = n.parents[0];
COV[475] = 1;         var y1 = n.parents[1];
COV[476] = 1;         var x2 = n.parents[2];
COV[477] = 1;         var y2 = n.parents[3];
        if (x1 == null || (x1 != null && x2 != null && x1 > x2)) {
COV[478] = 1;           var tmp = x1;
COV[479] = 1;           x1 = x2;
COV[480] = 1;           x2 = tmp;
        }
COV[481] = 1;         var did_union = false;
        if (x1 != null && x2 != null) {
          if (unions[union_key(y1, x1, x2)] != undefined) {
COV[482] = 1;             var uobj = unions[union_key(y1, x1, x2)];
COV[483] = 1;             uobj.children.push(n.index);
COV[484] = 1;             did_union = true;
          }
        }

        if (x1 != null && !did_union) {
COV[485] = 1;           this.data[y1][x1].children.push(n.index);
        }
        if (x2 != null && !did_union) {
          this.data[y2][x2].children.push(n.index)
        }
      }
    }
  }

  // Step 5: Sort children, set siblings, sort siblings
COV[486] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[487] = 1;     var y = rows[row_index];
COV[488] = 1;     var row = this.data[y];
COV[489] = 1;     for (var x = 0; x < row.length; x++) {
COV[490] = 1;       var n = row[x];
COV[491] = 1;       n.children.sort(sort_numerical_ascending);
COV[492] = 1;       for (var ci1 = 0; ci1 < n.children.length; ci1++) {
COV[493] = 1;         var c1 = n.children[ci1];
COV[494] = 1;         var child = this.data[y+1][c1];
COV[495] = 1;         for (var ci2 = 0; ci2 < n.children.length; ci2++) {
COV[496] = 1;           var c2 = n.children[ci2];
          if (child.siblings.indexOf(c2) == -1) {
COV[497] = 1;             child.siblings.push(c2);
          }
        }
      }
COV[498] = 1;       var uobj = n.right_union;
      if (uobj != null) {
COV[499] = 1;         uobj.children.sort(sort_numerical_ascending);
COV[500] = 1;         for (ci1 = 0; ci1 < uobj.children.length; ci1++) {
COV[501] = 1;           var c1 = uobj.children[ci1];
COV[502] = 1;           var child = this.data[y + 1][c1];
COV[503] = 1;           for (ci2 = 0; ci2 < uobj.children.length; ci2++) {
COV[504] = 1;             var c2 = uobj.children[ci2];
            if (child.siblings.indexOf(c2) == -1) {
COV[505] = 1;               child.siblings.push(c2);
            }
          }
        }
      }
COV[506] = 1;       n.siblings.sort(sort_numerical_ascending);
    }
  }

  // Step 6: Come up with the group for each person - their
  // siblings plus siblings' spouses
COV[507] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[508] = 1;     var y = rows[row_index];
COV[509] = 1;     var row = this.data[y];
COV[510] = 1;     for (var x = 0; x < row.length; x++) {
COV[511] = 1;       var n = row[x];
COV[512] = 1;       n.group = [];
COV[513] = 1;       for (var ci = 0; ci < n.siblings.length; ci++) {
COV[514] = 1;         var c = n.siblings[ci];
        if (n.group.indexOf(c) == -1) {
COV[515] = 1;           n.group.push(c);
        }
        if (row[c].left_union != null && n.group.indexOf(c - 1) == -1) {
COV[516] = 1;           n.group.push(c - 1);
        }
        if (row[c].right_union != null && n.group.indexOf(c + 1) == -1) {
COV[517] = 1;           n.group.push(c + 1);
        }
COV[518] = 1;         n.group.sort(sort_numerical_ascending);
      }
    }
  }

  // Step 7: Add extra space between adjacent people in a row who
  // aren't in the same group, && add extra space after people
  // who have direct children (i.e. children not through a union)
  // because their text goes off to the right.  Add extra space
  // for anyone with more than a trivial amount of text.
COV[519] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[520] = 1;     var y = rows[row_index];
COV[521] = 1;     var row = this.data[y];
COV[522] = 1;     var next = 0.0;
COV[523] = 1;     for (var x = 0; x < row.length; x++) {
COV[524] = 1;       row[x].Xoff += next;
COV[525] = 1;       var spacing = 0.0;
COV[526] = 1;       var nchild = false;
      if (x > 0 &&
          row[x - 1].group.indexOf(row[x]) == -1 &&
          row[x].group.indexOf(row[x-1]) == -1) {
COV[527] = 1;         spacing += 0.5;
      }
      if (row[x].children.length > 0) {
COV[528] = 1;         spacing += 1.0;
COV[529] = 1;         nchild = true;
      }
      if (row[x].label.length > LARGE_LABEL_CHARS) {
COV[530] = 1; 	spacing += EXTRA_LARGE_HORIZONTAL_SPACE;
      } else if (row[x].proband || row[x].label.length > MED_LABEL_CHARS) {
COV[531] = 1;         spacing += EXTRA_MED_HORIZONTAL_SPACE;
      }

      if (x == 0 || nchild) {
        // Xoff doesn't matter at the beginning of the line, or when
        // the text will be all to the right
COV[532] = 1;         next = 1.5 * spacing;
      } else {
        // Normally, equal spacing before && after
COV[533] = 1;         row[x].Xoff += spacing;
COV[534] = 1;         next = spacing;
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

COV[535] = 1;   var sanity_count = 0;
COV[536] = 1;   var sanity_moves = [];
  while (true) {
COV[537] = 1;     sanity_count++;
COV[538] = 1;     verbose('Trial ' + sanity_count);
    if (sanity_count == 20) {
COV[539] = 1;       var sanmap = {};
COV[540] = 1;       for (var move_i = 0; move_i < sanity_moves.length; move_i++) {
COV[541] = 1;         var move = sanity_moves[move_i];
COV[542] = 1;         var move_key = move.join(',');
        if (sanmap[move_key] == undefined) {
COV[543] = 1;           sanmap[move_key] = 1;
        } else {
COV[544] = 1;           sanmap[move_key]++;
        }
      }

COV[545] = 1;       out('Sorry, it is not possible to layout this pedigree.');
COV[546] = 1;       var found_count = 0;
COV[547] = 1;       var ymax = -1;
COV[548] = 1;       var found_x = 0;
COV[549] = 1;       var found_y = 0;
COV[550] = 1;       for (var move_i = 0; move_i < sanity_moves.length; move_i++) {
COV[551] = 1;         var move = sanity_moves[move_i];
COV[552] = 1;         var move_key = move.join(',');
COV[553] = 1;         var count = sanmap[move_key];
        if (count > 2) {
COV[554] = 1;           var y0 = move[0];
COV[555] = 1;           var x0 = move[1];
COV[556] = 1;           var y1 = move[2];
COV[557] = 1;           var x1 = move[2];
          if (y0 > ymax) {
COV[558] = 1;             ymax = y0;
COV[559] = 1;             found_x = x0;
COV[560] = 1;             found_y = y0;
COV[561] = 1;             found_count = 1;
          } else if (y0 == ymax) {
COV[562] = 1;             found_count += 1;
          }
        }
      }
      if (found_count == 1) {
COV[563] = 1;        out('The problem appears to be near ' + found_y + ' ' + (found_x + 1) +
            ', hope that helps.');
      }
COV[564] = 1;       return 'ERROR';
    }

    // Reset positions
COV[565] = 1;     for (row_index = 0; row_index < rows.length; row_index++) {
COV[566] = 1;       var y = rows[row_index];
COV[567] = 1;       var row = this.data[y];
COV[568] = 1;       for (var x = 0; x < row.length; x++) {
COV[569] = 1;         row[x].placed = false;
      }
    }

COV[570] = 1;     var Xmax = 0;
COV[571] = 1;     var ok = true;

    // Lay out from bottom up.
COV[572] = 1;     for (row_index = rows.length - 1; row_index >= 0; row_index--) {
      if (!ok)
COV[573] = 1;         break;

COV[574] = 1;       var X = 0;
COV[575] = 1;       var y = rows[row_index];
COV[576] = 1;       var row = this.data[y];
COV[577] = 1;       var n_next = null;
COV[578] = 1;       for (var x = 0; x < row.length; x++) {
COV[579] = 1;         verbose(y + ' ' + (x + 1));
COV[580] = 1;         var n = row[x];
        if (x + 1 < row.length) {
COV[581] = 1;           n_next = row[x + 1];
        }
        if (x == 0) {
COV[582] = 1;           X = n.Xoff;
        } else {
COV[583] = 1;           X += (MIN_HORIZONTAL_SPACE + n.Xoff);
        }
        if (n.placed) {
COV[584] = 1;           X = n.X;
COV[585] = 1;           verbose('  leaving at ' + n.X);
COV[586] = 1;           continue;
        }

        // Old: always placed person next to their partner - decided
        // against this, now will possibly place them far from their
        // partner to center them on their children

        if (y < rows[rows.length - 1]) {
COV[587] = 1;           var childrow = this.data[y + 1];
COV[588] = 1;           verbose('childrow: length=' + childrow.length);
        }
        if (n.children.length > 0) {
COV[589] = 1;           var X0 = childrow[n.children[0]].X;
COV[590] = 1;           var X1 = childrow[n.children[n.children.length - 1]].X;
COV[591] = 1;           var Xctr = 0.5 * (X0 + X1);
COV[592] = 1;           verbose('X0=' + X0 + ' X1=' + X1 + ' Xctr=' + Xctr);
          if (Xctr < X - 0.01) {  // epsilon fudge factor
COV[593] = 1;            verbose('  is at ' + X +
                     ', but ctr of its children is at ' + Xctr);

            // See if there's an overlap with folks on left
COV[594] = 1;             var rightmost = -1;
COV[595] = 1;             for (var xleft = 0; xleft < x - 1; xleft++) {
              if (row[xleft].children.length > 0) {
COV[596] = 1;                 var rightmost_group = childrow[row[xleft].children[0]].group;
COV[597] = 1;                 var rightmost_0 = rightmost_group[rightmost_group.length - 1];
COV[598] = 1;                 rightmost = Math.max(rightmost, rightmost_0);
              }
COV[599] = 1;               var uobj2 = row[xleft].right_union;
              if (uobj2 != null && uobj2.children.length > 0) {
COV[600] = 1;                 rightmost_group = childrow[uobj2.children[0]].group;
COV[601] = 1;                 rightmost_0 = rightmost_group[rightmost_group.length - 1];
COV[602] = 1;                 rightmost = Math.max(rightmost, rightmost_0);
              }
            }
COV[603] = 1;             var g0 = childrow[n.children[0]].group[0];
            if (rightmost < g0) {
COV[604] = 1;               childrow[g0].Xoff += (X - Xctr);
COV[605] = 1;              verbose('  (1) moving ' + (y + 1) + ' ' + g0 +
                       ' by ' + (X - Xctr));
COV[606] = 1;               sanity_moves.push([y, x + 1, y + 1, 1 + g0]);
COV[607] = 1;               ok = false;
            } else {
COV[608] = 1;               Xctr = X;
            }
          }
COV[609] = 1;           n.X = Xctr;
COV[610] = 1;           X = n.X;
COV[611] = 1;           n.placed = true;
COV[612] = 1;           verbose('  case with children complete, moved to ' + n.X);
COV[613] = 1;           continue;
        }

        if (n.right_union != null && n.right_union.children.length > 0) {
          // Placing a person directly above the center of their children
COV[614] = 1;           var uobj = n.right_union;
COV[615] = 1;           var X0 = childrow[uobj.children[0]].X;
COV[616] = 1;           var X1 = childrow[uobj.children[uobj.children.length - 1]].X;
COV[617] = 1;           var Xoff0 = childrow[uobj.children[0]].Xoff;
COV[618] = 1;           var Xoff1 = childrow[uobj.children[uobj.children.length - 1]].Xoff;
          var Xctr = 0.5 * (X0 + X1) -
COV[619] = 1;                      ((MIN_HORIZONTAL_SPACE + n_next.Xoff) / 2.0);
          if (Xctr < X - 0.01) {  // epsilon fudge factor
            // See if there's an overlap with folks on left
COV[620] = 1;             var rightmost = -1;
COV[621] = 1;             for (var xleft = 0; xleft < x - 1; xleft++) {
              if (row[xleft].children.length > 0) {
COV[622] = 1;                 var rightmost_group = childrow[row[xleft].children[0]].group;
COV[623] = 1;                 var rightmost_0 = rightmost_group[rightmost_group.length - 1];
COV[624] = 1;                 rightmost = Math.max(rightmost, rightmost_0);
              }
COV[625] = 1;               var uobj2 = row[xleft].right_union;
              if (uobj2 != null && uobj2.children.length > 0) {
COV[626] = 1;                 var rightmost_group = childrow[uobj2.children[0]].group;
COV[627] = 1;                 var rightmost_0 = rightmost_group[rightmost_group.length - 1];
COV[628] = 1;                 rightmost = Math.max(rightmost, rightmost_0);
              }
            }
COV[629] = 1;             var g0 = childrow[uobj.children[0]].group[0];
            if (rightmost < g0) {
COV[630] = 1;               childrow[g0].Xoff += X - Xctr;
COV[631] = 1;              verbose('  (2) moving ' + (y + 1) + ' ' + g0 + ' by ' +
                       (X - Xctr));
COV[632] = 1;               sanity_moves.push([y, x+1, y+1, 1 + g0]);
COV[633] = 1;               ok = false;
            } else {
COV[634] = 1;               Xctr = X;
            }
          }
COV[635] = 1;           n.X = Xctr;
COV[636] = 1;           X = n.X;
COV[637] = 1;           verbose('  case with union complete, moved to ' + n.X);
COV[638] = 1;           n.placed = true;
COV[639] = 1;           continue;
        }
COV[640] = 1;         n.X = X;
COV[641] = 1;         n.placed = true;
COV[642] = 1;         verbose('  default complete, moved to ' + n.X);
COV[643] = 1;         continue;
      }
      if (X + 5 > Xmax) {
COV[644] = 1;         Xmax = X + 5;
      }
    }
    if (ok) {
COV[645] = 1;       break;
    }
  }

COV[646] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[647] = 1;     var y = rows[row_index];
COV[648] = 1;     var row = this.data[y];
COV[649] = 1;     for (var x = 0; x < row.length; x++) {
      if (row[x].X == undefined) {
COV[650] = 1;         row[x].X = 0;
      }
    }
  }

  // For each row, figure out the sibling line y-position
  // and the parent line y-position (the parent line is not
  // relevant if the parent or union is perfectly centered on
  // the siblings

COV[651] = 1;   this.rowobjs = {};

COV[652] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[653] = 1;     var y = rows[row_index];
COV[654] = 1;     var row = this.data[y];
COV[655] = 1;     verbose('Sibling and parent lines (horizontal lines) for row ' + y);
COV[656] = 1;     var robj = {};
COV[657] = 1;     robj.num_parent_lines = 0;
COV[658] = 1;     robj.num_sibling_lines = 0;

COV[659] = 1;     this.rowobjs[y] = robj;

COV[660] = 1;     var max_label_lines = 0;
COV[661] = 1;     for (var x = 0; x < row.length; x++) {
COV[662] = 1;       var num_lines = row[x].label_lines.length;
      if (num_lines > max_label_lines) {
COV[663] = 1;         max_label_lines = num_lines;
      }
    }

    // We pretend that a certain number of 'conflicts' exist between
COV[664] = 1;     // parent lines && the text; every two lines of text equals a
    // conflict.
COV[665] = 1;     var num_label_conflicts = Math.floor((max_label_lines + 2) * 2 / 3);
COV[666] = 1;     verbose('Row ' + y + ': label conflicts = ' + num_label_conflicts);

COV[667] = 1;     var sibling_lines = [];
COV[668] = 1;     var parent_lines = [];
COV[669] = 1;     for (var x = 0; x < row.length; x++) {
COV[670] = 1;       verbose(y + ' ' + (x + 1));
COV[671] = 1;       var n = row[x];
      if (n.sibling_line == null) {
COV[672] = 1;         var conflicts = [];
COV[673] = 1;         for (var si = 0; si < sibling_lines.length; si++) {
COV[674] = 1;           var first = sibling_lines[si][0];
COV[675] = 1;           var last = sibling_lines[si][1];
COV[676] = 1;           var line = sibling_lines[si][2];
          if (n.siblings[0] <= last &&
              n.siblings[n.siblings.length - 1] >= first) {
            if (conflicts.indexOf(line) == -1) {
COV[677] = 1;               conflicts.push(line);
            }
          }
        }
COV[678] = 1;         n.sibling_line = 0;
        while (conflicts.indexOf(n.sibling_line) >= 0) {
COV[679] = 1;           n.sibling_line += 1;
        }
COV[680] = 1;        sibling_lines.push(
           [n.siblings[0], n.siblings[n.siblings.length - 1], n.sibling_line]);
COV[681] = 1;         for (si = 0; si < n.siblings.length; si++) {
COV[682] = 1;           var sib = n.siblings[si];
COV[683] = 1;           row[sib].sibling_line = n.sibling_line;
        }
      }
      if (n.parent_line == null && n.children.length > 0) {
COV[684] = 1;         console.log('Parent conflict 1');
COV[685] = 1;         var conflicts = [];
COV[686] = 1;         for (var sj = 0; sj < num_label_conflicts; sj++) {
COV[687] = 1;           conflicts.push(sj);
COV[688] = 1;           console.log('Parent conflict 2 label');
        }
COV[689] = 1;         verbose('    Base conflicts: ' + conflicts);
        // Check for overlapping lines using link structure only
COV[690] = 1;         for (var pi = 0; pi < parent_lines.length; pi++) {
COV[691] = 1;           var index = parent_lines[pi][0];
COV[692] = 1;           var first = parent_lines[pi][1];
COV[693] = 1;           var last = parent_lines[pi][2];
COV[694] = 1;           var line = parent_lines[pi][3];
          if (n.children[0] <= last &&
              n.children[n.children.length - 1] >= first) {
COV[695] = 1;            verbose('    ' + y + ' ' + (x + 1) +
                    ' conflicts with parent line for ' +
                     first + ' and ' + last);
            if (conflicts.indexOf(line) == -1) {
COV[696] = 1;               conflicts.push(line);
COV[697] = 1;               console.log('Parent conflict 3 link structure');
            }
          }
        }
        // Check for overlapping lines using positions
COV[698] = 1;         for (var pi = 0; pi < parent_lines.length; pi++) {
COV[699] = 1;           var index = parent_lines[pi][0];
COV[700] = 1;           var first = parent_lines[pi][1];
COV[701] = 1;           var last = parent_lines[pi][2];
COV[702] = 1;           var line = parent_lines[pi][3];
COV[703] = 1;           var nextrow = this.data[y + 1];
COV[704] = 1;           var other_X = row[index].X;
COV[705] = 1;           var other_ctr = 0.5 * (nextrow[first].X + nextrow[last].X);
COV[706] = 1;           var this_X = n.X;
COV[707] = 1;          var this_ctr = 0.5 * (nextrow[n.children[0]].X +
                                 nextrow[n.children[n.children.length - 1]].X);
          if (this.segments_intersect(other_X, other_ctr, this_X, this_ctr)) {
COV[708] = 1;            verbose('    ' + y + ' ' + (x + 1) +
                    ' overlaps parent line for ' +
                     first + ' and ' + last);
            if (conflicts.indexOf(line) == -1) {
COV[709] = 1;               conflicts.push(line);
COV[710] = 1;               console.log('Parent conflict 4 positions');
            }
          }
        }

COV[711] = 1;         n.parent_line = 0;
        while (conflicts.indexOf(n.parent_line) >= 0) {
COV[712] = 1;           n.parent_line++;
        }
COV[713] = 1;         verbose('    Choosing parent line ' + n.parent_line);
COV[714] = 1;        parent_lines.push(
            [x, n.children[0],
             n.children[n.children.length - 1],
              n.parent_line]);
COV[715] = 1;         verbose('    ' + JSON.stringify(parent_lines));
      }
COV[716] = 1;       var uobj = n.right_union;
      if (uobj && uobj.parent_line == null && uobj.children.length > 0) {
COV[717] = 1;         var conflicts = [];
COV[718] = 1;         for (var sj = 0; sj < num_label_conflicts; sj++) {
COV[719] = 1;           conflicts.push(sj);
        }
COV[720] = 1;         for (var pi = 0; pi < parent_lines.length; pi++) {
COV[721] = 1;           var index = parent_lines[pi][0];
COV[722] = 1;           var first = parent_lines[pi][1];
COV[723] = 1;           var last = parent_lines[pi][2];
COV[724] = 1;           var line = parent_lines[pi][3];
          if (uobj.children[0] <= last &&
              uobj.children[uobj.children.length - 1] >= first) {
            if (conflicts.indexOf(line) == -1) {
COV[725] = 1;               conflicts.push(line);
            }
          }
        }
COV[726] = 1;         uobj.parent_line = 0;
        while (conflicts.indexOf(uobj.parent_line) >= 0) {
COV[727] = 1;           uobj.parent_line++;
        }
COV[728] = 1;         verbose('    X2: Choosing parent line ' + uobj.parent_line);
COV[729] = 1;        parent_lines.push(
            [x,
             uobj.children[0],
             uobj.children[uobj.children.length - 1],
              uobj.parent_line]);
      }
    }
COV[730] = 1;     for (si = 0; si < sibling_lines.length; si++) {
COV[731] = 1;       var first = sibling_lines[si][0];
COV[732] = 1;       var last = sibling_lines[si][1];
COV[733] = 1;       var line = sibling_lines[si][2];
      if (line + 1 > robj.num_sibling_lines) {
COV[734] = 1;         robj.num_sibling_lines = line + 1;
      }
    }
COV[735] = 1;     for (pi = 0; pi < parent_lines.length; pi++) {
COV[736] = 1;       var index = parent_lines[pi][0];
COV[737] = 1;       var first = parent_lines[pi][1];
COV[738] = 1;       var last = parent_lines[pi][2];
COV[739] = 1;       var line = parent_lines[pi][3];
      if (line + 1 > robj.num_parent_lines) {
COV[740] = 1;         robj.num_parent_lines = line + 1;
      }
    }
    if (robj.num_parent_lines < num_label_conflicts) {
COV[741] = 1;       robj.num_parent_lines = num_label_conflicts;
    }
COV[742] = 1;     verbose('  Sibling lines: ' + JSON.stringify(sibling_lines));
COV[743] = 1;     verbose('  Parent lines: ' + JSON.stringify(parent_lines));
  }

  // Compute height and Y position of each row
COV[744] = 1;   var Y = 0;
COV[745] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[746] = 1;     var y = rows[row_index];
COV[747] = 1;     var row = this.data[y];
COV[748] = 1;     var max_lines = 0;
COV[749] = 1;     var base_ht = MIN_VERTICAL_SPACE;
    if (n.proband) {
COV[750] = 1;       base_ht += 1;
    }
COV[751] = 1;     var robj = this.rowobjs[y];
COV[752] = 1;     robj.height = base_ht + robj.num_parent_lines + robj.num_sibling_lines;
COV[753] = 1;     robj.Y = Math.floor(Y);
COV[754] = 1;    verbose('Row ' + y + ': Y=' + robj.Y +
            ' height=' + robj.height +
            ' parent_lines=' + robj.num_parent_lines +
             ' sibling_lines=' + robj.num_sibling_lines);
COV[755] = 1;     robj.num_parent_lines = 0;
COV[756] = 1;     robj.num_sibling_lines = 0;
COV[757] = 1;     Y += robj.height;
  }
COV[758] = 1;   var Ymax = Y;

  // Debug: print everyone's position
  if (VERBOSE) {
COV[759] = 1;     for (row_index = 0; row_index < rows.length; row_index++) {
COV[760] = 1;       var y = rows[row_index];
COV[761] = 1;       var row = this.data[y];
COV[762] = 1;       var robj = this.rowobjs[y];
COV[763] = 1;       for (var x = 0; x < row.length; x++) {
COV[764] = 1;         var n = row[x];
COV[765] = 1;         out(y + ' ' + (x + 1) + ': ' + n.X + ', ' + robj.Y);
        if (n.right_union != null)
COV[766] = 1;           out('  UNION');
      }
    }
  }

  // Set up figure
COV[767] = 1;   var Xmargin = 0.75;
COV[768] = 1;   var Ymargin = 0.75;
COV[769] = 1;   var Xmin = 0.0;
COV[770] = 1;   var Ymin = 0.0;

COV[771] = 1;   var text_lines = splittext(this.text, 600);
COV[772] = 1;   var line_height_guess = 1.5;
COV[773] = 1;   var text_height_guess = 2.5 + line_height_guess * text_lines.length;

COV[774] = 1;   var pages = 1;
COV[775] = 1;   var landscape = true;
COV[776] = 1;   var Xpage = 11.0;
COV[777] = 1;   var Ypage = 8.5;
COV[778] = 1;   var Xinnerpage = Xpage - (2 * pages) * Xmargin;
COV[779] = 1;   var Yinnerpage = Ypage - (2 * pages) * Ymargin;
COV[780] = 1;  var scale = Math.min(Xinnerpage / Xmax,
                        Yinnerpage / (Ymax + text_height_guess));

COV[781] = 1;   verbose('Scale: ' + scale);

  //if scale < 0.1 && pages < 3 {
  //  // Return false, which forces the calling function
  //  // to call again with multiple pages.
COV[782] = 1;   //  return false;
  // }

COV[783] = 1;   var line_height = 0.2 / scale;
COV[784] = 1;   var text_height = 2.5 + line_height * text_lines.length;

COV[785] = 1;   var linewidth = 5 * scale;

  // Move text so that it's at the top of the page but leave
  // everything else centered.
  if (text_height < (Yinnerpage / scale - Ymax) / 2) {
COV[786] = 1;     text_height = (Yinnerpage / scale - Ymax) / 2;
  }

  // Draw the title text.
COV[787] = 1;   for (var l = 0; l < text_lines.length; l++) {
COV[788] = 1;     line = text_lines[l];
    //text(Xmax/2.0, l * line_height - text_height, line, fontsize=10.0,
    //     horizontalalignment='center',
COV[789] = 1;     //     verticalalignment='top');
  }

COV[790] = 1;   var SCALE = 20;
COV[791] = 1;   var MARGIN = 12;
COV[792] = 1;   var TOP = 44;
COV[793] = 1;   var LEFT = 88;

COV[794] = 1;   var container = document.getElementById('pedigree');
  if (!container) {
COV[795] = 1;     container = document.createElement('div');
COV[796] = 1;     container.id = 'pedigree';
COV[797] = 1;     container.className = 'pedigree';
COV[798] = 1;     document.body.appendChild(container);
  }

  function makerowmarker(y, robj) {
COV[799] = 1;     var element = document.createElement('div');
COV[800] = 1;     element.id = 'r' + y;
COV[801] = 1;     element.innerText = y;
COV[802] = 1;     element.tabIndex = -1;
COV[803] = 1;     var Y = robj.Y;
COV[804] = 1;     var X = -1.5;
COV[805] = 1;     var left = (SCALE * X - MARGIN) + LEFT;
COV[806] = 1;     var top = (SCALE * Y - MARGIN) + TOP;
COV[807] = 1;     element.style['left'] = left + 'px';
COV[808] = 1;     element.style['top'] = top + 'px';
COV[809] = 1;     element.classList.add('scale' + SCALE); 
COV[810] = 1;     element.classList.add('rowmarker');
COV[811] = 1;     container.appendChild(element);
COV[812] = 1;     return element;
  }

  function makeperson(n, X, Y, coords) {
    if (n.multiple == 0) {
COV[813] = 1;       return null;
    }

COV[814] = 1;     var element = document.createElement('div');
COV[815] = 1;     element.tabIndex = -1;
COV[816] = 1;     var left = (SCALE * (X + 2.0) - MARGIN) + LEFT;
COV[817] = 1;     var top = (SCALE * Y - MARGIN) + TOP;
COV[818] = 1;     element.style['left'] = left + 'px';
COV[819] = 1;     element.style['top'] = top + 'px';
COV[820] = 1;     element.classList.add('scale' + SCALE); 
COV[821] = 1;     element.classList.add(n.gender);
    if (n.affected) {
COV[822] = 1;       element.classList.add('affected');
    }
    if (n.carrier) {
COV[823] = 1;       element.classList.add('carrier');
COV[824] = 1;       var carrier_dot = document.createElement('div');
COV[825] = 1;       carrier_dot.className = 'carrier_dot';
COV[826] = 1;       element.appendChild(carrier_dot);
    }
    if (n.proband) {
COV[827] = 1;       element.classList.add('proband');
COV[828] = 1;       var proband_arrow = document.createElement('div');
COV[829] = 1;       proband_arrow.className = 'proband_arrow';
COV[830] = 1;       element.appendChild(proband_arrow);
    }
    if (n.dead) {
COV[831] = 1;       element.classList.add('dead');
COV[832] = 1;       var dead_slash = document.createElement('div');
COV[833] = 1;       dead_slash.className = 'dead_slash';
COV[834] = 1;       element.appendChild(dead_slash);      
    }

COV[835] = 1;     var highlight = document.createElement('div');
COV[836] = 1;     highlight.className = 'highlight';
COV[837] = 1;     element.appendChild(highlight);

COV[838] = 1;     var coords_label = document.createElement('div');
COV[839] = 1;     coords_label.className = 'coords';
COV[840] = 1;     coords_label.innerText = coords;
COV[841] = 1;     element.appendChild(coords_label);

COV[842] = 1;     var ctr_label = document.createElement('div');
COV[843] = 1;     ctr_label.className = 'ctr_label';
COV[844] = 1;     element.appendChild(ctr_label);
    if (n.pregnancy) {
COV[845] = 1;       ctr_label.innerText = 'P';
    } else if (n.multiple == 10) {
COV[846] = 1;       ctr_label.innerText = 'n';
    } else if (n.multiple > 1) {
COV[847] = 1;       ctr_label.innerText = n.multiple;
    }

COV[848] = 1;     var text_label = document.createElement('div');
COV[849] = 1;     text_label.className = 'text_label';
COV[850] = 1;     text_label.innerText = n.label;
COV[851] = 1;     element.appendChild(text_label);

COV[852] = 1;     container.appendChild(element);
COV[853] = 1;     return element;
  }

  function diagonalline(element, x0, y0, x1, y1) {
    if (x1 < x0) {
COV[854] = 1;       var tmp = x0;
COV[855] = 1;       x0 = x1;
COV[856] = 1;       x1 = tmp;
COV[857] = 1;       tmp = y0;
COV[858] = 1;       y0 = y1;
COV[859] = 1;       y1 = tmp;
    }
COV[860] = 1;     element.className = 'diagonal_line';
COV[861] = 1;     var length = Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
COV[862] = 1;     element.style.width = length + 'px';
    if (element.style.MozTransform != undefined ||
        element.style.WebkitTransform != undefined ||
        element.style.OTransform != undefined ||
        element.style.transform != undefined) {
COV[863] = 1;       var angle = Math.atan((y1 - y0) / (x1 - x0));
COV[864] = 1;       element.style.top = y0 + 0.5 * length * Math.sin(angle) + 'px';
COV[865] = 1;       element.style.left = x0 - 0.5 * length * (1 - Math.cos(angle)) + 'px';
COV[866] = 1;       element.style.MozTransform = 'rotate(' + angle + 'rad)';
COV[867] = 1;       element.style.WebkitTransform = 'rotate(' + angle + 'rad)';
COV[868] = 1;       element.style.OTransform = 'rotate(' + angle + 'rad)';
    } else {
      // IE.
COV[869] = 1;       element.style.top = (y1 > y0) ? y0 + 'px' : y1 + 'px';
COV[870] = 1;       element.style.left = x0 + 'px';
COV[871] = 1;       var nCos = (x1-x0)/length;
COV[872] = 1;       var nSin = (y1-y0)/length;
      element.style.filter =
          'progid:DXImageTransform.Microsoft.Matrix(' +
          'sizingMethod="auto expand", ' +
          'M11=' + nCos + ', M12=' + -1*nSin +
COV[873] = 1;           ', M21=' + nSin + ', M22=' + nCos + ')';
    }
  }

  function makeline(x0, x1, y0, y1, debug_label) {
COV[874] = 1;    console.log('makeline ' + x0 + ', ' + y0 + ' : ' + x1 + ', ' + y1 +
                 ' ' + debug_label);
COV[875] = 1;     var element = document.createElement('div');
    if (debug_label) {
COV[876] = 1;       element.setAttribute('name', debug_label);
    }
    if (y0 == y1) {
      if (x1 < x0) {
COV[877] = 1;         var tmp = x1;
COV[878] = 1;         x1 = x0;
COV[879] = 1;         x0 = tmp;
      }
COV[880] = 1;       element.className = 'hline';
COV[881] = 1;       element.style['left'] = (SCALE * x0 + LEFT) + 'px';
COV[882] = 1;       element.style['top'] = (SCALE * y0 + TOP) + 'px';
COV[883] = 1;       element.style['width'] = (SCALE * (x1 - x0)) + 'px';
    } else if (x0 == x1) {
      if (y1 < y0) {
COV[884] = 1;         var tmp = y1;
COV[885] = 1;         y1 = y0;
COV[886] = 1;         y0 = tmp;
      }
COV[887] = 1;       element.className = 'vline';
COV[888] = 1;       element.style['left'] = (SCALE * x0 + LEFT) + 'px';
COV[889] = 1;       element.style['top'] = (SCALE * y0 + TOP) + 'px';
COV[890] = 1;       element.style['height'] = (SCALE * (y1 - y0)) + 'px';
    } else {
COV[891] = 1;      diagonalline(element,
                   SCALE * x0 + LEFT, SCALE * y0 + TOP,
                    SCALE * x1 + LEFT, SCALE * y1 + TOP);
    }
COV[892] = 1;     container.appendChild(element);
  }

  function makechildlines(
      Xtop, Ytop, Xcenter, Yparent, Ysibling, Ychild, children, debug_label) {
COV[893] = 1;     console.log('makechildlines ' + debug_label);
    // Parent to center of sibling line
COV[894] = 1;     makeline(Xtop, Xtop, Ytop, Yparent, debug_label + ' A');
COV[895] = 1;     makeline(Xtop, Xcenter, Yparent, Yparent, debug_label + ' B');
COV[896] = 1;     makeline(Xcenter, Xcenter, Yparent, Ysibling, debug_label + ' C');
    // Sibling line
COV[897] = 1;     var siblingLeft = children[0].X;
COV[898] = 1;     var siblingRight = children[children.length - 1].X;
    if (children.length > 1) {
      if (children[0].twin) {
COV[899] = 1;         siblingLeft = 0.5 * (children[0].X + children[1].X);
      }
      if (children[children.length - 2].twin) {
COV[900] = 1;        siblingRight = 0.5 * (children[children.length - 2].X +
                               children[children.length - 1].X);
      }
COV[901] = 1;      makeline(2.5 + siblingLeft, 2.5 + siblingRight,
                Ysibling, Ysibling, debug_label + ' D');
    }
    // Lines from the sibling line to each child
COV[902] = 1;     for (var i = 0; i < children.length; i++) {
COV[903] = 1;       var c = children[i];
      if (c.multiple == 0) {
COV[904] = 1;        makeline(2.0 + c.X, 3.0 + c.X,
                 Ysibling, Ysibling,
                  debug_label + ' S' + i);
COV[905] = 1;         continue;
      }
      if (c.twin && i + 1 < children.length) {
COV[906] = 1;         var topX = 0.5 * (c.X + children[i + 1].X);
      } else if (i>0 && children[i - 1].twin) {
COV[907] = 1;         topX = 0.5 * (c.X + children[i - 1].X);
      } else {
COV[908] = 1;         topX = c.X;
      }
COV[909] = 1;      makeline(2.5 + topX, 2.5 + c.X,
               Ysibling, Ychild - 0.02,
                debug_label + ' S' + i);
    }
  }

  // Main drawing loop
COV[910] = 1;   for (row_index = 0; row_index < rows.length; row_index++) {
COV[911] = 1;     var y = rows[row_index];
COV[912] = 1;     var row = this.data[y];
COV[913] = 1;     var robj = this.rowobjs[y];
COV[914] = 1;     robj.rowmarker = makerowmarker(y, robj);
COV[915] = 1;     for (var x = 0; x < row.length; x++) {
COV[916] = 1;       var n = row[x];
COV[917] = 1;       n.element = makeperson(n, n.X, robj.Y, y + ' ' + (x + 1));
      if (n.right_union != null) {
COV[918] = 1;        makeline(n.X + 3.0, row[x+1].X + 2.0,
                 robj.Y + 0.5, robj.Y + 0.5,
                 'Union of ' + y + ' ' + (x + 1) + ' and ' +
                  y + ' ' + (x + 2));
COV[919] = 1;         var uobj = n.right_union;
        if (uobj.children.length > 0) {
COV[920] = 1;           var child_nodes = [];
COV[921] = 1;           for (var ci = 0; ci < uobj.children.length; ci++) {
COV[922] = 1;             var c = uobj.children[ci];
COV[923] = 1;             child_nodes.push(this.data[y + 1][c]);
          }
COV[924] = 1;          var Xcenter = 2.5 + 0.5 * (child_nodes[0].X +
                                      child_nodes[child_nodes.length - 1].X);
COV[925] = 1;          var Ysibling = this.rowobjs[y + 1].Y - 1 -
                          child_nodes[0].sibling_line;
COV[926] = 1;          var debug_label = 'Child lines from union of ' + y + ' ' + (x + 1) +
                             ' and ' + y + ' ' + (x + 2);
COV[927] = 1;          makechildlines(2.5 + 0.5 * (n.X + row[x+1].X),    // Xtop
                         robj.Y + 0.5,                      // Ytop
                         Xcenter,                           // Xcenter
                         robj.Y + 1.5 + uobj.parent_line,   // Yparent
                         Ysibling,                          // Ysibling
                         this.rowobjs[y + 1].Y,             // Ychild
                         child_nodes,                       // children
                          debug_label);
        }
      }
      if (n.children.length > 0) {
COV[928] = 1;         var child_nodes = [];
COV[929] = 1;         for (var ci = 0; ci < n.children.length; ci++) {
COV[930] = 1;           var c = n.children[ci];
COV[931] = 1;           child_nodes.push(this.data[y + 1][c]);
        }
COV[932] = 1;        var Xcenter = 2.5 + 0.5 * (child_nodes[0].X +
                                    child_nodes[child_nodes.length - 1].X);
COV[933] = 1;         var Ysibling = this.rowobjs[y + 1].Y - 1 - child_nodes[0].sibling_line;
COV[934] = 1;         var debug_label = 'Child lines from ' + y + ' ' + (x + 1);
COV[935] = 1;        makechildlines(2.5 + n.X,                         // Xtop
                       robj.Y + 1.0,                      // Ytop
                       Xcenter,                           // Xcenter
                       robj.Y + 1.5 + n.parent_line,      // Yparent
                       Ysibling,                          // Ysibling
                       this.rowobjs[y + 1].Y,             // Ychild
                       child_nodes,                       // children
                        debug_label);
      }
    }
  }
COV[936] = 1; };

pedigree.Pedigree.prototype.replot = function() {
COV[937] = 1;   var container = document.getElementById('pedigree');
COV[938] = 1;   container.innerHTML = '';
COV[939] = 1;   this.plot();
COV[940] = 1;   this.navigate(0, 0);
COV[941] = 1; };

pedigree.Pedigree.prototype.getElement = function(x, y) {
  if (x >= 0) {
COV[942] = 1;     return this.data[this.y][this.x].element;
  } else {
COV[943] = 1;     return this.rowobjs[this.y].rowmarker;
  }
COV[944] = 1; };

pedigree.Pedigree.prototype.navigate = function(dx, dy) {
COV[945] = 1;   var element = this.getElement(this.x, this.y);
COV[946] = 1;   element.tabIndex = -1;
COV[947] = 1;   element.classList.remove('selected');

  if (this.data[this.y + dy] != undefined) {
COV[948] = 1;     this.y += dy;
  }
COV[949] = 1;   this.x += dx;
  if (this.x < -1) {
COV[950] = 1;     this.x = -1;
  }
  if (this.x >= this.data[this.y].length) {
COV[951] = 1;     this.x = this.data[this.y].length - 1;
  }

COV[952] = 1;   element = this.getElement(this.x, this.y);
COV[953] = 1;   element.tabIndex = 0;
COV[954] = 1;   element.classList.add('selected');
COV[955] = 1;   element.focus();
COV[956] = 1; };

pedigree.Pedigree.prototype.run = function() {
  if (this.y == undefined) {
COV[957] = 1;     this.y = 1;
COV[958] = 1;     this.x = -1;
  }

COV[959] = 1;   var element = this.getElement(this.x, this.y);
COV[960] = 1;   element.tabIndex = 0;
COV[961] = 1;   element.classList.add('selected');
COV[962] = 1;   element.focus();

COV[963] = 1;   var container = document.getElementById('pedigree');
  container.addEventListener('keydown', (function(evt) {
COV[964] = 1;     console.log('KEYDOWN ' + evt.keyCode);
COV[965] = 1;     var handled = false;
    switch(evt.keyCode) {
      case 37:  // Left arrow
COV[966] = 1;         this.navigate(-1, 0);
COV[967] = 1;         handled = true;
COV[968] = 1;         break;
      case 38:  // Up arrow
COV[969] = 1;         this.navigate(0, -1);
COV[970] = 1;         handled = true;
COV[971] = 1;         break;
      case 39:  // Right arrow
COV[972] = 1;         this.navigate(1, 0);
COV[973] = 1;         handled = true;
COV[974] = 1;         break;
      case 40:  // Down arrow
COV[975] = 1;         this.navigate(0, 1);
COV[976] = 1;         handled = true;
COV[977] = 1;         break;
    }
    if (handled) {
COV[978] = 1;       evt.stopPropagation();
COV[979] = 1;       evt.preventDefault();
    }
COV[980] = 1;   }).bind(this), false);
  container.addEventListener('keypress', (function(evt) {
COV[981] = 1;     console.log('KEYPRESS ' + evt.charCode);
COV[982] = 1;     var handled = false;
    switch(evt.charCode) {
      case 'f'.charCodeAt(0):
COV[983] = 1;         this.x += 1;
COV[984] = 1;         this.addnode(new pedigree.Node('female'), this.x, this.y);
COV[985] = 1;         this.push('adding female at ' + this.y + ' ' + (this.x + 1));
COV[986] = 1;         this.replot();
COV[987] = 1;         handled = true;
COV[988] = 1;         break;
      case 'm'.charCodeAt(0):
COV[989] = 1;         this.x += 1;
COV[990] = 1;         this.addnode(new pedigree.Node('male'), this.x, this.y);
COV[991] = 1;         this.push('adding male at ' + this.y + ' ' + (this.x + 1));
COV[992] = 1;         this.replot();
COV[993] = 1;         handled = true;
COV[994] = 1;         break;
      case 'U'.charCodeAt(0):
COV[995] = 1;         this.x += 1;
COV[996] = 1;         this.addnode(new pedigree.Node('nogender'), this.x, this.y);
COV[997] = 1;         this.push('adding unknown gender at ' + this.y + ' ' + (this.x + 1));
COV[998] = 1;         this.replot();
COV[999] = 1;         handled = true;
COV[1000] = 1;         break;
      case 'u'.charCodeAt(0):
COV[1001] = 1;         this.union(this.x, this.y);
COV[1002] = 1;         this.replot();
COV[1003] = 1;         handled = true;
COV[1004] = 1;         break;
    }
    if (handled) {
COV[1005] = 1;       evt.stopPropagation();
COV[1006] = 1;       evt.preventDefault();
    }
COV[1007] = 1;   }).bind(this), false);
COV[1008] = 1; };

// Indentation settings for Vim and Emacs.
//
// Local Variables:
// js2-basic-offset: 2
// indent-tabs-mode: nil
// End:
//
// vim: et sts=2 sw=2
