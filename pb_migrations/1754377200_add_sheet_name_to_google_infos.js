/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("google_infos")

  // add
  collection.schema.addField(new SchemaField({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_sheet_name",
    "max": 0,
    "min": 0,
    "name": "sheet_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("google_infos")

  // remove
  collection.schema.removeField("text_sheet_name")

  return app.save(collection)
})