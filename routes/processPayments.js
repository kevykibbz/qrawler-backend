const admin = require("firebase-admin");
const fs = require("fs");
const serviceAccount = require("../keys/serviceAccount.json");
var express = require("express");
var router = express.Router();
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_NAME,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

router.get("/:cutstomTransactionId", function (req, res, next) {
  res.send("Server is working.");
});

router.post("/:cutstomTransactionId", async function (req, res, next) {
  const customTransactionId = req.params.cutstomTransactionId;
  if (customTransactionId != "") {
    const amount=Number(req.body.updatedEntryDetails.Amount)
    const resultCode=req.body.updatedEntryDetails.ResultCode
    const checkoutRequestId=req.body.updatedEntryDetails.CheckoutRequestID
    const phone=req.body.updatedEntryDetails.Phone
    const receipt=req.body.updatedEntryDetails.Receipt
    const mEntryDetails = {
      MerchantRequestID: req.body.updatedEntryDetails.MerchantRequestID,
      CheckoutRequestID: checkoutRequestId,
      CustomTransactionID: customTransactionId,
      ResultCode: resultCode,
      Receipt:receipt ,
      Phone:phone,
      Amount: amount,
      TransactionDate: new Date(),
      Status: req.body.updatedEntryDetails.Status,
    };
    await db
      .collection("payments")
      .doc(customTransactionId)
      .get()
      .then(async (doc) => {
        if (doc.exists) {
          const userId = doc.data().UserId;
          await db
            .collection("payments")
            .doc(customTransactionId)
            .update(mEntryDetails)
            .then(async () => {
              if (resultCode == 0) {
                await db
                .collection("users")
                .doc(userId)
                .collection("payments")
                .doc(checkoutRequestId)
                .set({
                  Amount:amount,
                  TransactionDate:new Date(), 
                  Package: amount === 2000 ? "Lite" : "Pro",
                  ResultCode:resultCode,
                  Phone:phone,
                  Receipt:receipt,
                  CheckoutRequestId:checkoutRequestId
                });
                await db
                  .collection("users")
                  .doc(userId)
                  .update({
                    IsAccountActive: true,
                    HasPaid: true,
                    Package: amount === 2000 ? "Lite" : "Pro",
                    TransactionDate: new Date(),
                    Amount: amount,
                  })
                  .then(() => {
                    fs.appendFile(
                      "Payments.log",
                      JSON.stringify(mEntryDetails),
                      (err) => {
                        if (err) {
                          console.log("Error ocurred while writing file", err);
                        } else {
                          console.log("File written successfully.");
                          // Upload the file to Firebase Storage
                          const filePath = "Payments.log";
                          const destination = "Qrawler/Payments.log";
                          const options = {
                            destination,
                            metadata: { contentType: "text/plain" },
                          };

                          bucket.upload(
                            filePath,
                            options,
                            (err, uploadedFile) => {
                              if (err) {
                                console.error(
                                  "Error occurred while uploading file to Firebase Storage:",
                                  err
                                );
                              } else {
                                console.log(
                                  "File uploaded to Firebase Storage:",
                                  uploadedFile.name
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  })
                  .catch(() => {
                    console.log(`error:${error}`);
                  });
              }
            })
            .catch((error) => {
              console.log(`error:${error}`);
            });
        } else {
          console.log("Document doesnt exists.");
        }
      })
      .catch((error) => {
        console.log(`error:${error}`);
      });
  } else {
    res.status(400).json({
      Error: 400,
      Message:
        "Kindly check your post data.Make sure it has transactionId field set.",
    });
  }
  return res.json("Data received successfully.");
});

module.exports = router;
