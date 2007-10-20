#!python

DBG = 1 # stack trace
VERBOSE = False

TEST_PLOTTING = 0

LEFT = 1000
RIGHT = 1001
UP = 1002
DOWN = 1003
NEWLINE = 1004
BACKSPACE = 1005

import sys, os, datetime, traceback

windows = None

try:
  import msvcrt
  windows = True
except:
  import tty
  windows = False

import matplotlib
if windows:
  matplotlib.use('PS')
else:
  matplotlib.use('Pdf')
from pylab import *
from matplotlib.patches import Circle, Rectangle, Polygon

braille_numbers = {
  0: [2, 4, 5],
  1: [1],
  2: [1, 2],
  3: [1, 4],
  4: [1, 4, 5],
  5: [1, 5],
  6: [1, 2, 4],
  7: [1, 2, 4, 5],
  8: [1, 2, 5],
  9: [2, 4]}

# Letters left: eghior

helpstr = \
"""\r
Help:\r
Press T to type the text that appears at the top of the page.\r
When typing this text or also when typing the label for a person,\r
use a semicolon followed by a space to represent a line break.\r

New people are always created after the current person.\r
Press M for male, F for female, B for a pregnancy loss,\r
and shift-U for an unknown gender.\r
Press a number key 2-9 to put a number to represent multiple people.\r
Press 0 for a nonexistent person or child.\r
Press shift-N to put an n to represent n people.\r
Note that when counting the number of people, n people is counted as 10.\r

Use the arrow keys to move, or press J to jump to a particular person.\r
Press D to describe the current person.\r
Press W to describe the whole tree.\r

Press A to mark a person as affected.\r
Press C to mark a person as a carrier.\r
Press K to kill a person.\r
Press X to mark a person as the proband.\r
Press Shift-P to mark a person as a pregnancy.\r
Press Enter to enter an additional description of a person.\r

Press Shift-T on the first sibling to mark two siblings as twins.\r

Press U to create or delete a union.\r
Press P to set or delete a person's parents.\r
Press dot P to use the same parents as the previous person.\r
Press backspace to delete a person.\r

Press S to save, L to load, N to create a new pedigree.\r
Press dot S to quick save using the same filename without asking.\r
Press Z to undo, Y to redo what was undone.\r

Press Q to quit.\r
"""

global g_connection

class QuitError(Exception):
  pass

def out(str):
  if g_connection:
    g_connection.send(str + "\r\n")
    print str
  else:
    try:
      sys.stdout.write(str)
      sys.stdout.write("\r\n")
      sys.stdout.flush()
    except:
      pass

def verbose(str):
  if VERBOSE:
    out(str)

def out1(str):
  if g_connection:
    g_connection.send(str)
  else:
    sys.stdout.write(str)
    sys.stdout.flush()

def inchar():
  if g_connection:
    data = g_connection.recv(1)
    if (ord(data) >= ord('0') and ord(data) <= ord('z')):
      print "# %c" % data
    else:
      print "#", ord(data)
    if not data:
      return 3
    else:
      return data
  else:
    if windows:
      return msvcrt.getch()
    else:
      return sys.stdin.read(1)

def smart_eps2pdf(infilename, outfilename):
  inf = open(infilename)
  in_lines = inf.readlines()
  if in_lines[0][:11] != '%!PS-Adobe-' or in_lines[0].find('EPSF')<0:
    out("Unable to parse %s as an EPS file." % infilename)
    return

  tmpfilename = "tmp.eps"
  tmpf = open(tmpfilename, "w")

  header = True
  bbox = None
  for i in range(len(in_lines)):
    line = in_lines[i]
    if header and line[:2] != '%%' and line[:2] != '%!':
      header = False
      if bbox == None:
        out("Never found bounding box in EPS file.")
        return
      # Magic: offset the figure so that it starts at the origin;
      # this means it will appear in the proper place when we set
      # the PDF paper size smaller...
      tmpf.write("%d %d translate\n" % (-bbox[0], -bbox[1]))
      if VERBOSE:
        out("%d %d translate" % (-bbox[0], -bbox[1]))
    if header:
      if line[:14]=='%%BoundingBox:':
        bbox = map(int, line[14:].strip().split())
        if VERBOSE:
          out("Got bounding box: %s" % str(bbox))
    if VERBOSE:
      sys.stdout.write(line)
    tmpf.write(line)
  tmpf.flush()

  if windows:
    gs = 'c:/Progra~1/gs/gs8.54/bin/gswin32c.exe'
  else:
    gs = '/sw/bin/gs'
  cmdline = '%s -dDEVICEWIDTHPOINTS=%d -dDEVICEHEIGHTPOINTS=%d -dFIXEDMEDIA -q -dBATCH -dSAFER -dMaxBitmap=500000000 -dNOPAUSE -dAlignToPixels=0 -sDEVICE="pdfwrite" -sOutputFile="%s" -f"%s"' % (gs, bbox[2]-bbox[0], bbox[3]-bbox[1], outfilename, tmpfilename)
  if VERBOSE:
    out(cmdline)
  os.system(cmdline)
  tmpf.close()
  if not windows:
    os.unlink(tmpfilename)

class gobj:
  pass

def quotestr(str):
  return str.__repr__()

class node:
  def __init__(self, gender, affected=False, carrier=False, dead=False,
                     multiple = 1, pregnancy=False, twin=False,
                     proband=False, parents=None, label=""):
    self.gender = gender
    self.affected = affected
    self.carrier = carrier
    self.dead = dead
    self.multiple = multiple  # 1 = default, 0 = nonexistant, 10 = "n" people
    self.pregnancy = pregnancy
    self.twin = twin
    self.proband = proband
    self.parents = parents
    self.label = label

  def __repr__(self):
    label = self.label
    label.replace('"', "'")
    return '\nnode("'+str(self.gender)+'",\n' + \
           '     affected='+str(self.affected)+',\n'+ \
           '     carrier='+str(self.carrier)+',\n'+ \
           '     dead='+str(self.dead)+',\n'+ \
           '     multiple='+str(self.multiple)+',\n'+ \
           '     pregnancy='+str(self.pregnancy)+',\n'+ \
           '     twin='+str(self.twin)+',\n'+ \
           '     proband='+str(self.proband)+',\n'+ \
           '     parents='+str(self.parents)+',\n'+ \
           '     label='+quotestr(label)+')'

class state:
  def __init__(self, action, data, unions, x, y, text=""):
    self.action = action
    self.data = {}
    self.text = text
    for i in data:
      self.data[i] = []
      for n in data[i]:
        n2 = node(n.gender, n.affected, n.carrier, n.dead, n.multiple,
                  n.pregnancy, n.twin, n.proband, n.parents, n.label)
        self.data[i].append(n2)
    self.unions = {}
    for i in unions:
      self.unions[i] = unions[i]
    self.x = x
    self.y = y

  def __repr__(self):
    return 'state(\n'+ \
           '"'+str(self.action)+'",\n'+ \
           str(self.data)+',\n'+ \
           str(self.unions)+',\n'+ \
           str(self.x)+',\n'+ \
           str(self.y)+',\n'+ \
           'text=' + quotestr(self.text) + ')\n'

