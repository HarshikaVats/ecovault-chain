const cors = require("cors");

const knex = require("knex")({
  client: "mysql",
  connection: {
    host: process.env["MYSQL_HOST"],
    user: process.env["MYSQL_USER"],
    password: process.env["MYSQL_PASSWORD"],
    database: process.env["MYSQL_DATABASE"],
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
  },
});

const AxiosDigestAuth = require("@mhoc/axios-digest-auth").default;

const digestAuth = new AxiosDigestAuth({
  username: process.env.C2Q_username,
  password: process.env.C2Q_pwd,
});

// Importing dependencies and setting up http server
const express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json());

app.use(cors());

let port = 8000,
  ip = "0.0.0.0";
app.listen(port, ip);
console.log("Server running on http://%s:%s", ip, port);

// Utilities function
async function chat2Query(prompt) {
  try {
    const response = await digestAuth.request({
      headers: {
        Accept: "application/json",
        ContentType: "application/json",
      },
      data: {
        cluster_id: "1379661944646227701",
        database: "tifihub",
        tables: ["e_products"],
        instruction:
          prompt +
          ". (For gender, use m for males, f for females, everyone for everyone). (If no specific gender or age group is mentioned,  then use everyone for that column value) Return all of the 11 cloumns for each row",
      },
      method: "POST",
      url: "https://data.tidbcloud.com/api/v1beta/app/chat2query-BOoendGj/endpoint/v1/chat2data",
    });

    // old url was: "https://eu-central-1.data.tidbcloud.com/api/v1beta/app/chat2query-BOoendGj/endpoint/chat2data" (instruction was there instead of raw_question)

    if (
      response.data.data.result.code !== 200 &&
      response.data.data.result.code !== 429
    ) {
      console.log("Error in the prompt. ");
      return "ERROR:No matching results found for the prompt!!";
    } else if (response.data.data.result.code === 429) {
      console.log("Max API Calls Reached. ");
      return "ERROR:Max API Calls Reached";
    } else {
      console.log(response.data.data.result.row_count);
      if (response.data.data.columns.length < 8) {
        console.log(
          "Check your query again because the returned fields are less than 8"
        );
        return "ERROR:No matching results found for the prompt!!";
      } else {
        console.log("No of rows are: " + response.data.data.result.row_count);
        // console.log(response.data.data)
        if (response.data.data.result.row_count === 0)
          return "ERROR:No matching results found for the prompt!!";
        return response.data.data.rows;
      }
    }
  } catch (err) {
    console.log("ERROR: " + err);
    return "ERROR:Server error, please try again";
  }
}

app.get("/", async (req, res) => {
  console.log("Basic route requested");

  res.send({
    result:
      "Node js server for handling the backend requests. (By the way, we are going to win this event for sure)",
    error: "Not making any errors",
  });
});

app.post("/getUser", async (req, res) => {
  console.log("Getting the user details");
  const user = await knex("e_brands")
    .select("*")
    .where({ bEmail: req.body.email });
  if (!user.length) res.send({ result: false });
  else res.send({ result: true });
});

app.get("/delete", async (req, res) => {
  console.log("Getting details");
  const table = req.query.table;
  const id = req.query.id;

  if (table === "brands") await knex("e_brands").where({ bEmail: id }).del();
  else if (table === "products")
    await knex("e_products").where({ pName: id }).del();
  else if (table === "users") await knex("e_users").where({ uEmail: id }).del();

  res.send("Deleted the thing");
});

//BRANDS ENDPOINT
app.post("/validateEmail", async (req, res) => {
  console.log("Validating the email");
  try {
    if (req.body.email === "") {
      res.send("ERROR:Email can't be empty");
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)) {
      res.send("ERROR:Provide a valid email address");
      console.log("Invalid email provided");
      return;
    }

    const emails = await knex("e_brands")
      .select("*")
      .where({ bEmail: req.body.email });
    if (!emails.length) {
      // creating a random 6 digit password
      const pwd = Math.floor(Math.random() * (999999 - 100000) + 100000);

      let mailConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://versatilevats.com/squarehub/server.php?action=sendEmail&email=${req.body.email}&otp=${pwd}`,
        headers: {},
      };

      // sending the email along with the password
      try {
        await axios.request(mailConfig).then((response) => {
          if (response == 0) {
            res.send("ERROR:Email Failure");
            return;
          }
        });
      } catch (err) {
        console.log("Email failure");
        res.send(`ERROR:${err}`);
        return;
      }

      console.log("Valid email! Sent the verification email");
      res.send(`Can create a new account:${pwd}`);
    } else {
      res.send("ERROR:Email already in use");
    }
  } catch (err) {
    res.send("ERROR: Server error Line 232");
  }
});

