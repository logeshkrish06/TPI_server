// const express = require("express");
// const multer = require("multer");
// const xml2js = require("xml2js");
// const fs = require("fs");
// const path = require("path");
// //const chartHandlers = require("./chartHandlers");
// const { parseDimension, parseMeasure } = require("./parseField");
// const runGenerator = require("./generateLayout");
// const createPBIT = require("./createPBIT");
// const buildLayoutBatch = require("./layout-builder");
// const { workerData } = require("worker_threads");

// const app = express();
// const port = 5000;

// // Middleware
// app.use(express.json());
// app.use(express.static("public"));

// // Ensure output folder exists
// const outputDir = path.join(__dirname, "output");
// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir);
// }

// // Multer for file upload (keeps file in memory)
// const upload = multer({ storage: multer.memoryStorage() });

// // ===== Helper Functions =====

// // Extract worksheet names
// function getworksheetNames(datasource) {
//   if (!Array.isArray(datasource)) return [];
//   return datasource.map(item => item?.$?.name || null).filter(Boolean);
// }

// function parseFieldExpression(expr) {
//   if (!expr || typeof expr !== "string") return { aggFunc: null, field: null };

//   expr = expr.trim();

//   // Case: AGG([Field])
//   const aggPattern = /^([A-Za-z0-9_]+)\s*\(\s*\[?([^\]\)]+)\]?\s*\)$/;
//   const aggMatch = expr.match(aggPattern);

//   if (aggMatch) {
//     return {
//       aggFunc: aggMatch[1],                  // SUM, AVG, COUNT...
//       field: aggMatch[2].trim().replace(/\s+/g, "_")   // KEEP original case
//     };
//   }

//   // Case: [Field]
//   const bracketPattern = /^\[([^\]]+)\]$/;
//   const bracketMatch = expr.match(bracketPattern);

//   if (bracketMatch) {
//     return {
//       aggFunc: null,
//       field: bracketMatch[1].trim().replace(/\s+/g, "_")
//     };
//   }

//   // Case: plain field name
//   return {
//     aggFunc: null,
//     field: expr.trim().replace(/\s+/g, "_")
//   };
// }


// // Identify measures & dimensions
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
//     const colCaption = col.$.caption || colName;
//     const colRole = col.$.role;
//     console.log(colRole, "colRoleqwe");

//     const instance = instanceMap[colName];
//     let derivation =
//       instance?.derivation && instance.derivation !== "None"
//         ? instance.derivation
//         : null;

//     // If derivation has a "-Trunc" or similar, keep only main part
//     if (derivation) {
//       derivation = derivation.split("-")[0]; // e.g., "Year-Trunc" -> "Year"
//     }

//     // Build expression like Year(Order Date) or SUM(Sales)
//     const expression = derivation
//       ? `${derivation}(${colName})`
//       : colName;

//     // Parse the expression into { aggFunc, field }
//     const parsed = parseFieldExpression(expression);
//     console.log("parseddddddddddd", parsed);

//     if (colRole === "dimension") dimensions.push(parsed);
//     else if (colRole === "measure") measures.push(parsed);
//   });

//   console.log(dimensions, measures, "dimensions, measures");
//   return { dimensions, measures };
// }

// // Extract columns from worksheets
// function getColumnsFromWorksheet(datasourceArray, names) {
//   if (!Array.isArray(datasourceArray) || !names) return [];

//   const namesArray = Array.isArray(names) ? names : [names];
//   const matchedWorksheets = datasourceArray.filter(item =>
//     namesArray.includes(item?.$?.name)
//   );

//   return matchedWorksheets.map(worksheet => {
//     const table = worksheet.table?.[0] || {};
    
//     const view = table.view?.[0] || {};
//     const datasourceDependencies = view["datasource-dependencies"]?.[0] || {};
//     const columns = datasourceDependencies.column || [];
//     const columnInstances = datasourceDependencies["column-instance"] || [];

//     const consolidated = MeasureDimension(columns, columnInstances);

//     console.log(`\nWorksheet: ${worksheet.$.name}`);
//     console.log("Dimensions:");
//     consolidated.dimensions.forEach(d => console.log("   •", d));
//     console.log("Measures:");
//     consolidated.measures.forEach(m => console.log("   •", m));

//     return {
//       name: worksheet.$.name,
//       dimensions: consolidated.dimensions,
//       measures: consolidated.measures,
//     };
//   });
// }

// // Example: "Year([Order Date])"
// // Returns: { aggFunc: "Year", field: "order_date" }




// let selectedWorksheetData;
// let datasource;
// // ===== API Routes =====

// // Upload TWB file and return worksheet names
// // Upload TWB file and optionally parse selected worksheets
// app.post("/upload-twb", upload.single("twb"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No TWB file uploaded." });
//     }

//     const buffer = req.file.buffer;
//     const xml = buffer.toString("utf8");
//     const data = await xml2js.parseStringPromise(xml);
//     const datasource1 = data.workbook?.worksheets;
//     datasource = datasource1?.[0]?.worksheet || [];
//     const tableName = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.relation?.[0]?.$?.name;
//     const schema = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.relation?.[0]?.$?.table;
//     const schemaName = schema?.match(/^\[(.*?)\]/)?.[1];
//     //const tableName =   data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.relation?.['name'];

//     const metadataRecords = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.['metadata-records']?.[0]?.['metadata-record'];
//     const formattedColumns = metadataRecords.map(record => {
//       return {
//         columnName: record['remote-name']?.[0] ?? null,
//         dataType: record['local-type']?.[0] ?? null,
//         aggregation: record['aggregation']?.[0] ?? null,
//         nullable: record['contains-null']?.[0] === 'true' ? 'Yes' : 'No'
//       };
//     });

