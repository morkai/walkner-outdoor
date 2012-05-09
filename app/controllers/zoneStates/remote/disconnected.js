var util = require('util');
var disconnectedState = require('../disconnected');

exports.validLeaveStates = [
  'remote/stopped',
  'remote/connected',
  'remote/disconnected'
];

exports.enter = disconnectedState.enter;

exports.leave = disconnectedState.leave;