app.post("/createBrand", async (req, res) => {
  console.log("Creating the brand (website)");
  try {
    const body = req.body;
    console.log(body);

    // validating the request body
    if (
      body.bName === "" ||
      body.bEmail === "" ||
      body.bAddress === "" ||
      body.bStream === "" ||
      body.bDetails === ""
    ) {
      console.log("Error in creating the brand");
      res.send({ ERROR: "Provide all required parameters" });
      return;
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(body.bEmail)) {
      res.send({ ERROR: "Provide a valid email address" });
      return;
    }

    if (body.bAddress.length > 50) {
      console.log("Address is greater than 50 characters");
      res.send({ ERROR: "Address should be of less than 50 characters" });
      return;
    }

    try {
      await knex("e_brands").insert({
        bName: body.bName.toLowerCase(),
        bEmail: body.bEmail,
        bAddress: body.bAddress,
        bStream: body.bStream,
        pwd: 0,
        bDetails: body.bDetails,
        bDomains: "",
        bExtraDomain: "",
      });

      await knex("e_tones").insert({
        bName: body.bName.toLowerCase(),
        neutral: 0,
        frustrated: 0,
        encouraging: 0,
        constructive: 0,
        appreciative: 0,
      });

      res.send({ result: "SUCCESS! Created the brand: " + body.bName });
    } catch (err) {
      res.send({ ERROR: err });
    }
  } catch (err) {
    res.send({ result: "ERROR:Server error Line 268" });
  }
});

app.post("/login", async (req, res) => {
  console.log("A brand is trying to login");
  const body = req.body;

  try {
    const users = await knex("e_brands")
      .select("*")
      .where({ bEmail: body.email, pwd: body.pwd });
    // no user exists with the given email-pwd pair
    if (!users.length) {
      console.log("Wrong login credentials used (brands)");
      res.send("ERROR:Invalid credentials");
    } else {
      console.log("SUCCESS! Brand logged into the website");
      res.send(users[0]["bName"]);
    }
  } catch (err) {
    console.log("Line 286 ERROR");
  }
});

app.post("/addProduct", async (req, res) => {
  console.log("Brand is trying to add a product");
  const body = req.body;

  if (body.pName.length > 20) {
    res.send("ERROR:Name should be less than 20 characters");
    return;
  }

  if (body.pDesc.length > 20) {
    res.send("ERROR:Description should be less than 20 characters");
    return;
  }

  try {
    const pCategory = await knex("e_brands")
      .select("bStream")
      .select("bName")
      .where({ bEmail: body.bEmail });
    await knex("e_products").insert({
      pName: body.pName,
      bEmail: body.bEmail,
      pLink: "",
      pDesc: body.pDesc,
      pGender: body.pGender,
      pAgeGroup: body.pAgeGroup,
      pLoc: body.pLoc,
      pPrice: body.pPrice,
      pCategory: pCategory[0]["bStream"],
      companyName: pCategory[0]["bName"],
      pickup: body.pickup,
      label: body.label,
    });

    console.log(`PICKUP IS: ` + body.pickup);
    console.log(body.pickup);

    console.log(
      "SUCCESS! Product is added and the concerned users have been nudged"
    );

    res.send("Success");
  } catch (err) {
    console.log("ERROR at line 306");
    res.send("ERROR");
  }
});

app.post("/fetchProducts", async (req, res) => {
  console.log("Brands fetched their product inventory");
  const body = req.body;

  try {
    const products = await knex("e_products")
      .select("*")
      .where({ bEmail: body.email });
    if (!products.length) {
      res.send("ERROR:No products");
    } else {
      res.send(products);
    }
  } catch (err) {
    console.log("ERROR at line 334");
  }
});

app.post("/deleteProduct", async (req, res) => {
  console.log("Brand has reqeusted for PRODUCT DELETION !");
  const body = req.body;

  const del = await knex("e_products")
    .where({ pName: body.pName, bEmail: body.bEmail, pLoc: body.pLoc })
    .del();
  if (del) res.send("Deleted");
  else res.send("ERROR:Invalid details");
});

