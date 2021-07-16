/**
Python -> JavaScript notes:

Prefer Python:
* negative array indexing, like:
    first = a[0]
    last = a[-1]
* iteration over arrays, like:
    for x in a:
* more readable string formatting, like:
    "Result: %d, %d" % (x, y)
* class-based inheritance

Prefer JavaScript:
* explicit variable declarations, especially with 'use strict';
* a.length feels more natural than len(a). annoying to convert
* Easier printing of data structures without casting to strings first:
    "Result list is now: " + result_list
* OK to test value not in an associative array:
    if (myobj[key] == undefined)

Equivalent:
* (if item not in a) -> (if a.indexOf(item) != -1)
* to my surprise, every instance of array slicing (a[1:]) in my code
  was easy converted to a Python a.shift() or a.pop(), those cover quite
  a few cases - and a.slice works for most other cases.

Tossup:
* Structured indentation vs braces and semicolons.

**/

var nodeData1 = {
  'gender': 'male',
  'affected': false,
  'carrier': false,
  'dead': false,
  'pregnancy': false,
  'twin': false,
  'proband': true,
  'parents': null,
  'label': '',
  'multiple': 1
};

var node1 = new pedigree.Node(nodeData1);
assertEquals(JSON.stringify(node1), JSON.stringify(nodeData1));

var nodeData2 = {
  'gender': 'female',
  'affected': true,
  'carrier': false,
  'dead': false,
  'pregnancy': false,
  'twin': false,
  'proband': false,
  'parents': null,
  'label': 'Three girls',
  'multiple': 3
};

var node2 = new pedigree.Node(nodeData2);
assertEquals(JSON.stringify(node2), JSON.stringify(nodeData2));

var father = new pedigree.Node({'gender': 'male', 'label': 'Papa Bear'});
var mother = new pedigree.Node({'gender': 'female', 'label': 'Mama Bear'});
var brother = new pedigree.Node({'gender': 'male', 'label': 'Brother Bear',
                                 'parents': [0, 1, 1, 1],
                                 'proband': true});
var sister = new pedigree.Node({'gender': 'female', 'label': 'Sister Bear',
                                'parents': [0, 1, 1, 1]});

var pedi = new pedigree.Pedigree();
pedi.data[1] = [];
pedi.data[1].push(father);
pedi.data[1].push(mother);
pedi.data[2] = [];
pedi.data[2].push(brother);
pedi.data[2].push(sister);
pedi.unions.push([0, 1, 1, 1]);

pedi.describe_all();

pedi.describe(0, 1);
pedi.describe(1, 1);
pedi.describe(0, 2);
pedi.describe(1, 2);

pedi.longdescribe(0, 1);
pedi.longdescribe(1, 1);
pedi.longdescribe(0, 2);
pedi.longdescribe(1, 2);

console.log('Success!');
