const tableTemplate = (tableName, generateGuid) =>{
return {
    "qProperty":{
        "name": generateGuid(),
        "compatibilityLevel": 1550,
        "model": {
            "culture": "en-US",
            "dataAccessOptions": {
            "legacyRedirects": true,
            "returnErrorValuesAsNull": true
            },
            "defaultPowerBIDataSourceVersion": "powerBI_V3",
            "sourceQueryCulture": "en-US",
            "tables": [
            {
                "name": tableName,
                "lineageTag": generateGuid(),
                "columns": [],
                "partitions": [],
                "annotations": [
                {
                    "name": "PBI_ResultType",
                    "value": "Table"
                }
                ]
            },
            {
                "name": "DateTableTemplate_7a43041b-944f-4ca7-93e0-ce21e6e3b380",
                "isHidden": true,
                "isPrivate": true,
                "lineageTag": "8fb5f490-a883-4b95-9660-09bef4e22f62",
                "columns": [
                {
                    "type": "calculatedTableColumn",
                    "name": "Date",
                    "dataType": "dateTime",
                    "isNameInferred": true,
                    "isHidden": true,
                    "sourceColumn": "[Date]",
                    "formatString": "General Date",
                    "lineageTag": "4c4d6c4d-314e-43e4-8af1-067f58a7747c",
                    "dataCategory": "PaddedDateTableDates",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    }
                    ]
                },
                {
                    "type": "calculated",
                    "name": "Year",
                    "dataType": "int64",
                    "isHidden": true,
                    "expression": "YEAR([Date])",
                    "formatString": "0",
                    "lineageTag": "58e0a2b5-623d-47ae-af79-93e6bbbf5313",
                    "dataCategory": "Years",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    },
                    {
                        "name": "TemplateId",
                        "value": "Year"
                    }
                    ]
                },
                {
                    "type": "calculated",
                    "name": "MonthNo",
                    "dataType": "int64",
                    "isHidden": true,
                    "expression": "MONTH([Date])",
                    "formatString": "0",
                    "lineageTag": "11927ffe-4c77-41ad-87b4-162c9a1356e2",
                    "dataCategory": "MonthOfYear",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    },
                    {
                        "name": "TemplateId",
                        "value": "MonthNumber"
                    }
                    ]
                },
                {
                    "type": "calculated",
                    "name": "Month",
                    "dataType": "string",
                    "isHidden": true,
                    "expression": "FORMAT([Date], \"MMMM\")",
                    "sortByColumn": "MonthNo",
                    "lineageTag": "13c1dedb-3578-472a-9b7c-ea9b3fae56bb",
                    "dataCategory": "Months",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    },
                    {
                        "name": "TemplateId",
                        "value": "Month"
                    }
                    ]
                },
                {
                    "type": "calculated",
                    "name": "QuarterNo",
                    "dataType": "int64",
                    "isHidden": true,
                    "expression": "INT(([MonthNo] + 2) / 3)",
                    "formatString": "0",
                    "lineageTag": "f4922c53-53b1-4e68-866b-20b12b69ba3e",
                    "dataCategory": "QuarterOfYear",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    },
                    {
                        "name": "TemplateId",
                        "value": "QuarterNumber"
                    }
                    ]
                },
                {
                    "type": "calculated",
                    "name": "Quarter",
                    "dataType": "string",
                    "isHidden": true,
                    "expression": "\"Qtr \" & [QuarterNo]",
                    "sortByColumn": "QuarterNo",
                    "lineageTag": "10b5a568-16e5-4004-90e7-16e47d90b8ed",
                    "dataCategory": "Quarters",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    },
                    {
                        "name": "TemplateId",
                        "value": "Quarter"
                    }
                    ]
                },
                {
                    "type": "calculated",
                    "name": "Day",
                    "dataType": "int64",
                    "isHidden": true,
                    "expression": "DAY([Date])",
                    "formatString": "0",
                    "lineageTag": "8640b4db-c0de-4df5-a8e5-996c06f2fdd6",
                    "dataCategory": "DayOfMonth",
                    "summarizeBy": "none",
                    "annotations": [
                    {
                        "name": "SummarizationSetBy",
                        "value": "User"
                    },
                    {
                        "name": "TemplateId",
                        "value": "Day"
                    }
                    ]
                }
                ],
                "partitions": [
                {
                    "name": "DateTableTemplate_7a43041b-944f-4ca7-93e0-ce21e6e3b380",
                    "mode": "import",
                    "source": {
                    "type": "calculated",
                    "expression": "Calendar(Date(2015,1,1), Date(2015,1,1))"
                    }
                }
                ],
                "hierarchies": [
                {
                    "name": "Date Hierarchy",
                    "lineageTag": "9dcb782f-a877-4a8d-a66e-9a1c097e4c37",
                    "levels": [
                    {
                        "name": "Year",
                        "ordinal": 0,
                        "column": "Year",
                        "lineageTag": "310fd7c3-539a-440e-9c42-e189be889221"
                    },
                    {
                        "name": "Quarter",
                        "ordinal": 1,
                        "column": "Quarter",
                        "lineageTag": "2b541318-bdb6-4e8b-af45-55af0ad0ef7b"
                    },
                    {
                        "name": "Month",
                        "ordinal": 2,
                        "column": "Month",
                        "lineageTag": "015d9b9b-bb3a-456d-ac5a-1982a43041a3"
                    },
                    {
                        "name": "Day",
                        "ordinal": 3,
                        "column": "Day",
                        "lineageTag": "1d729b0a-3fc1-4189-9511-81bb24134072"
                    }
                    ],
                    "annotations": [
                    {
                        "name": "TemplateId",
                        "value": "DateHierarchy"
                    }
                    ]
                }
                ],
                "annotations": [
                {
                    "name": "__PBI_TemplateDateTable",
                    "value": "true"
                },
                {
                    "name": "DefaultItem",
                    "value": "DateHierarchy"
                }
                ]
            }
            ],
            "relationships": [
            
            ],
            "cultures": [
                {
                    "name": "en-US",
                    "linguisticMetadata": {
                    "content": {
                        "Version": "1.0.0",
                        "Language": "en-US"
                    },
                    "contentType": "json"
                    }
                }
            ],
            "annotations": [
            {
                "name": "PBI_QueryOrder",
                "value": `[\"${tableName}\"]`
            },
            {
                "name": "__PBI_TimeIntelligenceEnabled",
                "value": "1"
            },
            {
                "name": "PBIDesktopVersion",
                "value": "2.146.1133.0 (25.08)+c8010d55d1db76eda03c968b03481610e96a1ef7"
            }
            ]
        }
},
    "qChildren": []
}
}

