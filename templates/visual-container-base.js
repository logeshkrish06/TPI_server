const dynamicLayout = (() => {
  let counter = 0;          // z counter
  let xCounter = 10;        // starting x value

  return (config, query, dataTransforms) => {
    const currentX = xCounter;  // store before incrementing
    xCounter += 270;            // increase by 270 each call

    return {
      qProperty: {
        x: currentX,
        y: 0,
        z: counter++,
        width: 270.4461942257218,
        height: 268.76640419947506,
        config,
        filters: "[]",
        query,
        dataTransforms
      }
    };
  };
})();



module.exports = { dynamicLayout};