app.post("/chat2Query", async (req, res) => {
  const body = req.body;
  console.log("Prompt is: " + body.prompt);

  const response = await chat2Query(body.prompt);
  res.send(response);
});

// USER ENDPOINTS
app.post("/validateUser", async (req, res) => {
  const body = req.body;
  if (body.email === "" || body.phone === "") {
    res.send("ERROR:Phone/email can't be empty");
    return;
  }

  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(body.email)) {
    res.send("ERROR:Provide a valid email address");
    return;
  }

  try {
    const email = await knex("e_users")
      .select("*")
      .where({ uEmail: body.email });
    if (!email.length) {
      const phone = await knex("e_users")
        .select("*")
        .where({ uPhoneNo: body.phone });
      if (!phone.length) {
        // if request is for signing up
        if (body.signup) {
          const emailPwd = Math.floor(Math.random() * (999 - 100) + 100);
          const smsPwd = Math.floor(Math.random() * (999 - 100) + 100);

          try {
            await axios.request(smsConfig).then((response) => {
              console.log("Signup sms sent");
              res.send(smsPwd + "" + emailPwd);
            });

            await axios.request(mailConfig).then((response) => {
              console.log("Sign up email sent");
            });
          } catch (err) {
            console.log("Wrong Country Code Entered");
            res.send("ERROR:Wrong country code/incorrect number");
          }
        } else res.send("SUCCESS");
      } else {
        res.send("ERROR:Phone no is already in use");
      }
    } else {
      res.send("ERROR:Email is already in use");
    }
  } catch (err) {
    console.log("ERROR at line 364");
  }
});

app.post("/loginUser", async (req, res) => {
  const body = req.body;
  const byPass = body.bypass;
  // byPass will be true for OTP verification and false for regular login (email and pwd)

  try {
    let user;

    if (byPass)
      user = await knex("e_users").select("*").where({ uPhoneNo: body.phone });
    else
      user = await knex("e_users")
        .select("*")
        .where({ uEmail: body.email, uPwd: body.pwd });

    if (!user.length) {
      console.log("No user found!!");
      res.send("ERROR:Invalid credentials");
    } else {
      console.log("User found!!");
      let lastLogin = new Date(user[0]["lastLogin"]);
      let d = new Date();
      const currDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      d = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      d = new Date(d);

      let diff = d.getTime() - lastLogin.getTime();
      let difference = diff / (1000 * 60 * 60 * 24);

      let streak = user[0]["loginStreak"];

      let achievements;
      if (byPass)
        achievements = await knex("e_users")
          .select("achievements")
          .where({ uPhoneNo: body.phone });
      else
        achievements = await knex("e_users")
          .select("achievements")
          .where({ uEmail: body.email, uPwd: body.pwd });

      if (difference == 1) {
        // increase the login streak
        if (byPass) {
          if (!user[0]["achievements"].includes("l"))
            await knex("e_users")
              .where({ uPhoneNo: body.phone })
              .update({
                loginStreak: Number(user[0]["loginStreak"]) + 1,
                achievements: user[0]["achievements"] + "l",
              });
          else
            await knex("e_users")
              .where({ uEmail: body.email, uPwd: body.pwd })
              .update({ uPhoneNo: body.phone });
        } else {
          if (!user[0]["achievements"].includes("l"))
            await knex("e_users")
              .where({ uEmail: body.email, uPwd: body.pwd })
              .update({
                loginStreak: Number(user[0]["loginStreak"]) + 1,
                achievements: user[0]["achievements"] + "l",
              });
          else
            await knex("e_users")
              .where({ uEmail: body.email, uPwd: body.pwd })
              .update({ loginStreak: Number(user[0]["loginStreak"]) + 1 });
        }
        streak++;
      } else if (difference > 1) {
        if (byPass) {
          await knex("e_users")
            .where({ uPhoneNo: body.phone })
            .update({ loginStreak: 0 });
        } else {
          await knex("e_users")
            .where({ uEmail: body.email, uPwd: body.pwd })
            .update({ loginStreak: 0 });
        }
        streak = 0;
      }

      console.log("Current date is " + currDate);

      if (byPass)
        await knex("e_users")
          .where({ uPhoneNo: body.phone })
          .update({ lastLogin: currDate });
      else
        await knex("e_users")
          .where({ uEmail: body.email, uPwd: body.pwd })
          .update({ lastLogin: currDate });

      if (achievements[0]["achievements"].includes("l")) {
        res.send(
          user[0]["uName"] +
            ":" +
            user[0]["uPoints"] +
            ":" +
            streak +
            ":" +
            "old" +
            ":" +
            user[0]["tag"] +
            ":" +
            user[0]["tagAmount"] +
            ":" +
            user[0]["orderID"] +
            ":" +
            user[0]["uPhoneNo"]
        );
      } else {
        res.send(
          user[0]["uName"] +
            ":" +
            user[0]["uPoints"] +
            ":" +
            streak +
            ":" +
            "" +
            ":" +
            user[0]["tag"] +
            ":" +
            user[0]["tagAmount"] +
            ":" +
            user[0]["orderID"] +
            ":" +
            user[0]["uPhoneNo"]
        );
      }
    }
  } catch (err) {
    console.log("ERROR at line 456");
  }
});

