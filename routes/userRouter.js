const admin = require("firebase-admin");
var express = require("express");
var router = express.Router();

const db = admin.firestore();

/* GET users listing. */
router.get("/:softwareId", async(req, res, next)=>{
  const SoftwareId = req.params.softwareId;
  if (SoftwareId != "") {
    try {
      const snapshot = await db
        .collection("users")
        .where("SoftwareId", "==", SoftwareId)
        .get();

      if (snapshot.empty) {
        res.status(400).json({
          Error: 400,
          Message: "No matching document found",
        });
        return null;
      }

      // Assuming there is only one user with the provided email
      const user = snapshot.docs[0].data();
      res.send(user);
    } catch (error) {
      res.status(400).json({
        Error: 400,
        Message: "Uknown error ocurred",
      });
      throw error;
    }
  } else {
    res.status(400).json({
      Error: 400,
      Message: "Sofware id is missing in the query string.",
    });
  }
});

module.exports = router;
