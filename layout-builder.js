const fs = require("fs");
const path = require("path");
const { mainLayout } = require("./templates/main-layout");
const { dynamicLayout } = require("./templates/visual-container-base");
const { configTemplate, queryTemplate, dataTransformsTemplate } = require("./templates/dynamic");

function makeDaxExpression(fieldInfo) {
  if (!fieldInfo) return "";
  const { field, aggFunc } = fieldInfo;
  return aggFunc ? `${aggFunc}([${field}])` : field;
}

function buildLayoutBatch(layoutConfigs) {
  const outputPath = path.join(__dirname, "./Template/Report/Layout");

  // Ensure folder exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Load main layout template
  const mainLayoutObj = mainLayout();

  // Dynamic counters
let xCounter = 10;
let yCounter = 0;
let zCounter = 0;

layoutConfigs.forEach((input, index) => {
  console.log("Inputss", input)
  // Assign & advance layout positions
  const x = xCounter;
  const y = yCounter;
  const z = zCounter;

  xCounter += 270;         // move right
  // yCounter += input.height + 20;   // uncomment if you want vertical stacking
  zCounter += 1;

  // Extract raw values
  // const dimensionField = input.dimension.field;
  // const measureField = input.measure.field;
  // const aggFunc = input.measure.aggFunc || "";
  // const isHierarchy = input.isHierarchy;
  // const hierarchyLevel = input.hierarchyLevel || "Year";
  const dimensionField = input.dimension;
  const measureField = input.measure;
  const aggFunc = input.measure|| "";
  const isHierarchy = Array.isArray(dimensionField?.field)
    ? dimensionField.field[0]?.isHierarchy
    : dimensionField?.field?.isHierarchy;
  console.log("isHierarchyisHierarchy", isHierarchy)
  
  const hierarchyLevel = input.hierarchyLevel || "Year";
  const visualId = "visual_" + Date.now() + Math.floor(Math.random() * 1000);
  
  const replacements = {
    visualType: input.visualType,
    table: input.table,
    dimension: dimensionField,
    measure: measureField,
    //aggFuncMeasure: aggFunc,
    x,
    y,
    z,
    width: input.width,
    height: input.height,
    visualId,
    isHierarchy,
    hierarchyLevel
  };
console.log("replacementsreplacements", replacements)
  // Generate config
  const config = configTemplate(
     replacements.visualId,
      replacements.x,
      replacements.y,
      replacements.width,
      replacements.height,
      replacements.visualType,
      replacements.table,
      replacements.dimension,
      //replacements.aggFuncMeasure, // SAME
      replacements.measure,        // FIXED (stay here)
      replacements.isHierarchy,
      replacements.hierarchyLevel
  );

  console.log("configconfig", config)

  // Generate query
  const query = queryTemplate(
    replacements.table,
    replacements.dimension,
    replacements.measure,
    //replacements.aggFuncMeasure,
    replacements.isHierarchy,
    replacements.hierarchyLevel
  );

  // Generate dataTransforms
  const dataTransforms = dataTransformsTemplate(
    replacements.table,
    replacements.dimension,
    replacements.measure,
    //replacements.aggFuncMeasure,
    replacements.isHierarchy,
    replacements.hierarchyLevel
  );

  // Apply container
  const finalContainer = dynamicLayout(
    JSON.stringify(config.qProperty),
    JSON.stringify(query.qProperty),
    JSON.stringify(dataTransforms.qProperty)
  );

  // Push visual container
  mainLayoutObj.qProperty.sections[0].visualContainers.push(finalContainer.qProperty);
});


  const finalJson = JSON.stringify(mainLayoutObj.qProperty, null, 2);
  fs.writeFileSync(outputPath, Buffer.from(finalJson, "utf16le"));

  console.log("✔ Layout generated successfully!");
}

module.exports = buildLayoutBatch;
