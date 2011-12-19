var BufferQueueReader = module.exports = function()
{
  this.buffers = [];
  this.offset = 0;
  this.length = 0;
};

BufferQueueReader.prototype = {
  pushBuffer: function(buffer)
  {
    if (buffer.length > 0)
    {
      this.buffers.push(buffer);
      this.length += buffer.length;
    }
  },
  skip: function(count)
  {
    assertRange(count <= this.length);
    
    var buffer;
    
    this.offset += count;
    this.length -= count;
    
    while (this.buffers.length
      && (buffer = this.buffers[0]).length <= this.offset)
    {
      this.buffers.shift();
      this.offset -= buffer.length;
    }
  },
  shiftByte: function()
  {
    assertRange(this.length >= 1);
    
    var result,
        buffer;
    
    result = (buffer = this.buffers[0])[this.offset++];
    
    this.length -= 1;
    
    if (this.offset >= buffer.length)
    {
      this.buffers.shift();
      this.offset -= buffer.length;
    }
    
    return result;
  },
  shiftChar: function()
  {
    return String.fromCharCode(this.popByte());
  },
  shiftBytes: function(count)
  {
    assertRange(count <= this.length);
    
    this.length -= count;
    
    var result = [],
        buffer;
    
    while (count--)
    {
      result.push((buffer = this.buffers[0])[this.offset++]);
      
      if (this.offset >= buffer.length)
      {
        this.buffers.shift();
        this.offset -= buffer.length;
      }
    }
    
    return result;
  },
  shiftBuffer: function(count)
  {
    return new Buffer(count < 1 ? 0 : this.shiftBytes(count));
  },
  shiftString: function(length, encoding)
  {
    return this.shiftBuffer(length).toString(encoding || 'utf8');
  },
  shiftZeroString: function(encoding)
  {
    var result,
        zeroOffset = this.indexOf(0);
    
    if (zeroOffset === -1)
    {
      return undefined;
    }
    
    result = this.popString(zeroOffset, encoding);
    
    this.skip(1);
    
    return result;
  },
  shiftUnsignedInt: function(size, endian)
  {
    assertRange(size <= this.length);
    
    this.length -= size;
    
    return typeof endian === 'undefined' || endian > 0
      ? this.shiftUnsignedIntBE(size)
      : this.shiftUnsignedIntLE(size);
  },
  /**
   * @private
   */
  shiftUnsignedIntBE: function(size)
  {
    var result = 0,
        buffer;
    
    while (size--)
    {
      buffer = this.buffers[0];
      result = ((result << 8) >>> 0) + buffer[this.offset++];
      
      if (this.offset >= buffer.length)
      {
        this.offset -= this.buffers.shift().length;
      }
    }
    
    return result;
  },
  /**
   * @private
   */
  shiftUnsignedIntLE: function(size)
  {
    var result = 0,
        shift = -8,
        buffer;
    
    while (size--)
    {
      buffer = this.buffers[0];
      result += ((buffer[this.offset++] << (shift += 8)) >>> 0);
      
      if (this.offset >= buffer.length)
      {
        this.offset -= this.buffers.shift().length;
      }
    }
    
    return result;
  },
  indexOf: function(searchElement, fromIndex)
  {
    var offset = this.offset + (fromIndex || 0),
        index = 0,
        totalOffset = 0,
        buffer = this.buffers[index];
    
    while (index < this.buffers.length && offset >= buffer.length)
    {
      offset -= buffer.length;
      buffer = this.buffers[++index];
    }
    
    while (index < this.buffers.length)
    {
      if (buffer[offset] === searchElement)
      {
        return totalOffset;
      }
      
      offset += 1;
      totalOffset += 1;
      
      if (offset >= buffer.length)
      {
        offset = 0;
        buffer = this.buffers[++index];
      }
    }
    
    return -1;
  },
  readByte: function(offset)
  {
    offset || (offset = 0);
    
    assertRange(offset < this.length);
    
    var index = 0,
        buffer;
    
    offset += this.offset;
    
    while ((buffer = this.buffers[index]).length <= offset)
    {
      index += 1;
      offset -= buffer.length;
    }
    
    return buffer[offset];
  },
  readChar: function(offset)
  {
    return String.fromCharCode(this.readByte(offset));
  },
  readBytes: function(count, offset)
  {
    offset || (offset = 0);
    
    assertRange(offset + count <= this.length);
    
    var result = [],
        index = 0,
        buffer;
    
    offset += this.offset;
    
    while ((buffer = this.buffers[index]).length <= offset)
    {
      index += 1;
      offset -= buffer.length;
    }
    
    while (count--)
    {
      result.push(buffer[offset++]);
      
      if (offset >= buffer.length)
      {
        offset = 0;
        buffer = this.buffers[++index];
      }
    }
    
    return result;
  },
  readBuffer: function(count, offset)
  {
    offset || (offset = 0);
    
    assertRange(offset + count <= this.length);
    
    var result,
        resultOffset,
        index,
        buffer,
        written;
    
    offset += this.offset;
    
    while ((buffer = this.buffers[index]).length <= offset)
    {
      index += 1;
      offset -= buffer.length;
    }
    
    if (buffer.length >= offset + count)
    {
      return buffer.slice(offset, offset + count);
    }
    
    result = new Buffer(count);
    resultOffset = 0;
    
    while (count)
    {
      written = buffer.copy(
        result, resultOffset, offset, Math.min(buffer.length, offset + count)
      );
      
      resultOffset += written;
      count -= written;
      offset += written;
      
      if (offset >= buffer.length)
      {
        offset = 0;
        buffer = this.buffers[++index];
      }
    }
    
    return result;
  },
  readString: function(length, encoding, offset)
  {
    return this.readBuffer(length, offset).toString(encoding || 'utf8');
  },
  readZeroString: function(encoding, offset)
  {
    var zeroOffset = this.indexOf(0, offset);
    
    return zeroOffset === -1
      ? undefined
      : this.readString(zeroOffset - offset, encoding, offset);
  },
  readUnsignedInt: function(size, endian, offset)
  {
    offset || (offset = 0);
    
    assertRange(offset + size <= this.length);
    
    var index = 0,
        buffer;
    
    offset += this.offset;
    
    while (offset >= (buffer = this.buffers[index]).length)
    {
      index += 1;
      offset -= buffer.length;
    }
    
    return typeof endian === 'undefined' || endian > 0
      ? this.readUnsignedIntBE(size, offset, buffer, index)
      : this.readUnsignedIntLE(size, offset, buffer, index);
  },
  /**
   * @private
   */
  readUnsignedIntBE: function(size, offset, buffer, index)
  {
    var result = 0;
    
    while (size--)
    {
      result = ((result << 8) >>> 0) + buffer[offset++];
      
      if (offset >= buffer.length)
      {
        offset = 0;
        buffer = this.buffers[++index];
      }
    }
    
    return result;
  },
  /**
   * @private
   */
  readUnsignedIntLE: function(size, offset, buffer, index)
  {
    var result = 0,
        shift = -8;
    
    while (size--)
    {
      result += ((buffer[offset++] << (shift += 8)) >>> 0);
      
      if (offset >= buffer.length)
      {
        offset = 0;
        buffer = this.buffers[++index];
      }
    }
    
    return result;
  },
  copy: function(targetBuffer, targetStart, sourceStart, sourceEnd)
  {
    assertRange(sourceStart >= 0 && sourceEnd <= this.length);
    
    var offset = this.offset + sourceStart,
        count = sourceEnd - sourceStart,
        index = 0,
        buffer,
        written,
        totalWritten = 0;
    
    while ((buffer = this.buffers[index]).length <= offset)
    {
      index += 1;
      offset -= buffer.length;
    }
    
    if (buffer.length >= offset + count)
    {
      return buffer.copy(offset, offset + count);
    }
    
    while (count)
    {
      written = buffer.copy(
        targetBuffer,
        targetStart,
        offset,
        Math.min(buffer.length, offset + count)
      );
      
      count -= written;
      offset += written;
      totalWritten += written;
      
      if (offset >= b.length)
      {
        offset = 0;
        buffer = this.buffers[++index];
      }
    }
    
    return totalWritten;
  },
  slice: function(start, end)
  {
    if (end <= start)
    {
      return new Buffer(0);
    }
    
    assertRange(start >= 0 && end <= this.length);
    
    return this.readBuffer(end - start, start);
  }
};

function assertRange(condition)
{
  if (!condition)
  {
    throw new Error('Out of range.');
  }
}