app.post("/createUser", async (req, res) => {
  const body = req.body;
  try {
    await knex("e_users").insert({
      uDOB: body.uDOB,
      uPoints: 0,
      uName: body.uName,
      uEmail: body.uEmail,
      uPhoneNo: body.uPhone,
      loginStreak: 0,
      uGender: body.uGender,
      achievements: "",
      uAgeGroup: body.uAgeGroup,
      interests: body.interests,
      uPwd: body.uPwd,
      lastLogin: body.lastLogin,
    });

    res.send("SUCCESS");
  } catch (err) {
    res.send(err);
  }
});

// recommendations section
app.post("/recommendations", async (req, res) => {
  const body = req.body;

  try {
    const users = await knex("e_users")
      .select("*")
      .where({ uEmail: body.email });
    if (!users.length) {
      res.send("ERROR:Wrong email used");
    } else {
      let ans = [];
      const interests = users[0]["interests"].split(" ");
      console.log("INTERESTS " + interests.length);
      interests.forEach(async (item, ind) => {
        let products = await knex("e_products").select("*").where({
          pCategory: item,
          pGender: users[0]["uGender"],
          pAgeGroup: users[0]["uAgeGroup"],
        });

        if (products.length) {
          products.forEach((item, ind) => {
            ans.push(item);
          });
        }

        // second call to fetch products for every gender
        products = await knex("e_products").select("*").where({
          pCategory: item,
          pGender: "everyone",
          pAgeGroup: users[0]["uAgeGroup"],
        });

        if (products.length) {
          products.forEach((item, ind) => {
            ans.push(item);
          });
        }

        // third call to fetch products for every gender
        products = await knex("e_products").select("*").where({
          pCategory: item,
          pGender: users[0]["uGender"],
          pAgeGroup: "everyone",
        });

        if (products.length) {
          products.forEach((item, ind) => {
            ans.push(item);
          });
        }

        // fourth call to fetch products for every gender
        products = await knex("e_products").select("*").where({
          pCategory: item,
          pGender: "everyone",
          pAgeGroup: "everyone",
        });

        // console.log("Products 4 length is " + products.length)
        if (products.length) {
          products.forEach((item, ind) => {
            ans.push(item);
          });
        }

        if (ind == interests.length - 1) {
          res.send(ans);
        }
      });
    }
  } catch (err) {
    console.log("Error at line 557");
    res.send({
      error: err,
    });
  }
});

app.post("/createFeedback", async (req, res) => {
  const body = req.body;

  await knex("e_feedback").insert({
    uEmail: body.email,
    subject: body.type,
    uName: body.name,
    msg: body.msg,
  });

  let sendTo = "";

  // if the feedback has to sent to a brand, then find the brand's email address:
  if (body.sendTo !== "") {
    sendTo = await knex("e_brands").select("*").where({ bName: body.sendTo });
    console.log(
      "Feedback email will be sent to the brand: " + sendTo[0]["bEmail"]
    );
    sendTo = sendTo[0]["bEmail"];
  }

  console.log("Making the data object");

  // checking the tone and accordingly updating the database
  body.tone = body.tone.trim();
  if (body.tone != "NA" && body.type.toLowerCase().includes("brand")) {
    // getting the type of feedback tone
    const feedbackTone = body.tone.split(" ")[0].toLowerCase();

    console.log(`Feedback tone is: ${feedbackTone}`);

    await knex("e_tones")
      .where({ bName: body.sendTo })
      .increment(feedbackTone, 1);
  }

  let data = JSON.stringify({
    name: body.name,
    type: body.type,
    msg: body.msg,
    sendTo: sendTo,
    tone: body.tone,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://versatilevats.com/squarehub/server.php?action=createFeedback",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log("Create Feedback error: " + error);
    });

  const achievements = await knex("e_users")
    .select("*")
    .where({ uEmail: body.email });

  //send a whatsapp message to the user regarding the submitted feeback
  let feedbackMsg =
    "*🥳 You just sent a feedback through the extension*\n\n" +
    `*Type:* ${body.type}\n\n` +
    `*Feedback content:* ${body.msg}`;

  // if achievements is already provided
  if (achievements[0]["achievements"].includes("f")) {
    res.send("SUCCESS");
  } else {
    await knex("e_users")
      .where({ uEmail: body.email })
      .update({ achievements: achievements[0]["achievements"] + "f" });
    res.send("Achievement");
  }
});

