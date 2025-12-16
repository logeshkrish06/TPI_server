const { tablecolumn, tableTemplate, datecolumn, partitions, localtable, relationship } = require("./templates/tabletemplate");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function applyTemplate(template, data) {
  let output = template;
  for (const key in data) {
    const value = data[key];
    output = output.replace(new RegExp(`{{?${key}}}?`, "g"), value);
  }
  return output;
}

function buildDataModel({ tableName, formattedColumns, dbName, server }) {

  function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function generateLocalId() {
    return "LocalDateTable_" + crypto.randomUUID();
  }

  function normalizeDataType(type) {
    if (!type) return "string";
    const t = type.toLowerCase();
    if (t === "real") return "double";
    if (t === "integer") return "int64";
    if (t === "date") return "dateTime";
    return type;
  }

  // 1️⃣ Base model
  const model = tableTemplate(tableName, generateGuid);
  const table = model.qProperty.model.tables[0];

  const localDateTables = [];
  const relationships = [];

  formattedColumns.forEach(col => {
    if (!col) return;

    const colName = col.columnName || col.name;
    const rawType = col.dataType;
    const normalizedType = normalizeDataType(rawType);
    const isDate = rawType === "date";

    if (!isDate) {
      const colObj = tablecolumn(
        colName,
        normalizedType,
        colName,
        generateGuid(),
        col.aggregation || "none"
      );
      table.columns.push(colObj.qProperty);
      return;
    }

    const localId = generateLocalId();
    const relationshipId = generateGuid();

    const localTableObj = localtable(localId, tableName, colName, generateGuid);
    localDateTables.push(localTableObj.qProperty);

    const relObj = relationship(localId, tableName, colName, relationshipId);
    relationships.push(relObj.qProperty);

    const dateColObj = datecolumn(
      colName,
      "dateTime",
      colName,
      "Long Date",
      generateGuid(),
      "none",
      relationshipId,
      localId
    );

    table.columns.push(dateColObj.qProperty);
  });

  const partitionObj = partitions(tableName, dbName, server);
  table.partitions.push(partitionObj.qProperty);
  model.qProperty.model.tables.push(...localDateTables);
  model.qProperty.model.relationships = relationships;

  // 🔹 Append to DataModelSchema using layout-style logic
  const schemaTemplatePath = path.join(__dirname, "./templates/DataModelSchemaTemplate.txt"); // Your template file
  const schemaOutputPath = path.join(__dirname, "./Template/DataModelSchema");

  let templateContent = "";
  if (fs.existsSync(schemaTemplatePath)) {
    templateContent = fs.readFileSync(schemaTemplatePath, "utf8");
  } else {
    // fallback if template not found
    templateContent = "{{DataModelContent}}";
  }

  const replacements = {
    DataModelContent: JSON.stringify(model.qProperty, null, 2)
  };

  const finalContent = applyTemplate(templateContent, replacements);
  const utf16 = Buffer.from(finalContent, "utf16le");
  fs.writeFileSync(schemaOutputPath, utf16);

  console.log(`✅ Data model appended to ${schemaOutputPath}`);

  return model;
}

module.exports = { buildDataModel };
