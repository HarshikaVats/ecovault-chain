const cors = require("cors");
const { ethers } = require("ethers");
const BigNumber = require("bignumber.js");
const thetajs = require("@thetalabs/theta-js");

const data = require("./data.js");

const express = require("express"),
  body_parser = require("body-parser"),
  app = express().use(body_parser.json());

const axios = require("axios");

app.use(cors());
let port = 1337,
  ip = "0.0.0.0";
app.listen(port, ip);
console.log("Server running on http://%s:%s", ip, port);

const chainId = thetajs.networks.ChainIds.Testnet;
const provider = new thetajs.providers.HttpProvider(chainId);

// to genearte password for the keystore file
function generateRandomPassword() {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  const allChars = uppercase + lowercase + numbers;
  let password = "";

  // Ensure at least one character from each set is included
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Fill the rest of the password length with random characters from all sets
  for (let i = password.length; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");

  return password;
}

async function getWallet(key, type, password = "") {
  try {
    let wallet;

    if (type === "mnemonic") {
      console.log("\n--- Opening a wallet via a mnemonic ---");
      wallet = thetajs.Wallet.fromMnemonic(key);
      wallet = await wallet.connect(provider);
      console.log(wallet._signingKey().privateKey);
    } else if (type === "privateKey") {
      console.log("\n\n--- Opening a wallet via a private key ---");
      // In this case, we cannot get the mnemonic phrase as it was not created via a mnemonic phrase
      wallet = new thetajs.Wallet(key);
      wallet = await wallet.connect(provider);
      console.log(wallet.address);
    } else if (type === "keystore") {
      console.log("\n\n--- Opening a wallet via a keystore ---");
      const jsonWallet = `
      ${JSON.stringify(key, null, 2)}
      `;
      wallet = thetajs.Wallet.fromEncryptedJson(jsonWallet, password);
      console.log(wallet.address);
    } else {
      return {
        result: "",
        error: "Invalid key!!",
      };
    }

    const validationRes = await validateAccount(
      wallet.address,
      password != "" ? true : false
    );
    console.log(validationRes);

    if (validationRes.error.includes("address")) {
      const parts = validationRes.error.split("address");
      const beforeAddress = parts[0].trim();
      const afterAddress = parts[1].split("is")[1].trim();
      return {
        result: "",
        error: `${beforeAddress} address ${afterAddress}`,
      };
    } else {
      return {
        result: {
          ...validationRes.result,
          privateKey: wallet._signingKey().privateKey,
        },
        error: validationRes.error ? validationRes.error : "",
      };
    }
  } catch (err) {
    /* Errors that can come when an invalid key is provided:
      1. invalid private key (split the reponse till " (")
      2. hex data is odd length (split the response till " (")
    */
    console.log(err.message);
    return {
      result: "",
      error: err.message,
    };
  }
}

async function createWallet() {
  console.log("\n\n--- Creating a new wallet ---");
  let wallet = thetajs.Wallet.createRandom();
  wallet = await wallet.connect(provider);
  let walletObj = {
    result: {},
  };
  walletObj.result.balance = 5;
  walletObj.result.address = wallet.address;
  walletObj.result.mnemonic = wallet._mnemonic().phrase;
  walletObj.result.privateKey = wallet._signingKey().privateKey;
  return walletObj;
}

/* proceed will be true only for account created via the "createWallet" endpoint
  When this func will be called via getWallet endpoint, then the new account will
  not be made/and credited with 5 tfuels
*/
async function validateAccount(address, proceed = false) {
  console.log("\n\n--- Validating an account ---");
  console.log("PROCEED: " + proceed);
  try {
    const account = await provider.getAccount(address);
    console.log(
      `${address} has ${(account.coins.tfuelwei / 1e18).toFixed(2)} tfuels`
    );
    return {
      result: {
        address,
        balance: (account.coins.tfuelwei / 1e18).toFixed(2),
      },
      error: "",
    };
  } catch (err) {
    if (
      err.code === -32000 &&
      err.message.includes("is not found") &&
      proceed
    ) {
      console.log("This is a newly created account!!");
      await sendTfuel("0x74c0073A1b141aFd67764AB114Fc0beAd5043D8F", address, 5);
      console.log("successfully transferred 5 tfuels into the account");
      return {
        result: {
          address,
          balance: 5,
        },
        error: "",
      };
    }

    console.log(err.message);
    return {
      balance: "",
      error: err.message,
    };
  }
}

async function sendTfuel(
  fromAdd,
  toAdd,
  tfuel,
  key = process.env.adminPrivateKey
) {
  console.log("\n\n--- Sending TFuel ---");
  try {
    const account = await provider.getAccount(fromAdd);
    const balance = account.coins.tfuelwei / 1e18;
    console.log(
      `Balance of ${fromAdd}: ${balance} TFuel, & sequence: ${account.sequence}`
    );

    if (balance < tfuel) {
      console.log("ERROR: Insufficient balance in admin account");
      return {
        result: "",
        error: "Insufficient balance in theta account",
      };
    } else {
      let wallet = new thetajs.Wallet(key);
      wallet = await wallet.connect(provider);

      const ten18 = new BigNumber(10).pow(18);
      const thetaWeiToSend = new BigNumber(0);
      const tfuelWeiToSend = new BigNumber(tfuel).multipliedBy(ten18);
      const txData = {
        from: fromAdd,
        outputs: [
          {
            address: toAdd,
            thetaWei: thetaWeiToSend,
            tfuelWei: tfuelWeiToSend,
          },
        ],
      };

      try {
        const transaction = new thetajs.transactions.SendTransaction(txData);
        const txn = await wallet.sendTransaction(transaction);
        // `https://testnet-explorer.thetatoken.org/txs/${txhhash}`
        console.log(txn.hash, txn.block.Height);
        return {
          result: {
            hash: txn.hash,
            block: txn.block.Height,
            url: `https://testnet-explorer.thetatoken.org/txs/${txn.hash}`,
          },
          error: "",
        };
      } catch (err) {
        console.log(err.message);
        return {
          result: "",
          error: err.message,
        };
      }
    }
  } catch (err) {
    console.log("Send tfuel error:" + err.message);
    return {
      result: "",
      error: err.message,
    };
  }
}

const apiKey = process.env.jsonBinAPIKey;
const jsonBinBaseUrl = "https://api.jsonbin.io/v3/b";

async function createBin(data, phone) {
  try {
    const response = await axios.post(jsonBinBaseUrl, data, {
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": apiKey,
        "X-Bin-Name": phone,
      },
    });
    console.log("Bin Created:", response.data.metadata.id);
    // calling the node js server to update the binId in the database:
    console.log("Updating the binId in the database!!");
    await axios.post(
      `${process.env.nodeServer}/updateBin`,
      {
        phone: phone,
        binId: response.data.metadata.id,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Done everything!!");
    return response.data.metadata.id; // Return the bin ID for future use
  } catch (error) {
    console.error("Error creating bin:", error);
  }
}

async function deployContract(NFTname, NFTsymbol, NFTlink) {
  console.log("\n\n--- Deploying Contract ---");
  try {
    let wallet = new thetajs.Wallet(process.env.adminPrivateKey);
    wallet = await wallet.connect(provider);

    const contractToDeploy = new thetajs.ContractFactory(
      data.ABI,
      data.byteCode,
      wallet
    );

    /*
      txnUrl: `https://testnet-explorer.thetatoken.org/txs/${result.hash}`,
      contractUrl: `https://testnet-explorer.thetatoken.org/account/${result.contract_address}`,
    */

    const result = await contractToDeploy.deploy(NFTname, NFTsymbol, NFTlink);
    return {
      result: {
        hash: result.hash,
        contractAddress: result.contract_address,
      },
      error: "",
    };
  } catch (err) {
    console.log(err.message);
    return {
      result: "",
      error: err.message,
    };
  }
}

async function transferNFT(contractAddress, to, nonce = "") {
  console.log("\n\n--- Transferring NFT ---");
  try {
    let wallet = new thetajs.Wallet(process.env.adminPrivateKey);
    wallet = await wallet.connect(provider);

    /* if the walet is not okay, then we get the error: "Cannot read properties of undefined"
      Via the ABI, the program is able to find out the functions and definitions present in the smart contract
      and that is why CONTRACT will hold of the details as long as the ABI is correct
      ERRORS:
        1. For invalid ABI: Unexpected end of JSON input
        2. For invalid contract address: 
            call revert exception (when the contract address is wrong)
            encoding/hex: invalid byte (when the contract address is not of correct length)
    */
    const contract = new thetajs.Contract(contractAddress, data.ABI, wallet);
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(name, symbol);

    let transfer;
    if (nonce == "") {
      transfer = await contract.transferFrom(wallet.address, to, 0);
      return {
        result: {
          name,
          symbol,
          transferhash: transfer.hash,
        },
        error: "",
      };
    } else {
      transfer = await contract.transferFrom(wallet.address, to, 0, {
        sequence: nonce,
      });
      return {
        result: {
          name,
          symbol,
          transferhash: transfer.hash,
        },
        error: "",
      };
    }
  } catch (err) {
    console.log("Error: " + err.message);

    //  ValidateInputAdvanced: Got 300, expected 420.
    if (err.message.includes("ValidateInputAdvanced")) {
      let regex = /expected (\d+)/;
      let match = err.message.match(regex);

      let expectedNumber = 0;
      if (match) {
        expectedNumber = parseInt(match[1], 10);
        console.log(expectedNumber);
      }
      console.log("Correct sequence number is: " + expectedNumber);
      return await transferNFT(contractAddress, to, expectedNumber);
    } else {
      return {
        result: "",
        error: err.message,
      };
    }
  }
}

// Express Server's Endpoints
app.get("/", (req, res) => {
  // const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // console.log(timeZone);

  res.send({
    result: "Will win the theta 2024 event for sure!!",
    error: "No room for errors!!",
  });
});

app.post("/getWallet", async (req, res) => {
  console.log("Endpoint: /getWallet");
  if (!req.body.key || !req.body.type) {
    res.send({
      result: "",
      error: "Please provide the key and the type!!",
    });
    return;
  }
  const { key, type } = req.body;
  let wallet;

  if (req.body.password) wallet = await getWallet(key, type, req.body.password);
  else wallet = await getWallet(key, type);

  res.send({
    result: wallet.result,
    error: wallet.error,
  });
});

app.get("/createWallet", async (req, res) => {
  const wallet = await createWallet();
  console.log(wallet);
  res.send({
    error: wallet.error,
    result: wallet.result,
  });
  await validateAccount(wallet.result.address, true);
});

app.get("/createKeystore", async (req, res) => {
  let wallet = ethers.Wallet.createRandom();
  console.log(wallet.address);
  console.log(wallet.publicKey);
  console.log(wallet.privateKey);
  console.log(wallet.mnemonic.phrase);

  const password = generateRandomPassword();
  const keystore = JSON.parse(await wallet.encrypt(password));
  // if keystore has a key named "x-ethers", delete that
  delete keystore["x-ethers"];

  // replace the Crypto key with crypto, and delete the old Crypto key
  keystore.crypto = keystore.Crypto;
  delete keystore.Crypto;

  let walletObj = {
    result: {
      balance: 5,
      address: wallet.address,
      mnemonic: wallet.mnemonic.phrase,
      privateKey: wallet.privateKey,
      keystore,
      password,
    },
    error: "",
  };

  res.send(walletObj);
  await validateAccount(wallet.address, true);
});

app.post("/sendTfuel", async (req, res) => {
  console.log("Endpoint: /sendTfuel");
  console.log(req.body);
  if (!req.body.from || !req.body.to || !req.body.amount) {
    res.send({
      result: "",
      error:
        "Please provide the 'from' address, 'to' address, and the amount!!",
    });
    return;
  }

  // sending the tfuels from the "buyer" acc to the admin account
  const { from, to, amount } = req.body;
  let key;

  if (req.body.key == undefined) key = process.env.adminPrivateKey;
  else key = req.body.key;

  const { result, error } = await sendTfuel(from, to, amount, key);
  res.send({
    result,
    error,
  });

  // then send the tfuels to the particular brands:
  const breakup = req.body.breakup;
  if (breakup == undefined) return;
  console.log("Breakup array is: ");
  console.log(breakup);

  for (const key of Object.keys(breakup)) {
    console.log(
      "Finding the wallet address from Glitch for: " + key + " " + breakup[key]
    );

    try {
      let to = await axios.request({
        method: "post",
        maxBodyLength: Infinity,
        // url: "https://c4c-descope.glitch.me/getWallet",
        url: "https://c4c-descope-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com/getWallet",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          name: key,
          role: "Seller",
        }),
      });

      to = await getWallet(to.data.result, "privateKey");
      console.log(to.result.address);

      await sendTfuel(
        "0x74c0073A1b141aFd67764AB114Fc0beAd5043D8F",
        to.result.address,
        breakup[key]
      );
    } catch (error) {
      console.log(error);
    }
  }
});