app.get("/listBrands", async (req, res) => {
  const brands = await knex("e_brands").select("bName");
  if (!brands.length) res.send("ERROR:No brands found");
  else {
    res.send(brands);
  }
});

app.post("/getBrandProducts", async (req, res) => {
  let category = req.body.category;
  let company = req.body.company;
  let gender = req.body.gender;
  let age = req.body.age;

  if (category === "default") category = "%";
  if (company === "default") company = "%";
  if (gender === "default") gender = "%";
  if (age === "default") age = "%";

  const brandProducts = await knex("e_products")
    .select("*")
    .whereLike("companyName", company)
    .andWhereLike("pCategory", category)
    .andWhereLike("pGender", gender)
    .andWhereLike("pAgeGroup", age);

  if (!brandProducts.length)
    res.send("ERROR:No products available for the selected combination");
  else res.send(brandProducts);
});

// AI-ML endpoint
app.post("/getLabelProducts", async (req, res) => {
  let labels = req.body.labels;
  let finalResult = [];

  for (let label = 0; label < labels.length; label++) {
    let products = await knex("e_products")
      .select("*")
      .where({ label: labels[label] });
    products.forEach((prod) => {
      finalResult.push(prod);
    });
  }
  res.send(finalResult);
});

app.post("/getAchievements", async (req, res) => {
  const achievements = await knex("e_users")
    .select("achievements")
    .where({ uEmail: req.body.email });
  res.send(achievements[0]["achievements"]);
});

app.post("/updateVerify", async (req, res) => {
  const achievements = await knex("e_users")
    .select("achievements")
    .where({ uEmail: req.body.email });
  // if achievements is already provided
  if (achievements[0]["achievements"].includes("v")) {
    res.send("SUCCESS");
  } else {
    await knex("e_users")
      .where({ uEmail: req.body.email })
      .update({ achievements: achievements[0]["achievements"] + "v" });
    res.send("Achievement");
  }
});

// chart endpoints:
app.get("/getChartValues", async (req, res) => {
  const males = await knex("e_users").count("*").where({ uGender: "m" });
  const females = await knex("e_users").count("*").where({ uGender: "f" });

  const kids = await knex("e_users").count("*").where({ uAgeGroup: "kids" });
  const youth = await knex("e_users").count("*").where({ uAgeGroup: "youth" });
  const adult = await knex("e_users").count("*").where({ uAgeGroup: "adult" });
  const old = await knex("e_users").count("*").where({ uAgeGroup: "old" });

  const clothing = await knex("e_products")
    .count("*")
    .where({ pCategory: "clothing" });
  const food = await knex("e_products").count("*").where({ pCategory: "food" });
  const furniture = await knex("e_products")
    .count("*")
    .where({ pCategory: "furniture" });
  const electronics = await knex("e_products")
    .count("*")
    .where({ pCategory: "electronics" });

  const genderCounts = [];
  genderCounts.push(males[0]["count(*)"]);
  genderCounts.push(females[0]["count(*)"]);

  const ageGroupCounts = [];
  ageGroupCounts.push(kids[0]["count(*)"]);
  ageGroupCounts.push(youth[0]["count(*)"]);
  ageGroupCounts.push(adult[0]["count(*)"]);
  ageGroupCounts.push(old[0]["count(*)"]);

  const productCounts = [];
  productCounts.push(clothing[0]["count(*)"]);
  productCounts.push(food[0]["count(*)"]);
  productCounts.push(electronics[0]["count(*)"]);
  productCounts.push(furniture[0]["count(*)"]);

  const finalArray = [];
  finalArray.push(genderCounts);
  finalArray.push(ageGroupCounts);
  finalArray.push(productCounts);

  const tones = await knex("e_tones")
    .select("*")
    .where({ bName: req.query.brand });

  const feedbackTonesArray = [];
  feedbackTonesArray.push(tones[0]["neutral"]);
  feedbackTonesArray.push(tones[0]["frustrated"]);
  feedbackTonesArray.push(tones[0]["encouraging"]);
  feedbackTonesArray.push(tones[0]["constructive"]);
  feedbackTonesArray.push(tones[0]["appreciative"]);

  finalArray.push(feedbackTonesArray);

  res.send(finalArray);
});

