define(
['require', 'jQuery', 'app/views/viewport'],
function(require, $, viewport)
{
  var enableTouch = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

  if (enableTouch === false)
  {
    return {enabled: false};
  }

  var bodyEl = $(document.body);

  bodyEl.addClass('touchEnabled');

  var sv = '/vendor/scrollview/jquery.mobile.scrollview-min.js';
  var vk = '/vendor/vk/vk_loader.js' +
           '?vk_skin=air_large' +
           '&vk_layout=PL Polish (Programmers)';

  require([vk, sv], function()
  {
    attachKeyboard();
    makeScrollable();
  });

  function resizeView()
  {
    var viewEl   = $(viewport.view.el);
    var layoutEl = $(viewport.layout.el);

    if (viewEl.hasClass('dashboard'))
    {
      return;
    }

    viewEl.append('<div class="bottomSpacer"></div>');

    var height = window.innerHeight +
                 viewEl.outerHeight() -
                 layoutEl.outerHeight();

    if (VirtualKeyboard.isOpen())
    {
      height -= $('#kbContainer').outerHeight();
    }

    viewEl.height(height);

    return viewEl;
  }

  function makeScrollable()
  {
    viewport.bind('change:view', function()
    {
      var viewEl = resizeView();

      if (viewEl)
      {
        viewEl.scrollview({
          direction: 'y'
        });
        viewEl.find('.ui-scrollview-view').css('overflow', 'visible');
      }
    });

    $(window).resize(resizeView);
  }

  function attachKeyboard()
  {
    function invalidTarget(el)
    {
      var type = el.type;

      return type === 'button' ||
             type === 'submit' ||
             type === 'radio' ||
             type === 'checkbox';
    }

    var selector    = 'input, textarea';
    var currentEl   = null;
    var containerEl = $('<div id="kbContainer"></div>').appendTo(bodyEl);
    var holderEl    = $('<div id="kbHolder"></div>');
    var toggleEl    = $('<input id="toggleKb" value="Pokaż klawiaturę" type="button" class="button">');

    containerEl.append(toggleEl).append(holderEl);

    if (viewport.view)
    {
      if ($(viewport.view.el).hasClass('dashboard'))
      {
        toggleEl.hide();
      }
      else
      {
        resizeView();
      }
    }

    bodyEl.delegate(selector, 'focus', function()
    {
      if (invalidTarget(this))
      {
        return;
      }

      currentEl = this;

      VirtualKeyboard.attachInput(currentEl);
    });

    bodyEl.delegate(selector, 'blur', function()
    {
      if (invalidTarget(this))
      {
        return;
      }

      VirtualKeyboard.detachInput();
    });

    toggleEl.click(function()
    {
      if (VirtualKeyboard.isOpen())
      {
        currentEl = null;

        toggleEl.val('Pokaż klawiaturę');
        bodyEl.removeClass('kb');

        VirtualKeyboard.close();

        resizeView();

        return;
      }

      if (!currentEl)
      {
        var els = $(selector);

        for (var i = 0, l = els.length; i < l; ++i)
        {
          if (!invalidTarget(els[i]))
          {
            currentEl = els[i];

            break;
          }
        }

        if (!currentEl)
        {
          return;
        }

        currentEl.focus();
      }

      toggleEl.val('Schowaj klawiaturę');
      bodyEl.addClass('kb');

      VirtualKeyboard.show(currentEl, holderEl[0]);
    });

    viewport.bind('dialog:show', function()
    {
      toggleEl.show();
    });
    viewport.bind('dialog:close', toggleToggleEl);
    viewport.bind('change:view', toggleToggleEl);

    function toggleToggleEl()
    {
      if ($(viewport.view.el).hasClass('dashboard'))
      {
        if (VirtualKeyboard.isOpen())
        {
          toggleEl.click().hide();
        }
        else
        {
          toggleEl.hide();
        }
      }
      else
      {
        toggleEl.show();
      }
    }
  }

  return {enabled: true}
});
