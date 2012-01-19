define(['require', 'jQuery', 'app/views/viewport'], function(require, $, viewport)
{
  var selector = 'input, textarea';

  function invalidTarget(el)
  {
    var type = el.type;

    return type === 'button' ||
           type === 'submit' ||
           type === 'radio' ||
           type === 'checkbox';
  }

  function attachKeyboard()
  {
    var currentEl   = null;
    var bodyEl      = $(document.body);
    var containerEl = $('<div id="kbContainer"></div>').appendTo(bodyEl);
    var holderEl    = $('<div id="kbHolder"></div>');
    var toggleEl    = $('<input id="toggleKb" value="Pokaż klawiaturę" type="button" class="button">');

    containerEl.append(toggleEl).append(holderEl);

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

        return VirtualKeyboard.close();
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
  }

  var host = window.location.hostname;

  if (host === 'localhost' || host === '127.0.0.1')
  {
    require(['/vendor/vk/vk_loader.js?vk_skin=air_large&vk_layout=PL Polish (Programmers)'], function()
    {
      setTimeout(attachKeyboard, 500);
    });
  }
});