app.post("/statEmails", async (req, res) => {
  const body = req.body;

  if (body.msg == "") {
    res.send("ERROR:Message cannot be empty");
    return;
  }

  const users = await knex("e_users")
    .select("*")
    .where({ uAgeGroup: body.ageGroup, uGender: body.gender });
  if (!users.length) res.send("ERROR:Selected combinations has no user");
  else {
    for (let a = 0; a < users.length; a++) {
      let data = {
        to: users[a]["uEmail"],
        companyName: body.companyName.toUpperCase(),
        msg: body.msg,
        attachment: body.attachment,
      };

      if (!body.attachment || body.attachment === "") {
      } else data["attachment"] = body.attachment;

      data = JSON.stringify(data);

      console.log("Data is: " + data);

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://versatilevats.com/squarehub/server.php?action=sendAttachment",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios
        .request(config)
        .then((response) => {
          console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
          console.log("Send Attachment error: " + error);
        });
    }

    res.send("SUCCESS");
  }
});

// JSONBIN ENDPOINTS
async function readBin(binId) {
  try {
    const response = await axios.get(`https://api.jsonbin.io/v3/b/${binId}`, {
      headers: {
        "X-Master-Key": process.env.jsonBinAPIKey,
      },
    });
    return {
      result: response.data.record,
      error: "",
    };
  } catch (error) {
    console.error("Error reading bin!!");
    console.log(error.response.data.message);

    return {
      result: "",
      error: error.response.data.message,
    };
  }
}

