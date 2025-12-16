function parseDimension(input) {
  //console.log("inputingggggg", input);

  if (!input) return { aggFunc: null, field: null, isHierarchy: false };

  // Copy original flags (important!)
  let isHierarchy = input.isHierarchy || false;

  // If input is an object
  if (typeof input === "object" && input !== null) {
    let aggFunc = input.aggFunc || null;
    let field = input.field || null;

    // Remove surrounding brackets if present
    if (typeof field === "string" && field.startsWith("[") && field.endsWith("]")) {
      field = field.slice(1, -1);
    }

    return {
      aggFunc,
      field,
      isHierarchy  // ← KEEP THIS
    };
  }

  // Otherwise input is a string
  const str = input.trim();
  let aggFunc = null;
  let field = null;

  const aggMatch = str.match(/^([A-Za-z0-9_\-]+)\s*\(\s*\[?(.+?)\]?\s*\)$/);

  if (aggMatch) {
    aggFunc = aggMatch[1].split("-")[0].toUpperCase();
    field = aggMatch[2];
  } else if (str.startsWith("[") && str.endsWith("]")) {
    field = str.slice(1, -1);
  } else {
    field = str;
  }

  return {
    aggFunc,
    field,
    isHierarchy  // ← IMPORTANT: PRESERVE IT HERE TOO
  };
}

function parseMeasure(input) {
  //console.log("strMeasure", input);
  if (!input) return { aggFunc: null, field: null };

  // CASE: array of measures
  if (Array.isArray(input)) {
    return input.map(m => parseMeasure(m)); 
  }

  // CASE: object with array field → wrap properly
  if (typeof input === "object" && Array.isArray(input.field)) {
    return input.field.map(m => parseMeasure(m));
  }

  // CASE: simple object with field + aggFunc
  if (typeof input === "object" && input !== null) {
    return {
      aggFunc: input.aggFunc || null,
      field: typeof input.field === "string"
        ? input.field.replace(/\s+/g, "_")
        : null
    };
  }

  const str = input.trim();

  // SUM([Sales]) or SUM(Sales)
  const aggMatch = str.match(/^([A-Za-z0-9_\-]+)\s*\(\s*\[?([^)\]]+)\]?/i);
  if (aggMatch) {
    const agg = aggMatch[1].split("-")[0].toUpperCase();
    const cleanField = aggMatch[2].split(".").pop();
    return { aggFunc: agg, field: cleanField.replace(/\s+/g, "_") };
  }

  // [Sales]
  const bracketMatch = str.match(/^\[(.+?)\]$/);
  if (bracketMatch) return { aggFunc: null, field: bracketMatch[1].replace(/\s+/g, "_") };

  // table.Sales
  if (str.includes(".")) {
    return { aggFunc: null, field: str.split(".").pop().replace(/\s+/g, "_") };
  }

  // plain string
  return { aggFunc: null, field: str.replace(/\s+/g, "_") };
}


module.exports = { parseDimension, parseMeasure };