//     console.log("formattedColumns", formattedColumns)
//     const remoteNames = metadataRecords?.map(  record => record?.['remote-name']?.[0]) ?? [];
//     const connections = data.workbook?.datasources?.[0]?.datasource?.[0]?.connection?.[0]?.['named-connections']?.[0]?.['named-connection']?.[0]?.connection
//     console.log("metadataRecords", metadataRecords)
//     //?.[0]?.datasource || [];

//     //.['datasource']?.['metadata-records']
//     // console.log("remoteNames", schemaName);
//     // console.log("remoteNames", remoteNames);
//     // console.log("tableName", tableName)
//     // console.log("connections", connections)

//     // Get all worksheet names (for frontend list)
//     const worksheetNames = getworksheetNames(datasource);

//     // Selected worksheets sent from frontend
//     const selectedWorksheets = req.body.selectedWorksheets || worksheetNames;
   

//     res.json({ worksheetNames, worksheets: selectedWorksheetData });
//   } catch (err) {
//     console.error("❌ Error parsing TWB file:", err);
//     res.status(500).json({ error: "Failed to parse TWB file." });
//   }
// });

// app.post("/save-selected-worksheets", express.json(), (req, res) => {
//   const { selectedWorksheets, originalFileName } = req.body;
//   console.log("Received worksheets", selectedWorksheets);
//   console.log("file:", originalFileName);

//   // TODO: Do whatever you need here:
//   // e.g., store in DB, process, generate response, etc.

//   res.json({
//     message: "Worksheets received successfully",
//     count: selectedWorksheets.length,
//     data: selectedWorksheets
//   });
// });

// let finalJsonGlobal = [];

// app.post("/save-chart-types", async (req, res) => {
//   try {
//     const { chartSelections } = req.body;

//     if (!chartSelections || chartSelections.length === 0) {
//       return res.status(400).json({ error: "No chart selections provided." });
//     }

//     // Convert chartSelections → { worksheetName: chartType }
//     const finalJson = {};
//     chartSelections.forEach(item => {
//       finalJson[item.worksheetName] = item.chartType;
//     });

//     const selectedWorksheetNames = Object.keys(finalJson);

//     // Get worksheet info: dimensions + measures
//     const worksheetData = getColumnsFromWorksheet(datasource, selectedWorksheetNames);
//     console.log("worksheetData", worksheetData);

//     // Build layout configs directly (NO chartHandlers)
//     const layoutConfigs = worksheetData.map(ws => {
//       const selectedType = finalJson[ws.name]; // "line" | "bar" | "column" | "pie"
//       console.log("selectedType1234", selectedType)
//       // pick the FIRST dimension + FIRST measure by default
//       const rawDimension = ws.dimensions[0];
//       const rawMeasure = ws.measures[0];

//       // Parse dimension
//       const parsedDimension = parseDimension({
//         field: rawDimension?.field || rawDimension,
//         aggFunc: rawDimension?.aggFunc || null
//       });

//       // Parse measure
//       const parsedMeasure = parseMeasure({
//         field: rawMeasure?.field || rawMeasure,
//         aggFunc: rawMeasure?.aggFunc || null
//       });

//       return {
//         // Map chartType → PowerBI visualType
//         visualType:
//         selectedType === "line_chart"
//           ? "lineChart"
//           : selectedType === "column_chart" || selectedType === "bar"
//           ? "columnChart"
//           : selectedType === "pie_chart"
//           ? "pieChart"
//           : selectedType,


//         dimension: parsedDimension,    // { field, aggFunc }
//         measure: parsedMeasure,        // { field, aggFunc }
//         aggFuncMeasure: parsedMeasure.aggFunc || "",

//         table: "store_orders",

//         x: 10,
//         y: 0,
//         width: 280,
//         height: 280,

//         visualId: "visual_" + Date.now() + Math.floor(Math.random() * 1000)
//       };
//     });

//     console.log("FINAL layoutConfigs:", layoutConfigs);

//     // Batch build layout
//     await buildLayoutBatch(layoutConfigs);

//     // Create PBIT
//     const pbitPath = await createPBIT();

//     // Send PBIT file to browser
//     res.setHeader("Content-Disposition", "attachment; filename=Final.pbit");
//     res.setHeader("Content-Type", "application/octet-stream");

//     return res.sendFile(pbitPath);

//   } catch (err) {
//     console.error("❌ Error generating PBIT:", err);
//     res.status(500).send("Error generating PBIT file");
//   }
// });

// // ===== Add this new API Route =====
// app.post("/append-column-to-table", async (req, res) => {
//   try {
//     console.log("Request received:", req.body); // ✅ req used

//     const tableFilePath = path.join(__dirname, "tableTest2.json");
//     const columnTemplatePath = path.join(__dirname, "templates", "tablecolumn.json");
//     const outputFilePath = path.join(__dirname, "output", "tableTest2_updated.json");

//     const tableData = JSON.parse(fs.readFileSync(tableFilePath, "utf-8"));
//     const columnTemplate = JSON.parse(fs.readFileSync(columnTemplatePath, "utf-8"));

//     if (!Array.isArray(tableData.model.tables)) {
//       return res.status(400).json({ error: "No tables found" });
//     }

//     const table = tableData.model.tables[0];
//     if (!Array.isArray(table.columns)) table.columns = [];
//     table.columns.push(columnTemplate);

//     fs.writeFileSync(outputFilePath, JSON.stringify(tableData, null, 2), "utf-8");

//     console.log("Column appended successfully to", outputFilePath);

//     res.json({
//       message: "Column appended successfully",
//       outputFile: outputFilePath,
//       data: tableData
//     });
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Start server
// app.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });


