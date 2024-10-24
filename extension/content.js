const THETA_URL =
  "https://theta-server-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com";
const NODE_SERVER_URL =
  "https://node-server-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com";

async function serverCall(
  request,
  endpoint,
  SERVER = THETA_URL,
  method = "POST"
) {
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let raw = JSON.stringify(request);

  let requestOptions = {
    method,
    body: raw,
    headers: myHeaders,
    redirect: "follow",
  };

  if (method === "GET") delete requestOptions.body;

  return await fetch(`${SERVER}/${endpoint}`, requestOptions)
    .then((response) => response.json())
    .then((result) => result)
    .catch((error) => {
      // console.log(error);
      return `ERROR:Server error`;
    });
}

// dom references
const tag = document.querySelector("#tag");
const email = document.querySelector("#email");
const items = document.querySelector("#items");
const payout = document.querySelector("#payout");
const process = document.querySelector("#process");
const totalPrice = document.querySelector("#totalPrice");
const pickupTotal = document.querySelector("#pickupTotal");
const pickupDetails = document.querySelector("#pickupDetails");

const tagPayment = document.querySelector("#tagPayment");
const orderError = document.querySelector("#orderError");
const paymentInfo = document.querySelector("#paymentInfo");

const overlay = document.querySelector("#overlay");
const overlayText = document.querySelector("#overlayText");

const discount = document.querySelector("#discount");
const noPastOrders = document.querySelector("#noPastOrders");
const pastOrdersTable = document.querySelector("#pastOrdersTable");
const priceAfterDiscount = document.querySelector("#priceAfterDiscount");
const priceAfterDiscountBlock = document.querySelector(
  "#priceAfterDiscountBlock"
);

const tryonDiv = document.querySelector("#tryon");
const tryonError = document.querySelector("#tryonError");
const tryonSelect = document.querySelector("#tryonSelect");
const tryonItems = document.querySelectorAll("#tryonItems");

let discountPercentage = 0;

