// ------------------------------
// NORMALIZATION HELPERS
// ------------------------------
function normalizeDimensions(dim) {
  if (!dim) return [];
  if (Array.isArray(dim)) return dim;
  if (Array.isArray(dim.field)) return dim.field;
  if (typeof dim === "object" && dim.field) return [dim];
  return [];
}

function normalizeMeasures(msr) {
  if (!msr) return [];
  if (Array.isArray(msr)) return msr;
  return [msr];
}

// ------------------------------
// AUTO MAP PROJECTIONS WITH DATE HIERARCHY SUPPORT
// ------------------------------
function autoMapProjections(dimensions, measures, table) {
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);
  const projections = {};

  // Single date hierarchy
  if ( dimensions[0].isHierarchy == true ) {
    console.log("WorkingHierar")
    const dim = dimensions[0];
    projections.Category = [
      {
        queryRef: `${table}.${dim.field}.Variation.Date Hierarchy.${dim.aggFunc}`,
        active: true
      }
    ];
    if (measures[0]) {
      projections.Y = [
        { queryRef: `${measures[0].aggFunc}(${table}.${measures[0].field})` }
      ];
    }
    return projections;
  }

  // Multiple dimensions/measures → manual mapping
  if (dimensions.length + measures.length > 1) {
    if (dimensions[0]) projections.Category = [{ queryRef: `${table}.${dimensions[0].field}`, active: true }];
    if (dimensions[1]) projections.Series = [{ queryRef: `${table}.${dimensions[1].field}` }];
    if (measures[0]) projections.Y = [{ queryRef: `${measures[0].aggFunc}(${table}.${measures[0].field})` }];
    if (measures[1]) projections.Tooltips = [{ queryRef: `${measures[1].aggFunc}(${table}.${measures[1].field})` }];
    return projections;
  }

  // Default auto-map
  const roles = ["Category", "Series", "Breakdown", "Legend", "Tooltips"];
  dimensions.forEach((dim, index) => {
    const role = roles[index] || "Tooltips";
    if (!projections[role]) projections[role] = [];
    const queryRef = dim.isHierarchy
      ? `${table}.${dim.field}.Variation.Date Hierarchy.${dim.aggFunc}`
      : `${table}.${dim.field}`;
    projections[role].push({ queryRef, active: index === 0 });
  });

  measures.forEach((msr, index) => {
    const role = index === 0 ? "Y" : "Tooltips";
    if (!projections[role]) projections[role] = [];
    projections[role].push({ queryRef: `${msr.aggFunc}(${table}.${msr.field})` });
  });

  return projections;
}

// ------------------------------
// CONFIG TEMPLATE
// ------------------------------
function configTemplate(visualId, x, y, width, height, visualType, table, dimensions, measures) {
  //console.log("Valeuesss", measures, visualId, x, y, width, height, visualType, table, dimensions, measures)
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  const projections = autoMapProjections(dimensions, measures, table);
  console.log("dimensions123", dimensions)
  dimensions.forEach(dim => {
  if (dim.isHierarchy) {
    console.log(`Field: ${dim.field}, Derivation: ${dim.aggFunc}`);
  }
});

  function getOrderByExpression(dim) {
  if (dim.isHierarchy === true) {
    return {
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
            Hierarchy: `Date Hierarchy`
          }
        },
        Level: dim.aggFunc
      }
    };
  }

  if (Array.isArray(dim.field)) {
    return {
      Column: {
        Expression: { SourceRef: { Source: "s" } },
        Property: dim.field[0].field
      }
    };
  }

  return {
    Column: {
      Expression: { SourceRef: { Source: "s" } },
      Property: dim.field
    }
  };
}

