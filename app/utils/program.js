// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var createHash = require('crypto').createHash;

/**
 * @param {Program|Object} program
 * @return {Buffer}
 */
exports.compileProgram = function(program)
{
  var idBuf = new Buffer(program._id.toString(), 'hex');
  var txt = '\r{\n';

  txt += 'global_loops = ' + (program.infinite ? '0' : '1') + '\n';
  txt += 'FOR global_loops\n';
  txt += '{';

  program.steps.forEach(function(step, i)
  {
    txt += '\nstep = ' + (i + 1) + '\n';
    txt += 'loop = ' + step.iterations + '\n';
    txt += 'FOR loop\n';
    txt += '{\n';
    txt += 'WRITE io/state 1\n';
    txt += 'SLEEP ' + step.timeOn + '\n';
    txt += 'WRITE io/state 0\n';
    txt += 'SLEEP ' + step.timeOff + '\n';
    txt += '}';

    return txt;
  });

  txt += '\n}\n}';

  var hash = createHash('md5').update(idBuf).update(txt, 'utf8').digest();

  var buf = new Buffer(hash.length + idBuf.length + txt.length);

  buf.write(hash, 0, hash.length, 'binary');
  idBuf.copy(buf, hash.length);
  buf.write(txt, hash.length + idBuf.length, txt.length, 'utf8');

  return buf;
};

/**
 * @param {Program|Object} program
 * @param {RemoteState} remoteState
 */
exports.calcRemainingTime = function(program, remoteState)
{
  var remainingTime = program.totalTime;

  for (var i = 0; i < remoteState.stepIndex; ++i)
  {
    var step = program.steps[i];

    remainingTime -= (step.timeOn + step.timeOff) * step.iterations;
  }

  var currentStep = program.steps[remoteState.stepIndex];

  if (!currentStep)
  {
    return remainingTime;
  }

  remainingTime -=
    (currentStep.timeOn + currentStep.timeOff) * remoteState.stepIteration;

  if (remoteState.stepState)
  {
    remainingTime -= remoteState.elapsedTime;
  }
  else
  {
    remainingTime -= currentStep.timeOn + remoteState.elapsedTime;
  }

  return remainingTime;
};
