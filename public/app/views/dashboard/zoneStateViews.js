define(
[
  'app/views/dashboard/DisconnectedStateView',
  'app/views/dashboard/ConnectedStateView',
  'app/views/dashboard/ProgramRunningStateView',
  'app/views/dashboard/ProgramFinishedStateView',
  'app/views/dashboard/ProgramStoppedStateView',
  'app/views/dashboard/ProgramErroredStateView'
],
/**
 * @param {function(new:DisconnectedStateView)} DisconnectedStateView
 * @param {function(new:ConnectedStateView)} ConnectedStateView
 * @param {function(new:ProgramRunningStateView)} ProgramRunningStateView
 * @param {function(new:ProgramFinishedStateView)} ProgramFinishedStateView
 * @param {function(new:ProgramStoppedStateView)} ProgramStoppedStateView
 * @param {function(new:ProgramErroredStateView)} ProgramErroredStateView
 */
function(
  DisconnectedStateView,
  ConnectedStateView,
  ProgramRunningStateView,
  ProgramFinishedStateView,
  ProgramStoppedStateView,
  ProgramErroredStateView)
{
  return {
    disconnected: DisconnectedStateView,
    connected: ConnectedStateView,
    programRunning: ProgramRunningStateView,
    programFinished: ProgramFinishedStateView,
    programStopped: ProgramStoppedStateView,
    programErrored: ProgramErroredStateView
  }
});
