const mainLayout = () =>{
return{
  "qProperty":{
        "id": 0,
        "filters": "[{\"name\":\"a715ca483704125817ca\",\"expression\":{\"Column\":{\"Expression\":{\"SourceRef\":{\"Entity\":\"Input Parameter\"}},\"Property\":\"Input Parameter\"}},\"type\":\"Categorical\",\"howCreated\":1,\"objects\":{\"general\":[{\"properties\":{}}]}}]",
        "resourcePackages": [
          {
            "resourcePackage": {
              "name": "SharedResources",
              "type": 2,
              "items": [
                {
                  "type": 202,
                  "path": "BaseThemes/CY24SU10.json",
                  "name": "CY24SU10"
                }
              ],
              "disabled": false
            }
          }
        ],
        "sections": [
          {
            "name": "c8580b5b7440bc0056d4",
            "displayName": "Page 1",
            "filters": "[]",
            "ordinal": 0,
            "visualContainers": [],
            "config": "{\"objects\":{\"outspacePane\":[{\"properties\":{\"width\":{\"expr\":{\"Literal\":{\"Value\":\"244L\"}}}}}]}}",
            "displayOption": 1,
            "width": 1280,
            "height": 720
          }
        ],
        "config": "{\"version\":\"5.66\",\"themeCollection\":{\"baseTheme\":{\"name\":\"CY24SU10\",\"type\":2,\"version\":{\"visual\":\"1.8.97\",\"report\":\"2.0.97\",\"page\":\"1.3.97\"}}},\"activeSectionIndex\":0,\"defaultDrillFilterOtherVisuals\":true,\"linguisticSchemaSyncVersion\":2,\"settings\":{\"useNewFilterPaneExperience\":true,\"allowChangeFilterTypes\":true,\"useStylableVisualContainerHeader\":true,\"queryLimitOption\":6,\"exportDataMode\":1,\"useDefaultAggregateDisplayName\":true,\"useEnhancedTooltips\":true},\"objects\":{\"section\":[{\"properties\":{\"verticalAlignment\":{\"expr\":{\"Literal\":{\"Value\":\"'Top'\"}}}}}],\"outspacePane\":[{\"properties\":{\"expanded\":{\"expr\":{\"Literal\":{\"Value\":\"true\"}}}}}]}}",
        "layoutOptimization": 0,
        "pods": [
          {
            "name": "6095943a96be4ce4f5eb",
            "boundSection": "c8580b5b7440bc0056d4",
            "config": "{}"
          }
        ]
      }
    }
}

module.exports = {mainLayout};

