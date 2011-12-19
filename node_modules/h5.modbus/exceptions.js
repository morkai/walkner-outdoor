function exportError(code, name, message)
{
  exports[code] = exports[name] = function(properties)
  {
    return createError(code, name, message, properties);
  };
}

function createError(code, name, message, properties)
{
  var error  = new Error(message);
  error.code = code;
  error.name = name;
  
  for (var property in properties)
  {
    error[property] = properties[property];
  }
  
  return error;
}

exportError(1,
            'IllegalFunction',
            'The function code received in the query is not an allowable action for the server (or slave).');

exportError(2,
            'IllegalDataAddress',
            'The data address received in the query is not an allowable address for the server (or slave).');

exportError(3,
            'IllegalDataValue',
            'A value contained in the query data field is not an allowable value for server (or slave).');

exportError(4,
            'SlaveDeviceFailure',
            'An unrecoverable error occurred while the server (or slave) was attempting to perform the requested action.');

exportError(5,
            'Acknowledge',
            'The server (or slave) has accepted the request and is processing it, but a long duration of time will be required to do so.');

exportError(6,
            'SlaveDeviceBusy',
            'The server (or slave) is engaged in processing a long–duration program command.');

exportError(8,
            'MemoryParityError',
            'The server (or slave) attempted to read record file, but detected a parity error in the memory.');

exportError(10,
            'GatewayPathUnavailable',
            'Gateway was unable to allocate an internal communication path from the input port to the output port for processing the request.');

exportError(11,
            'GatewayTargetDeviceFailedToRespond',
            'No response was obtained from the target device.');