const tablecolumn = (name, dataType, sourceColumn, lineageTag, summarizeBy) => {
  // Start building the object
  const col = {
    name: name,
    dataType: dataType,
    sourceColumn: sourceColumn,
    // Add formatString immediately after sourceColumn if int64
    ...(dataType === "int64" && { formatString: "0" }),
    lineageTag: lineageTag,
    summarizeBy: summarizeBy,
    annotations: [
      {
        name: "SummarizationSetBy",
        value: "Automatic"
      },
      // Add PBI_FormatHint if double
      ...(dataType === "double" ? [{
        name: "PBI_FormatHint",
        value: "{\"isGeneralNumber\":true}"
      }] : [])
    ]
  };

  return {
    qProperty: col,
    qChildren: []
  };
};


const datecolumn = (name, dataType, sourceColumn, formatString, lineageTag, summarizeBy, relationshipId, localId) =>{
  return{
    "qProperty":{
            "name": name,
            "dataType": dataType,
            "sourceColumn": sourceColumn,
            "formatString": formatString,
            "lineageTag": lineageTag,
            "summarizeBy": summarizeBy,
            "variations": [
              {
                "name": "Variation",
                "relationship": relationshipId,
                "defaultHierarchy": {
                  "table": localId,
                  "hierarchy": "Date Hierarchy"
                },
                "isDefault": true
              }
            ],
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "Automatic"
              },
              {
                "name": "UnderlyingDateTimeDataType",
                "value": "Date"
              }
            ]
          },
          "qChildren":[]   
  }

}

const partitions = (tableName, dbName, server)=>{
    return{
        "qProperty":{            
            "name": tableName,
            "mode": "import",
            "source": {
              "type": "m",
              "expression": [
                 "let",
                `    Source = Odbc.DataSource("dsn=PostgreSQL35W", [HierarchicalNavigation=true]),`,
                `    ${dbName}_Database = Source{[Name="${dbName}",Kind="Database"]}[Data],`,
                `    public_Schema = ${dbName}_Database{[Name="public",Kind="Schema"]}[Data],`,
                `    ${tableName}_Table = public_Schema{[Name="${tableName}",Kind="Table"]}[Data]`,
                "in",                
                `  ${tableName}_Table`
              ]
            }
          
        },
        "qchildren":[]
    }
}

