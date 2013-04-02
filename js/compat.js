if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
 
    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };
 
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
 
    return fBound;
  };
}

function cancelEventWrap(evt) {
  if (evt.preventDefault) {
    evt.stopPropagation();
    evt.preventDefault();   
  } else {
    evt.cancelBubble = true;
    evt.returnValue = false;
  }
}

function addEventListenerWrap(element, event, handler, capture) {
  if (element.addEventListener) {
    element.addEventListener(event, handler, capture);
  } else {
    element.attachEvent('on' + event, handler);
  }
}

function removeEventListenerWrap(element, event, handler, capture) {
  if (element.removeEventListener) {
    element.removeEventListener(event, handler, capture);
  } else {
    element.detachEvent('on' + event, handler);
  }
}

function hasClass(ele, cls) {
  return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
 
function addClass(ele, cls) {
  if (!this.hasClass(ele,cls))
    ele.className += " " + cls;
}
 
function removeClass(ele, cls) {
  if (hasClass(ele,cls)) {
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ');
  }
}

if (window.console == undefined) {
  window.console = {};
  window.console.log = function(msg) {
  };
}

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}