async function addDataInBin(binId, data) {
  try {
    const response = await axios.put(
      `https://api.jsonbin.io/v3/b/${binId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": process.env.jsonBinAPIKey,
        },
      }
    );
    console.log("Bin Updated:", response.data);
    return {
      error: "",
      result: response.data,
    };
  } catch (error) {
    console.error("Error updating bin");
    return {
      error,
      result: "",
    };
  }
}

// update the binId field of the e_users table using knex
// being called from "thetaServer"
app.post("/updateBin", async (req, res) => {
  console.log("Updating bin");
  await knex("e_users")
    .where({ uPhoneNo: req.body.phone })
    .update({ binId: req.body.binId });

  res.send("Success");
});

app.post("/getBin", async (req, res) => {
  console.log("Getting the JSON bin " + req.body.binId);
  res.send(await readBin(req.body.binId));
});

app.post("/addDataInBin", async (req, res) => {
  console.log("Updating the bin");
  console.log(req.body);
  try {
    const updateBinRes = await addDataInBin(req.body.binId, req.body.data);
    console.log(updateBinRes);
    res.send({
      result: updateBinRes,
      error: "",
    });
  } catch (err) {
    console.log(err);
    return {
      result: "",
      error: "Error updating the bin",
    };
  }
});

app.post("/findBinId", async (req, res) => {
  console.log("/findBinId endpoint");
  try {
    const binId = await knex("e_users")
      .select("binId")
      .where({ uPhoneNo: req.body.phone });

    console.log(binId);

    // Bin Id is not yet formulated
    if (!binId.length || !binId[0].binId) {
      console.log("No binId found for the provided phone number");
      res.send({
        result: "",
        error: "No binId found for the provided phone number",
      });
    } else {
      console.log("BinId exists!!");
      res.send({
        result: binId[0]["binId"],
        error: "",
      });
    }
  } catch (err) {
    res.send({
      result: "",
      error: "Error in finding the bin",
    });
  }
});

app.post("/createOrder", async (req, res) => {
  const body = req.body;
  console.log("Creating the order");

  try {
    await knex("e_orders").insert({
      txn: body.txn,
      orderID: body.orderID,
      distance: body.distance,
      orderedBy: body.orderedBy,
      orderedByBin: body.orderedByBin,
    });

    // then send the email
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://versatilevats.com/ibm/c4c/extension/order.php",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        orderID: body.orderID,
        items: body.mailData.items,
        totalPrice: body.mailData.totalPrice,
        pickupAvailed: body.mailData.pickupAvailed,
        pickupLocation: body.mailData.pickupLocation,
        orderedBy: body.orderedBy,
      }),
    };

    axios.request(config);

    res.send("SUCCESS");
  } catch (err) {
    res.send(err);
  }
});

// watsonx orchestrate endpoints:
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

app.get("/getBrands", async (req, res) => {
  const brands = await knex("e_brands").select("bName").select("bStream");

  if (!brands.length) {
    res.send("ERROR: No brands found");
    return;
  }

  // Convert each brand name to uppercase
  const upperCaseBrands = brands.map((brand) => ({
    bName: brand.bName.toUpperCase(),
    bStream: capitalizeFirstLetter(brand.bStream.toUpperCase()),
  }));

  res.send(upperCaseBrands);
});

app.post("/getOrders", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // first check the user credentials in the e_users table
  const user = await knex("e_users")
    .select("*")
    .where({ uEmail: email, uPwd: password });

  if (!user.length) {
    res.send({
      orders: [
        {
          orderID: "Invalid Credentials",
          distance: "NA",
          txn: "NA",
        },
      ],
    });

    return;
  }

  // fetch the orders from the e_orders table
  const orders = await knex("e_orders").select("*").where({ orderedBy: email });

  if (!orders.length) {
    res.send({
      orders: [
        {
          orderID: "No orders!!",
          distance: "NA",
          txn: "NA",
        },
      ],
    });
    return;
  }

  res.send({
    orders,
  });
});

app.post("/getProducts", async (req, res) => {
  const brand = req.body.brand.toLowerCase();
  console.log(brand);

  if (brand == "" || !brand) {
    res.send([
      {
        pName: "Wrong brand name!!",
        pDesc: "NA",
        companyName: "NA",
        pCategory: "NA",
        pPrice: "NA",
        pLoc: "NA",
      },
    ]);
  }

  const products = await knex("e_products")
    .select("*")
    .where({ companyName: brand });

  console.log(`${products.length} products found`);

  if (!products.length) {
    res.send([
      {
        pName: "Brand has 0 products!!",
        pDesc: "NA",
        companyName: "NA",
        pCategory: "NA",
        pPrice: "NA",
        pLoc: "NA",
      },
    ]);
    return;
  }

  res.send(products);
});

app.post("/getAOrder", async (req, res) => {
  const orderID = req.body.orderID;

  if (orderID == "" || !orderID) {
    res.send({
      time: "No order ID provided!!",
      breakup: {},
      pickupLocation: "NA",
      pickupAvailed: "NA",
      totalPrice: "NA",
      discount: "NA",
    });
    return;
  }

  const order = await knex("e_orders").select("*").where({ orderID });

  if (!order.length) {
    res.send({
      time: "Wrong order ID provided!!",
      breakup: {},
      pickupLocation: "NA",
      pickupAvailed: "NA",
      totalPrice: "NA",
      discount: "NA",
    });
    return;
  }

  const binData = await readBin(order[0].orderedByBin);

  const particularOrder = binData.result.orders.find(
    (order) => order.id === orderID
  );

  res.send({
    breakup: particularOrder.breakup,
    pickupAvailed: particularOrder.pickupAvailed,
    pickupLocation: particularOrder.pickupLocation
      ? particularOrder.pickupLocation
      : "NA",
    time: particularOrder.time,
    totalPrice: particularOrder.totalPrice,
    discount: particularOrder.discount == 0 ? "NA" : particularOrder.discount,
    carbonSaved: particularOrder.pickupLocation
      ? `${(0.404 * order[0].distance).toFixed(3)} milligrams carbon saved`
      : "NA",
  });
});

// endpoint for PROMPT LAB
let accessToken = null;
let tokenExpiration = null;

async function getAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiration) {
    console.log("Old token expired! Generating a new token");

    // Token has expired or doesn't exist, generate a new one
    try {
      const response = await axios.post(
        "https://iam.cloud.ibm.com/identity/token",
        new URLSearchParams({
          grant_type: "urn:ibm:params:oauth:grant-type:apikey",
          apikey: process.env.IBM_KEY,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;
      accessToken = data.access_token;
      tokenExpiration = Date.now() + data.expires_in * 1000; // expires_in is in seconds

      return accessToken;
    } catch (error) {
      throw new Error("Failed to get access token");
    }
  }

  console.log("Old token still valid! Using the old token");
  return accessToken;
}

app.post("/useIBMPromptLab", async (req, res) => {
  console.log("Using IBM Prompt Lab to generate feedback");

  const prompt = req.body.prompt;
  const token = await getAccessToken();

  let data = JSON.stringify({
    input: `Input: I purchased a table from XYZ store, and after using it for a week, I noticed some scratches. Can you help me draft a feedback?\nOutput: I recently bought a table from your store, but after a week of use, I found scratches on the surface. I would appreciate it if you could look into this and provide a solution or replacement. Thank you\n\nInput: I ordered a pair of shoes from ABC, and the size doesn't fit. Can you help draft feedback to let them know?\nOutput: I recently purchased shoes from ABC, but unfortunately, the size doesn't fit properly. Could you please help me with the exchange or return process? I look forward to hearing back from you. Thank you.\n\nInput: I ordered a mobile phone from DEF, but it arrived with a damaged screen. Can you draft feedback for me?\nOutput: I ordered a mobile phone from DEF, but it arrived with a cracked screen. Please assist me with the return or replacement process for the damaged item. I appreciate your help in resolving this issue\n\nInput: ${prompt}\"\n\nOutput:`,
    parameters: {
      decoding_method: "sample",
      max_new_tokens: 70,
      min_new_tokens: 0,
      random_seed: null,
      stop_sequences: ["\nInput"],
      temperature: 0.7,
      top_k: 50,
      top_p: 1,
      repetition_penalty: 1,
    },
    model_id: "ibm/granite-13b-chat-v2",
    project_id: "d0e31518-4d2d-4428-93b3-27c1b6a729e0",
    moderations: {
      hap: {
        input: {
          enabled: true,
          threshold: 0.5,
          mask: {
            remove_entity_value: true,
          },
        },
        output: {
          enabled: true,
          threshold: 0.5,
          mask: {
            remove_entity_value: true,
          },
        },
      },
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://eu-de.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      res.send({
        result: response.data.results[0].generated_text,
        error: "",
      });
    })
    .catch((error) => {
      res.send({
        result: "",
        error: error.response.data,
      });
    });
});

