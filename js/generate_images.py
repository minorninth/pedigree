#!/opt/local/bin/python2.7

import Image
import aggdraw
import os

import Image, ImageDraw, ImageFilter

unit = 20
margin = 12
width = (unit + 2 * margin)
height = (unit + 2 * margin)
left = margin + 0.5
top = margin + 0.5
right = unit + margin + 0.5
bottom = unit + margin + 0.5

black_pen = aggdraw.Pen("black", 1, opacity=255)
thick_black_pen = aggdraw.Pen("black", 1.5, opacity=255)
highlight_pen = aggdraw.Pen("#ffff00", 6, opacity=255)

white_brush = aggdraw.Brush("white", opacity=255)
affected_brush = aggdraw.Brush("#bbbbbb", opacity=255)
black_brush = aggdraw.Brush("black", opacity=255)

def start():
  black = Image.new("RGBA", (width, height), 'black')
  im = Image.new("RGBA", (width, height), 'white')
  im.putalpha(black.split()[1])  # Make the alpha layer transparent, too.
  d = aggdraw.Draw(im)
  return (im, d)  

def finish(im, d, basename):
  d.flush()
  name = '%s-%d' % (basename, unit)
  im.save('%s.tiff' % name)
  os.system('convert %s.tiff %s.png' % (name, name))
  os.unlink('%s.tiff' % name)
  print '%s.png' % name

if 1:
  (im, d) = start()
  d.rectangle((left, top, right, bottom), None, white_brush)
  d.rectangle((left, top, right, bottom), black_pen)
  finish(im, d, 'male')

if 1:
  (im, d) = start()
  d.rectangle((left - 3, top - 3, right + 3, bottom + 3), highlight_pen)
  finish(im, d, 'male-selected')

if 1:
  (im, d) = start()
  d.rectangle((left, top, right, bottom), None, affected_brush)
  d.rectangle((left, top, right, bottom), black_pen)
  finish(im, d, 'male-aff')

if 1:
  (im, d) = start()
  d.ellipse((left, top, right, bottom), None, white_brush)
  d.ellipse((left, top, right, bottom), black_pen)
  finish(im, d, 'female')

if 1:
  (im, d) = start()
  d.ellipse((left - 3, top - 3, right + 3, bottom + 3), highlight_pen)
  finish(im, d, 'female-selected')

if 1:
  (im, d) = start()
  d.ellipse((left, top, right, bottom), None, affected_brush)
  d.ellipse((left, top, right, bottom), black_pen)
  finish(im, d, 'female-aff')

if 1:
  (im, d) = start()
  inset = unit * 2 / 5
  left2 = margin + inset + 0.5
  top2 = margin + inset + 0.5
  right2 = unit + margin - inset + 0.5
  bottom2 = unit + margin - inset + 0.5
  d.ellipse((left2, top2, right2, bottom2), None, black_brush)
  d.ellipse((left2, top2, right2, bottom2), black_pen)
  finish(im, d, 'carrier-dot')

if 1:
  (im, d) = start()

  a = unit / 2   # arrow line length
  b = unit / 4   # arrow end length
  dd = unit / 10  # distance of arrow from unit box

  x0 = left - a
  y0 = bottom + a
  x1 = left - dd
  y1 = bottom + dd
  x2 = x1 - b
  y2 = y1
  x3 = x1
  y3 = y1 + b
  d.line((x0, y0, x1, y1), thick_black_pen)
  d.line((x1, y1, x2, y2), thick_black_pen)
  d.line((x1, y1, x3, y3), thick_black_pen)
  finish(im, d, 'proband-arrow')

if 1:
  x0 = left + unit / 2
  y0 = top
  x1 = right
  y1 = top + unit / 2
  x2 = left + unit / 2
  y2 = bottom
  x3 = left
  y3 = top + unit / 2
  (im, d) = start()
  d.polygon((x0, y0, x1, y1, x2, y2, x3, y3), black_pen, white_brush)
  finish(im, d, 'nogender')

  (im, d) = start()
  d.polygon((x0, y0 - 4, x1 + 4, y1, x2, y2 + 4, x3 - 4, y3),
            highlight_pen)
  finish(im, d, 'nogender-selected')

  (im, d) = start()
  d.polygon((x0, y0, x1, y1, x2, y2, x3, y3), None, affected_brush)
  d.polygon((x0, y0, x1, y1, x2, y2, x3, y3), black_pen)
  finish(im, d, 'nogender-aff')

if 1:
  x0 = left + unit / 2
  y0 = top
  x1 = right
  y1 = top + unit / 2
  x2 = left
  y2 = top + unit / 2
  (im, d) = start()
  d.polygon((x0, y0, x1, y1, x2, y2), black_pen, white_brush)
  finish(im, d, 'pregloss')

  (im, d) = start()
  d.polygon((x0, y0 - 4, x1 + 4, y1 + 4, x2 - 4, y2 + 4),
            highlight_pen)
  finish(im, d, 'pregloss-selected')

  (im, d) = start()
  d.polygon((x0, y0, x1, y1, x2, y2), None, affected_brush)
  d.polygon((x0, y0, x1, y1, x2, y2), black_pen)
  finish(im, d, 'pregloss-aff')

if 1:
  (im, d) = start()
  x0 = right + unit / 8
  y0 = top - unit / 8
  x1 = left - unit / 8
  y1 = bottom + unit / 8
  d.line((x0, y0, x1, y1), black_pen)
  finish(im, d, 'dead-slash')

if 1:
  (im, d) = start()
  x0 = width / 2
  y0 = unit / 4
  x1 = width - unit / 4
  y1 = height - unit / 4
  d.arc((x0, y0, x1, y1), 270, 90, highlight_pen)
  finish(im, d, 'rowmarker-selected')

if 0:
  im = Image.new("RGBA", (128, 128), None)
  d = aggdraw.Draw(im)
  p = aggdraw.Pen("red", 5, opacity=127)
  b = aggdraw.Brush("yellow", opacity=127)
  d.line((0, 0, 128, 128), p)
  d.line((0, 128, 128, 0), p)
  d.arc((48, 48, 96, 96), 0, 315, p)
  d.pieslice((48, 48, 96, 96), 0, 315, None, b)
  d.polygon((16, 16, 48, 16, 48, 48, 16, 16), None, b)
  d.flush()
  im.save('out.tiff')
  os.system('convert out.tiff out.png')