class pedigree:
  def __init__(self):
    self.text = 'Prepared by Ronit Ovadia'
    self.data = {}
    self.data[1] = []
    self.unions = {}
    self.char_history = "  "
    self.redo_history = []
    self.undo_history = [0, 0]
    self.dirty = False
    self.prev_parents = None
    self.last_dot = False
    self.filename = False
    pass

  def get_next_char(self):
    c = inchar()
    self.char_history += c
    if ord(self.char_history[-2])==224: # win32 escape code
      if ord(c)==75:
        return LEFT
      elif ord(c)==77:
        return RIGHT
      elif ord(c)==72:
        return UP
      elif ord(c)==80:
        return DOWN
    if (ord(self.char_history[-3])==255 and
        ord(self.char_history[-2])>=249): # unix escape code
      out("Escape %d %d %d" % (
        ord(self.char_history[-3]),
        ord(self.char_history[-2]),
        ord(self.char_history[-1])))
    elif (ord(self.char_history[-3])==27 and
          ord(self.char_history[-2])==91): # unix escape code
      if ord(c)==68:
        return LEFT
      elif ord(c)==67:
        return RIGHT
      elif ord(c)==65:
        return UP
      elif ord(c)==66: # down
        return DOWN
    elif ord(c)==3:
      raise QuitError
    elif ord(c)>=224: # part of escape code to ignore
      return None
    elif ord(c)==10:
      return None
    elif ord(c)==13:
      return NEWLINE
    elif ord(c)==8 or ord(c)==126 or ord(c)==127:
      return BACKSPACE
    elif ord(c)==91:
      if ord(self.char_history[-2])==27:
        return None
      else:
        return c
    elif ord(c)==27:
      return None
    else:
      return c

  def push(self, action, x, y):
    s = state(action, self.data, self.unions, x, y, text=self.text)
    self.undo_history.append(s)
    if self.redo_history != []:
      self.redo_history = []
    self.dirty = True

  def loadstate(self, s):
    self.data = {}
    self.text = s.text
    for i in s.data:
      self.data[i] = s.data[i]
    self.unions = {}
    for i in s.unions:
      self.unions[i] = s.unions[i]
    return (s.x, s.y)

  def undo(self):
    if len(self.undo_history) <= 1:
      out("Nothing to undo.")
      return None
    a = self.undo_history[-1]
    self.undo_history = self.undo_history[:-1]
    self.redo_history.append(a)
    out("Undoing %s" % a.action)
    return self.loadstate(self.undo_history[-1])

  def redo(self):
    if self.redo_history == []:
      out("Nothing to redo.")
      return None
    s = self.redo_history[-1]
    self.redo_history = self.redo_history[:-1]
    self.undo_history.append(s)
    out("Redoing %s" % s.action)
    return self.loadstate(s)

  def load(self, filename):
    if not os.path.exists(filename):
      out("File not found.")
      return None
    try:
      data = open(filename, "r").read()
    except:
      out("Sorry, unable to read file.")
      return None
    if len(data)<10 or data[:10] != "#PEDIGREE\n":
      out("File is not in the right format.")
      return None
    s = None
    try:
      s=eval(data)
    except:
      out("An error occurred trying to parse the file.")
      return None
    try:
      self.text = s.text
      self.data = s.data
      self.unions = s.unions
      self.filename = filename
      out("Successfully loaded file saved on %s" % (s.action))
      self.describe_all(s.x, s.y)
      self.push("loading %s" % filename, s.x, s.y)
      return (s.x, s.y)
    except:
      out("An error occurred trying to load the pedigree from the file.")
      return None

  def load_prompt(self):
    out("Enter the filename to load")
    filename = self.readline()
    if filename == "":
      out("No filename specified, so I will not load.")
      return None
    self.load(filename)

  def save(self, x, y):
    s = state(str(datetime.date.today()), self.data, self.unions,
              x, y, text=self.text)
    if self.last_dot and self.filename:
      filename = self.filename
    else:
      while 1:
        out("Enter filename to save pedigree:")
        filename = self.readline()
        if filename=="":
          out("No filename specified, so I will not save.")
          return
        if not os.path.exists(filename):
          break
        if self.ask("Replace existing file with that name?"):
          break
    fp = open(filename, "w")
    fp.write("#PEDIGREE\n")
    fp.write(str(s))
    fp.close()
    self.push("saving %s" % filename, x, y)
    self.dirty = False
    success = self.plot(filename)
    if not success:
      success = self.plot(filename, page = 0, pages = 2)
      if success:
        success = self.plot(filename, page = 1, pages = 2)
      if not success:
        out("Error, file not saved.")
        return
      out("The output is two pages, in two separate PDF files.")
    
    #self.plot(filename, braille=True)
    self.filename = filename
    out("Data file and PDF saved.")

  def out_counts(self, count_list):
    str = ""
    for count_tuple in count_list:
      if str != "":
        str += ", "
      if len(count_tuple)==2:
        (count, singular) = count_tuple
        plural = singular + "s"
      else:
        (count, singular, plural) = count_tuple
      if (count==1):
        str += "%d %s" % (count, singular)
      else:
        str += "%d %s" % (count, plural)
    out(str+".")

  def describe_all(self, x, y):
    out(self.text)
    proband_count = 0
    affected_count = 0
    carrier_count = 0
    pregnancy_count = 0
    twin_count = 0
    dead_count = 0
    male_count = 0
    female_count = 0
    nogender_count = 0
    pregloss_count = 0
    row_count = 0
    node_count = 0
    person_count = 0
    for y1 in self.data:
      row = self.data[y1]
      row_count += 1
      for x1 in range(len(row)):
        n = row[x1]
        n.connections = 0
        node_count += 1
        person_count += n.multiple
        if n.gender == 'male':
          male_count += n.multiple
        if n.gender == 'female':
          female_count += n.multiple
        if n.gender == 'nogender':
          nogender_count += n.multiple
        if n.gender == 'pregloss':
          pregloss_count += n.multiple
        if n.proband:
          proband_count += n.multiple
        if n.affected:
          affected_count += n.multiple
        if n.pregnancy:
          pregnancy_count += n.multiple
        if n.twin:
          twin_count += n.multiple
        if n.carrier:
          carrier_count += n.multiple
        if n.dead:
          dead_count += n.multiple
    # print main stats
    if node_count == 0:
      out("The pedigree is completely empty.")
      return
    self.out_counts([(node_count, "node"),
                     (person_count, "person", "people"),
                     (row_count, "row"),
                     (male_count, "male"),
                     (female_count, "female"),
                     (nogender_count, "person of unknown gender",
                                      "people of unknown gender"),
                     (pregloss_count, "pregnancy loss",
                                      "pregnancy losses"),
                     (proband_count, "proband"),
                     (pregnancy_count, "pregnancy", "pregnancies"),
                     (twin_count, "twin"),
                     (affected_count, "affected person", "affected people"),
                     (carrier_count, "carrier"),
                     (dead_count, "dead person", "dead people")])
    # count the number of connections (parents, children, unions)
    # each person has
    for row in self.data.values():
      for n in row:
        if n.parents != None:
          (x1, y1, x2, y2) = n.parents
          n.connections += 1
          if x1!=None and y1!=None:
            self.data[y1][x1].connections += 1
          if x2!=None and y2!=None:
            self.data[y2][x2].connections += 1
    for (x1, y1, x2, y2) in self.unions:
      self.data[y1][x1].connections += 1
      self.data[y2][x2].connections += 1
    # print disconnected people
    no_connection_count = 0
    for row in self.data.values():
      for n in row:
        if n.connections == 0:
          no_connection_count += 1
    if no_connection_count == 0:
      out("Everyone in the pedigree is connected to at least one other.")
    elif no_connection_count == node_count:
      out("Nobody in the pedigree is connected to anyone else.")
    elif no_connection_count == 1:
      out("The following person is not connected:")
    else:
      out("The following %d people are not connected:" % no_connection_count)
    for y1 in self.data:
      row = self.data[y1]
      row_count += 1
      for x1 in range(len(row)):
        n = row[x1]
        if n.connections == 0:
          out("  %d %d" % (y1, x1+1))
    out("")
    pass

  def describe(self, x, y):
    row = self.data[y]
    if row == []:
      out("Row %d is empty." % y)
    elif x==-1:
      out("Beginning of row %d, length %d." % (y, len(row)))
    else:
      n = row[x]
      str = "%d %d is" % (y, x+1)
      if n.proband:
        str += " the proband and is"
      if n.multiple == 10:
        str += " nx"
      elif n.multiple > 1:
        str += " %dx" % n.multiple
      if n.affected:
        str += " an affected"

      if n.multiple == 0:
        str += " a nonexistant child"
      else:
        if n.gender == "male":
          str += " male"
        if n.gender == "female":
          str += " female"
        if n.gender == "nogender":
          str += " person of unknown gender"
        if n.gender == "pregloss":
          str += " pregnancy loss"

      if n.pregnancy:
        str += ", a pregnancy"
      if n.twin:
        str += ", a twin with the following sibling"
      if n.carrier:
        str += ", a carrier"
      if n.dead:
        str += ", dead"

      # union
      ustr = ""
      found_unions = []
      for (x1, y1, x2, y2) in self.unions:
        if x1==x and y1==y and (x2, y2) not in found_unions:
          found_unions.append((x2, y2))
          if ustr=="":
            ustr = ", in union with %d %d" % (y2, x2+1)
          else:
            ustr += " and %d %d" % (y2, x2+1)
        if x2==x and y2==y and (x1, y1) not in found_unions:
          found_unions.append((x1, y1))
          if ustr=="":
            ustr = ", in union with %d %d" % (y1, x1+1)
          else:
            ustr += " and %d %d" % (y1, x1+1)
      str += ustr

      # parents
      if n.parents:
        (fx, fy, mx, my) = n.parents
        if fx!=None and fy!=None and mx!=None and my!=None:
          str += ", child of %d %d and %d %d" % (fy, fx+1, my, mx+1)
        elif fx!=None and fy!=None:
          str += ", child of %d %d" % (fy, fx+1)
        elif mx!=None and my!=None:
          str += ", child of %d %d" % (my, mx+1)

      # children
      children = 0
      nochildren = 0
      for row in self.data:
        for person in self.data[row]:
          if person.parents != None:
            (xx1, yy1, xx2, yy2) = person.parents
            if (xx1==x and yy1==y) or (xx2==x and yy2==y):
              if person.multiple == 0:
                nochildren += 1
              else:
                children += 1
      if children == 1:
        str += ", with 1 child"
      elif children > 1:
        str += ", with %d children" % children
      elif nochildren > 0:
        str += ", marked explicitly as having no children"

      str += "."
      if n.label != "":
        str += " " + n.label
      out(str)

  def edit(self, x, y):
    out("Enter a new description for %d %d." % (y, x+1))
    line = self.readline()
    self.data[y][x].label = line
    self.push("changing description of %d %d to %s" % (y, x+1, line), x, y)
    self.describe(x, y)

  def move(self, x1, y1, x2, y2):
    u2 = {}
    for u in self.unions:
      (xx1, yy1, xx2, yy2) = u
      if xx1==x1 and yy1==y1:
        xx1 = x2
        yy1 = y2
      if xx2==x1 and yy2==y1:
        xx2 = x2
        yy2 = y2
      u2[(xx1, yy1, xx2, yy2)] = 1
    self.unions = u2
    for y in self.data:
      row = self.data[y]
      for n in row:
        if n.parents != None:
          (xx1, yy1, xx2, yy2) = n.parents
          if xx1==x1 and yy1==y1:
            xx1 = x2
            yy1 = y2
          if xx2==x1 and yy2==y1:
            xx2 = x2
            yy2 = y2
          n.parents = (xx1, yy1, xx2, yy2)

  def deletenode(self, x, y):
    if x==-1:
      return (x, y)
    # Delete unions containing this node
    oldunions = self.unions
    self.unions = {}
    for (xx1, yy1, xx2, yy2) in oldunions:
      if xx1==x and yy1==y:
        out("Deleting union with %d %d" % (yy2, xx2+1))
      elif xx2==x and yy2==y:
        out("Deleting union with %d %d" % (yy1, xx1+1))
      else:
        self.unions[(xx1, yy1, xx2, yy2)] = 1
    # Delete parent fields containing this node
    for y1 in self.data:
      row = self.data[y1]
      for x1 in range(len(row)):
        n = row[x1]
        if n.parents != None:
          (xx1, yy1, xx2, yy2) = n.parents
          if xx1==x and yy1==y:
            xx1 = None
            yy1 = None
            out("Deleting parent of %d %d" % (y1, x1+1))
          if xx2==x and yy2==y:
            xx2 = None
            yy2 = None
            out("Deleting parent of %d %d" % (y1, x1+1))
          if xx1==None and yy1==None and xx2==None and yy2==None:
            n.parents = None
          else:
            n.parents = (xx1, yy1, xx2, yy2)
    # Move the rest of the row over
    row = self.data[y]
    row = row[:x] + row[x+1:]
    self.data[y] = row
    for i in range(x+1, len(row)+1):
      self.move(i,y,i-1,y)
    out("Successfully deleted %d %d from the tree." % (y, x+1))
    self.push("deleting %d %d" % (y, x+1), x, y)
    x -= 1
    return (x, y)

  def addnode(self, n, x, y):
    row = self.data[y]
    row = row[:x] + [n] + row[x:]
    self.data[y] = row
    for i in range(len(row)-1, x, -1):
      self.move(i-1,y,i,y)

  def readline(self):
    line = ""
    while 1:
      c = self.get_next_char()
      if c==NEWLINE:
        out('')
        return line
      elif c==BACKSPACE:
        if len(line)>0:
          line = line[:-1]
          out1('\r' + ' '*(len(line)+2) + ('\r%s' % line))
      elif c!=None:
        out1(c)
        line = line + c

  def ask(self, prompt):
    out(prompt)
    while 1:
      c = self.get_next_char()
      if c=='y' or c=='Y':
        return True
      elif c=='c' or c=='C':
        return []
      else:
        return False

  def getloc(self):
    out("Type row number, comma row position, and press enter.")
    line = self.readline()
    try:
      (y, x) = map(int, line.split(","))
    except:
      out("Did not understand, exiting this command.")
      return None
    if y < 1 or y not in self.data:
      out("Row does not exist.")
      out("Use the up and down arrows to create a new row.")
      return None
    if x < 0 or x > len(self.data[y]):
      out("Sorry, row %d has only %d people." % (y, len(self.data[y])))
      return None
    return (x-1, y)

  def parents(self, x, y):
    if y==1:
      out("You are in the top row, there are no parents to specify.")
      out("Press up arrow to create a row for this person's parents.")
      return
    num_parents = 0
    p1 = None
    p2 = None
    if self.last_dot and self.prev_parents != None:
      (num_parents, fx, fy, mx, my) = self.prev_parents
      p1 = (fx, fy)
      p2 = (mx, my)
      if num_parents == 1:
        out("Using %d %d as the parent again." % (fy, fx+1))
      elif num_parents == 2:
        out("Using %d %d and %d %d as the parents again." % (
            fy, fx+1, my, mx+1))
    if num_parents == 0:
      out("Press number key for number of parents: "+
          "1, 2, or 0 to delete existing parents.")
      c = self.get_next_char()
      if c=='1':
        num_parents = 1
      elif c=='2':
        num_parents = 2
      elif c=='0':
        num_parents = 0
      else:
        out("Did not understand, exiting this command.")
        return None
    if num_parents == 0:
      # Delete existing parents
      if self.data[y][x].parents != None:
        out("Deleting parents of node %d %d." % (y, x+1))
        self.data[y][x].parents = None
        self.push("deleting parents of %d %d" % (y, x+1), x, y)
        return
      else:
        out("%d %d did not already have parents, doing nothing." %
            (y, x+1))
        return

    if p1 == None:
      if num_parents == 2:
        out("Please specify the father of %d %d first." % (y, x+1))
      else:
        out("Specify the parent of %d %d." % (y, x+1))
      p1 = self.getloc()
      if p1==None:
        return
    (fx, fy) = p1
    if num_parents == 2 and self.data[fy][fx].gender != "male":
      out("%d %d is not male.  Exiting adding parents." % (fy, fx+1))
      return
    if p2 == None:
      if num_parents == 2:
        for (x1, y1, x2, y2) in self.unions:
          if x1==fx and y1==fy:
            if self.ask("Is %d %d the mother?" % (y2, x2+1)):
              p2 = (x2, y2)
              break
          if x2==fx and y2==fy:
            if self.ask("Is %d %d the mother?" % (y1, x1+1)):
              p2 = (x1, y1)
              break
      if p2==None and num_parents == 2:
        out("Please specify the mother.")
        p2 = self.getloc()
      if p2==None and num_parents == 2:
        return
    if num_parents == 2:
      (mx, my) = p2
      if self.data[my][mx].gender != "female":
        out("%d %d is not female.  Exiting adding parents." % (my, mx+1))
        return
      found_union = False
      for (x1, y1, x2, y2) in self.unions:
        if x1==fx and y1==fy and x2==mx and y2==my:
          found_union = True
        if x2==fx and y2==fy and x1==mx and y1==my:
          found_union = True
      if not found_union:
        out("Adding union between %d %d and %d %d." % (fy, fx+1, my, mx+1))
        self.unions[(fx, fy, mx, my)] = 1
    else:
      # one parent
      (mx, my) = (None, None)
    self.prev_parents = (num_parents, fx, fy, mx, my)
    self.data[y][x].parents = (fx, fy, mx, my)
    self.push("adding parents of %d %d" % (y, x+1), x, y)
    self.describe(x, y)

  def union(self, x, y):
    if x==-1:
      return
    row = self.data[y]
    x2 = None
    y2 = None
    if (x>0 and row[x-1].gender != row[x].gender and
        (x-1, y, x, y) not in self.unions and
        (x, y, x-1, y) not in self.unions):
      if self.ask("Create union between %d %d and %d %d?" %
             (y, x, y, x+1)):
        x2 = x-1
        y2 = y
    if x2 is None:
      out("Enter person to union or ununion with %d %d" % (y, x+1))
      result = self.getloc()
      if result == None:
        return
      (x2, y2) = result
    if x==x2 and y==y2:
      out("Cannot union person with themself!")
      return
    if (x, y, x2, y2) in self.unions or (x2, y2, x, y) in self.unions:
      out("That union already exists, would you like to delete it?")
      c = self.get_next_char()
      if c=='y' or c=='Y':
        out("Deleting union between %d %d and %d %d" % \
            (y, x+1, y2, x2+1))
        oldunions = self.unions
        self.unions = {}
        for (xx1, yy1, xx2, yy2) in oldunions:
          if ((xx1==x and yy1==y and xx2==x2 and yy2==y2) or 
              (xx2==x and yy2==y and xx1==x2 and yy1==y2)):
            pass
          else:
            self.unions[(xx1, yy1, xx2, yy2)] = 1
      self.push("deleting union between %d %d and %d %d" % \
                (y, x+1, y2, x2+1), x, y)
      return
    if self.data[y][x].gender == self.data[y2][x2].gender:
      out("Sorry, %d %d and %d %d are both %s" %
          (y, x+1, y2, x2+1, self.data[y2][x2].gender))
      return
    if y!=y2:
      if not self.ask("Are you sure you want to union between different rows?"):
        return
    self.unions[(x, y, x2, y2)] = 1
    self.push("creating union between %d %d and %d %d" % (y, x+1, y2, x2+1), x, y)
    self.describe(x, y)

  def segments_intersect(self, a0, a1, b0, b1):
    """Return true if the line segment from a0 to a1 intersects the
       segment from b0 to b1; they may appear in any order"""
    aL = min(a0, a1)
    aR = max(a0, a1)
    bL = min(b0, b1)
    bR = max(b0, b1)
    return aL <= bR and aR >= bL

  def plot(self, filename_stem, cur_x=None, cur_y=None,
           braille=False, page=0, pages=1):
    class unionobj:
      pass

    rows = self.data.keys()
    rows.sort()

    # Step 1: Initialize fields
    for y in rows:
      row = self.data[y]
      for x in range(len(row)):
        n = row[x]
        n.index = x
        n.sibling_line = None
        n.parent_line = None
        n.siblings = [x]
        n.children = []
        n.right_union = None
        n.left_union = None
        n.Xoff = 0
        if n.parents != None:
          (x1, y1, x2, y2) = n.parents
          if (y1 != None and y1 != y-1) or (y2 != None and y2 != y-1):
            out("A parent of %d %d is not in the row above." % \
                (y, x+1))
            out("Cannot save drawing.")
            return False

    # Step 2: Calculate text extent for each node
    #renderer = matplotlib.backends.backend_pdf.RendererPdf("temp")
    def textwidth(s):
      return len(s) * 5.7
      ### t = text(0.0, 0.0, s, fontsize=9.0)
      ### return t.get_window_extent(renderer).get_bounds()[2]

    def splittext(text, max_width):
      lines = []
      tokens = text.split(" ")
      line = tokens[0]
      tokens = tokens[1:]
      while len(tokens)>0:
        while textwidth(line + " " + tokens[0]) < max_width:
          if len(line)>0 and line[-1]==';':
            break
          line += " " + tokens[0]
          tokens = tokens[1:]
          if len(tokens)==0:
            break
        if len(tokens)==0:
          break
        if len(line)>0 and line[-1]==';':
          line = line[:-1]
        lines.append(line)
        line = tokens[0]
        tokens = tokens[1:]
      if len(line)>0 and line[-1]==';':
        line = line[:-1]
      lines.append(line)
      return lines

    for y in rows:
      row = self.data[y]
      for x in range(len(row)):
        n = row[x]
        n.label_lines = []
        if n.label == None or n.label == "":
          continue
        n.label_lines = splittext(n.label, 80)

    # Step 3: Insert unions
    unions = {}
    for (x1, y1, x2, y2) in self.unions:
      if y1 != y2:
        out("%d %d is in union with %d %d, in a different row." % \
          (y1, x1+1, y2, x2+1))
        out("Cannot save drawing.")
        return False
      if x1 > x2:
        (x2, x1) = (x1, x2)
      if x2 != x1 + 1:
        out("%d %d is in union with %d %d, but they are not adjacent." % \
          (y1, x1+1, y2, x2+1))
        out("Cannot save drawing.")
        return False
      uobj = unionobj()
      unions[(y1, x1, x2)] = uobj
      uobj.children = []
      uobj.parent_line = None
      self.data[y1][x1].right_union = uobj
      self.data[y1][x2].left_union = uobj
      uobj.left = x1
      uobj.right = x2

    # Step 4: Append children to each Parent or Union
    for y in rows:
      row = self.data[y]
      for n in row:
        if n.parents != None:
          (x1, y1, x2, y2) = n.parents
          if x1 == None or (x1 != None and x2 != None and x1 > x2):
            (x2, x1) = (x1, x2)
          did_union = False
          if x1 != None and x2 != None:
            if (y1, x1, x2) in unions:
              uobj = unions[(y1, x1, x2)]
              uobj.children.append(n.index)
              did_union = True

          if x1 != None and not did_union:
            self.data[y1][x1].children.append(n.index)
          if x2 != None and not did_union:
            self.data[y2][x2].children.append(n.index)

    # Step 5: Sort children, set siblings, sort siblings
    for y in rows:
      row = self.data[y]
      for n in row:
        n.children.sort()
        for c1 in n.children:
          child = self.data[y+1][c1]
          for c2 in n.children:
            if c2 not in child.siblings:
              child.siblings.append(c2)
        uobj = n.right_union
        if uobj != None:
          uobj.children.sort()
          for c1 in uobj.children:
            child = self.data[y+1][c1]
            for c2 in uobj.children:
              if c2 not in child.siblings:
                child.siblings.append(c2)
        n.siblings.sort()

    # Step 6: Come up with the group for each person - their
    # siblings plus siblings' spouses
    for y in rows:
      row = self.data[y]
      for n in row:
        n.group = []
        for c in n.siblings:
          if c not in n.group:
            n.group.append(c)
          if row[c].left_union != None and c-1 not in n.group:
            n.group.append(c-1)
          if row[c].right_union != None and c+1 not in n.group:
            n.group.append(c+1)
        n.group.sort()

    # Step 7: Add extra space between adjacent people in a row who
    # aren't in the same group, and add extra space after people
    # who have direct children (i.e. children not through a union)
    # because their text goes off to the right.
    for y in rows:
      row = self.data[y]
      for x in range(1, len(row)):
        if (row[x] not in row[x-1].group and
            row[x-1] not in row[x].group):
          row[x].Xoff += 1
        if len(row[x-1].children) > 0:
          row[x].Xoff += 2

    # Layout time!  Do one row at a time, starting from the bottom.
    # Try to lay out each parent centered around the center point of
    # the children.  If the parent would have to slide too far to the
    # left in order to do this, check to see if the parent's child group
    # is independent of the child group of all people to the left of
    # the parent.  If so, push this parent's child group to the right
    # and try again.  Otherwise, lay out the parent where it belongs.

    sanity_count = 0
    while 1:
      sanity_count += 1
      verbose("Trial %d" % sanity_count)
      if sanity_count == 20:
        break

      # Reset positions
      for y in rows:
        for n in self.data[y]:
          n.placed = False

      Xmax = 0
      ok = True

      for y in rows[::-1]:  # From bottom up
        if not ok:
          break
        X = 0
        row = self.data[y]
        for x in range(len(row)):
          verbose("%d %d" % (y, x + 1))
          n = row[x]
          if x == 0:
            X = n.Xoff
          else:
            X += (6 + n.Xoff)
          if n.placed:
            X = n.X
            verbose("  leaving at %.1f" % n.X)
            continue

          # Old: always placed person next to their partner - decided
          # against this, now will possibly place them far from their
          # partner to center them on their children
          #
          #if n.left_union != None and row[x-1].placed:
          #  n.X = X
          #  n.placed = True
          #  continue

          if y < rows[-1]:
            childrow = self.data[y+1]
          if len(n.children)>0:
            X0 = childrow[n.children[0]].X
            X1 = childrow[n.children[-1]].X
            Xctr = 0.5*(X0 + X1)
            if Xctr < X - 0.01: # epsilon fudge factor
              verbose("  is at %.1f, but ctr of its children is at %.1f" %
                      (X, Xctr))
              # See if there's an overlap with folks on left
              rightmost = -1
              for xleft in range(x-1):
                if len(row[xleft].children)>0:
                  rightmost_0 = childrow[row[xleft].children[0]].group[-1]
                  rightmost = max(rightmost, rightmost_0)
                uobj2 = row[xleft].right_union
                if uobj2 != None and len(uobj2.children)>0:
                  rightmost_0 = childrow[uobj2.children[0]].group[-1]
                  rightmost = max(rightmost, rightmost_0)
              if rightmost < childrow[n.children[0]].group[0]:
                childrow[childrow[n.children[0]].group[0]].Xoff += (X - Xctr)
                verbose("  (1) moving %d %d by %.1f" % (
                    y + 1, childrow[n.children[0]].group[0], X - Xctr))
                ok = False
              else:
                Xctr = X
            n.X = Xctr
            X = n.X
            n.placed = True
            verbose("  case with children complete, moved to %.1f" % n.X)
            continue
          if n.right_union != None and len(n.right_union.children)>0:
            uobj = n.right_union
            X0 = childrow[uobj.children[0]].X
            X1 = childrow[uobj.children[-1]].X
            Xctr = 0.5*(X0 + X1) - 3.5
            if Xctr < X - 0.01: # epsilon fudge factor
              # See if there's an overlap with folks on left
              rightmost = -1
              for xleft in range(x-1):
                if len(row[xleft].children)>0:
                  rightmost_0 = childrow[row[xleft].children[0]].group[-1]
                  rightmost = max(rightmost, rightmost_0)
                uobj2 = row[xleft].right_union
                if uobj2 != None and len(uobj2.children)>0:
                  rightmost_0 = childrow[uobj2.children[0]].group[-1]
                  rightmost = max(rightmost, rightmost_0)
              if rightmost < childrow[uobj.children[0]].group[0]:
                childrow[childrow[uobj.children[0]].group[0]].Xoff += \
                    (X - Xctr)
                verbose("  (2) moving %d %d by %.1f" % (
                    y + 1, childrow[uobj.children[0]].group[0], X - Xctr))
                ok = False
              else:
                Xctr = X
            n.X = Xctr
            X = n.X
            verbose("  case with union complete, moved to %.1f" % n.X)
            n.placed = True
            continue
          n.X = X
          n.placed = True
          verbose("  default complete, moved to %.1f" % n.X)
          continue
        if (X + 5) > Xmax:
           Xmax = X + 5
      if ok:
        break

    # For each row, figure out the sibling line y-position
    # and the parent line y-position (the parent line is not
    # relevant if the parent or union is perfectly centered on
    # the siblings

    class rowobj:
      pass

    rowobjs = {}

    for y in rows:
      verbose("Sibling and parent lines (horizontal lines) for row %d" % y)
      robj = rowobj()
      robj.num_parent_lines = 0
      robj.num_sibling_lines = 0

      rowobjs[y] = robj

      max_label_lines = 0
      for x in range(len(row)):
        num_lines = len(row[x].label_lines)
        if num_lines > max_label_lines:
          max_label_lines = num_lines
      # We pretend that a certain number of "conflicts" exist between
      # parent lines and the text; every two lines of text equals a
      # conflict
      num_label_conflicts = max_label_lines

      row = self.data[y]
      sibling_lines = []
      parent_lines = []
      for x in range(len(row)):
        verbose("%d %d" % (y, x+1))
        n = row[x]
        if n.sibling_line == None:
          conflicts = []
          for (first, last, line) in sibling_lines:
            if n.siblings[0] <= last and n.siblings[-1] >= first:
              if line not in conflicts:
                conflicts.append(line)
          n.sibling_line = 0
          while n.sibling_line in conflicts:
            n.sibling_line += 1
          sibling_lines.append((n.siblings[0], n.siblings[-1], n.sibling_line))
          for sib in n.siblings:
            row[sib].sibling_line = n.sibling_line
        if n.parent_line == None and len(n.children)>0:
          conflicts = range(num_label_conflicts)
          verbose("    Base conflicts: " + str(conflicts))
          # Check for overlapping lines using link structure only
          for (index, first, last, line) in parent_lines:
            if n.children[0] <= last and n.children[-1] >= first:
              verbose("    %d %d conflicts with parent line for %d and %d" %
                      (y, x+1, first, last))
              if line not in conflicts:
                conflicts.append(line)
          # Check for overlapping lines using positions
          for (index, first, last, line) in parent_lines:
            nextrow = self.data[y+1]
            other_X = row[index].X
            other_ctr = 0.5 * (nextrow[first].X + nextrow[last].X)
            this_X = n.X
            this_ctr = 0.5 * (nextrow[n.children[0]].X +
                              nextrow[n.children[-1]].X)
            verbose("    This: %.1f %.1f  Other: %.1f %.1f" %
               (this_ctr, this_X, other_ctr, other_X))
            if self.segments_intersect(other_X, other_ctr, this_X, this_ctr):
              verbose("    %d %d overlaps parent line for %d and %d" %
                      (y, x+1, first, last))
              if line not in conflicts:
                conflicts.append(line)
          n.parent_line = 0
          while n.parent_line in conflicts:
            n.parent_line += 1
          verbose("    Choosing parent line %d" % n.parent_line)
          parent_lines.append(
              (x, n.children[0], n.children[-1], n.parent_line))
          verbose("    " + str(parent_lines))
        uobj = n.right_union
        if uobj and uobj.parent_line == None and len(uobj.children)>0:
          conflicts = range(num_label_conflicts)
          for (index, first, last, line) in parent_lines:
            if uobj.children[0] <= last and uobj.children[-1] >= first:
              if line not in conflicts:
                conflicts.append(line)
          uobj.parent_line = 0
          while uobj.parent_line in conflicts:
            uobj.parent_line += 1
          verbose("    X2: Choosing parent line %d" % uobj.parent_line)
          parent_lines.append(
              (x, uobj.children[0], uobj.children[-1], uobj.parent_line))
      for (first, last, line) in sibling_lines:
        if line+1 > robj.num_sibling_lines:
          robj.num_sibling_lines = line+1
      for (index, first, last, line) in parent_lines:
        if line+1 > robj.num_parent_lines:
          robj.num_parent_lines = line+1
      verbose("  Sibling lines: " + str(sibling_lines))
      verbose("  Parent lines: " + str(parent_lines))

    # Compute height and Y position of each row
    Y = 0
    for y in rows:
      max_lines = 0
      row = self.data[y]
      for x in range(len(row)):
        n = row[x]
        num_lines = len(n.label_lines)
        if n.proband:
          num_lines += 1
        max_lines = max(max_lines, num_lines)
      if max_lines <= 5:
        base_ht = 5
      else:
        base_ht = 1.2 + 0.8 * max_lines
      robj = rowobjs[y]
      robj.height = base_ht + robj.num_parent_lines + robj.num_sibling_lines
      robj.num_parent_lines = 0
      robj.num_sibling_lines = 0
      robj.Y = int(Y)
      Y += robj.height
    Ymax = Y

    # Debug: print everyone's position
    if VERBOSE:
      for y in rows:
        robj = rowobjs[y]
        row = self.data[y]
        for x in range(len(row)):
          n = row[x]
          out("%d %d: %d, %d" % (y, x+1, n.X, robj.Y))
          if n.right_union != None:
            out("  UNION")

    # Set up figure
    (Xmargin, Ymargin) = (0.75, 0.75)
    Xmin = 0.0
    Ymin = 0.0

    text_lines = splittext(self.text, 600)
    line_height_guess = 1.5
    text_height_guess = 2.5 + line_height_guess * len(text_lines)

    if Xmax > (Ymax+text_height_guess):
      landscape = True
      (Xpage, Ypage) = (11.0 * pages, 8.5)
    else:
      landscape = False
      (Xpage, Ypage) = (8.5, 11.0 * pages)
    Xinnerpage = Xpage - (2 * pages) * Xmargin
    Yinnerpage = Ypage - (2 * pages) * Ymargin
    scale = min(Xinnerpage / Xmax, Yinnerpage / (Ymax + text_height_guess))

    if scale < 0.09 and pages == 1:
      # Return false, which forces the calling function
      # to call again with multiple pages.
      return False

    line_height = 0.2 / scale
    text_height = 2.5 + line_height * len(text_lines)

    linewidth = 5 * scale

    # Those calculations were for both pages, to set the scale.
    # Now switch to the values for just the current page:
    if pages > 1:
      if landscape:
        (Xpage, Ypage) = (11.0, 8.5)
        if page == 0:
          Xmax /= 2
        else:
          Xmin = Xmax / 2
      else:
        (Xpage, Ypage) = (8.5, 11.0)
        if page == 0:
          Ymax /= 2
        else:
          Ymin = Ymax / 2
      Xinnerpage = Xpage - 2 * Xmargin
      Yinnerpage = Ypage - 2 * Ymargin

    fig = figure(figsize = (Xpage, Ypage), dpi = 300)
    subplots_adjust(left = Xmargin/Xpage,
                    right = (Xpage-Xmargin)/Xpage,
                    bottom = Ymargin/Ypage,
                    top = (Ypage-Ymargin)/Ypage)

    # Move text so that it's at the top of the page but leave
    # everything else centered.
    if text_height < (Yinnerpage/scale - Ymax) / 2:
      text_height = (Yinnerpage/scale - Ymax) / 2

    # Draw the title text, but only on page 1
    if page == 0:
      for l in range(len(text_lines)):
        line = text_lines[l]
        text(Xmax/2.0, l * line_height - text_height, line, fontsize=10.0,
             horizontalalignment='center',
             verticalalignment='top')
    else:
      line = "Page %d" % (page + 1)
      text(Xmax/2.0, - text_height, line, fontsize=10.0,
           horizontalalignment='center',
           verticalalignment='top')      

    def draw_braille(str, X, Y, center):
      bx = 2.0
      by = 2.0
      width = bx * len(str)
      if center:
        Xleft = X - (width / 2)
      else:
        Xleft = X
      for i in range(len(str)):
        pattern = braille_numbers[ord(str[i])-ord('0')]
        dots = [(0.20, 0.20),
                (0.20, 1.00),
                (0.20, 1.80),
                (1.00, 0.20),
                (1.00, 1.00),
                (1.00, 1.80)]
        for j in range(6):
          if (j+1) in pattern:
            (dotx, doty) = dots[j]
            obj = Circle((Xleft + i*bx + dotx, Y + doty), radius = 0.08,
                         resolution = 30, linewidth = linewidth)
            obj.set_facecolor('#000000')
            gca().add_patch(obj)

    def makeperson(n, X, Y):
      if n.gender == 'female':
        obj = Circle((X + 2.5, Y + 0.5), radius = 0.5, resolution=100,
                     linewidth=linewidth)
      elif n.gender == 'male':
        obj = Rectangle(xy=(X + 2.0, Y + 0.0),
                        width = 1.0, height = 1.0,
                        linewidth=linewidth)
      elif n.gender == 'nogender':
        obj = Polygon(xy=[(X + 2.5, Y + 0.0),
                          (X + 3.0, Y + 0.5),
                          (X + 2.5, Y + 1.0),
                          (X + 2.0, Y + 0.5)],
                      linewidth=linewidth)
      elif n.gender == 'pregloss':
        obj = Polygon(xy=[(X + 2.5, Y + 0.0),
                          (X + 3.0, Y + 0.5),
                          (X + 2.0, Y + 0.5)],
                      linewidth=linewidth)
      obj.set_facecolor('#ffffff')
      if n.affected:
        obj.set_facecolor('#c0c0c0')
      if n.multiple == 0:
        # It's a dummy person, don't actually draw them
        pass
      else:
        # Draw the object
        gca().add_patch(obj)
      if n.carrier:
        center_dot = Circle((X + 2.5, Y + 0.5), radius = 0.1, resolution=50)
        center_dot.set_facecolor('#000000')
        gca().add_patch(center_dot)
      if n.proband:
        obj = Arrow(X + 0.65, Y + 1.05, 1.0, -0.4, 0.5,
                    facecolor = '#000000', linewidth=linewidth)
        gca().add_patch(obj)
        text(X + 0.15, Y + 1.1, "P", fontsize=45*scale,
             horizontalalignment='center',
             verticalalignment='top')
      if n.dead:
        plot([X + 3.1, X + 1.9],
             [Y - 0.1, Y + 1.1],
             color = '#000000', linewidth=linewidth)
      if n.pregnancy:
        text(X + 2.45, Y + 0.5, "P", fontsize=36*scale,
             horizontalalignment='center',
             verticalalignment='center')
      elif n.multiple == 10:
        if X + 2.45 < Xmax + 2 and X + 2.45 > Xmin - 2:
          text(X + 2.45, Y + 0.5, "n", fontsize=36*scale,
               horizontalalignment='center',
               verticalalignment='center')
      elif n.multiple > 1:
        if X + 2.45 < Xmax + 2 and X + 2.45 > Xmin - 2:
          text(X + 2.45, Y + 0.5, "%d" % n.multiple, fontsize=36*scale,
               horizontalalignment='center',
               verticalalignment='center')
      if braille:
        if len(n.children)>0:
          draw_braille("%d%d" % (y, x+1), X+3.5, Y+2.5, center=False)
        else:
          draw_braille("%d%d" % (y, x+1), X+2.5, Y+2.5, center=True)
      elif n.label != "":
        Ytexttop = 1.2
        if n.proband:
          Ytexttop += 0.6
        if len(n.children)>0:
          textXpos = X + 2.7
          halign = 'left'
        else:
          textXpos = X + 2.5
          halign = 'center'
        if textXpos < Xmax + 2 and textXpos > Xmin - 2:
          for l in range(len(n.label_lines)):
            line = n.label_lines[l]
            text(textXpos, Y + Ytexttop + l*0.8, line, fontsize=52*scale,
                 horizontalalignment=halign,
                 verticalalignment='top')

    def makechildlines(Xtop, Ytop, Xcenter, Yparent, Ysibling, Ychild,
                       children):
      # Parent to center of sibling line
      plot([Xtop, Xtop, Xcenter, Xcenter],
           [Ytop, Yparent, Yparent, Ysibling],
           color = '#000000', linewidth=linewidth)
      # Sibling line
      siblingLeft = children[0].X
      siblingRight = children[-1].X
      if len(children) > 1:
        if children[0].twin:
          siblingLeft = 0.5 * (children[0].X + children[1].X)
        if children[-2].twin:
          siblingRight = 0.5 * (children[-2].X + children[-1].X)
      plot([2.5 + siblingLeft, 2.5 + siblingRight],
           [Ysibling, Ysibling],
           color = '#000000', linewidth=linewidth)
      # Lines from the sibling line to each child
      for i in range(len(children)):
        c = children[i]
        if c.multiple == 0:
          plot([2.0 + c.X, 3.0 + c.X],
               [Ysibling, Ysibling],
               color = '#000000', linewidth=linewidth)
          continue
        if c.twin and i+1 < len(children):
          topX = 0.5 * (c.X + children[i+1].X)
        elif i>0 and children[i-1].twin:
          topX = 0.5 * (c.X + children[i-1].X)
        else:
          topX = c.X
        plot([2.5 + topX, 2.5 + c.X],
             [Ysibling, Ychild-0.02],
             color = '#000000', linewidth=linewidth)

    # Main drawing loop
    for y in rows:
      robj = rowobjs[y]
      row = self.data[y]
      for x in range(len(row)):
        n = row[x]
        makeperson(n, n.X, robj.Y)
        if n.right_union != None:
          plot([n.X + 3.0, row[x+1].X + 2.0],
               [robj.Y + 0.5, robj.Y + 0.5],
               color='#000000', linewidth=linewidth)
          uobj = n.right_union
          if len(uobj.children) > 0:
            child_nodes = [self.data[y+1][c] for c in uobj.children]
            Xcenter = 2.5 + 0.5 * (child_nodes[0].X + child_nodes[-1].X)
            Ysibling = rowobjs[y+1].Y - 1 - child_nodes[0].sibling_line
            makechildlines(2.5 + 0.5 * (n.X + row[x+1].X),    # Xtop
                           robj.Y + 0.5,                      # Ytop
                           Xcenter,                           # Xcenter
                           robj.Y + 1.5 + uobj.parent_line,   # Yparent
                           Ysibling,                          # Ysibling
                           rowobjs[y+1].Y,                    # Ychild
                           child_nodes)                       # children
        if len(n.children) > 0:
          child_nodes = [self.data[y+1][c] for c in n.children]
          Xcenter = 2.5 + 0.5 * (child_nodes[0].X + child_nodes[-1].X)
          Ysibling = rowobjs[y+1].Y - 1 - child_nodes[0].sibling_line
          makechildlines(2.5 + n.X,                         # Xtop
                         robj.Y + 1.0,                      # Ytop
                         Xcenter,                           # Xcenter
                         robj.Y + 1.5 + n.parent_line,      # Yparent
                         Ysibling,                          # Ysibling
                         rowobjs[y+1].Y,                    # Ychild
                         child_nodes)                       # children

    axis('scaled')

    ax = axis([Xmin-1, Xmax+1, Ymax+1, Ymin-(text_height+1)])
    gca().set_axis_off()

    if pages > 1:
      filename_stem = "%s-page-%d" % (filename_stem, page+1)

    if braille:
      filename = '%s.braille.pdf' % filename_stem
    else:
      filename = '%s.pdf' % filename_stem
    if windows:
      savefig('tmp.eps')
      smart_eps2pdf('tmp.eps', filename)
    else:
      savefig(filename)

    return True
    # End plot

  def run(self, x0=None, y0=None):
    if x0!=None and y0!=None:
      x = x0
      y = y0
      self.push("initial state loaded from file", x, y)
    else:
      out("New pedigree.  Press the question mark for help.")
      y = 1
      x = -1
      self.push("initial state", x, y)
    self.describe(x, y)

    while 1:
      try:
        row = self.data[y]
        c = self.get_next_char()
        if c==LEFT:
          if x > -1:
            x -= 1
            self.describe(x, y)
        elif c==RIGHT:
          if len(row)>0 and x < len(row)-1:
            x += 1
            self.describe(x, y)
        elif c==UP:
          rows = self.data.keys()
          rows.sort()
          rows.reverse()
          if y==1:
            if self.ask("Insert new row at top?"):
              for y1 in rows:
                for x1 in range(len(self.data[y1])):
                  self.move(x1, y1, x1, y1+1)
                self.data[y1+1] = self.data.pop(y1)
              x = -1
              self.data[1] = []
            self.push("inserting new row at top", x, y)
            self.describe(x, y)
          else:
            if y==rows[0] and len(self.data[y])==0:
              self.data.pop(y)
            y -= 1
            if x >= len(self.data[y]):
              x = len(self.data[y])-1
            self.describe(x, y)
        elif c==DOWN:
          y += 1
          if y not in self.data:
            self.data[y] = []
            x = -1
          if x >= len(self.data[y]):
            x = len(self.data[y])-1
          self.describe(x, y)
        elif c=='?':
          out(helpstr)
        elif c==NEWLINE:
          if x >= 0 and x < len(row):
            self.edit(x, y)
        elif c=='u':
          self.union(x, y)
        elif c=='p':
          self.parents(x, y)
        elif c=='P':
          if x >= 0 and x < len(row):
            row[x].pregnancy = not row[x].pregnancy
            self.push("changing pregnancy status of %d %d" % (y, x+1), x, y)
            self.describe(x, y)           
        elif c=='T':
          if x >= 0 and x < len(row):
            row[x].twin = not row[x].twin
            self.push("changing twin status of %d %d" % (y, x+1), x, y)
            self.describe(x, y)
        elif c=='a':
          if x >= 0 and x < len(row):
            row[x].affected = not row[x].affected
            self.push("changing affectedness of %d %d" % (y, x+1), x, y)
            self.describe(x, y)
        elif c=='k':
          if x >= 0 and x < len(row):
            if row[x].dead:
              self.push("bringing %d %d back to life" % (y, x+1), x, y)
              row[x].dead = False
            else:
              self.push("killing %d %d" % (y, x+1), x, y)
              row[x].dead = True
            self.describe(x, y)
        elif c == 'N':
          if x >= 0 and x < len(row):
            row[x].multiple = 10
            self.push("setting %d %d to n people" % \
                      (y, x+1), x, y)
            self.describe(x, y)
        elif c!=None and c >= '0' and c <= '9':
          if x >= 0 and x < len(row):
            row[x].multiple = (ord(c) - ord('0'))
            if row[x].multiple > 1:
              self.push("setting %d %d to %d people" % \
                        (y, x+1, row[x].multiple), x, y)
            else:
              self.push("setting %d %d to 1 person" % (y, x+1), x, y)
            self.describe(x, y)
        elif c=='q':
          if self.dirty:
            if self.ask("Save pedigree before quitting?"):
              self.save(x, y)
          out("Quitting")
          raise QuitError
        elif c=='c':
          if x >= 0 and x < len(row):
            row[x].carrier = not row[x].carrier
            self.push("changing carrier status of %d %d" % (y, x+1), x, y)
            self.describe(x, y)
        elif c=='x':
          if x >= 0 and x < len(row):
            row[x].proband = not row[x].proband
            self.push("changing proband status of %d %d" % (y, x+1), x, y)
            self.describe(x, y)
        elif c=='d':
          self.describe(x, y)
        elif c=='w':
          self.describe_all(x, y)
        elif c=='j':
          result = self.getloc()
          if result != None:
            (x, y) = result
          self.describe(x, y)
        elif c=='m':
          x += 1
          self.addnode(node("male"), x, y)
          self.push("adding male at %d %d" % (y, x+1), x, y)
          self.describe(x, y)
        elif c=='f':
          x += 1
          self.addnode(node("female"), x, y)
          self.push("adding female at %d %d" % (y, x+1), x, y)
          self.describe(x, y)
        elif c=='U':
          x += 1
          self.addnode(node("nogender"), x, y)
          self.push("adding unknown gender at %d %d" % (y, x+1), x, y)
          self.describe(x, y)
        elif c=='b':
          x += 1
          self.addnode(node("pregloss"), x, y)
          self.push("adding pregnancy loss at %d %d" % (y, x+1), x, y)
          self.describe(x, y)
        elif c=='z':
          result = self.undo()
          if result != None:
            (x, y) = result
            self.describe(x, y)
        elif c=='y':
          result = self.redo()
          if result != None:
            (x, y) = result
            self.describe(x, y)
        elif c=='t':
          out("Enter the text to go at the top of the page.")
          new_text = self.readline()
          if new_text != None:
            self.text = new_text
            self.describe(x, y)
        elif c=='n':
          if self.dirty:
            response = self.ask("Save pedigree before creating new one?  "+
                                "y, n, or c for cancel")
            if response == []:
              self.describe(x, y)
              continue
            if response:
              self.save(x, y)
          self.data = {}
          self.data[1] = []
          self.unions = {}
          y = 1
          x = -1
          self.dirty = False
          self.push("creating new pedigree", x, y)
          self.describe(x, y)
        elif c==BACKSPACE:
          (x, y) = self.deletenode(x, y)
          self.describe(x, y)
        elif c=='s':
          self.save(x, y)
        elif c=='l':
          result = self.load_prompt()
          if result != None:
            (x, y) = result
          self.describe(x, y)
        elif c==None:
          pass
        elif c=='.':
          pass
        else:
          if DBG:
            try:
              out("Unknown character %d." % ord(c))
            except:
              print "Unknown character", c
              pass
          pass
        if c=='.':
          self.last_dot = True
        else:
          self.last_dot = False
      except QuitError:
        raise QuitError
      except:
	out("Sorry, an error occurred with that last command.")
        if DBG:
          fp = open("debug_pedigree_out.txt", "w")
          traceback.print_exc(file=fp)
          fp.close()
          for line in open("debug_pedigree_out.txt", "r"):
            out(line[:-1])
          out("")

        if y not in self.data:
          self.data[y] = []
        if x < 0:
          x = 0
        if x >= len(self.data[y]):
          x = len(self.data[y])-1
        self.describe(x, y)