// update the pastorders and NFT, even if the user has not opened the extension
async function paintUI(binData, binId) {
  tryonSelect.innerHTML = "<option value=''>Select an item</option>";
  // check whether there are some previous orders or not?
  if (binData.orders.length > 0) {
    noPastOrders.style.display = "none";
    pastOrdersTable.style.display = "block";
    let table = document.querySelector("#pastOrdersTable tbody");
    table.innerHTML = "";

    binData.orders.forEach((order, index) => {
      let row = table.insertRow(index);
      let view = row.insertCell(0);
      let id = row.insertCell(1);
      let date = row.insertCell(2);
      let tfuels = row.insertCell(3);
      let pickup = row.insertCell(4);
      let discount = row.insertCell(5);

      // doing some UI changes to enable the user to view the particular order
      view.style.cursor = "pointer";
      view.style.textAlign = "center";
      const encodedDateString = encodeURIComponent(order.time);
      const baseURL = new URL(
        "https://versatilevats.com/ibm/c4c/extension/checkout.html"
      );
      const params = new URLSearchParams(baseURL.search);
      params.append("bin", binId);
      params.append("time", encodedDateString);
      baseURL.search = params.toString();

      view.innerHTML = `<a href="${baseURL.toString()}" target="_blank"><img width="24" height="24" src="https://img.icons8.com/material-outlined/48/vision.png" alt="vision"/></a>`;

      id.textContent = order.id;
      date.textContent = order.time;
      tfuels.textContent = order.totalPrice;
      pickup.textContent = order.totalTfuels;
      discount.textContent = order.discount;
    });
  } else {
    noPastOrders.style.display = "block";
    pastOrdersTable.style.display = "none";
  }

  // check whether any of the NFT is already provided to the user or not!!
  if (binData.n1.transfer) {
    discountPercentage = 5;
    document.querySelector("#nft1").style.filter = "grayscale(0)";
    document.querySelector("#nft1").parentElement.style.pointerEvents = "auto";
    document.querySelector(
      "#nft1"
    ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${binData.n1.transfer}`;
  }
  if (binData.n2.transfer) {
    discountPercentage = 7;
    document.querySelector("#nft2").style.filter = "grayscale(0)";
    document.querySelector("#nft2").parentElement.style.pointerEvents = "auto";
    document.querySelector(
      "#nft2"
    ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${binData.n2.transfer}`;
  }
  if (binData.n3.transfer) {
    discountPercentage = 10;
    document.querySelector("#nft3").style.filter = "grayscale(0)";
    document.querySelector("#nft3").parentElement.style.pointerEvents = "auto";
    document.querySelector(
      "#nft3"
    ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${binData.n3.transfer}`;
  }
  if (binData.n4.transfer) {
    discountPercentage = 15;
    document.querySelector("#nft4").style.filter = "grayscale(0)";
    document.querySelector("#nft4").parentElement.style.pointerEvents = "auto";
    document.querySelector(
      "#nft4"
    ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${binData.n4.transfer}`;
  }

  const storageData = await chrome.storage.local.get();
  // console.log(storageData);

  // checking teh clothing items for the Tryon Model
  let clothingItems = {};
  Object.keys(storageData["cart"]).forEach((key) => {
    if (key != "count" && key != "tagAmount") {
      if (storageData["cart"][key].companyType == "clothing") {
        let name = `${storageData["cart"][key]["name"]} from ${storageData["cart"][key]["company"]}`;
        clothingItems[name] = key;
      }
    }
  });

  let clothingItemsCount = Object.keys(clothingItems).length;

  if (clothingItemsCount > 0) {
    tryonDiv.style.display = "flex";
    let options = "<option value=''>Select an item</option>";
    Object.keys(clothingItems).forEach((key) => {
      options += `<option value="${clothingItems[key]}">${key}</option>`;
    });

    tryonSelect.innerHTML = options;
    tryonItems.forEach((item) => {
      item.style.pointerEvents = "auto";
      item.style.cursor = "pointer";
    });
  }

  discount.textContent = discountPercentage;
}

async function checkDataBin() {
  if (location.href.includes("checkout.html")) {
    const storageData = await chrome.storage.local.get();
    // console.log(storageData);

    // only proceed if the user has some data in the storage
    if (Object.entries(storageData).length && storageData["binId"]) {
      const binData = await serverCall(
        { binId: storageData["binId"] },
        "getBin",
        NODE_SERVER_URL
      );

      // console.log(binData.result);

      if (binData.error == "") paintUI(binData.result, storageData["binId"]);
    }
  }
}

checkDataBin();

// accepting the data that is coming from the extension
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  const {
    cart,
    binId,
    tfuels,
    binData,
    address,
    thetaTag,
    userEmail,
    cartTotal,
    privateKey,
    pickupPrice,
  } = request;

  // finding the breakup total for each of the brands:
  const breakup = {};
  const orderItems = [];
  Object.keys(cart).forEach((key) => {
    if (key != "count" && key != "tagAmount") {
      // adding the price of the item to the breakup object
      if (breakup[cart[key].company]) {
        breakup[cart[key].company] += cart[key].price;
      }
      // creating a new key for the company
      else {
        breakup[cart[key].company] = cart[key].price;
      }

      // now I want to push an object to the orderItems array that will have the company, name, price of each item
      orderItems.push({
        company: cart[key].company,
        name: cart[key].name,
        price: cart[key].price,
      });
    }
  });

  if (discountPercentage) {
    // updating the prices
    Object.keys(breakup).forEach((key) => {
      breakup[key] = (
        ((100 - discountPercentage) / 100) *
        (breakup[key] / 10)
      ).toFixed(2);
    });

    // hiding or showin up the priceAfterDiscountBlock
    priceAfterDiscountBlock.style.display = "flex";
    priceAfterDiscount.textContent = (
      ((100 - discountPercentage) / 100) *
      (cartTotal / 10)
    ).toFixed(2);
  } else {
    priceAfterDiscountBlock.style.display = "none";

    // updating the prices
    Object.keys(breakup).forEach((key) => {
      breakup[key] = (breakup[key] / 10).toFixed(2);
    });

    // hiding or showin up the priceAfterDiscountBlock
    priceAfterDiscountBlock.style.display = "flex";
    priceAfterDiscount.textContent = (cartTotal / 10).toFixed(2);
  }

  // console.log(breakup);
  document.querySelector("#totalTfuels").textContent = cartTotal / 10;

  tag.textContent = thetaTag;
  payout.style.display = "block";
  process.style.display = "block";
  orderError.style.display = "none";
  pickupDetails.style.display = "block";
  pickupTotal.textContent = pickupPrice;

  // when the user do not have the "thetaTag"
  if (thetaTag == "NA" || pickupPrice == 0) {
    pickupDetails.style.display = "none";
    paymentInfo.style.display = "none";
  }
  // when the user have the "thetaTag"
  else {
    pickupDetails.style.display = "block";
    process.style.display = "none";

    tagPayment.textContent = pickupPrice;

    const rejectPickup = document.querySelector("#rejectPickup");
    const agreePickup = document.querySelector("#agreePickup");

    rejectPickup.addEventListener("click", () => {
      process.style.display = "block";
      orderError.style.display = "none";
      paymentInfo.style.display = "none";
    });

    agreePickup.addEventListener("click", () => {
      process.style.display = "block";
      orderError.style.display = "none";
      paymentInfo.style.display = "block";
      tagPayment.textContent = pickupPrice / 10;
    });
  }

  email.textContent = userEmail;
  items.textContent = cart.count;
  totalPrice.textContent = cartTotal;

  document.querySelector("#noCurrentOrder").style.display = "none";
  document.querySelector("#currentOrderExtension").style.display = "block";

  window.postMessage(
    {
      action: "askForLocation",
    },
    "*"
  );

  // handling the COMPLETE PAYMENT button
  process.addEventListener("click", async (req, res) => {
    const totalTfuels = cartTotal / 10;
    const totalPrice = cartTotal;

    let pickupLocation = "";
    let pickupAvailed = false;

    // checking for the location dropdown (to check for pickupAvailed)
    let vault = document.querySelector("#dropdown").value;
    let distance = 0;

    // when the user opts for the pickup
    if (!vault.includes("NA") && vault.length < 10) {
      pickupAvailed = true;
      pickupLocation = vault;

      // Grab the distance between the user's location and the pickup location
      const dropdown = document.querySelector("#dropdown");
      const selectedOption = dropdown.options[dropdown.selectedIndex];
      distance = selectedOption.getAttribute("distance");
    }

    // checks if the user has enough TFUEL balance
    if (Number(tfuels) < Number(cartTotal / 10)) {
      process.style.display = "none";
      orderError.style.display = "block";
      orderError.textContent = "Insufficient TFUEL balance";
      return;
    }

    // increasing the purchase count
    binData.purchase++;

    let time = new Date();
    let amount;

    // populating the amount according to the discount field
    if (priceAfterDiscountBlock.style.display == "none") {
      amount = cartTotal / 10;
    } else {
      amount = priceAfterDiscount.textContent;
    }

    // orderID should be the first 7 characters of the JSONBIN ID, and then the current time in UNIX.
    let orderID = binId.slice(0, 7) + time.getTime();

    binData.orders.push({
      breakup,
      id: orderID,
      pickupAvailed,
      pickupLocation,
      items: orderItems,
      time: time.toLocaleString(),
      totalTfuels: Number(amount),
      discount: discountPercentage,
      totalPrice: Number(totalPrice),
    });

    orderError.style.display = "none";

    overlay.style.display = "block";
    document.querySelector("body").style.pointerEvents = "none";
    overlayText.textContent = `Deducting ${amount} tfuels from your wallet`;

    // deduct the TFUEL from the user's account
    const txn = await serverCall(
      {
        to: "0x74c0073A1b141aFd67764AB114Fc0beAd5043D8F",
        key: privateKey,
        from: address,
        amount,
        breakup,
      },
      "sendTfuel"
    );

    // gets the block, hash, and url for the successful txn in the result object
    if (txn.error != "") {
      overlay.style.display = "none";
      process.style.display = "none";
      orderError.style.display = "block";
      orderError.textContent = txn.error;
      return;
    }
    // now populate the order details in the past order section and update the bin with the new order
    else {
      // creating the order & sending the email
      serverCall(
        {
          orderID,
          distance,
          orderedByBin: binId,
          orderedBy: userEmail,
          txn: `https://testnet-explorer.thetatoken.org/txs/${txn.result.hash}`,
          mailData: {
            pickupAvailed,
            pickupLocation,
            items: orderItems,
            totalPrice: Number(totalPrice),
          },
        },
        "createOrder",
        NODE_SERVER_URL
      );

      overlayText.textContent = "Updating the order details...";

      // checking whether this is the first purchase or not
      // if it is the first purchase, then NFT 1 would be minted
      if (binData.purchase == 1) {
        // console.log("Minting the firstPurchase NFT");
        overlayText.textContent =
          "Transferring the firstPurchase NFT to your wallet";
        const txnData = await serverCall(
          { contract: binData.n1.contractAddress, to: address },
          "transferNFT"
        );

        // console.log(txnData);

        binData.n1.transfer = txnData.result.transferhash;
        document.querySelector("#nft1").style.filter = "grayscale(0)";
        document.querySelector(
          "#nft1"
        ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${txnData.result.transferhash}`;
      }

      // checking whether NFT2 (100tfuels) is active or not?
      if (document.querySelector("#nft2").style.filter == "grayscale(100%)") {
        // if the user is spending more than 100tfuels on this sinlge order!
        if (totalTfuels > 100) {
          // console.log("Minting the 100tfuels NFT");
          overlayText.textContent =
            "Transferring the 100tfuels NFT to your wallet";
          const txnData = await serverCall(
            { contract: binData.n2.contractAddress, to: address },
            "transferNFT"
          );

          // console.log(txnData);
          binData.n2.transfer = txnData.result.transferhash;
          document.querySelector("#nft2").style.filter = "grayscale(0)";
          document.querySelector(
            "#nft2"
          ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${txnData.result.transferhash}`;
        }
      }

      // checking whether NFT3 (5items) is active or not?
      if (document.querySelector("#nft3").style.filter == "grayscale(100%)") {
        // checking whether there are >=5 items in the single order
        if (cart.count >= 5) {
          // console.log("Minting the 5items NFT");
          overlayText.textContent =
            "Transferring the 5items NFT to your wallet";
          const txnData = await serverCall(
            { contract: binData.n3.contractAddress, to: address },
            "transferNFT"
          );

          // console.log(txnData);
          binData.n3.transfer = txnData.result.transferhash;
          document.querySelector("#nft3").style.filter = "grayscale(0)";
          document.querySelector(
            "#nft3"
          ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${txnData.result.transferhash}`;
        }
      }

      // checking whether NFT4 (fifthPurchase) is active or not?
      if (binData.purchase == 5) {
        // console.log("Minting the fifthPurchase NFT");
        overlayText.textContent =
          "Transferring the fifthPurchase NFT to your wallet";
        const txnData = await serverCall(
          { contract: binData.n4.contractAddress, to: address },
          "transferNFT"
        );

        // console.log(txnData);
        binData.n4.transfer = txnData.result.transferhash;
        document.querySelector("#nft4").style.filter = "grayscale(0)";
        document.querySelector(
          "#nft1"
        ).parentElement.href = `https://testnet-explorer.thetatoken.org/txs/${txnData.result.transferhash}`;
      }

      overlayText.textContent = "Updating the JSON bin...";
      console.log("Updating the JSON bin");

      // pushing the updated bin in JSONBIN
      await serverCall(
        {
          binId,
          data: binData,
        },
        "addDataInBin",
        NODE_SERVER_URL
      );

      // setting the cart to empty as the order was fulfilled
      await chrome.storage.local.set({ cart: { count: 0, tagAmount: 0 } });
      location.reload();
    }

    document.querySelector("body").style.pointerEvents = "auto";
    overlay.style.display = "none";
  });

  sendResponse("Success!!");

  paintUI(binData, binId);
});