// Priority: use hierarchy → else first dimension
const primarySortDim =
  dimensions.find(d => d.isHierarchy) || dimensions[0];

  // Build SELECT block
  const buildSelect = () => {
    const selects = [];

    dimensions.forEach(dim => {
      if (dim.isHierarchy == true) {
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
                Hierarchy: `Date Hierarchy`
              }
            },
            Level: dim.aggFunc
          },
          Name: `${table}.${dim.field}.Variation.Date Hierarchy.${dim.aggFunc}`,
          NativeReferenceName: `${dim.field} ${dim.aggFunc}`
        });
      } else if (Array.isArray(dim.field)) {
        dim.field.forEach(d => {
          selects.push({
            Column: { Expression: { SourceRef: { Source: "s" } }, Property: d.field },
            Name: `${table}.${d.field}`,
            NativeReferenceName: d.field
          });
        });
      } else {
        selects.push({
          Column: { Expression: { SourceRef: { Source: "s" } }, Property: dim.field },
          Name: `${table}.${dim.field}`,
          NativeReferenceName: dim.field
        });
      }
    });

    measures.forEach(msr => {
      selects.push({
        Aggregation: {
          Expression: { Column: { Expression: { SourceRef: { Source: "s" } }, Property: msr.field } },
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
      layouts: [
        { id: 0, position: { x, y, width, height, z: 0 } }
      ],
      singleVisual: {
        visualType,
        projections,
        prototypeQuery: {
          Version: 2,
          From: [{ Name: "s", Entity: table, Type: 0 }],
          Select: buildSelect(),
          OrderBy: [
          {
            Direction: 1,
            Expression: getOrderByExpression(primarySortDim)
          }
        ]

        },
        drillFilterOtherVisuals: true,
        hasDefaultSort: true
      }
    }
  };
}

// ------------------------------
// QUERY TEMPLATE
// ------------------------------
function queryTemplate(table, dimensions, measures) {
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  const Select = [];

  // ------------------------------
// FIX: Determine correct ORDER BY dimension following SELECT logic
// ------------------------------


  
  dimensions.forEach(dim => {
    console.log("dim.isHierarchy", dim.isHierarchy)
    if (dim.isHierarchy == true) {
     console.log("coimngss")
      Select.push({
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
    } else if (Array.isArray(dim.field)) {
      dim.field.forEach(d => {        
        Select.push({
          Column: { Expression: { SourceRef: { Source: "s" } }, Property: d.field },
          Name: `${table}.${d.field}`,
          NativeReferenceName: d.field
        });
      });
    } else {
      Select.push({        
        Column: { Expression: { SourceRef: { Source: "s" } }, Property: dim.field },
        Name: `${table}.${dim.field}`,
        NativeReferenceName: dim.field
      });
    }
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
            Query: { Version: 2, From: [{ Name: "s", Entity: table, Type: 0 }], Select },
            Binding: { Primary: { Groupings: [{ Projections: dimensions.map((_, i) => i) }] },DataReduction: { DataVolume: 4,Primary: { Sample: {} }}, Version: 1 },
            ExecutionMetricsKind: 1
          }
        }
      ]
    }
  };
}

// ------------------------------
// DATA TRANSFORMS TEMPLATE
// ------------------------------
function dataTransformsTemplate(table, dimensions, measures) {
  dimensions = normalizeDimensions(dimensions);
  measures = normalizeMeasures(measures);

  const selects = [];
  const queryMetadataSelect = [];
  const Filters = [];
  const roles = autoMapProjections(dimensions, measures, table);

  // Build projectionActiveItems and ordering
  // Build projectionActiveItems and ordering
  const projectionOrdering = {};
  const projectionActiveItems = {};
  Object.keys(roles).forEach(role => {
    projectionOrdering[role] = [];
    roles[role].forEach((item, idx) => {
      projectionOrdering[role].push(selects.length);
      projectionActiveItems[role] = [{ queryRef: item.queryRef, suppressConcat: false }];
    });
  });


  // Dimensions
  dimensions.forEach(dim => {
    const queryName = dim.isHierarchy && dim.aggFunc
      ? `${table}.${dim.field}.Variation.Date Hierarchy.${dim.aggFunc}`
      : Array.isArray(dim.field)
      ? dim.field[0].field
      : dim.field;

    selects.push(dim.isHierarchy && dim.aggFunc
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
                    PropertyVariationSource: { Expression: { SourceRef: { Entity: table } }, Name: "Variation", Property: dim.field }
                  },
                  Hierarchy: `Date Hierarchy`
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
          expr: { Column: { Expression: { SourceRef: { Entity: table } }, Property: dim.field } }
        });

    queryMetadataSelect.push({
      Restatement: dim.isHierarchy && dim.aggFunc ? dim.aggFunc: dim.field,
      Name: queryName,
      Type: dim.isHierarchy && dim.aggFunc ? 3 : 2048
    });

    Filters.push(dim.isHierarchy && dim.aggFunc
      ? { type: 2, expression: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { PropertyVariationSource: { Expression: { SourceRef: { Entity: table } }, Name: "Variation", Property: dim.field } }, Hierarchy: `Date Hierarchy` } }, Level: dim.aggFunc } } }
      : { type: 0, expression: { Column: { Expression: { SourceRef: { Entity: table } }, Property: dim.field } } });
  });

  // Measures
  measures.forEach(msr => {
    const name = `${msr.aggFunc}(${table}.${msr.field})`;
    selects.push({
      displayName: `${msr.aggFunc} of ${msr.field}`,
      queryName: name,
      roles: { Y: true },
      type: { category: null, underlyingType: 259 },
      expr: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: table } }, Property: msr.field } }, Function: 0 } }
    });

    queryMetadataSelect.push({ Restatement: `${msr.aggFunc} of ${msr.field}`, Name: name, Type: 1 });
    Filters.push({ type: 2, expression: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: table } }, Property: msr.field } }, Function: 0 } } });
  });

  return {
    qProperty: {
      projectionOrdering,
      projectionActiveItems,
      queryMetadata: { Select: queryMetadataSelect, Filters },
      visualElements: [
        { DataRoles: Object.keys(roles).map((role, index) => ({ Name: role, Projection: index, isActive: role === "Category" })) }
      ],
      selects
    }
  };
}



