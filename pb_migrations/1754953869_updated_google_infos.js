/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_549441380")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id = user_id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_549441380")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id = @collection.google_infos.user_id"
  }, collection)

  return app.save(collection)
})