const localtable = (localId, tableName, dateColumn, generateGuid ) =>{
    return{
        "qProperty" :{
        "name": localId,
        "isHidden": true,
        "showAsVariationsOnly": true,
        "lineageTag": generateGuid(),
        "columns": [
          {
            "type": "calculatedTableColumn",
            "name": "Date",
            "dataType": "dateTime",
            "isNameInferred": true,
            "isHidden": true,
            "sourceColumn": "[Date]",
            "formatString": "General Date",
            "lineageTag": generateGuid(),
            "dataCategory": "PaddedDateTableDates",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              }
            ]
          },
          {
            "type": "calculated",
            "name": "Year",
            "dataType": "int64",
            "isHidden": true,
            "expression": "YEAR([Date])",
            "formatString": "0",
            "lineageTag": generateGuid(),
            "dataCategory": "Years",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              },
              {
                "name": "TemplateId",
                "value": "Year"
              }
            ]
          },
          {
            "type": "calculated",
            "name": "MonthNo",
            "dataType": "int64",
            "isHidden": true,
            "expression": "MONTH([Date])",
            "formatString": "0",
            "lineageTag": generateGuid(),
            "dataCategory": "MonthOfYear",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              },
              {
                "name": "TemplateId",
                "value": "MonthNumber"
              }
            ]
          },
          {
            "type": "calculated",
            "name": "Month",
            "dataType": "string",
            "isHidden": true,
            "expression": "FORMAT([Date], \"MMMM\")",
            "sortByColumn": "MonthNo",
            "lineageTag": generateGuid(),
            "dataCategory": "Months",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              },
              {
                "name": "TemplateId",
                "value": "Month"
              }
            ]
          },
          {
            "type": "calculated",
            "name": "QuarterNo",
            "dataType": "int64",
            "isHidden": true,
            "expression": "INT(([MonthNo] + 2) / 3)",
            "formatString": "0",
            "lineageTag": generateGuid(),
            "dataCategory": "QuarterOfYear",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              },
              {
                "name": "TemplateId",
                "value": "QuarterNumber"
              }
            ]
          },
          {
            "type": "calculated",
            "name": "Quarter",
            "dataType": "string",
            "isHidden": true,
            "expression": "\"Qtr \" & [QuarterNo]",
            "sortByColumn": "QuarterNo",
            "lineageTag": generateGuid(),
            "dataCategory": "Quarters",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              },
              {
                "name": "TemplateId",
                "value": "Quarter"
              }
            ]
          },
          {
            "type": "calculated",
            "name": "Day",
            "dataType": "int64",
            "isHidden": true,
            "expression": "DAY([Date])",
            "formatString": "0",
            "lineageTag": generateGuid(),
            "dataCategory": "DayOfMonth",
            "summarizeBy": "none",
            "annotations": [
              {
                "name": "SummarizationSetBy",
                "value": "User"
              },
              {
                "name": "TemplateId",
                "value": "Day"
              }
            ]
          }
        ],
        "partitions": [
          {
            "name": localId,
            "mode": "import",
            "source": {
              "type": "calculated",
              "expression": `Calendar(Date(Year(MIN('${tableName}'[${dateColumn}])), 1, 1), Date(Year(MAX('${tableName}'[${dateColumn}])), 12, 31))`
            }
          }
        ],
        "hierarchies": [
          {
            "name": "Date Hierarchy",
            "lineageTag": "5e50dd9a-7bbd-4d8b-9d2f-ae8a7e2c3253",
            "levels": [
              {
                "name": "Year",
                "ordinal": 0,
                "column": "Year",
                "lineageTag": generateGuid()
              },
              {
                "name": "Quarter",
                "ordinal": 1,
                "column": "Quarter",
                "lineageTag": generateGuid()
              },
              {
                "name": "Month",
                "ordinal": 2,
                "column": "Month",
                "lineageTag": generateGuid()
              },
              {
                "name": "Day",
                "ordinal": 3,
                "column": "Day",
                "lineageTag": generateGuid()
              }
            ],
            "annotations": [
              {
                "name": "TemplateId",
                "value": "DateHierarchy"
              }
            ]
          }
        ],
        "annotations": [
          {
            "name": "__PBI_LocalDateTable",
            "value": "true"
          }
        ]
      },
        "qChildren" :{

        }
    }
}

const relationship = (localId, tableName, dateColumn, relationshipId) =>{
    return{
        "qProperty":{            
        "name": relationshipId,
        "fromTable": tableName,
        "fromColumn": dateColumn,
        "toTable": localId,
        "toColumn": "Date",
        "joinOnDateBehavior": "datePartOnly"      
        },
        "qChildren":[]
    }
}

const variations = (relationshipId, localId )=>{
    return{
        
                "name": "Variation",
                "relationship": relationshipId,
                "defaultHierarchy": {
                  "table": localId,
                  "hierarchy": "Date Hierarchy"
                },
                "isDefault": true
              }
    }

module.exports = {
  tablecolumn,
  tableTemplate,
  partitions,
  localtable,
  relationship,
  variations,
  datecolumn
}