// const queryTemplate = (
//   table,
//   dimension,
//   measure,
//   isDateHierarchy = true,
//   hierarchyLevel 
// ) => {
//   const categorySelect = isDateHierarchy
//     ? {
//         HierarchyLevel: {
//           Expression: {
//             Hierarchy: {
//               Expression: {
//                 PropertyVariationSource: {
//                   Expression: { SourceRef: { Source: "s" } },
//                   Name: "Variation",
//                   Property: dimension.field
//                 }
//               },
//               Hierarchy: `${hierarchyLevel} Hierarchy`
//             }
//           },
//           Level: hierarchyLevel
//         },
//         Name: `${table}.${dimension.field}.Variation.Date Hierarchy.${hierarchyLevel}`,
//         NativeReferenceName: `${dimension.field} ${hierarchyLevel}`
//       }
//     : {
//         Column: {
//           Expression: { SourceRef: { Source: "s" } },
//           Property: dimension.field
//         },
//         Name: `${table}.${dimension.field}`,
//         NativeReferenceName: dimension.field
//       };

//   return {
//     qProperty: {
//       query: {
//         Commands: [
//           {
//             SemanticQueryDataShapeCommand: {
//               Query: {
//                 Version: 2,
//                 From: [{ Name: "s", Entity: table, Type: 0 }],
//                 Select: [
//                   categorySelect,
//                   {
//                     Aggregation: {
//                       Expression: {
//                         Column: {
//                           Expression: { SourceRef: { Source: "s" } },
//                           Property: measure.field
//                         }
//                       },
//                       Function: 0
//                     },
//                     Name: `${measure.aggFunc} of ${measure.field}`,
//                     NativeReferenceName: `${measure.aggFunc} of ${measure.field}`
//                   }
//                 ],
//                 OrderBy: [
//                   isDateHierarchy
//                     ? {
//                         Direction: 1,
//                         Expression: {
//                           HierarchyLevel: {
//                             Expression: {
//                               Hierarchy: {
//                                 Expression: {
//                                   PropertyVariationSource: {
//                                     Expression: { SourceRef: { Source: "s" } },
//                                     Name: "Variation",
//                                     Property: dimension.field
//                                   }
//                                 },
//                                 Hierarchy: `${hierarchyLevel} Hierarchy`
//                               }
//                             },
//                             Level: hierarchyLevel
//                           }
//                         }
//                       }
//                     : {
//                         Direction: 1,
//                         Expression: {
//                           Column: {
//                             Expression: { SourceRef: { Source: "s" } },
//                             Property: dimension.field
//                           }
//                         }
//                       }
//                 ]
//               },
//               Binding: {
//                 Primary: {
//                   Groupings: [{ Projections: [0, 1] }]
//                 },
//                 DataReduction: {
//                   DataVolume: 4,
//                   Primary: { Sample: {} }
//                 },
//                 Version: 1
//               },
//               ExecutionMetricsKind: 1
//             }
//           }
//         ]
//       }
//     }
//   };
// };