if __name__=="__main__":
  global g_connection
  g_connection = None

  if 0:  # test segments_intersect
    p = pedigree()
    assert(p.segments_intersect(0, 3, 2, 5))
    assert(p.segments_intersect(3, 0, 2, 5))
    assert(p.segments_intersect(0, 3, 5, 2))
    assert(p.segments_intersect(0, 3, 3, 5))
    assert(not p.segments_intersect(0, 3, 4, 5))
    assert(not p.segments_intersect(0, 3, 5, 4))
    assert(not p.segments_intersect(0, 3, -2, -1))
    assert(not p.segments_intersect(0, 3, -1, -2))
    assert(p.segments_intersect(0, 3, -1, 0))
    assert(p.segments_intersect(0, 3, -1, 1))

  port = 0
  filename = None
  if len(sys.argv) >= 2:
    try:
      port = int(sys.argv[1])
    except:
      filename = sys.argv[1]

  if port > 0:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', port))
    while 1:
      print "Listening on port %d" % port
      s.listen(1)
      conn, addr = s.accept()
      conn.send('\xFF\xFB\x03') # WILL go into character mode
      conn.send('\xFF\xFB\x01') # WILL echo

      g_connection = conn
      print "Connected by", addr
      try:
        p = pedigree()
        p.run()
      except QuitError:
        print "Exited natually."
      except:
        traceback.print_exc(file=sys.stdout)
        print "Exited unnaturally."
      conn.close()
      print "Connection closed."
      print
  else:
    if not windows:
      tty.setraw(sys.stdin)
    try:
      p = pedigree()
      if filename:
        (x, y) = p.load(filename)
        p.run(x, y)
      else:
        p.run()
    except QuitError:
      out("Exited natually.")
    except:
      traceback.print_exc(file=sys.stdout)
      out("\n")
      out("Exited unnaturally.")
