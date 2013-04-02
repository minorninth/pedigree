#!/opt/local/bin/python2.7

import Image
import aggdraw
import os

import Image, ImageDraw, ImageFilter

class GenerateImages:
  def __init__(self, unit):
    self.black_pen = aggdraw.Pen("black", 1, opacity=255)
    self.thick_black_pen = aggdraw.Pen("black", 1.5, opacity=255)
    self.highlight_pen = aggdraw.Pen("#ffff00", 6, opacity=255)

    self.white_brush = aggdraw.Brush("white", opacity=255)
    self.affected_brush = aggdraw.Brush("#bbbbbb", opacity=255)
    self.black_brush = aggdraw.Brush("black", opacity=255)

    self.margin = (unit * 3) / 5
    self.width = (unit + 2 * self.margin)
    self.height = (unit + 2 * self.margin)
    self.left = self.margin + 0.5
    self.top = self.margin + 0.5
    self.right = unit + self.margin + 0.5
    self.bottom = unit + self.margin + 0.5

  def start(self):
    black = Image.new("RGBA", (self.width, self.height), 'black')
    im = Image.new("RGBA", (self.width, self.height), 'white')
    im.putalpha(black.split()[1])  # Make the alpha layer transparent, too.
    d = aggdraw.Draw(im)
    return (im, d)  
  
  def finish(self, im, d, basename):
    d.flush()
    name = '%s-%d' % (basename, unit)
    im.save('%s.tiff' % name)
    os.system('convert %s.tiff %s.png' % (name, name))
    os.unlink('%s.tiff' % name)
    print '%s.png' % name
  
  def draw_all(self):
    if 1:
      (im, d) = self.start()
      d.rectangle((self.left, self.top, self.right, self.bottom), None, self.white_brush)
      d.rectangle((self.left, self.top, self.right, self.bottom), self.black_pen)
      self.finish(im, d, 'male')
  
    if 1:
      (im, d) = self.start()
      d.rectangle((self.left - 3, self.top - 3, self.right + 3, self.bottom + 3), self.highlight_pen)
      self.finish(im, d, 'male-selected')
  
    if 1:
      (im, d) = self.start()
      d.rectangle((self.left, self.top, self.right, self.bottom), None, self.affected_brush)
      d.rectangle((self.left, self.top, self.right, self.bottom), self.black_pen)
      self.finish(im, d, 'male-aff')
  
    if 1:
      (im, d) = self.start()
      d.ellipse((self.left, self.top, self.right, self.bottom), None, self.white_brush)
      d.ellipse((self.left, self.top, self.right, self.bottom), self.black_pen)
      self.finish(im, d, 'female')
  
    if 1:
      (im, d) = self.start()
      d.ellipse((self.left - 3, self.top - 3, self.right + 3, self.bottom + 3), self.highlight_pen)
      self.finish(im, d, 'female-selected')
  
    if 1:
      (im, d) = self.start()
      d.ellipse((self.left, self.top, self.right, self.bottom), None, self.affected_brush)
      d.ellipse((self.left, self.top, self.right, self.bottom), self.black_pen)
      self.finish(im, d, 'female-aff')
  
    if 1:
      (im, d) = self.start()
      inset = unit * 2 / 5
      self.left2 = self.margin + inset + 0.5
      self.top2 = self.margin + inset + 0.5
      self.right2 = unit + self.margin - inset + 0.5
      self.bottom2 = unit + self.margin - inset + 0.5
      d.ellipse((self.left2, self.top2, self.right2, self.bottom2), None, self.black_brush)
      d.ellipse((self.left2, self.top2, self.right2, self.bottom2), self.black_pen)
      self.finish(im, d, 'carrier-dot')
  
    if 1:
      (im, d) = self.start()
  
      a = unit / 2   # arrow line length
      b = unit / 4   # arrow end length
      dd = unit / 10  # distance of arrow from unit box
  
      x0 = self.left - a
      y0 = self.bottom + a
      x1 = self.left - dd
      y1 = self.bottom + dd
      x2 = x1 - b
      y2 = y1
      x3 = x1
      y3 = y1 + b
      d.line((x0, y0, x1, y1), self.thick_black_pen)
      d.line((x1, y1, x2, y2), self.thick_black_pen)
      d.line((x1, y1, x3, y3), self.thick_black_pen)
      self.finish(im, d, 'proband-arrow')
  
    if 1:
      x0 = self.left + unit / 2
      y0 = self.top
      x1 = self.right
      y1 = self.top + unit / 2
      x2 = self.left + unit / 2
      y2 = self.bottom
      x3 = self.left
      y3 = self.top + unit / 2
      (im, d) = self.start()
      d.polygon((x0, y0, x1, y1, x2, y2, x3, y3), self.black_pen, self.white_brush)
      self.finish(im, d, 'nogender')
  
      (im, d) = self.start()
      d.polygon((x0, y0 - 4, x1 + 4, y1, x2, y2 + 4, x3 - 4, y3),
                self.highlight_pen)
      self.finish(im, d, 'nogender-selected')
  
      (im, d) = self.start()
      d.polygon((x0, y0, x1, y1, x2, y2, x3, y3), None, self.affected_brush)
      d.polygon((x0, y0, x1, y1, x2, y2, x3, y3), self.black_pen)
      self.finish(im, d, 'nogender-aff')
  
    if 1:
      x0 = self.left + unit / 2
      y0 = self.top
      x1 = self.right
      y1 = self.top + unit / 2
      x2 = self.left
      y2 = self.top + unit / 2
      (im, d) = self.start()
      d.polygon((x0, y0, x1, y1, x2, y2), self.black_pen, self.white_brush)
      self.finish(im, d, 'pregloss')
  
      (im, d) = self.start()
      d.polygon((x0, y0 - 4, x1 + 4, y1 + 4, x2 - 4, y2 + 4),
                self.highlight_pen)
      self.finish(im, d, 'pregloss-selected')
  
      (im, d) = self.start()
      d.polygon((x0, y0, x1, y1, x2, y2), None, self.affected_brush)
      d.polygon((x0, y0, x1, y1, x2, y2), self.black_pen)
      self.finish(im, d, 'pregloss-aff')
  
    if 1:
      (im, d) = self.start()
      x0 = self.right + unit / 8
      y0 = self.top - unit / 8
      x1 = self.left - unit / 8
      y1 = self.bottom + unit / 8
      d.line((x0, y0, x1, y1), self.black_pen)
      self.finish(im, d, 'dead-slash')
  
    if 1:
      (im, d) = self.start()
      x0 = self.width / 2
      y0 = unit / 4
      x1 = self.width - unit / 4
      y1 = self.height - unit / 4
      d.arc((x0, y0, x1, y1), 270, 90, self.highlight_pen)
      self.finish(im, d, 'rowmarker-selected')
  
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

for unit in [10, 20]:
  g = GenerateImages(unit)
  g.draw_all()

  
