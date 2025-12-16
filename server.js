const express = require("express");
const multer = require("multer");
const xml2js = require("xml2js");
const fs = require("fs");
const path = require("path");
const { parseDimension, parseMeasure } = require("./parseField");
const buildLayoutBatch = require("./layout-builder");
const createPBIT = require("./createPBIT");
//const { tablecolumn, tableTemplate } = require("./tableTemplate");
const { buildDataModel } = require("./buildDataModel");
const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Ensure output folder exists
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Multer for file upload
const upload = multer({ storage: multer.memoryStorage() });
let derivation, colDatatype, twbFileName, tableData, tableName, schema, schemaName, formattedColumns, dbName, server, dateColumns;

// ========================
// GLOBAL VARIABLES
// ========================
let datasource;

// ========================
// HELPER FUNCTIONS
// ========================

function getworksheetNames(datasource) {
  if (!Array.isArray(datasource)) return [];
  return datasource.map(item => item?.$?.name || null).filter(Boolean);
}

function parseFieldExpression(expr) {
  //console.log("exppppppppppppppp", expr);
  if (!expr || typeof expr !== "string") return { aggFunc: null, field: null };

  expr = expr.trim();

  // ------------------------------------------
  // Case 1: Aggregation pattern → SUM(col)
  // ------------------------------------------
  const aggPattern = /^([A-Za-z0-9_]+)\s*\(\s*\[?([^\]\)]+)\]?\s*\)$/;
  const aggMatch = expr.match(aggPattern);
  console.log("aggMatch", aggMatch)

  if (aggMatch) {
    return {
      aggFunc: aggMatch[1],
      field: aggMatch[2].trim().replace(/\s+/g, "_") // KEEP underscore conversion
    };
  }

  // ------------------------------------------
  // Case 2: Bracketed field → [Order Date]
  // ------------------------------------------
  const bracketPattern = /^\[([^\]]+)\]$/;
  const bracketMatch = expr.match(bracketPattern);

  if (bracketMatch) {
    return {
      aggFunc: null,
      field: bracketMatch[1].trim().replace(/\s+/g, "_") // KEEP underscore conversion
    };
  }

  // ------------------------------------------
  // Case 3: Plain field → DO NOT modify spaces
  // ------------------------------------------
  return {
    aggFunc: null,
    field: expr // ← DO NOT replace spaces
  };
}


// function MeasureDimension(columns, columnInstances) {
//   if (!Array.isArray(columns) || !Array.isArray(columnInstances))
//     return { dimensions: [], measures: [] };

//   const instanceMap = columnInstances.reduce((acc, inst) => {
//     acc[inst.$.column] = inst.$;
//     return acc;
//   }, {});

//   const dimensions = [];
//   const measures = [];

//   columns.forEach(col => {
//     const colName = col.$.name;
//     const colRole = col.$.role;
//     const colDatatype = col.$.datatype;
//     const instance = instanceMap[colName];

//     let derivation = instance?.derivation && instance.derivation !== "None"
//       ? instance.derivation.split("-")[0]
//       : null;

//     let expression;

//     // --------------------------------------------
//     // SPECIAL LOGIC ONLY FOR DATE DATATYPE FIELDS
//     // --------------------------------------------
//     if (colDatatype === "date" && derivation) {
//       // Build precise hierarchy path
//       console.log("colName1234567", colName)
//       const cleanName = colName.replace(/\[(.*?)\]/g, "$1");
//       console.log("cleanName1234567890", cleanName)
//       expression = `${cleanName}.Variation.Date.Hierarchy.${derivation}`;
//     } 
//     else {
//       // Default behavior — unchanged
//       expression = derivation ? `${derivation}(${colName})` : colName;
//     }

//     // Parse only the final expression
//     const parsed = parseFieldExpression(expression);

//     if (colRole === "dimension") dimensions.push(parsed);
//     else if (colRole === "measure") measures.push(parsed);
//   });

//   return { dimensions, measures };
// }