app.post("/deployContract", async (req, res) => {
  console.log("Endpoint: /deployContract");

  const phone = req.body.phone;

  res.send({
    result: "Success",
    error: "",
  });

  const nftNames = ["firstPurchase", "100tfuels", "5items", "fifthPurchase"];
  const NFTsymbols = ["FP", "100T", "5I", "5P"];
  const NFTlinks = [
    "https://versatilevats.com/ibm/c4c/extension/gifs/nft1.gif",
    "https://versatilevats.com/ibm/c4c/extension/gifs/nft2.gif",
    "https://versatilevats.com/ibm/c4c/extension/gifs/nft3.gif",
    "https://versatilevats.com/ibm/c4c/extension/gifs/nft4.gif",
  ];

  let finalObj = {
    phone,
    n1: {},
    n2: {},
    n3: {},
    n4: {},
    purchase: 0,
    orders: [],
  };

  for (let i = 0; i < 4; i++) {
    const deployRes = await deployContract(
      nftNames[i],
      NFTsymbols[i],
      NFTlinks[i]
    );

    if (deployRes.error == "") {
      finalObj[`n${i + 1}`] = deployRes.result;
    } else {
      console.log(`Problem in pushing nft contract no: ${i}`);
      console.log(deployRes.error);
    }
  }

  console.log("Creating the bin for that");
  createBin(finalObj, phone);
});

