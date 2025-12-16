const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

function createPBIT(twbFileName, password = null) {
  return new Promise((resolve, reject) => {
    const templateFolder = path.join(__dirname, "Template");
    const outputPBIT = path.join(__dirname, `${twbFileName}.pbit`);

    if (!fs.existsSync(templateFolder)) {
      return reject("Template folder does not exist!");
    }

    const output = fs.createWriteStream(outputPBIT);

    // Archive options matching 7-Zip GUI:
    const archiveOptions = {
      zlib: { level: 5 },           // compression level 5 (Normal)
      forceLocalTime: true,         // closer to 7-zip timestamp behavior
      forceZip64: false             // 7-zip defaults unless file >4GB
    };

    // Create archive
    const archive = archiver("zip", archiveOptions);

    // OPTIONAL: ZipCrypto encryption (only if password provided)
    if (password) {
      archive.encrypt({
        password,
        method: "zipcrypto"         // matches your screenshot
      });
    }

    output.on("close", () => {
      console.log(`✅ PBIT created: ${outputPBIT} (${archive.pointer()} bytes)`);
      resolve(outputPBIT);
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") console.warn(err);
      else reject(err);
    });

    archive.on("error", (err) => reject(err));

    archive.pipe(output);

    // Add folder contents (relative path mode)
    archive.directory(templateFolder, false);

    archive.finalize();
  });
}

module.exports = createPBIT;


// const fs = require("fs");
// const path = require("path");
// const archiver = require("archiver");

// function createPBIT() {
//   return new Promise((resolve, reject) => {
//     const templateFolder = path.join(__dirname, "Template");
//     const outputPBIT = path.join(__dirname, "Final.pbit");

//     if (!fs.existsSync(templateFolder)) {
//       return reject("Template folder does not exist!");
//     }

//     const output = fs.createWriteStream(outputPBIT);
//     const archive = archiver("zip", { zlib: { level: 5 } });

//     output.on("close", () => {
//       console.log(`✅ PBIT file created: ${outputPBIT} (${archive.pointer()} bytes)`);
//       resolve(outputPBIT);
//     });

//     archive.on("warning", (err) => {
//       if (err.code === "ENOENT") console.warn(err);
//       else reject(err);
//     });

//     archive.on("error", (err) => reject(err));

//     archive.pipe(output);
//     archive.directory(templateFolder, false); // compress folder contents
//     archive.finalize();
//   });
// }

// module.exports = createPBIT;
