/**
 * A wrapper around {node.Buffer} providing convenient functions
 * for reading binary data.
 * @name {h5.buffers.BufferReader}
 * @constructor
 * @param {node.Buffer} buffer
 */
var BufferReader = module.exports = function(buffer)
{
  this.buffer = buffer;
  this.length = buffer.length;
  this.offset = 0;
};

/**
 * @enum {number}
 */
BufferReader.ENDIAN = {
  BIG: 1,
  LITTLE: -1
};

BufferReader.prototype = {
  
  /**
   * Skips the specified number of bytes by advancing the internal buffer
   * pointer by that number.
   * 
   * @param {number} count The number of bytes to skip.
   * @throws {Error} If the specified count exceeds the buffer length.
   */
  skip: function(count)
  {
    assertRange(count <= this.length);

    this.length -= count;
    this.offset += count;
  },
  
  /**
   * Returns the next byte, advancing the internal buffer pointer by one.
   * 
   * @return {number} The next byte.
   * @throws {Error} If the buffer is empty.
   */
  shiftByte: function()
  {
    var result = this.readByte();
    
    this.skip(1);
    
    return result;
  },
  
  /**
   * Returns the next byte as a character, advancing the internal buffer
   * pointer by one.
   * 
   * @return {string} The next byte as a character.
   * @throws {Error} If the buffer is empty.
   */
  shiftChar: function()
  {
    var result = this.readChar();
    
    this.skip(1);
    
    return result;
  },
  
  /**
   * Returns the specified number of the next bytes as an array,
   * advancing the internal buffer pointer by that number.
   * 
   * @param {number} count The number of bytes to return.
   * @return {Array.<number>} An array of bytes.
   * @throws {Error} If the specified count exceeds the buffer length.
   */
  shiftBytes: function(count)
  {
    var result = this.readBytes(count);
    
    this.skip(count);
    
    return result;
  },
  
  /**
   * Returns the specified number of the next bytes as an instance of
   * {node.Buffer}, advancing the internal buffer pointer by that number.
   * 
   * @param {number} count The number of bytes to return as a buffer.
   * @return {node.Buffer} A buffer with the specified number
   * of the next bytes.
   * @throws {Error} If the specified count exceeds the buffer length.
   */
  shiftBuffer: function(count)
  {
    var result = this.readBuffer(count);
    
    this.skip(count);
    
    return result;
  },
  
  /**
   * Returns the specified number of the next bytes as a string
   * of the the specified encoding, advancing the internal buffer pointer
   * by the specified length.
   * 
   * @param {number} length The number of bytes to return as a string.
   * @param {encoding="utf8"} encoding The encoding of the string.
   * @return {string} A string of the specified length and encoding.
   * @throws {Error} If the specified length exceeds the buffer length.
   */
  shiftString: function(length, encoding)
  {
    var result = this.readString(length, encoding);
    
    this.skip(length);
    
    return result;
  },
  
  /**
   * Returns a string in the specified encoding from the next byte to
   * the next `\0` character, advancing the internal buffer
   * pointer by the length of that string.
   * If `\0` is not found, `NULL` is returned.
   * 
   * @param {encoding="utf8"} encoding The encoding of the string to return.
   * @return {?string} A string if `\0` character was found; `NULL` otherwise.
   */
  shiftZeroString: function(encoding)
  {
    var zeroIndex = Array.prototype.indexOf.call(this.buffer, 0, this.offset),
        oldOffset = this.offset,
        result = null;
    
    if (zeroIndex !== -1)
    {
      result = this.buffer.slice(this.offset, zeroIndex)
                          .toString(encoding || 'utf8');
      
      this.offset = zeroIndex + 1;
      this.length -= this.offset - oldOffset;
    }
    
    return result;
  },
  
  /**
   * Returns the specified number of the next bytes as an unsigned integer,
   * advancing the internal buffer pointer by the size of that integer.
   * 
   * @param {number} size The size of the integer.
   * @param {?number} endian Number greater than 0 for big endian;
   * otherwise - little endian.
   * @return {number}
   * @throws {Error} If the specified size exceeds the buffer length.
   */
  shiftUnsignedInt: function(size, endian)
  {
    var result = this.readUnsignedInt(size, endian);
    
    this.skip(size);
    
    return result;
  },
  
  /**
   * Returns the first index at which a given element can be found
   * in the buffer, or -1 if it is not present.
   * 
   * @param {number} searchElement Element to locate in the buffer.
   * @param {number=0} fromIndex The index at which to begin the search.
   * @return {number} The first index at which a given element can be found
   * in the buffer, or -1 if it is not present.
   */
  indexOf: function(searchElement, fromIndex)
  {
    return Array.prototype.indexOf.call(this.buffer, searchElement, fromIndex);
  },
  
  /**
   * Returns the byte at the internal buffer pointer, optionally offset by
   * the specified number.
   * 
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {number} The byte at the internal buffer pointer.
   * @throws {Error} If the buffer is empty.
   */
  readByte: function(offset)
  {
    offset || (offset = 0);
    
    assertRange(offset < this.length);
    
    return this.buffer[this.offset + offset];
  },
  
  /*
   * Returns the byte at the internal buffer pointer as a character,
   * optionally offset by the specified number.
   * 
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {number} The byte at the internal buffer pointer as a character.
   * @throws {Error} If the buffer is empty.
   */
  readChar: function(offset)
  {
    return String.fromCharCode(this.readByte(offset));
  },
  
  /**
   * Returns the specified number of bytes as an array, starting at the
   * internal buffer pointer, optionally offset by the specified number.
   * 
   * @param {number} count The number of bytes to return.
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {Array.<number>} An array of bytes.
   * @throws {Error} If the specified count exceeds the buffer length.
   */
  readBytes: function(count, offset)
  {
    offset || (offset = 0);
    
    assertRange(offset + count <= this.length);
    
    return Array.prototype.slice.call(this.buffer,
                                      this.offset + offset,
                                      this.offset + offset + count);
  },
  
  /**
   * Returns the specified number of bytes as an instance of {node.Buffer},
   * starting at the internal buffer pointer, optionally offset
   * by the specified number.
   * 
   * @param {number} count The number of bytes to return as a buffer.
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {node.Buffer} A buffer with the specified number
   * of the next bytes.
   * @throws {Error} If the specified count exceeds the buffer length.
   */
  readBuffer: function(count, offset)
  {
    offset || (offset = 0);
    
    assertRange(offset + count <= this.length);
    
    return this.buffer.slice(this.offset + offset,
                             this.offset + offset + count);
  },
  
  /**
   * Returns the specified number of bytes as a string of the specified
   * encoding, starting at the internal buffer pointer, optionally offset
   * by the specified number.
   * 
   * @param {number} length The number of bytes to return as a string.
   * @param {encoding="utf8"} encoding The encoding of the string.
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {string} A string of the specified length and encoding.
   * @throws {Error} If the specified length exceeds the buffer length.
   */
  readString: function(count, encoding, offset)
  {
    if (typeof encoding === 'number')
    {
      offset = encoding;
      encoding = null;
    }
    
    offset || (offset = 0);
    
    return this.readBuffer(count, offset).toString(encoding || 'utf8');
  },
  
  /**
   * Returns a string in the specified encoding from the byte at the current
   * buffer pointer (optionally offset by the specified number) to the next `\0`
   * character.
   * If `\0` is not found, `NULL` is returned.
   * 
   * @param {encoding="utf8"} encoding The encoding of the string to return.
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {?string} A string if `\0` character was found; `NULL` otherwise.
   */
  readStringZero: function(encoding, offset)
  {
    offset || (offset = 0);
    
    var zeroIndex = Array.prototype.indexOf.call(this.buffer,
                                                 0,
                                                 this.offset + offset);
    
    if (zeroIndex === -1)
    {
      return null;
    }
    
    return this.readString(offset, encoding, zeroIndex - offset);
  },
  
  /**
   * Returns the specified number of bytes as an unsigned integer, starting
   * at the internal buffer pointer, optionally offset by the specified number.
   * 
   * @param {number} size The size of the integer.
   * @param {?number} endian Number greater than 0 for big endian;
   * otherwise - little endian.
   * @param {number=0} offset Optional offset to apply to the internal
   * buffer pointer.
   * @return {number}
   * @throws {Error} If the specified size exceeds the buffer length.
   */
  readUnsignedInt: function(size, endian, offset)
  {
    offset || (offset = 0);
    
    assertRange(offset + size <= this.length);
    
    var result = 0;
    
    if (typeof endian === 'undefined' || endian > 0)
    {
      while (size--)
      {
        result = ((result << 8) >>> 0) + this.buffer[this.offset + offset++];
      }
    }
    else
    {
      var shift = -8;
      
      while (size--)
      {
        result += ((this.buffer[this.offset + offset++] << (shift += 8)) >>> 0);
      }
    }
    
    return result;
  },
  
  /**
   * Does a `memcpy()` between buffers.
   * 
   * @param {node.Buffer} targetBuffer
   * @param {number} targetStart
   * @param {number} sourceStart
   * @param {number} sourceEnd
   * @return {node.Buffer} The target buffer.
   */
  copy: function(targetBuffer, targetStart, sourceStart, sourceEnd)
  {
    this.buffer.copy(targetBuffer, targetStart, sourceStart, sourceEnd);
    
    return targetBuffer;
  },
  
  /**
   * Returns a new buffer which references the same memory as the old,
   * but offset and cropped by the start and end indexes.
   * 
   * @param {number} start
   * @param {number} end
   * @return {node.Buffer}
   */
  slice: function(start, end)
  {
    if (end <= start)
    {
      return new Buffer(0);
    }
    
    assertRange(start >= 0 && end <= this.length);
    
    return this.buffer.slice(start, end);
  }
};

function assertRange(condition)
{
  if (!condition)
  {
    throw new Error('Out of range.');
  }
}
