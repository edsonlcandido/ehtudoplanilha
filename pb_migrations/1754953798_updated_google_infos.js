/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_549441380")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @collection.google_infos.user_id",
    "deleteRule": "@request.auth.id = @collection.google_infos.user_id",
    "listRule": "@request.auth.id = @collection.google_infos.user_id",
    "updateRule": "@request.auth.id = @collection.google_infos.user_id",
    "viewRule": "@request.auth.id = @collection.google_infos.user_id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_549441380")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
