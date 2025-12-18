const fs = require("fs");
const path = require("path");
const { mainLayout } = require("./templates/main-layout");
const { dynamicLayout } = require("./templates/visual-container-base");
const { configTemplate, queryTemplate, dataTransformsTemplate, makeFilters } = require("./templates/dynamic");

function makeDaxExpression(fieldInfo) {
  if (!fieldInfo) return "";
  const { field, aggFunc } = fieldInfo;
  return aggFunc ? `${aggFunc}([${field}])` : field;
}

function buildLayoutBatch(layoutConfigs) {
  const outputPath = path.join(__dirname, "./Template/Report/Layout");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const mainLayoutObj = mainLayout();

  layoutConfigs.forEach(input => {

    console.log("input", input)
    const visualId = "visual_" + Date.now() + Math.floor(Math.random() * 1000);

    const x = input.x || 10;
    const y = input.y || 0;
    const z = input.z || 0;

    // -------------------------
    // Build dateColumnMap
    // -------------------------
    const dateColumnMap = {};
    (input.chartFilter || []).forEach(f => {
      if (f.localDateTableId && f.column) {
        dateColumnMap[f.column] = f.localDateTableId;
      }
    });

    // -------------------------
    // Generate filters
    // -------------------------
    const visualFilters = makeFilters(
      input.table,
      input.chartFilter,
      dateColumnMap
    );

    // Visual-level filters
    const visualFilterArray = visualFilters.map(f => f.qProperty);
    console.log("visualFilterArray", visualFilterArray)

    // Query-level filters (same filters reused)
    const queryFilters = visualFilters;
    console.log("queryFilters", queryFilters)

    // -------------------------
    // Build visual container
    // -------------------------
    const finalContainer = dynamicLayout(
      JSON.stringify(
        configTemplate(
          visualId,
          x,
          y,
          input.width,
          input.height,
          input.visualType,
          input.table,
          input.dimension,
          input.measure
        ).qProperty
      ),
      JSON.stringify(
        queryTemplate(
          input.table,
          input.dimension,
          input.measure,
          queryFilters // ✅ PASS FILTERS HERE
        ).qProperty
      ),
      JSON.stringify(
        dataTransformsTemplate(
          input.table,
          input.dimension,
          input.measure
        ).qProperty
      ),
      JSON.stringify(visualFilterArray)
    );

    mainLayoutObj.qProperty.sections[0].visualContainers.push(
      finalContainer.qProperty
    );
  });

  fs.writeFileSync(
    outputPath,
    Buffer.from(JSON.stringify(mainLayoutObj.qProperty, null, 2), "utf16le")
  );

  console.log("✔ Layout generated successfully!");
}

module.exports = buildLayoutBatch;