app.post("/getFeebackTone", async (req, res) => {
  console.log("Using IBM Prompt Lab to classify feedback tone");

  const feedback = req.body.feedback;
  const token = await getAccessToken();

  let data = JSON.stringify({
    input: `Classify the feedback into one of the following tones: Neutral, Encouraging, Constructive, Appreciative, or Frustrated.\n\nInput: I am absolutely thrilled to share my recent experience with the Ecovault chain project! As a passionate advocate for sustainable infrastructure, I was eager to support this innovative solution for secure, decentralized storage. The project has exceeded my expectations in every way. The user-friendly interface, robust security features, and seamless integration with existing systems have made it a great one\nOutput: Enthusiastic\n\nInput: I recently acquired a leather wallet from XYZ brand through your Chrome extension, and I must express my disappointment with the product. The stitching, quality, and appearance are subpar, which is not in line with the brand'\''s reputation. I kindly request a replacement or a full refund for this defective item. I would appreciate a prompt response and resolution\nOutput: Disappointed\n\nInput: ${feedback}\nOutput:`,
    parameters: {
      decoding_method: "sample",
      max_new_tokens: 70,
      min_new_tokens: 0,
      random_seed: null,
      stop_sequences: ["\n"],
      temperature: 0.7,
      top_k: 50,
      top_p: 1,
      repetition_penalty: 1,
    },
    model_id: "ibm/granite-13b-chat-v2",
    project_id: "d0e31518-4d2d-4428-93b3-27c1b6a729e0",
    moderations: {
      hap: {
        input: {
          enabled: true,
          threshold: 0.5,
          mask: {
            remove_entity_value: true,
          },
        },
        output: {
          enabled: true,
          threshold: 0.5,
          mask: {
            remove_entity_value: true,
          },
        },
      },
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://eu-de.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      res.send({
        result: response.data.results[0].generated_text,
        error: "",
      });
    })
    .catch((error) => {
      res.send({
        result: "",
        error: error.response.data,
      });
    });
});
