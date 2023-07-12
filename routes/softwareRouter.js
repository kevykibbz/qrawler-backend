const admin = require("firebase-admin");
var express = require("express");
var router = express.Router();

const db = admin.firestore();

router.get("/data", async (req, res, next)=> {
  try {
    const snapshot = await db.collection("software").get();

    if (snapshot.empty) {
      res.status(400).json({
        Error: 400,
        Message: "No matching document found",
      });
      return null;
    }

    // Assuming there is only one user with the provided email
    const data = snapshot.docs[0].data();
    res.send(data);
  } catch (error) {
    res.status(400).json({
      Error: 400,
      Message: "Uknown error ocurred",
    });
    throw error;
  }
});

module.exports = router;
