/*
  Chunks
  PAEz

  Goes with Bytes.
  Used to step through an array buffer easier.
*/

function Chunks(buf) {
  this.buffer = Bytes(buf);
  this.index = 0;

}

Chunks.prototype.get = function(amount) {
  var value = this.buffer.slice(this.index, this.index + amount);
  this.index += value.length;
  return value;
};

Chunks.prototype.getChunk = function(amount) {
  var value = this.buffer.slice(this.index, this.index + amount);
  this.index += value.length;
  return new Chunks(value);
};

Chunks.prototype.getString = function(encoding, length) {
  var end, nulls = 0;

  switch (encoding) {

    case 'utf-16':
    case 'utf-16le':
    case 'utf-16be':
    case 'utf16':
    case 'utf16le':
    case 'utf16be':
      if (length === undefined) {
        end = this.buffer.findNull16(this.index);
        nulls = 2;
      }
      break;

    default:
      if (length === undefined) {
        end = this.buffer.indexOf([0]);
        nulls = 1;
      }
      break;

  }

  if (length !== undefined) end = this.index + length;

  if (end == -1 || end > this.buffer.length) end = this.buffer.length;
  var value = this.buffer.toString(encoding, this.index, end);
  this.index = end + nulls;
  if (this.index > this.buffer.length) this.index = this.buffer.length;
  return value;
};

Chunks.prototype.getInt8 = function() {
  var value = this.buffer.view.getInt8(this.index);
  this.index += 1;
  return value;
};

Chunks.prototype.getUint8 = function() {
  var value = this.buffer.view.getUint8(this.index);
  this.index += 1;
  return value;
};

Chunks.prototype.getInt16 = function(le) {
  var value = this.buffer.view.getInt16(this.index, le);
  this.index += 2;
  return value;
};

Chunks.prototype.getUint16 = function(le) {
  var value = this.buffer.view.getUint16(this.index, le);
  this.index += 2;
  return value;
};

Chunks.prototype.getInt32 = function(le) {
  var value = this.buffer.view.getInt32(this.index, le);
  this.index += 4;
  return value;
};

Chunks.prototype.getUint32 = function(le) {
  var value = this.buffer.view.getUint32(this.index, le);
  this.index += 4;
  return value;
};

Chunks.prototype.getFloat32 = function(le) {
  var value = this.buffer.view.getFloat32(this.index, le);
  this.index += 4;
  return value;
};

Chunks.prototype.getFloat64 = function(le) {
  var value = this.buffer.view.getFloat64(this.index, le);
  this.index += 8;
  return value;
};

Chunks.prototype.pos = function(index) {
  if (index === undefined) return this.index;
  if (index >= this.buffer.length) index = this.buffer.length - 1;
  if (index < 0) index = 0;
  this.index = index;
  return index;
};

Chunks.prototype.seek = function(amount) {
  var index = this.index + amount;
  index = Math.max(0, Math.min(this.buffer.length, index));
  this.index = index;
  return index;
};
