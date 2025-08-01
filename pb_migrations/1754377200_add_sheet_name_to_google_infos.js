/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("google_infos")

  // Add sheet_name field to google_infos collection
  collection.fields.addField({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2333214374",
    "max": 0,
    "min": 0,
    "name": "sheet_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  })

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("google_infos")

  // Remove sheet_name field
  collection.fields.removeField("text2333214374")

  return app.save(collection)
})