// // ------------------------------
// // SINGLE DIM + SINGLE MEASURE VERSION
// // ------------------------------

// const configTemplate = (
//   visualId,
//   x,
//   y,
//   width,
//   height,
//   visualType,
//   table,
//   dimension,  
//   measure,
//   isHierarchy = false,
//   hierarchyLevel 
//   //console.log("dimension", dimension)
// ) => {
// console.log("dimensionconsole.log", dimension)
//   // Category queryRef
//   const categoryQueryRef = isHierarchy
//     ? `${table}.${dimension.field}.Variation.${hierarchyLevel} Hierarchy.${hierarchyLevel}`
//     : `${table}.${dimension.field}`;

//   // Select object for category
//   const categorySelect = isHierarchy
//     ? {
//         HierarchyLevel: {
//           Expression: {
//             Hierarchy: {
//               Expression: {
//                 PropertyVariationSource: {
//                   Expression: { SourceRef: { Source: "s" } },
//                   Name: "Variation",
//                   Property: dimension.field
//                 }
//               },
//               Hierarchy: `${hierarchyLevel} Hierarchy`
//             }
//           },
//           Level: hierarchyLevel
//         },
//         Name: categoryQueryRef,
//         NativeReferenceName: `${dimension.field} ${hierarchyLevel}`
//       }
//     : {
//         Column: {
//           Expression: { SourceRef: { Source: "s" } },
//           Property: dimension.field
//         },
//         Name: categoryQueryRef,
//         NativeReferenceName: dimension.field
//       };

//   const measureName = `${measure.aggFunc}(${table}.${measure.field})`;

//   return {
//     qProperty: {
//       name: visualId,
//       layouts: [
//         {
//           id: 0,
//           position: { x, y, width, height, z: 0 }
//         }
//       ],
//       singleVisual: {
//         visualType,
//         projections: {
//           Category: [{ queryRef: categoryQueryRef, active: true }],
//           Y: [{ queryRef: measureName }]
//         },
//         prototypeQuery: {
//           Version: 2,
//           From: [{ Name: "s", Entity: table, Type: 0 }],
//           Select: [
//             categorySelect,
//             {
//               Aggregation: {
//                 Expression: {
//                   Column: {
//                     Expression: { SourceRef: { Source: "s" } },
//                     Property: measure.field
//                   }
//                 },
//                 Function: 0
//               },
//               Name: measureName,
//               NativeReferenceName: `${measure.aggFunc} of ${measure.field}`
//             }
//           ],
//           OrderBy: [
//             isHierarchy
//               ? {
//                   Direction: 1,
//                   Expression: {
//                     HierarchyLevel: {
//                       Expression: {
//                         Hierarchy: {
//                           Expression: {
//                             PropertyVariationSource: {
//                               Expression: { SourceRef: { Source: "s" } },
//                               Name: "Variation",
//                               Property: dimension.field
//                             }
//                           },
//                           Hierarchy: `${hierarchyLevel} Hierarchy`
//                         }
//                       },
//                       Level: hierarchyLevel
//                     }
//                   }
//                 }
//               : {
//                   Direction: 1,
//                   Expression: {
//                     Column: {
//                       Expression: { SourceRef: { Source: "s" } },
//                       Property: dimension.field
//                     }
//                   }
//                 }
//           ]
//         },
//         drillFilterOtherVisuals: true,
//         hasDefaultSort: true
//       }
//     }
//   };
// };




