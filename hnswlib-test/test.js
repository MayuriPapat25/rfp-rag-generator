// test.js
const { HNSWLib } = require("hnswlib-node");
console.log("hnswlib-node imported successfully!");

async function testHNSW() {
  try {
    const dim = 128; // Example dimension
    const maxElements = 1000;
    const space = "l2"; // Example space
    const efConstruction = 100;
    const M = 16;

    const index = new HNSWLib(space, dim);
    await index.initIndex(maxElements, efConstruction, M);
    console.log("HNSWLib index initialized successfully!");
    // You can add data and search here if needed
  } catch (e) {
    console.error("Error initializing HNSWLib:", e);
  }
}

testHNSW();
