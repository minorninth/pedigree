import pedigree from './pedigree.js';

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

test('Create pedigree', () => {
    var tu2 = new pedigree.Pedigree();
    tu2.data = {
	1: [
	    new pedigree.Node({'gender': 'male',
			       'affected': false,
			       'carrier': true,
			       'dead': true,
			       'multiple': 1,
			       'pregnancy': false,
			       'twin': false,
			       'proband': false,
			       'parents': null,
			       'label': 'd. 84 natural causes'})
	]
    };
    tu2.text = 'Ethnicity - Maternal: Swedish, Paternal: Danish; Consanguinity deni\
ed';

});
