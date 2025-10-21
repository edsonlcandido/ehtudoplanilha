/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_121766130")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file2359244304",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "application/pdf"
    ],
    "name": "file",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_121766130")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file2359244304",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/png",
      "image/jpeg",
      "application/pdf"
    ],
    "name": "file",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