// const dataTransformsTemplate = (
//   table,
//   dimension,
//   measure,  
//   isDateHierarchy = true,
//   hierarchyLevel 
// ) => {
//   const categoryQueryRef = isDateHierarchy
//     ? `${table}.${dimension.field}.Variation.${hierarchyLevel} Hierarchy.${hierarchyLevel}`
//     : `${table}.${dimension.field}`;

//   const categorySelect = isDateHierarchy
//     ? { Name: categoryQueryRef, Restatement: hierarchyLevel, Type: 3, Format: "0" }
//     : { Name: categoryQueryRef, Restatement: dimension.field };

//   const categoryFilter = isDateHierarchy
//     ? {
//         type: 2,
//         expression: {
//           HierarchyLevel: {
//             Expression: {
//               Hierarchy: {
//                 Expression: {
//                   PropertyVariationSource: {
//                     Expression: { SourceRef: { Entity: table } },
//                     Name: "Variation",
//                     Property: dimension.field
//                   }
//                 },
//                 Hierarchy: `${hierarchyLevel} Hierarchy`
//               }
//             },
//             Level: hierarchyLevel
//           }
//         }
//       }
//     : { type: 2, expression: { Column: { Expression: { SourceRef: { Entity: table } }, Property: dimension.field } } };

//   const categorySelectExpr = isDateHierarchy
//     ? {
//         displayName: hierarchyLevel,
//         format: "0",
//         queryName: categoryQueryRef,
//         roles: { Category: true },
//         type: { category: "Years", underlyingType: 66308 },
//         expr: {
//           HierarchyLevel: {
//             Expression: {
//               Hierarchy: {
//                 Expression: {
//                   PropertyVariationSource: {
//                     Expression: { SourceRef: { Entity: table } },
//                     Name: "Variation",
//                     Property: dimension.field
//                   }
//                 },
//                 Hierarchy: `${hierarchyLevel} Hierarchy`
//               }
//             },
//             Level: hierarchyLevel
//           }
//         }
//       }
//     : {
//         displayName: dimension.field,
//         queryName: categoryQueryRef,
//         roles: { Category: true },
//         type: { category: null, underlyingType: 259 },
//         expr: { Column: { Expression: { SourceRef: { Entity: table } }, Property: dimension.field } }
//       };

//   return {
//     qProperty: {
//       dataTransforms: {
//         projectionOrdering: { Category: [0], Y: [1] },
//         projectionActiveItems: { Category: [{ queryRef: categoryQueryRef, suppressConcat: false }] },
//         queryMetadata: {
//           Select: [
//             { Name: `${measure.aggFunc} of ${measure.field}`, Restatement: `${measure.aggFunc} of ${measure.field}`, Type: 1 },
//             categorySelect
//           ],
//           Filters: [
//             categoryFilter,
//             { type: 2, expression: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: table } }, Property: measure.field } }, Function: 0 } } }
//           ]
//         },
//         visualElements: [
//           { DataRoles: [{ Name: "Category", Projection: 0, isActive: true }, { Name: "Y", Projection: 1, isActive: false }] }
//         ],
//         selects: [
//           categorySelectExpr,
//           {
//             displayName: `${measure.aggFunc} of ${measure.field}`,
//             queryName: `${measure.aggFunc} of ${measure.field}`,
//             roles: { Y: true },
//             type: { category: null, underlyingType: 259 },
//             expr: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: table } }, Property: measure.field } }, Function: 0 } }
//           }
//         ]
//       }
//     }
//   };
// };


module.exports = { configTemplate, queryTemplate, dataTransformsTemplate};
