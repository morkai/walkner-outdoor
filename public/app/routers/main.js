define(
[
  './HomeRouter',
  './HistoryRouter',
  './ProgramsRouter',
  './ZonesRouter',
  './UsersRouter',
  './ControllersRouter'
],
/**
 * @param {function(new:HomeRouter)} HomeRouter
 * @param {function(new:HomeRouter)} HistoryRouter
 * @param {function(new:ProgramsRouter)} ProgramsRouter
 * @param {function(new:ZonesRouter)} ZonesRouter
 * @param {function(new:UsersRouter)} UsersRouter
 * @param {function(new:ControllersRouter)} ControllersRouter
 */
function(
  HomeRouter,
  HistoryRouter,
  ProgramsRouter,
  ZonesRouter,
  UsersRouter,
  ControllersRouter)
{
  return function(options)
  {
    new HomeRouter(options);
    new HistoryRouter(options);
    new ProgramsRouter(options);
    new ZonesRouter(options);
    new UsersRouter(options);
    new ControllersRouter(options);
  };
});
