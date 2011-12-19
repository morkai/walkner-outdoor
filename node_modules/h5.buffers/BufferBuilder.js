/**
 * A wrapper around {node.Buffer} providing convenient functions
 * for writing binary data.
 * @name {h5.buffers.BufferBuilder}
 * @constructor
 */
var BufferBuilder = module.exports = function()
{
  this.length = 0;
  this.data = [];
};

BufferBuilder.prototype = {
  /**
   * Pushes the specified byte value to the end of the buffer.
   * 
   * @param {number} byteValue A number between 0 and 255.
   * @return {h5.buffers.BufferBuilder}
   */
  pushByte: function(byteValue)
  {
    this.data.push(function(buffer, offset)
    {
      buffer[offset] = byteValue;
      
      return 1;
    });
    
    ++this.length;
    
    return this;
  },
  /**
   * Pushes the specified ASCII character to the end of the buffer.
   * 
   * @param {string} charValue A single character string.
   * @return {h5.buffers.BufferBuilder}
   */
  pushChar: function(charValue)
  {
    return this.pushByte(charValue.charCodeAt(0));
  },
  /**
   * Pushes the specified bytes to the end of the buffer.
   * 
   * @param {Array.<number>} byteArray An array of numbers between 0 and 255.
   * @return {h5.buffers.BufferBuilder}
   */
  pushBytes: function(byteArray)
  {
    this.data.push(function(buffer, offset)
    {
      byteArray.forEach(function(value, index)
      {
        buffer[offset + index] = value;
      });
      
      return byteArray.length;
    });
    
    this.length += byteArray.length;
    
    return this;
  },
  /**
   * Pushes the specified source buffer to the end of the buffer
   * under construction.
   * 
   * @param {node.Buffer} sourceBuffer A buffer to copy from.
   * @return {h5.buffers.BufferBuilder}
   */
  pushBuffer: function(sourceBuffer)
  {
    this.data.push(function(targetBuffer, offset)
    {
      return sourceBuffer.copy(targetBuffer, offset, 0, sourceBuffer.length);
    });
    
    this.length += sourceBuffer.length;
    
    return this;
  },
  /**
   * Pushes the specified string in the specified encoding to the end
   * of the buffer.
   * 
   * @param {string} string A string to push.
   * @param {string='utf8'} encoding An encoding of the pushed string.
   * @return {h5.buffers.BufferBuilder}
   */
  pushString: function(string, encoding)
  {
    encoding || (encoding = 'utf8');
    
    this.data.push(function(buffer, offset)
    {
      return buffer.write(string, offset, encoding);
    });
    
    this.length += Buffer.byteLength(string, encoding);
    
    return this;
  },
  /**
   * Pushes the specified string in the specified encoding followed by `\0`
   * character to the end of the buffer.
   * 
   * @param {string} string A string to push.
   * @param {string='utf8'} encoding An encoding of the pushed string.
   * @return {h5.buffers.BufferBuilder}
   */
  pushZeroString: function(string, encoding)
  {
    return this.pushString(string, encoding).pushByte(0);
  },
  /**
   * Pushes the specified value as an unsigned integer of the specified size
   * and in the specified endian.
   * 
   * @param {number} value An unsigned integer.
   * @param {number} size A number of bytes on which to write the value,
   * e.g. 2 for 16 bit, 4 for 32 bit integers.
   * @param {?number} endian Number greater than 0 for big endian;
   * otherwise - little endian.
   * @return {h5.buffers.BufferBuilder}
   */
  pushUnsignedInt: function(value, size, endian)
  {
    value >= 0 || (value = 0);
    
    if (typeof endian === 'undefined' || endian > 0)
    {
      this.data.push(function(buffer, offset)
      {
        var shift = size * 8;
        
        for (var i = 0; i < size; ++i)
        {
          buffer[offset + i] = (value >>> (shift -= 8)) & 0xFF;
        }
        
        return size;
      });
    }
    else
    {
      this.data.push(function(buffer, offset)
      {
        var shift = -8;
        
        for (var i = 0; i < size; ++i)
        {
          buffer[offset + i] = (value >>> (shift += 8)) & 0xFF;
        }
        
        return size;
      });
    }
    
    this.length += size;
    
    return this;
  },
  /**
   * Pushes the specified builder to the end of this builder's buffer.
   * 
   * @param {h5.buffers.BufferBuilder} builder
   * @return {h5.buffers.BufferBuilder}
   */
  pushBuilder: function(builder)
  {
    this.data.push.apply(this.data, builder.data);
    
    this.length += builder.length;
    
    return this;
  },
  /**
   * Returns a buffer containing all the pushed bytes.
   * 
   * @return {h5.buffers.BufferBuilder}
   */
  toBuffer: function()
  {
    var buffer = new Buffer(this.length);
    
    this.copy(buffer);
    
    return buffer;
  },
  /**
   * Copies all the pushed data to the specified target buffer.
   * 
   * @param {node.Buffer} targetBuffer
   * @param {number} targetStart
   */
  copy: function(targetBuffer, targetStart)
  {
    this.data.reduce(function(offset, item)
    {
      return offset + item(targetBuffer, offset);
    }, targetStart || 0);
  }
};