// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'Backbone',

  'app/models/Zone',
  'app/models/Zones',
  'app/views/viewport',
  'app/views/zones/ZoneListView',
  'app/views/zones/AddZoneFormView',
  'app/views/zones/ZoneDetailsPageView',
  'app/views/zones/EditZoneFormView',
  'app/views/zones/DeleteZoneView',
  'app/views/zones/ProgramZoneView',
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Zone)} Zone
 * @param {function(new:Zones)} Zones
 * @param {Viewport} viewport
 * @param {function(new:ZoneListView)} ZoneListView
 * @param {function(new:AddZoneFormView)} AddZoneFormView
 * @param {function(new:ZoneDetailsPageView)} ZoneDetailsPageView
 * @param {function(new:EditZoneFormView)} EditZoneFormView
 * @param {function(new:DeleteZoneView)} DeleteZoneView
 * @param {function(new:ProgramZoneView)} ProgramZoneView
 */
function(
  Backbone,
  Zone,
  Zones,
  viewport,
  ZoneListView,
  AddZoneFormView,
  ZoneDetailsPageView,
  EditZoneFormView,
  DeleteZoneView,
  ProgramZoneView)
{
  /**
   * @class ZonesRouter
   * @constructor
   * @extends Backbone.Router
   * @param {Object} [options]
   */
  var ZonesRouter = Backbone.Router.extend({
    routes: {
      'zones': 'list',
      'zones;add': 'add',
      'zones/:id': 'view',
      'zones/:id;edit': 'edit',
      'zones/:id;delete': 'del',
      'zones/:id;program': 'program'
    }
  });

  ZonesRouter.prototype.list = function()
  {
    if (viewport.msg.auth('viewZones'))
    {
      return;
    }

    viewport.msg.loading();

    new Zones().fetch({
      data: {
        fields: ['name']
      },
      success: function(collection)
      {
        viewport.showView(new ZoneListView({collection: collection}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ZonesRouter.prototype.add = function()
  {
    if (viewport.msg.auth('manageZones'))
    {
      return;
    }

    viewport.showView(new AddZoneFormView({model: new Zone()}));
  };

  ZonesRouter.prototype.view = function(id)
  {
    if (viewport.msg.auth('viewZones'))
    {
      return;
    }

    viewport.msg.loading();

    new Zone({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new ZoneDetailsPageView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ZonesRouter.prototype.edit = function(id)
  {
    if (viewport.msg.auth('manageZones'))
    {
      return;
    }

    viewport.msg.loading();

    new Zone({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new EditZoneFormView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ZonesRouter.prototype.del = function(id)
  {
    if (viewport.msg.auth('manageZones'))
    {
      return;
    }

    viewport.msg.loading();

    new Zone({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new DeleteZoneView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ZonesRouter.prototype.program = function(id)
  {
    if (viewport.msg.auth('assignPrograms'))
    {
      return;
    }

    viewport.msg.loading();

    new Zone({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new ProgramZoneView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return ZonesRouter;
});
