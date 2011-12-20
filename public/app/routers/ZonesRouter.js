define(
[
  'Backbone',

  'app/models/Zone',
  'app/models/Zones',
  'app/views/viewport',
  'app/views/zones/ZoneListView',
  'app/views/zones/AddZoneFormView',
  'app/views/zones/ZoneDetailsView',
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
 * @param {function(new:ZoneDetailsView)} ZoneDetailsView
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
  ZoneDetailsView,
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
    'zones'            : 'list',
    'zones;add'        : 'add',
    'zones/:id'        : 'view',
    'zones/:id;edit'   : 'edit',
    'zones/:id;delete' : 'delete',
    'zones/:id;program': 'program'
  }
});

ZonesRouter.prototype.list = function()
{
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
  viewport.showView(new AddZoneFormView({model: new Zone()}));
};

ZonesRouter.prototype.view = function(id)
{
  viewport.msg.loading();

  new Zone({_id: id}).fetch({
    success: function(model)
    {
      viewport.showView(new ZoneDetailsView({model: model}));
    },
    error: function()
    {
      viewport.msg.loadingFailed();
    }
  });
};

ZonesRouter.prototype.edit = function(id)
{
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

ZonesRouter.prototype.delete = function(id)
{
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
