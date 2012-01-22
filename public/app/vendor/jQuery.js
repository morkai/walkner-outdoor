define(
[
  'vendor/form2js-min.js',
  'vendor/chosen/chosen.jquery-min.js'
],
function()
{
  $.ajaxSetup({
    cache: false
  });

  $.fn.fromObject = function(obj)
  {
    js2form(this[0], obj);
  };

  return $.noConflict();
});
