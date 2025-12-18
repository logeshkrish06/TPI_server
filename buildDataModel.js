const { tablecolumn, tableTemplate, datecolumn, partitions, localtable, relationship } = require("./templates/tabletemplate");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ==================================================
// BUILD DATA MODEL
// ==================================================

function buildDataModel({ tableName, formattedColumns, dbName, server }) {

  // -----------------------------------------------
  // ID GENERATORS
  // -----------------------------------------------

  function generateGuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function generateLocalDateTableId() {
    return "LocalDateTable_" + crypto.randomUUID();
  }

  // -----------------------------------------------
  // DATA TYPE NORMALIZER
  // -----------------------------------------------

  function normalizeDataType(type) {
    if (!type) return "string";

    const dataType = type.toLowerCase();

    switch (dataType) {
      case "real":
        return "double";
      case "integer":
        return "int64";
      case "date":
        return "dateTime";
      default:
        return type;
    }
  }

  // -----------------------------------------------
  // BASE MODEL & TABLE
  // -----------------------------------------------

  const model = tableTemplate(tableName, generateGuid);
  const table = model.qProperty.model.tables[0];

  const localDateTables = [];
  const relationships = [];

  // Map: date column → local table info
  const dateTableMap = {};

  // -----------------------------------------------
  // PROCESS COLUMNS
  // -----------------------------------------------

  formattedColumns.forEach(column => {
    if (!column) return;

    const columnName = column.columnName || column.name;
    const rawType = column.dataType;
    const normalizedType = normalizeDataType(rawType);
    const isDateColumn = rawType === "date";

    // -----------------------------
    // NON-DATE COLUMN
    // -----------------------------
    if (!isDateColumn) {
      const columnObject = tablecolumn(
        columnName,
        normalizedType,
        columnName,
        generateGuid(),
        column.aggregation || "none"
      );

      table.columns.push(columnObject.qProperty);
      return;
    }

    // -----------------------------
    // DATE COLUMN
    // -----------------------------

    const localTableId = generateLocalDateTableId();
    const relationshipId = generateGuid();

    // Save mapping for later use (filters, visuals)
    dateTableMap[columnName] = {
      localTableId,
      relationshipId
    };

    // Create local date table
    const localDateTable = localtable(
      localTableId,
      tableName,
      columnName,
      generateGuid
    );
    localDateTables.push(localDateTable.qProperty);

    // Create relationship
    const relationshipObject = relationship(
      localTableId,
      tableName,
      columnName,
      relationshipId
    );
    relationships.push(relationshipObject.qProperty);

    // Create date column in main table
    const dateColumnObject = datecolumn(
      columnName,
      "dateTime",
      columnName,
      "Long Date",
      generateGuid(),
      "none",
      relationshipId,
      localTableId
    );

    table.columns.push(dateColumnObject.qProperty);
  });

  // -----------------------------------------------
  // PARTITION
  // -----------------------------------------------

  const partitionObject = partitions(tableName, dbName, server);
  table.partitions.push(partitionObject.qProperty);

  // -----------------------------------------------
  // APPEND GENERATED OBJECTS
  // -----------------------------------------------

  model.qProperty.model.tables.push(...localDateTables);
  model.qProperty.model.relationships = relationships;

  // -----------------------------------------------
  // DEBUG: DATE COLUMN MAP
  // -----------------------------------------------

  Object.entries(dateTableMap).forEach(([columnName, info]) => {
    console.log(
      `🗓️ Date Column: ${columnName} → LocalTable: ${info.localTableId}, Relationship: ${info.relationshipId}`
    );
  });

  // -----------------------------------------------
  // WRITE DATA MODEL SCHEMA
  // -----------------------------------------------

  const outputPath = path.join(__dirname, "./Template/DataModelSchema");
  const jsonContent = JSON.stringify(model.qProperty, null, 2);
  const utf16Buffer = Buffer.from(jsonContent, "utf16le");

  fs.writeFileSync(outputPath, utf16Buffer);

  // -----------------------------------------------
  // RETURN RESULT
  // -----------------------------------------------

  return {
    model,
    dateTableMap
  };
}

// ==================================================
// EXPORT
// ==================================================

module.exports = { buildDataModel };
