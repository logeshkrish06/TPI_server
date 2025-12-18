// ==================================================
// NORMALIZATION HELPERS
// ==================================================

// Always return dimensions as an array
function normalizeDimensions(dimensions) {
  if (!dimensions) return [];
  if (Array.isArray(dimensions)) return dimensions;
  if (Array.isArray(dimensions.field)) return dimensions.field;
  if (typeof dimensions === "object" && dimensions.field) return [dimensions];
  return [];
}

// Always return measures as an array
function normalizeMeasures(measures) {
  if (!measures) return [];
  if (Array.isArray(measures)) return measures;
  return [measures];
}

// ==================================================
// FILTER HELPERS
// ==================================================

const makeFilterValues = (values, derivation) => {
  return values.map(v => {
    let value;

    // Date hierarchy values (Year, Month etc.)
    if (derivation) {
      value = derivation === "Year" && !v.endsWith("L") ? `${v}L` : v;
    }
    // Normal categorical values
    else {
      value = `'${v}'`;
    }

    return [{ Literal: { Value: value } }];
  });
};

// ==================================================
// QUERY HELPERS
// ==================================================

function buildQueryWhere(filters = []) {
  if (!Array.isArray(filters) || filters.length === 0) {
    return [];
  }

  const where = filters
    .map(f => f?.qProperty?.filter?.Where)
    .flat()
    .filter(Boolean);

  console.log("✅ buildQueryWhere:", JSON.stringify(where, null, 2));
  return where;
}

function buildQueryOrderBy(measures) {
  if (!measures || measures.length === 0) return [];

  return [
    {
      Direction: 2,
      Expression: {
        Aggregation: {
          Function: 0,
          Expression: {
            Column: {
              Expression: { SourceRef: { Source: "s" } },
              Property: measures[0].field
            }
          }
        }
      }
    }
  ];
}

// ==================================================
// AUTO MAP PROJECTIONS (CORE LOGIC)
// ==================================================

function autoMapProjections(dimensions, measures, table) {
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  const projections = {};

  console.log("dimensionsDimui", dimensions);

  // ----------------------------------------------
  // 1️⃣ Separate hierarchy & non-hierarchy dimensions
  // ----------------------------------------------

  const hierarchyDimension = dimensions.find(d => d.isHierarchy === true);
  const normalDimensions = dimensions.filter(d => !d.isHierarchy);

  // ----------------------------------------------
  // 2️⃣ CATEGORY (X-axis)
  // ----------------------------------------------

  if (hierarchyDimension) {
    projections.Category = [
      {
        queryRef: `${table}.${hierarchyDimension.field}.Variation.Date Hierarchy.${hierarchyDimension.aggFunc}`,
        active: true
      }
    ];
  } else if (dimensions[0]) {
    projections.Category = [
      {
        queryRef: `${table}.${dimensions[0].field}`,
        active: true
      }
    ];
  }

  // ----------------------------------------------
  // 3️⃣ LEGEND
  // ----------------------------------------------

  if (normalDimensions.length > 0) {
    projections.Legend = normalDimensions.map(dim => ({
      queryRef: `${table}.${dim.field}`
    }));
  }

  // ----------------------------------------------
  // 4️⃣ MEASURES
  // ----------------------------------------------

  if (measures[0]) {
    projections.Y = [
      { queryRef: `${measures[0].aggFunc}(${table}.${measures[0].field})` }
    ];
  }

  if (measures[1]) {
    projections.Tooltips = [
      { queryRef: `${measures[1].aggFunc}(${table}.${measures[1].field})` }
    ];
  }

  return projections;
}

// ==================================================
// VISUAL CONFIG TEMPLATE
// ==================================================

function configTemplate(
  visualId,
  x,
  y,
  width,
  height,
  visualType,
  table,
  dimensions,
  measures
) {
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  const projections = autoMapProjections(dimensions, measures, table);

  // -------------------------------
  // Build SELECT block
  // -------------------------------
  const buildSelect = () => {
    const selects = [];

    // Dimensions
    dimensions.forEach(dim => {
      if (dim.isHierarchy) {
        selects.push({
          HierarchyLevel: {
            Expression: {
              Hierarchy: {
                Expression: {
                  PropertyVariationSource: {
                    Expression: { SourceRef: { Source: "s" } },
                    Name: "Variation",
                    Property: dim.field
                  }
                },
                Hierarchy: "Date Hierarchy"
              }
            },
            Level: dim.aggFunc
          },
          Name: `${table}.${dim.field}.Variation.Date Hierarchy.${dim.aggFunc}`,
          NativeReferenceName: `${dim.field} ${dim.aggFunc}`
        });
      } else {
        selects.push({
          Column: {
            Expression: { SourceRef: { Source: "s" } },
            Property: dim.field
          },
          Name: `${table}.${dim.field}`,
          NativeReferenceName: dim.field
        });
      }
    });

    // Measures
    measures.forEach(msr => {
      selects.push({
        Aggregation: {
          Expression: {
            Column: {
              Expression: { SourceRef: { Source: "s" } },
              Property: msr.field
            }
          },
          Function: 0
        },
        Name: `${msr.aggFunc}(${table}.${msr.field})`,
        NativeReferenceName: `${msr.aggFunc} of ${msr.field}`
      });
    });

    return selects;
  };

  return {
    qProperty: {
      name: visualId,
      layouts: [{ id: 0, position: { x, y, width, height, z: 0 } }],
      singleVisual: {
        visualType,
        projections,
        prototypeQuery: {
          Version: 2,
          From: [{ Name: "s", Entity: table, Type: 0 }],
          Select: buildSelect(),
          OrderBy: buildQueryOrderBy(measures)
        },
        drillFilterOtherVisuals: true,
        hasDefaultSort: true
      }
    }
  };
}

