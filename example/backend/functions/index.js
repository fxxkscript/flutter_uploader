const path = require("path");
const os = require("os");
const fs = require("fs");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");

exports.upload = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const uploads = [];
    const methods = ["POST", "PUT", "PATCH"];
    if (!methods.includes(req.method, 0)) {
      return res.status(405).json({
        errorMessage: "Method is not allowed"
      });
    }

    const busboy = new Busboy({ headers: req.headers });

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log("File [" + fieldname + "]: filename: " + filename);
      file.on("data", data => {
        console.log("File [" + fieldname + "] got " + data.length + " bytes");
      });
      file.on("end", () => {
        console.log("File [" + fieldname + "] Finished");
      });

      const filepath = path.join(os.tmpdir(), filename);
      uploads.push({
        file: filepath,
        fieldname: fieldname,
        filename: filename,
        mimetype: mimetype,
        encoding: encoding
      });
      console.log(`Saving '${fieldname}' to ${filepath}`);
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
      console.log("Field [" + fieldname + "]: value: " + val);
    });
    busboy.on("finish", () => {
      res.status(200).json({
        message: "Successfully uploaded"
      });
      res.end();
    });
    busboy.on("error", error => {
      res.status(500).json({
        errorMessage: error.toString(),
        error: error
      });
      res.end();
    });
    busboy.end(req.rawBody);
    req.pipe(busboy);
  });
});
