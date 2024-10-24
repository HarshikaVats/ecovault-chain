"use strict";

import cors from "cors";

// Imports dependencies and set up http server
import axios from "axios";
import request from "request";
import express from "express";
import bodyParser from "body-parser";

import DescopeClient from "@descope/node-sdk";

const app = express().use(bodyParser.json());

app.use(cors());
app.listen(process.env.PORT || 2425, () =>
  console.log("Application is running 🏃‍🏃‍🏃‍🏃‍♂️")
);

let descopeClient;

try {
  descopeClient = DescopeClient({
    projectId: "P2nCws5VQkucwCVqAiCdzLWjr9QW",
    managementKey: process.env.DESCOPE_MGMT_KEY,
  });
} catch (error) {
  console.log("failed to initialize: " + error);
}

app.get("/", async (req, res) => {
  res
    .status(200)
    .send("We are going to win the IBM Call for Code 2024 Challenge 🥇");
});

// this will be done for the brands that are trying to register on the website
app.get("/checkUser", async (req, res) => {
  const userID = req.query.userID;
  console.log("User ID is: " + userID);

  const token = req.headers["authorization"];
  console.log("Token is: " + token);

  // restricting unauthorized users
  if (token == undefined || token.split(" ")[1] !== process.env.BEARER_TOKEN) {
    res.status(400).send("No Authorization header");
  }

  // only allowing authorized users
  else {
    try {
      const userData = await descopeClient.management.user.load(userID);
      if (userData.data === undefined) {
        console.log("LINE 107");
        res.status(200).send({ result: false });
      } else {
        console.log("SUCCESS, line 111");
        res.status(200).send({ result: true });
      }
    } catch (err) {
      console.log("ERROR, line 115");
      res.status(200).send({ result: false });
    }
  }
});

app.post("/sendOTP", async (req, res) => {
  const body = req.body;

  const user = { name: body.name, phone: body.phone, email: body.email };

  const loginId = body.email;
  const deliveryMethod = "email";

  const resp = await descopeClient.otp.signUp[deliveryMethod](loginId, user);
  if (resp.ok) {
    console.log(resp.data.maskedEmail);
    res.send({ result: `Sent the OTP to ${resp.data.maskedEmail}` });
  } else {
    console.log(resp.error.errorDescription);
    res.send({ error: resp.error.errorDescription });
  }
});

app.post("/verifyOTP", async (req, res) => {
  // if the OTP is wrongly entered, then the OTP gets expired
  const otp = req.body.otp;
  const loginId = req.body.email;

  const resp = await descopeClient.otp.verify["email"](loginId, otp);

  if (resp.ok) {
    // updating the custom attributes for the user
    let addCustomAtrributes =
      await descopeClient.management.user.updateCustomAttribute(
        loginId,
        "buyerDob",
        req.body.buyerDob
      );
    addCustomAtrributes =
      await descopeClient.management.user.updateCustomAttribute(
        loginId,
        "buyerGender",
        req.body.buyerGender
      );
    addCustomAtrributes =
      await descopeClient.management.user.updateCustomAttribute(
        loginId,
        "buyerAgeGroup",
        req.body.buyerAgeGroup
      );
    addCustomAtrributes =
      await descopeClient.management.user.updateCustomAttribute(
        loginId,
        "buyerInterests",
        req.body.buyerInterests
      );

    if (req.body.name) {
      // await descopeClient.management.user.updateDisplayName(loginId, "givenName", req.body.name)
    }
    if (req.body.privateKey) {
      addCustomAtrributes =
        await descopeClient.management.user.updateCustomAttribute(
          loginId,
          "wallet",
          req.body.privateKey
        );
    }

    if (addCustomAtrributes.ok) {
      // adding the role
      const addRole = await descopeClient.management.user.addRoles(loginId, [
        "Buyer",
      ]);
      if (addRole.ok) {
        res.send({ result: "Added custom attributes and role!!" });
        console.log("Added the role");
      } else console.log({ error: addRole.error.errorDescription });
      console.log("Modified the custom attribute successfully");
    } else console.log({ error: addCustomAtrributes.error.errorDescription });
  } else res.send({ error: resp.error.errorDescription });
});

app.post("/loginWithOTP", async (req, res) => {
  const body = req.body;

  const loginId = body.phone;
  const deliveryMethod = "sms";

  const loginOptions = {
    templateOptions: { templateName: "Ennovation OTP" },
  };

  const resp = await descopeClient.otp.signIn[deliveryMethod](
    loginId,
    loginOptions
  );
  console.log(resp);
  if (resp.ok) res.send({ result: "Success" });
  else res.send({ result: resp.error.errorDescription });
});

app.post("/verifyWithOTP", async (req, res) => {
  const otp = req.body.otp;
  const loginId = req.body.phone;

  const resp = await descopeClient.otp.verify["sms"](loginId, otp);

  if (resp.ok) res.send({ result: "Success" });
  else res.send({ error: resp.error.errorDescription });
});

// for the theta2024 event (getting the wallet privateKey from descope)
app.post("/getWallet", async (req, res) => {
  console.log("--- Get Wallet endpoint ---");
  try {
    let role;
    if (req.body.role == undefined) role = "Buyer";
    else role = "Seller";

    let userDetails;
    let matchingUsers;

    if (role == "Buyer") {
      console.log("Buyer is there: ", req.body.email);
      userDetails = await descopeClient.management.user.search({
        emails: [req.body.email],
      });

      matchingUsers = userDetails.data.filter(
        (user) => user.roleNames.includes(role) && user.email === req.body.email
      );
    } else {
      console.log("Seller is there");
      userDetails = await descopeClient.management.user.search({
        name: req.body.name,
      });

      matchingUsers = userDetails.data.filter(
        (user) =>
          user.roleNames.includes(role) &&
          user.givenName.toLowerCase() === req.body.name.toLowerCase()
      );
    }

    console.log(matchingUsers[0]);

    if (matchingUsers[0]) {
      res.send({
        result: matchingUsers[0].customAttributes.wallet,
        error: "",
      });
    } else {
      res.send({
        result: "",
        error: "No such user found",
      });
    }
  } catch (err) {
    res.send({
      error: "No such user found",
      result: "",
    });
  }
});