function MeasureDimension(columns, columnInstances) {
  if (!Array.isArray(columns) || !Array.isArray(columnInstances))
    return { dimensions: [], measures: [] };

  // Map column-instance by column name (remove brackets)
  const instanceMap = columnInstances.reduce((acc, inst) => {
    const colName = inst.$.column.replace(/^\[(.*)\]$/, "$1");
    acc[colName] = inst.$;
    return acc;
  }, {});

  const dimensions = [];
  const measures = [];

  const removeBrackets = (name) => {
    if (!name) return name;
    return name.replace(/^\[(.*)\]$/, "$1");
  };

  columns.forEach(col => {
    const colName = removeBrackets(col.$.name);
    const colRole = col.$.role;
    const colDatatype = col.$.datatype;

    const instance = instanceMap[colName];
    const derivation = instance?.derivation && instance.derivation !== "None"
      ? instance.derivation.split("-")[0]
      : null;

    console.log("Derivation:", derivation);

    const parsed = parseFieldExpression(colName);

    // Set hierarchy for date columns
    parsed.isHierarchy = colDatatype === "date";

    // ✅ Set aggFunc always (for BOTH dimensions and measures)
    if (derivation) {
      parsed.aggFunc = derivation;
    }

    if (colRole === "dimension") dimensions.push(parsed);
    else if (colRole === "measure") measures.push(parsed);
  });

  return { dimensions, measures };
}

function extractFilters(filters = []) {
  const map = new Map();

  filters.forEach(filter => {
    (filter.groupfilter || []).forEach(gf => {

      // single member
      if (gf.$?.function === 'member') {
        addValue(map, gf.$.level, gf.$.member);
      }

      // union
      if (gf.$?.function === 'union') {
        (gf.groupfilter || []).forEach(m =>
          addValue(map, m.$?.level, m.$?.member)
        );
      }
    });
  });

  return [...map.entries()].map(([column, values]) => ({
    column,
    values: [...values]
  }));
}


function addValue(map, level, member) {
  const column = extractColumnName(level);
  const value = cleanMemberValue(member);

  if (!map.has(column)) {
    map.set(column, new Set());
  }
  map.get(column).add(value);
}

function extractColumnName(level = '') {
  const match = level.match(/\[none:(.*?):nk\]/);
  return match ? match[1] : level;
}

function cleanMemberValue(member = '') {
  return member
    .replace(/&quot;/g, '')
    .replace(/^"+|"+$/g, '');
}


 

function getColumnsFromWorksheet(datasourceArray, names) {
  if (!Array.isArray(datasourceArray) || !names) return [];
  const namesArray = Array.isArray(names) ? names : [names];
  const matchedWorksheets = datasourceArray.filter(item => namesArray.includes(item?.$?.name));

  return matchedWorksheets.map(worksheet => {
    const table = worksheet.table?.[0] || {};
    const view = table.view?.[0] || {};
    const dsDeps = view["datasource-dependencies"]?.[0] || {};
    const columns = dsDeps.column || [];
    const columnInstances = dsDeps["column-instance"] || [];
    const consolidated = MeasureDimension(columns, columnInstances);
    //console.log("consolidated.dimensions", consolidated.dimensions)
    const worksheetFilters = view['filter'] || [];
    


    return {
    name: worksheet.$.name,
    dimensions: consolidated.dimensions,
    measures: consolidated.measures,
    filters: worksheetFilters   // ✅ worksheet-scoped filters
  };

  });
}

// ========================
// ROUTES
// ========================

// Upload TWB file


app.post("/upload-twb", upload.single("twb"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No TWB file uploaded." });
     twbFileName = req.file.originalname;
    console.log("TWB File Name:", twbFileName);
    const xml = req.file.buffer.toString("utf8");
    const data = await xml2js.parseStringPromise(xml);
    const datasource1 = data.workbook?.worksheets;
    const db = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.['named-connections']?.[0]?.['named-connection']?.[0]?.connection?.[0]?.$
    console.log("db123456", db)
    dbName = db?.dbname
    console.log("dbName", dbName)
    server = db?.class 
    console.log("server, dbName", server, dbName)
    datasource = datasource1?.[0]?.worksheet || [];
    const worksheetNames = getworksheetNames(datasource);
    tableData = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.relation?.[0]
    tableName = tableData?.$?.name;
    schema = tableData?.$?.table;
    
    schemaName = schema?.match(/^\[(.*?)\]/)?.[1];
    //console.log("schemaName", schemaName)
    //const tableName =   data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.relation?.['name'];

    const metadataRecords = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.['metadata-records']?.[0]?.['metadata-record'];
    formattedColumns = metadataRecords.map(record => {
      return {
        columnName: record['remote-name']?.[0] ?? null,
        dataType: record['local-type']?.[0] ?? null,
        aggregation: record['aggregation']?.[0] ?? null,
        nullable: record['contains-null']?.[0] === 'true' ? 'Yes' : 'No'
      };
    });
    dateColumns = formattedColumns.filter(col=> col.dataType === 'date')
    console.log("dateColumns", dateColumns)
    //console.log("formattedColumns", formattedColumns)
    const remoteNames = metadataRecords?.map(  record => record?.['remote-name']?.[0]) ?? [];
    const connections = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.['named-connections']?.[0]?.['named-connection']?.[0]?.connection
    //console.log("metadataRecords", metadataRecords)

    res.json({ worksheetNames });
  } catch (err) {
    console.error("❌ Error parsing TWB file:", err);
    res.status(500).json({ error: "Failed to parse TWB file." });
  }
});

