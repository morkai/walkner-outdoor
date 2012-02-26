define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/paginator.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {String} paginatorTpl
 */
function($, _, Backbone, paginatorTpl)
{
  /**
   * @class PaginatorView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var PaginatorView = Backbone.View.extend({
    template: _.template(paginatorTpl),
    tagName: 'ol',
    className: 'pages'
  });

  PaginatorView.prototype.initialize = function()
  {
    this.model.bind('change', this.render, this);
  };

  PaginatorView.prototype.destroy = function()
  {
    this.model.unbind('change', this.render, this);

    this.remove();
  };

  /**
   * @return {PaginatorView}
   */
  PaginatorView.prototype.render = function()
  {
    var model = this.model;
    var pageNumbers = model.get('pageNumbers') || 3;
    var pageCount = model.get('pageCount') || 0;
    var currentPage = model.get('currentPage') || 1;
    var href = model.get('href') || '?page=${page}';

    if (pageCount > 1)
    {
      pageNumbers = (pageNumbers - 1) / 2;

      var firstPage = currentPage;
      var lastPage = firstPage + pageNumbers;
      var cut = true;
      var showLeftDots = false;

      if ((firstPage - pageNumbers) < 1)
      {
        firstPage = 1;
      }
      else
      {
        firstPage -= pageNumbers;
        showLeftDots = firstPage !== 1;
      }

      if (lastPage > pageCount)
      {
        lastPage = pageCount;
        cut = false;
      }

      if (currentPage < (pageNumbers + 1))
      {
        lastPage += (pageNumbers + 1) - currentPage;

        if (lastPage > pageCount)
        {
          lastPage = pageCount;
        }
      }
      else if (currentPage > (pageCount - pageNumbers))
      {
        firstPage -= pageNumbers - (pageCount - currentPage);

        if (firstPage < 1)
        {
          firstPage = 1;
        }
      }

      var showRightDots = cut && lastPage !== pageCount;

      this.el.innerHTML = this.template({
        currentPage: currentPage,
        pageCount: pageCount,
        href: href,
        showFirstPageLink: currentPage > 2,
        showPrevPageLink: currentPage > 1,
        showNextPageLink: currentPage < pageCount,
        showLastPageLink: currentPage < (pageCount - 1),
        showLeftDots: showLeftDots && this.options.showDots,
        showRightDots: showRightDots && this.options.showDots,
        firstPage: firstPage,
        lastPage: lastPage
      });
    }
    else
    {
      this.el.innerHTML = '';
    }

    return this;
  };

  return PaginatorView;
});
