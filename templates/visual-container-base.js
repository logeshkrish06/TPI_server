const dynamicLayout = (() => {
  let counter = 0;          
  let xCounter = 10;        

  return (config, query, dataTransforms, filters) => {
    const currentX = xCounter;
    xCounter += 270;
    //console.log("filterFinal", filters)  // should now log the full structure

    return {
      qProperty: {
        x: currentX,
        y: 0,
        z: counter++,
        width: 270.4461942257218,
        height: 268.76640419947506,
        config,
        filters,
        query,
        dataTransforms
        //filters  // assign the array as-is
      }
    };
  };
})();





module.exports = { dynamicLayout};