// Save selected worksheets
app.post("/save-selected-worksheets", express.json(), (req, res) => {
  const { selectedWorksheets, originalFileName } = req.body;
  res.json({
    message: "Worksheets received successfully",
    count: selectedWorksheets.length,
    data: selectedWorksheets
  });
});

// Save chart types & generate PBIT with appended column

app.post("/save-chart-types", async (req, res) => {
  try {
    const { chartSelections } = req.body;
    if (!chartSelections || chartSelections.length === 0)
      return res.status(400).json({ error: "No chart selections provided." });

    // 1️⃣ APPEND COLUMN FIRST
    
    // Pass tableName dynamically from uploaded datasource
    const updatedTable = buildDataModel({
      tableName,        // from uploaded TWB
      schema,
      schemaName,
      formattedColumns,
      dbName, 
      server,
      dateColumns,
      twbFileName
    });
    const finalTable = updatedTable.qProperty
    console.log("✅ Column appended successfully:", finalTable);

    // 2️⃣ Generate layouts
    const finalJson = {};
    chartSelections.forEach(item => { finalJson[item.worksheetName] = item.chartType; });

    const selectedWorksheetNames = Object.keys(finalJson);
    const worksheetData = getColumnsFromWorksheet(datasource, selectedWorksheetNames);

    const layoutConfigs = (() => {
  let xCounter = 10;     // x starts at 10
  let zCounter = 0;      // z increments by 1

  return worksheetData.map(ws => {
    const selectedType = finalJson[ws.name];
    const rawDimension = ws.dimensions;
    //console.log("Rawwwwwww", rawDimension)
    const rawMeasure = ws.measures;

    const parsedDimension = parseDimension({
      field: rawDimension?.field || rawDimension,
      aggFunc: rawDimension?.aggFunc || null,
      isHierarchy: rawDimension?.isHierarchy || false
    });

    const parsedMeasure = parseMeasure({
      field: rawMeasure?.field || rawMeasure,
      aggFunc: rawMeasure?.aggFunc || null
    });

    const chartFilters = extractFilters(ws.filters);
    console.log("filters", chartFilters)

    // Store current X and Z before incrementing
    const currentX = xCounter;
    const currentZ = zCounter;

    // increment for next visual
    xCounter += 270;  // horizontal spacing
    zCounter += 1;

    return {
      visualType:
        selectedType === "line_chart"
          ? "lineChart"
          : selectedType === "column_chart" || selectedType === "bar"
          ? "columnChart"
          : selectedType === "pie_chart"
          ? "pieChart"
          : selectedType === "area_chart"
          ? "areaChart"
          : selectedType === "combo_chart"
          ? "lineStackedColumnComboChart"
          : selectedType,

      dimension: parsedDimension,
      isHierarchy: parsedDimension.isHierarchy,
      measure: parsedMeasure,
      aggFuncMeasure: parsedMeasure.aggFunc || "",
      table: tableName,
      chartFilter: chartFilters,

      // dynamic layout
      x: currentX,
      y: 0,
      z: currentZ,

      width: 270.4461942257218,
      height: 268.76640419947506,
      visualId: "visual_" + Date.now() + Math.floor(Math.random() * 1000),
      hierarchyLevel:parsedDimension.aggFunc
    };
  });
})();


    await buildLayoutBatch(layoutConfigs);

    // 3️⃣ Create PBIT
    const pbitPath = await createPBIT(twbFileName);

    res.setHeader("Content-Disposition", "attachment; filename=Final.pbit");
    res.setHeader("Content-Type", "application/octet-stream");
    res.sendFile(pbitPath);

  } catch (err) {
    console.error("❌ Error generating PBIT:", err);
    res.status(500).send("Error generating PBIT file");
  }
});


// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});



