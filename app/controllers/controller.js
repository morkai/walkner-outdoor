var running = false;

module.exports = {

  run: function(messageHandlers)
  {
    if (running)
    {
      throw new Error('Controller is already running.');
    }

    process.on('message', function(message)
    {
      if (message.type in messageHandlers)
      {
        messageHandlers[message.type](message.data, function(data)
        {
          process.send({
            id  : message.id,
            type: message.type,
            data: data
          });
        });
      }
      else
      {
        console.error('Unknown message type: %s', message.type);
      }
    });
  },

  zoneFinished: function(err, zoneId)
  {
    process.send({
      type: 'zoneFinished',
      data: {error: err, zoneId: zoneId}
    });
  }

};