// ==================================================
// QUERY TEMPLATE
// ==================================================

function queryTemplate(table, dimensions, measures, filters = []) {
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  const Select = [];
  const groupingProjections = [];

  dimensions.forEach((dim, index) => {
    if (dim.isHierarchy) {
      Select.push({
        HierarchyLevel: {
          Expression: { Hierarchy: { Expression: { SourceRef: { Source: "s" } }, Hierarchy: "Date Hierarchy" } },
          Level: dim.aggFunc
        },
        Name: `${table}.${dim.field}.${dim.aggFunc}`,
        NativeReferenceName: dim.field
      });
    } else {
      Select.push({
        Column: { Expression: { SourceRef: { Source: "s" } }, Property: dim.field },
        Name: `${table}.${dim.field}`,
        NativeReferenceName: dim.field
      });
    }

    groupingProjections.push(index);
  });

  measures.forEach(msr => {
    Select.push({
      Aggregation: {
        Expression: { Column: { Expression: { SourceRef: { Source: "s" } }, Property: msr.field } },
        Function: 0
      },
      Name: `${msr.aggFunc}(${table}.${msr.field})`,
      NativeReferenceName: `${msr.aggFunc} of ${msr.field}`
    });
  });

  return {
    qProperty: {
      Commands: [
        {
          SemanticQueryDataShapeCommand: {
            Query: {
              Version: 2,
              From: [{ Name: "s", Entity: table, Type: 0 }],
              Select,
              Where: buildQueryWhere(filters),
              OrderBy: buildQueryOrderBy(measures)
            },
            Binding: {
              Primary: { Groupings: [{ Projections: groupingProjections }] },
              DataReduction: { DataVolume: 4, Primary: { Window: { Count: 1000 } } },
              Version: 1
            },
            ExecutionMetricsKind: 1
          }
        }
      ]
    }
  };
}

// ==================================================
// FILTER BUILDER
// ==================================================

const makeFilters = (tableName, filtersInput, dateColumnMap = {}) => {
  if (!filtersInput) return [];

  return filtersInput.map(f => {
    const localDateTableId = dateColumnMap[f.column] || f.localDateTableId || null;

    if (localDateTableId && f.derivation) {
      return {
        qProperty: {
          name: `${Date.now()}_${Math.random()}`,
          expression: {
            HierarchyLevel: {
              Expression: {
                Hierarchy: {
                  Expression: {
                    PropertyVariationSource: {
                      Expression: { SourceRef: { Entity: tableName } },
                      Name: "Variation",
                      Property: f.column
                    }
                  },
                  Hierarchy: "Date Hierarchy"
                }
              },
              Level: f.derivation
            }
          },
          filter: {
            Version: 2,
            From: [{ Name: "l", Entity: localDateTableId, Type: 0 }],
            Where: [
              {
                Condition: {
                  In: {
                    Expressions: [{ Column: { Expression: { SourceRef: { Source: "l" } }, Property: f.derivation } }],
                    Values: makeFilterValues(f.values || [], f.derivation)
                  }
                }
              }
            ]
          },
          type: "Categorical"
        }
      };
    }

    // Non-hierarchy filter
    return {
      qProperty: {
        name: `${Date.now()}_${Math.random()}`,
        expression: { Column: { Expression: { SourceRef: { Entity: tableName } }, Property: f.column } },
        filter: {
          Version: 2,
          From: [{ Name: "s", Entity: tableName, Type: 0 }],
          Where: [
            {
              Condition: {
                In: {
                  Expressions: [{ Column: { Expression: { SourceRef: { Source: "s" } }, Property: f.column } }],
                  Values: makeFilterValues(f.values || [])
                }
              }
            }
          ]
        },
        type: "Categorical"
      }
    };
  });
};

