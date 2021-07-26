import pedigree from './pedigree.js';

test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
});

test('Create pedigree', () => {
    var tu2 = new pedigree.Pedigree();
    tu2.data = {
        1: [
            new pedigree.Node({
                'gender': 'male',
                'affected': false,
                'carrier': true,
                'dead': true,
                'multiple': 1,
                'pregnancy': false,
                'twin': false,
                'proband': false,
                'parents': null,
                'label': 'd. 84 natural causes'
            }),
            new pedigree.Node({
                'gender': 'female',
                'affected': false,
                'carrier': false,
                'dead': true,
                'multiple': 1,
                'pregnancy': false,
                'twin': false,
                'proband': false,
                'parents': null,
                'label': 'd. 85 natural causes'
            }),
        ],
        2: [
            new pedigree.Node({
                'gender': 'female',
                'affected': false,
                'carrier': false,
                'dead': false,
                'multiple': 4,
                'pregnancy': false,
                'twin': false,
                'proband': false,
                'parents': [0, 1, 1, 1],
                'label': 'A&W, no information about number of children'
            }),
            new pedigree.Node({
                'gender': 'male',
                'affected': false,
                'carrier': false,
                'dead': false,
                'multiple': 1,
                'pregnancy': false,
                'twin': false,
                'proband': true,
                'parents': [0, 1, 1, 1],
                'label': 'A&W, no information about children'
            }),
        ]
    };
    tu2.unions = [
        [1, 1, 0, 1]
    ];
    tu2.text = 'Ethnicity - Maternal: Swedish, Paternal: Danish; Consanguinity denied';
    expect(tu2.longdescribe(0, 1)).toBe('1 1 is the father of the proband');
    expect(tu2.longdescribe(1, 1)).toBe('1 2 is the mother of the proband');
    expect(tu2.longdescribe(0, 2)).toBe('2 1 is a sister of the proband');
    expect(tu2.longdescribe(1, 2)).toBe('2 2 is the proband.');
});