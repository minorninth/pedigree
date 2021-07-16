#!/usr/bin/python

SRC_JS = 'pedigree.js'
SRC_TEST_JS = 'pedigree_tu2.js'

DST_JS = 'pedigree_coverage.js'
DST_TEST_JS = 'pedigree_coverage_tu2.js'

srcf = open(SRC_JS)
dstf = open(DST_JS, 'w')
dstf.write('window.COV = {};\n');
covered_lines = 0
for line in srcf:
  if line.find(';') > 0:
    line = 'COV[' + str(covered_lines) + '] = 1; ' + line
    covered_lines += 1
  dstf.write(line)
dstf.close()

src_testf = open(SRC_TEST_JS)
dst_testf = open(DST_TEST_JS, 'w')
dst_testf.write(src_testf.read())
dst_testf.write('var cov_count = 0;\n')
dst_testf.write('var cov_max = ' + str(covered_lines) + ';\n')
dst_testf.write('for (var i = 0; i < cov_max; i++) {\n')
dst_testf.write('  if (COV[i])\n')
dst_testf.write('    cov_count++;\n')
dst_testf.write('  else\n')
dst_testf.write('    console.log("Missing line: " + i);\n')
dst_testf.write('}\n');
dst_testf.write('console.log("Coverage: " + cov_count + " of " + cov_max + " lines."\n');
dst_testf.close()