// ==================================================
// DATA TRANSFORMS TEMPLATE
// ==================================================

function dataTransformsTemplate(table, dimensions, measures) {

  // Normalize inputs
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  // These arrays build the final metadata
  const selects = [];
  const queryMetadataSelect = [];
  const filters = [];

  // Roles are derived from autoMapProjections
  const roles = autoMapProjections(dimensions, measures, table);

  // --------------------------------------------------
  // Build projection ordering & active items
  // --------------------------------------------------

  const projectionOrdering = {};
  const projectionActiveItems = {};

  Object.keys(roles).forEach(role => {
    projectionOrdering[role] = [];

    roles[role].forEach(item => {
      projectionOrdering[role].push(selects.length);
      projectionActiveItems[role] = [
        { queryRef: item.queryRef, suppressConcat: false }
      ];
    });
  });

  // --------------------------------------------------
  // DIMENSIONS
  // --------------------------------------------------

  dimensions.forEach(dim => {

    // Query name for hierarchy or normal column
    const queryName = dim.isHierarchy && dim.aggFunc
      ? `${table}.${dim.field}.Variation.Date Hierarchy.${dim.aggFunc}`
      : `${table}.${dim.field}`;

    // Dimension select block
    selects.push(
      dim.isHierarchy && dim.aggFunc
        ? {
            displayName: dim.aggFunc,
            format: "0",
            queryName,
            roles: { Category: true },
            type: { category: "Years", underlyingType: 66308 },
            expr: {
              HierarchyLevel: {
                Expression: {
                  Hierarchy: {
                    Expression: {
                      PropertyVariationSource: {
                        Expression: { SourceRef: { Entity: table } },
                        Name: "Variation",
                        Property: dim.field
                      }
                    },
                    Hierarchy: "Date Hierarchy"
                  }
                },
                Level: dim.aggFunc
              }
            }
          }
        : {
            displayName: dim.field,
            queryName,
            roles: { Category: true },
            type: { category: null, underlyingType: 1 },
            expr: {
              Column: {
                Expression: { SourceRef: { Entity: table } },
                Property: dim.field
              }
            }
          }
    );

    // Metadata for dimension
    queryMetadataSelect.push({
      Restatement: dim.isHierarchy ? dim.aggFunc : dim.field,
      Name: queryName,
      Type: dim.isHierarchy ? 3 : 2048
    });

    // Filter expression
    filters.push(
      dim.isHierarchy && dim.aggFunc
        ? {
            type: 2,
            expression: {
              HierarchyLevel: {
                Expression: {
                  Hierarchy: {
                    Expression: {
                      PropertyVariationSource: {
                        Expression: { SourceRef: { Entity: table } },
                        Name: "Variation",
                        Property: dim.field
                      }
                    },
                    Hierarchy: "Date Hierarchy"
                  }
                },
                Level: dim.aggFunc
              }
            }
          }
        : {
            type: 0,
            expression: {
              Column: {
                Expression: { SourceRef: { Entity: table } },
                Property: dim.field
              }
            }
          }
    );
  });

  // --------------------------------------------------
  // MEASURES
  // --------------------------------------------------

  measures.forEach(msr => {
    const queryName = `${msr.aggFunc}(${table}.${msr.field})`;

    // Measure select
    selects.push({
      displayName: `${msr.aggFunc} of ${msr.field}`,
      queryName,
      roles: { Y: true },
      type: { category: null, underlyingType: 259 },
      expr: {
        Aggregation: {
          Expression: {
            Column: {
              Expression: { SourceRef: { Entity: table } },
              Property: msr.field
            }
          },
          Function: 0
        }
      }
    });

    // Metadata for measure
    queryMetadataSelect.push({
      Restatement: `${msr.aggFunc} of ${msr.field}`,
      Name: queryName,
      Type: 1
    });

    // Measure filter
    filters.push({
      type: 2,
      expression: {
        Aggregation: {
          Expression: {
            Column: {
              Expression: { SourceRef: { Entity: table } },
              Property: msr.field
            }
          },
          Function: 0
        }
      }
    });
  });

  // --------------------------------------------------
  // FINAL TRANSFORM OBJECT
  // --------------------------------------------------

  return {
    qProperty: {
      projectionOrdering,
      projectionActiveItems,
      queryMetadata: {
        Select: queryMetadataSelect,
        Filters: filters
      },
      visualElements: [
        {
          DataRoles: Object.keys(roles).map((role, index) => ({
            Name: role,
            Projection: index,
            isActive: role === "Category"
          }))
        }
      ],
      selects
    }
  };
}





module.exports = { configTemplate, queryTemplate, dataTransformsTemplate, makeFilters};
