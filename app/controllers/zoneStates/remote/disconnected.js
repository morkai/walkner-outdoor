// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var util = require('util');
var disconnectedState = require('../disconnected');

exports.validLeaveStates = [
  'remote/stopped',
  'remote/connected',
  'remote/disconnected'
];

exports.enter = disconnectedState.enter;

exports.leave = disconnectedState.leave;
