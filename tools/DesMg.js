Object.defineProperty(exports, "__esModule", {
  value: true
});
var def_DesMg = function () {
  function _ctor() {}
  _ctor.encode = function (e) {
    var t = this.utf8Encode(e);
    var n = t.slice(0, 2);
    for (var i = 0; i < t.length; i++) {
      var a = t[i];
      a ^= n[i % 2];
      n[i + 2] = a;
    }
    return this.encode_base(n, true);
  };
  _ctor.decode = function (e) {
    var t = this.decode_base(e, true);
    var n = t.slice(0, 2);
    var i = t.slice(2, t.length);
    var a = 0;
    for (var o = i.length; a < o; a++) {
      var r = i[a];
      r ^= n[a % 2];
      i[a] = r;
    }
    return this.utf8Decode(i);
  };
  _ctor.encode_base = function (e, t) {
    var n;
    var i;
    var a;
    var o;
    var r;
    var s;
    var c;
    var l = "";
    var u = 0;
    for (var d = t ? e : this.utf8Encode(e); u < d.length;) {
      o = (n = d[u++]) >> 2;
      r = (3 & n) << 4 | (i = d[u++]) >> 4;
      s = (15 & i) << 2 | (a = d[u++]) >> 6;
      c = 63 & a;
      if (isNaN(i)) {
        s = c = 64;
      } else {
        isNaN(a) && (c = 64);
      }
      l = l + this._keyStr.charAt(o) + this._keyStr.charAt(r) + this._keyStr.charAt(s) + this._keyStr.charAt(c);
    }
    return l;
  };
  _ctor.decode_base = function (e, t) {
    var n;
    var i;
    var a;
    var o;
    var r;
    var s;
    var c = 0;
    e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    for (var l = []; c < e.length;) {
      n = this._keyStr.indexOf(e.charAt(c++)) << 2 | (o = this._keyStr.indexOf(e.charAt(c++))) >> 4;
      i = (15 & o) << 4 | (r = this._keyStr.indexOf(e.charAt(c++))) >> 2;
      a = (3 & r) << 6 | (s = this._keyStr.indexOf(e.charAt(c++)));
      l.push(n);
      64 != r && l.push(i);
      64 != s && l.push(a);
    }
    if (true === t) {
      return l;
    } else {
      return this.utf8Decode(l);
    }
  };
  _ctor.utf8Encode = function (e) {
    e = e.replace(/\r\n/g, "\n");
    var t = [];
    for (var n = 0; n < e.length; n++) {
      var i = e.charCodeAt(n);
      if (i < 128) {
        t.push(i);
      } else if (i > 127 && i < 2048) {
        t.push(i >> 6 | 192);
        t.push(63 & i | 128);
      } else {
        t.push(i >> 12 | 224);
        t.push(i >> 6 & 63 | 128);
        t.push(63 & i | 128);
      }
    }
    return t;
  };
  _ctor.utf8Decode = function (e) {
    var t;
    var n;
    var i = "";
    var a = 0;
    for (var o = 0; a < e.length;) {
      if ((t = e[a]) < 128) {
        i += String.fromCharCode(t);
        a++;
      } else if (t > 191 && t < 224) {
        n = e[a + 1];
        i += String.fromCharCode((31 & t) << 6 | 63 & n);
        a += 2;
      } else {
        n = e[a + 1];
        o = e[a + 2];
        i += String.fromCharCode((15 & t) << 12 | (63 & n) << 6 | 63 & o);
        a += 3;
      }
    }
    return i;
  };
  _ctor._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  return _ctor;
}();
exports.default = def_DesMg;