// helpers/twbParser.js
const xml2js = require("xml2js");

// Extract worksheet names
function getDatasourceNames(datasource) {
  if (!Array.isArray(datasource)) return [];
  return datasource.map(item => item?.$?.name || null).filter(Boolean);
}

// Extract Dimensions and Measures
function MeasureDimension(columns, columnInstances) {
  if (!Array.isArray(columns) || !Array.isArray(columnInstances))
    return { dimensions: [], measures: [] };

  const instanceMap = columnInstances.reduce((acc, inst) => {
    acc[inst.$.column] = inst.$;
    return acc;
  }, {});

  const dimensions = [];
  const measures = [];

  columns.forEach(col => {
    const colName = col.$.name;
    const colCaption = col.$.caption;
    const colRole = col.$.role;

    const instance = instanceMap[colName];
    const derivation =
      instance?.derivation && instance.derivation !== "None"
        ? instance.derivation
        : null;
    const displayName = derivation ? `${derivation}(${colName})` : colName;

    if (colRole === "dimension") dimensions.push(displayName);
    else if (colRole === "measure") measures.push(displayName);
  });
  console.log("DIMandMeasure", dimensions, measures)
  return { dimensions, measures };
}

// Extract all worksheets with their dimensions/measures
function getColumnsFromWorksheet(datasourceArray, names) {
  if (!Array.isArray(datasourceArray) || !names) return [];

  const namesArray = Array.isArray(names) ? names : [names];
  const matchedWorksheets = datasourceArray.filter(item =>
    namesArray.includes(item?.$?.name)
  );

  return matchedWorksheets.map(worksheet => {
    const table = worksheet.table?.[0] || {};
    const view = table.view?.[0] || {};
    const dsDeps = view["datasource-dependencies"]?.[0] || {};
    const columns = dsDeps.column || [];
    const columnInstances = dsDeps["column-instance"] || [];

    const consolidated = MeasureDimension(columns, columnInstances);

    console.log(`\n✅ Worksheet: ${worksheet.$.name}`);
    console.log("📊 Dimensions:", consolidated.dimensions);
    console.log("📈 Measures:", consolidated.measures);

    return {
      name: worksheet.$.name,
      dimensions: consolidated.dimensions,
      measures: consolidated.measures
    };
  });
}

// Parse XML buffer (TWB content)
async function parseTWB(buffer) {
  const xml = buffer.toString("utf8");
  const data = await xml2js.parseStringPromise(xml);
  const datasource1 = data.workbook?.worksheets;
  const datasource = datasource1?.[0]?.worksheet || [];

  const worksheetNames = getDatasourceNames(datasource);
  const fullData = getColumnsFromWorksheet(datasource, worksheetNames);

  return { worksheetNames, fullData };
}

module.exports = { parseTWB };