app.post("/transferNFT", async (req, res) => {
  console.log("Endpoint: /transferNFT");
  if (!req.body.contract || !req.body.to) {
    res.send({
      result: "",
      error: "Please provide the contract address and the 'to' address!!",
    });
    return;
  }
  const contract = await transferNFT(req.body.contract, req.body.to);
  res.send({
    result: contract.result,
    error: contract.error,
  });
});

// sending the email to the user regarding the wallet details
app.post("/sendEmail", async (req, res) => {
  console.log(req.body);
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  await fetch("https://versatilevats.com/ibm/c4c/extension/mail.php", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({
      to: req.body.to,
      team: req.body.team,
      address: req.body.address,
      mnemonic: req.body.mnemonic,
      privateKey: req.body.privateKey,
      keystore: req.body.keystore,
      password: req.body.password,
    }),
  });

  res.send({
    result: "SENT EMAIL",
  });
});

// for descope validation
function decodeJSON(dataUri) {
  // Check for the prefix and split the string to get the base64 content
  let base64String = dataUri.split(",")[1];

  if (!dataUri.split(",")[0].includes("/json;")) {
    return {
      error: "Invalid file. Expected a JSON file",
      result: null,
    };
  }

  try {
    // Decode base64 string to a byte array
    let decodedBuffer = Buffer.from(base64String, "base64");
    let decodedString = decodedBuffer.toString("utf-8");
    return {
      error: "",
      result: JSON.parse(decodedString),
    };
  } catch (error) {
    return {
      error: "Invalid JSON file",
      result: null,
    };
  }
}

app.post("/validateKeystoreJSON", async (req, res) => {
  console.log("Endpoint: /validateKeystoreJSON");
  const decodedStr = decodeJSON(req.body.keystore);

  if (decodedStr.error != "") {
    res.send(decodedStr);
    return;
  }

  // proceed if only the uploaded file is a JSON
  let requiredKeys = ["address", "crypto", "id", "version"];
  let foundAllKeys = false;

  Object.keys(decodedStr.result).forEach((key) => {
    if (requiredKeys.includes(key)) foundAllKeys = true;
    else foundAllKeys = false;
  });

  // if all the keys are not present, then the JSON is invalid
  if (!foundAllKeys) {
    res.send({
      result: null,
      error: "Uplaoded JSON is not a valid keystore JSON!!",
    });
    return;
  }

  res.send(decodedStr);
});

// To mint new NFTs
// (async () => {
//   const deployRes = await deployContract(
//     "Mater of Theta",
//     "MT",
//     "https://versatilevats.com/ibm/c4c/extension/gifs/discord-bot/nft-3.png"
//   );

//   if (deployRes.error == "") {
//     console.log(deployRes.result);
//   } else {
//     console.log(deployRes.error);
//   }
// })();
