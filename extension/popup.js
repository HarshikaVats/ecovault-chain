import { NODE_SERVER_URL, ML_MODEL_URL, THETA_URL } from "./theta.js";
// const GLITCH_SERVER = "https://c4c-descope.glitch.me";
const GLITCH_SERVER =
  "https://c4c-descope-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com";

document.querySelectorAll("input").forEach((input) => {
  input.setAttribute("autocomplete", "off");
});

const cartCount = document.querySelector("#cartCount");

/* Example prompt:
 *I purchased a leather wallet from XYZ brand a few days ago using your Chrome extension. However, I noticed that the stitching, quality, and appearance are not up to the mark. Please help me draft a complaint to the company, requesting a replacement or refund.*
 */
const generateTextPrompt = async (textPrompt) => {
  console.log(textPrompt);
  console.log("Generating the text prompt");
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    prompt: textPrompt,
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  return await fetch(`${NODE_SERVER_URL}/useIBMPromptLab`, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      return result;
    })
    .catch((error) => console.log("error", error));
};

// handling the output of the Google Palm API
document
  .querySelector("#feedbackMsg")
  .addEventListener("keydown", async (event) => {
    if (event.key == "Enter") {
      event.preventDefault();

      let content = event.target.value;

      if (
        content.length == 0 ||
        content.indexOf("*") == -1 ||
        content.indexOf("*") == content.lastIndexOf("*") ||
        content.slice(content.indexOf("*") + 1, content.lastIndexOf("*"))
          .length < 20
      ) {
        console.log("INVALID AI PROMPT");
        document.querySelector("#feedbackError").style.visibility = "visible";
        document.querySelector("#feedbackError").textContent =
          "Please provide a valid AI prompt";
      } else {
        document.querySelector("body").style.pointerEvents = "none";

        // calling the text2text generation function
        const ibmResponse = await generateTextPrompt(
          content.slice(content.indexOf("*") + 1, content.lastIndexOf("*"))
        );

        if (ibmResponse.error != "") {
          event.target.value = ibmResponse.error;
        } else {
          event.target.value = ibmResponse.result;
          event.target.value = event.target.value.slice(0, 499);
        }

        document.querySelector("body").style.pointerEvents = "auto";
      }
    }
  });

// cart related functions
document.querySelector("#cartHeader").addEventListener("click", async () => {
  chrome.tabs.create({
    url: "https://versatilevats.com/ibm/c4c/extension/checkout.html",
  });
});

document.querySelector("#shoppingCart").addEventListener("click", async () => {
  document.querySelector("#cartDetails").style.display = "flex";

  //populate the cart:
  const mainDiv = document.querySelector("#cartProducts");
  mainDiv.innerHTML = "";

  let totalPrice = 0;
  let pickupTotal = 0;

  await chrome.storage.local.get(["cart", "tag"]).then((data) => {
    let itr = 0;
    console.log(data["cart"]);

    if (data["cart"].count == 0) {
      document.querySelector("#cartTotal").textContent = "0";
      document.querySelector("#pickupTotal").textContent = "0";
      mainDiv.innerHTML = `<span style="color: red; font-weight: bold; font-size: 1rem; text-align: center">There are 0 items in your cart!</span>`;
    } else {
      for (let object in data["cart"]) {
        const mainContainer = document.createElement("div");

        // capuring the cart items
        if (data["cart"][object].name) {
          totalPrice += data["cart"][object].price;
          mainContainer.style.width = "90%";
          mainContainer.style.margin = "auto";

          const firstChild = document.createElement("div");
          firstChild.style.display = "flex";
          firstChild.style.borderRadius = "10px";
          firstChild.style.alignItems = "center";
          firstChild.style.justifyContent = "space-between";
          firstChild.style.background = "rgb(240, 240, 240)";

          let addIcon = document.createElement("img");
          addIcon.width = 20;
          addIcon.height = 20;
          addIcon.style.cursor = "pointer";

          let showAddIcon = true;
          // count for cart is 0 for empty carts
          if (object === object) {
            showAddIcon = false;
          }

          addIcon.addEventListener(
            "click",
            async (
              event,
              name = data["cart"][object].name,
              company = data["cart"][object].company,
              desc = data["cart"][object].desc,
              img = object
            ) => {
              await chrome.storage.local.get(["cart", "tag"]).then((row) => {
                let newCart = row["cart"];
                newCart.count = row["cart"].count - 1;

                totalPrice -= newCart[img].price;
                if (newCart[img].pickup && row["tag"] != "NA") {
                  pickupTotal -= newCart[img].price;
                }
                document.querySelector("#cartTotal").textContent = totalPrice;
                document.querySelector("#pickupTotal").textContent =
                  pickupTotal;

                delete newCart[img];

                chrome.storage.local.set({
                  cart: newCart,
                });

                cartCount.textContent = parseInt(cartCount.textContent) - 1;

                event.target.parentElement.parentElement.remove();
                if (cartCount.textContent == 0)
                  mainDiv.innerHTML = `<span style="color: red; font-weight: bold; font-size: 1rem; text-align: center">There are 0 items in your cart!</span>`;

                // replace the button with the ADD BUTTON
                event.target.src =
                  "https://img.icons8.com/fluency/30/add--v1.png";
                event.target.setAttribute("id", "add");
              });
            }
          );

          if (showAddIcon) {
            addIcon.src = "https://img.icons8.com/fluency/30/add--v1.png";
            addIcon.setAttribute("id", "add");
          } else {
            addIcon.src = "https://img.icons8.com/fluency/30/minus.png";
            addIcon.setAttribute("id", "minus");
          }

          firstChild.appendChild(addIcon);

          const firstPara = document.createElement("p");
          firstPara.style.fontSize = "1rem";
          firstPara.textContent = data["cart"][object].name;

          const secondPara = document.createElement("p");
          secondPara.style.fontSize = "1rem";
          secondPara.innerHTML = `By <b>${data["cart"][object].company}</b>`;

          firstChild.appendChild(firstPara);
          firstChild.appendChild(secondPara);

          const secondChild = document.createElement("div");
          secondChild.style.width = "100%";
          secondChild.style.padding = "10px";
          secondChild.style.display = "flex";
          secondChild.style.alignItems = "center";
          secondChild.style.justifyContent = "space-evenly";

          const secondChildDiv = document.createElement("div");

          const pDesc = document.createElement("p");
          pDesc.textContent = data["cart"][object].desc;

          const price = document.createElement("p");
          price.textContent = `$ ${data["cart"][object].price}`;

          secondChildDiv.appendChild(pDesc);
          secondChildDiv.appendChild(price);

          // check for the PICKUP option
          if (data["cart"][object].pickup && data["tag"] != "NA") {
            pickupTotal += data["cart"][object].price;
            const pickup = document.createElement("p");
            pickup.innerHTML = "<u>Pickup available</u>";
            secondChildDiv.appendChild(pickup);
          }

          const img = document.createElement("img");
          img.src = object;
          img.style.borderRadius = "20px";
          img.setAttribute("width", "50px");
          img.setAttribute("height", "50px");

          secondChild.appendChild(secondChildDiv);
          secondChild.appendChild(img);

          itr++;

          mainContainer.appendChild(firstChild);
          mainContainer.appendChild(secondChild);
          mainDiv.appendChild(mainContainer);
        }
      }
      document.querySelector("#cartTotal").textContent = totalPrice;
      document.querySelector("#pickupTotal").textContent = pickupTotal;
    }
    if (data["tag"] != "NA") {
      document.querySelector(
        "#tag"
      ).innerHTML = `Tag ID: <b>${data["tag"]}</b>`;
    } else {
      document.querySelector(
        "#tag"
      ).innerHTML = `<b>Oops, you do not have a TAG</b>`;
    }
  });
});

document.querySelector("#closeCart").addEventListener("click", async () => {
  document.querySelector("#loader").style.display = "flex";
  document.querySelector("#cartDetails").style.display = "none";
  document.querySelector("#recommendations").style.display = "none";

  await chrome.storage.local.get(["currentSection"]).then(async (data) => {
    if (data["currentSection"] === "recommendations") {
      await populateRecommendations();
      document.querySelector("#recommendations").style.display = "flex";
    } else if (data["currentSection"] === "brands") {
      document.querySelector("#brandsProducts").innerHTML = "";
    }
  });

  document.querySelector("#loader").style.display = "none";
});

// data is being sent from the extension to the checkout page
document.querySelector("#checkoutCart").addEventListener("click", async () => {
  const {
    cart,
    binId,
    tfuels,
    address,
    thetaTag,
    userEmail,
    cartTotal,
    privateKey,
    pickupPrice,
  } = await chrome.storage.local.get().then((data) => {
    return {
      cart: data["cart"],
      binId: data["binId"],
      thetaTag: data["tag"],
      tfuels: data["tfuels"],
      userEmail: data["email"],
      address: data["address"],
      privateKey: data["privateKey"],
      cartTotal: document.querySelector("#cartTotal").textContent,
      pickupPrice: document.querySelector("#pickupTotal").textContent,
    };
  });

  // grab the binId first
  const bin = await chrome.storage.local.get().then(async (data) => {
    // fetch the id from the db if it is not in the localStorage
    if (data.binId == undefined) {
      // grab the binId from the server
      const binId = JSON.parse(
        await serverCall(
          {
            phone: data.phone,
          },
          "findBinId"
        )
      );

      document.querySelector("#error").style.visibility = "hidden";

      if (binId.error != "") {
        document.querySelector("#error").style.visibility = "visible";
        document.querySelector("#error").textContent =
          "For first time users: Bin is being created, so wait for sometime before checking out";
        document.querySelector("#cartDetails").style.display = "none";
        return null;
      }
      await chrome.storage.local.set({
        binId: binId.result,
      });

      return binId.result;
    } else return data["binId"];
  });

  if (cart.count == 0) {
    return;
  }
  if (bin == null) return;

  // get the contents of the bin
  let binData = JSON.parse(await serverCall({ binId: bin }, "getBin"));
  if (binData.error != "") return;

  binData = binData.result;

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (cart.count > 0) {
    // sending the cart details to the content script
    await chrome.tabs
      .sendMessage(tab.id, {
        cart,
        binId,
        tfuels,
        address,
        binData,
        thetaTag,
        cartTotal,
        userEmail,
        privateKey,
        pickupPrice,
      })
      .then(() => {
        window.close();
      })
      .catch((err) => {
        document.querySelector("#cartDetails").style.display = "none";
        document.querySelector("#error").style.visibility = "visible";
        document.querySelector("#error").textContent =
          "Be on the CHECKOUT page by clicking on the 'Your Cart' text";
      });
  } else {
    document.querySelector("#cartDetails").style.display = "none";
    document.querySelector("#error").style.visibility = "visible";
    document.querySelector("#error").textContent =
      "Atleast add a single item before checking out";
  }
});

// resetting the credentials for already logged in details
document
  .querySelector("#resetCredentials")
  .addEventListener("click", async (event) => {
    document.querySelector("#loginEmail").value = "";
    document.querySelector("#loginPwd").value = "";

    document.querySelector("#loginEmail").removeAttribute("disabled");
    document.querySelector("#loginPwd").removeAttribute("disabled");

    await chrome.storage.local.clear();

    event.target.style.display = "none";
  });

// running pre-checks on the data
chrome.storage.local
  .get(["currentSection", "username", "email", "score", "pwd", "cart"])
  .then((data) => {
    // for the first time use
    if (data["username"] == undefined || data["username"] == "") {
      console.log("FIRST TIME USER");
      chrome.storage.local.set({
        cart: { count: 0, tagAmount: 0 },
        currentSection: "",
        username: "",
        email: "",
        score: 0,
        tag: "",
      });
    } else {
      cartCount.textContent = data["cart"].count;
      document.querySelector("#resetCredentials").style.display = "block";

      document.querySelector("#loginEmail").setAttribute("disabled", "");
      // document.querySelector("#loginPwd").setAttribute("disabled", "")

      console.log("OLD USER");
      console.log(data["email"]);
      document.querySelector("#loginEmail").value = data["email"];
      // document.querySelector("#loginPwd").value = data["pwd"]
      chrome.storage.local.set({
        currentSection: "",
      });
    }
  });

async function serverCall(
  request,
  endpoint,
  SERVER = NODE_SERVER_URL,
  method = "POST"
) {
  document.querySelector("body").style.pointerEvents = "none";
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
    .then((response) => response.text())
    .then((result) => {
      document.querySelector("body").style.pointerEvents = "auto";
      return result;
    })
    .catch((error) => {
      return `ERROR:Server error`;
    });
}

const toggleSections = ["#loginForm"];

async function populateRecommendations() {
  document.querySelector("#recProducts").textContent = "";
  await chrome.storage.local.get(["email", "cart"]).then(async (data) => {
    let personalizedContent = await serverCall(
      {
        email: data["email"],
      },
      "recommendations"
    );

    personalizedContent = JSON.parse(personalizedContent);
    console.log(personalizedContent);

    const mainDiv = document.querySelector("#recProducts");

    for (let a = 0; a < personalizedContent.length; a++) {
      const mainContainer = document.createElement("div");
      mainContainer.style.width = "90%";
      mainContainer.style.margin = "auto";

      const firstChild = document.createElement("div");
      firstChild.style.display = "flex";
      firstChild.style.borderRadius = "10px";
      firstChild.style.alignItems = "center";
      firstChild.style.justifyContent = "space-between";
      firstChild.style.background = "rgb(240, 240, 240)";

      let addIcon = document.createElement("img");
      addIcon.width = 20;
      addIcon.height = 20;
      addIcon.style.cursor = "pointer";

      let showAddIcon = true;
      // count for cart is 0 for empty carts
      if (data["cart"].count > 0) {
        for (let object in data["cart"]) {
          if (object === personalizedContent[a]["pLoc"]) {
            showAddIcon = false;
            break;
          }
        }
      }

      addIcon.addEventListener(
        "click",
        async (
          event,
          name = personalizedContent[a]["pName"],
          company = personalizedContent[a]["companyName"].toUpperCase(),
          desc = personalizedContent[a]["pDesc"],
          img = personalizedContent[a]["pLoc"],
          price = personalizedContent[a]["pPrice"],
          pickup = personalizedContent[a]["pickup"],
          companyType = personalizedContent[a]["pCategory"]
        ) => {
          // Adding the object to the CART
          if (
            event.target.getAttribute("id") === "add" &&
            data["cart"].tagAmount == 0
          ) {
            await chrome.storage.local.get(["cart"]).then((row) => {
              let newCart = row["cart"];
              newCart.count = row["cart"].count + 1;
              newCart[img] = {
                company,
                desc,
                name,
                price,
                pickup,
                companyType,
              };

              chrome.storage.local.set({
                cart: newCart,
              });

              cartCount.textContent = parseInt(cartCount.textContent) + 1;

              // replace the button with the MINUS BUTTON
              event.target.src = "https://img.icons8.com/fluency/30/minus.png";
              event.target.setAttribute("id", "minus");
            });
          } else if (
            event.target.getAttribute("id") === "add" &&
            data["cart"].tagAmount > 0
          ) {
            document.querySelector("#error").style.visibility = "visible";
            document.querySelector("#error").textContent =
              "Complete the last pickup order first";
          }
          // deleting the object from the CART
          else if (event.target.getAttribute("id") === "minus") {
            await chrome.storage.local.get(["cart"]).then((row) => {
              let newCart = row["cart"];
              newCart.count = row["cart"].count - 1;
              delete newCart[img];

              chrome.storage.local.set({
                cart: newCart,
              });

              cartCount.textContent = parseInt(cartCount.textContent) - 1;

              // replace the button with the ADD BUTTON
              event.target.src =
                "https://img.icons8.com/fluency/30/add--v1.png";
              event.target.setAttribute("id", "add");
            });
          }
        }
      );

      if (showAddIcon) {
        addIcon.src = "https://img.icons8.com/fluency/30/add--v1.png";
        addIcon.setAttribute("id", "add");
      } else {
        addIcon.src = "https://img.icons8.com/fluency/30/minus.png";
        addIcon.setAttribute("id", "minus");
      }

      const firstPara = document.createElement("p");
      firstPara.style.fontSize = "1rem";
      firstPara.textContent = personalizedContent[a]["pName"];

      const secondPara = document.createElement("p");
      secondPara.style.fontSize = "1rem";
      secondPara.innerHTML = `By <b>${personalizedContent[a][
        "companyName"
      ].toUpperCase()}</b>`;

      firstChild.appendChild(firstPara);
      firstChild.appendChild(secondPara);
      firstChild.appendChild(addIcon);

      const secondChild = document.createElement("div");
      secondChild.style.width = "100%";
      secondChild.style.padding = "10px";
      secondChild.style.display = "flex";
      secondChild.style.alignItems = "center";
      secondChild.style.justifyContent = "space-evenly";

      const secondChildDiv = document.createElement("div");

      const pDesc = document.createElement("p");
      pDesc.textContent = personalizedContent[a]["pDesc"];

      const price = document.createElement("p");
      price.textContent = `$ ${personalizedContent[a]["pPrice"]}`;

      const emptyPara = document.createElement("p");

      const pDetails = document.createElement("p");
      let gender = personalizedContent[a]["pGender"];
      let ageGroup = personalizedContent[a]["pAgeGroup"];

      if (gender == "m") gender = "males";
      else if (gender == "f") gender = "females";
      else gender = "every gender";

      if (ageGroup == "everyone") ageGroup = "every";

      pDetails.innerHTML = `This product is for<b>${gender}</b> & for <b>${ageGroup} age group</b>`;

      secondChildDiv.appendChild(pDesc);
      secondChildDiv.appendChild(price);
      secondChildDiv.appendChild(emptyPara);
      secondChildDiv.appendChild(pDetails);

      const img = document.createElement("img");
      img.src = personalizedContent[a]["pLoc"];
      img.style.borderRadius = "20px";
      img.setAttribute("width", "80px");
      img.setAttribute("height", "80px");

      if (a % 2 == 0) {
        secondChild.appendChild(secondChildDiv);
        secondChild.appendChild(img);
      } else {
        secondChild.appendChild(img);
        secondChild.appendChild(secondChildDiv);
      }

      mainContainer.appendChild(firstChild);
      mainContainer.appendChild(secondChild);

      mainDiv.appendChild(mainContainer);
    }
  });
}

function filterRecommendations(textToSearch) {
  chrome.storage.local.get(["currentSection"]).then(async (data) => {
    if (data["currentSection"] === "recommendations") {
      document.querySelector("#recProducts").childNodes.forEach((node) => {
        if (
          node.firstChild.firstChild.textContent
            .toLowerCase()
            .includes(textToSearch.toLowerCase())
        )
          node.style.display = "block";
        else node.style.display = "none";
      });
    } else if (data["currentSection"] === "brands") {
      document.querySelector("#brandsProducts").childNodes.forEach((node) => {
        if (
          node.firstChild.firstChild.firstChild.textContent
            .toLowerCase()
            .includes(textToSearch.toLowerCase())
        )
          node.style.display = "block";
        else node.style.display = "none";
      });
    }
  });
}

document
  .querySelector("#filterRecommendations")
  .addEventListener("keyup", (e) => {
    filterRecommendations(e.target.value);
  });

async function navigateTo(from, to) {
  if (to == "recommendations") {
    document.querySelector("#wallet").style.display = "block";
    document.querySelector(
      "#header"
    ).firstElementChild.firstElementChild.style.display = "flex";

    document.querySelector("#filterRecommendations").value = "";
    document.querySelector("#filterRecommendations").style.display = "block";

    console.log("CALLING THE FUNCTION");
    document.querySelector(`#${from}`).style.display = "none";
    document.querySelector("#loader").style.display = "flex";
    await populateRecommendations();
    document.querySelector("#loader").style.display = "none";
    document.querySelector(`#${to}`).style.display = "flex";
    console.log("OUTSIDE");
  } else if (to == "brands") {
    document.querySelector("#mlImageInput").value = "";
    document.querySelector("#mlLabels").style.display = "none";

    document.querySelector("#brandCategory").value = "default";
    document.querySelector("#brandGender").value = "default";
    document.querySelector("#brandAge").value = "default";

    document.querySelector("#brandsProducts").textContent = "";
    document.querySelector("#brandName").innerHTML = "";
    await populateBrands();
    document.querySelector("#filterRecommendations").style.display = "none";
    document.querySelector(`#${from}`).style.display = "none";
    document.querySelector(`#${to}`).style.display = "flex";

    // hide the wallet and the name division
    document.querySelector("#wallet").style.display = "none";
    document.querySelector(
      "#header"
    ).firstElementChild.firstElementChild.style.display = "none";
  } else if (to == "rewards") {
    chrome.storage.local.get(["email"]).then(async (data) => {
      const res = await serverCall({ email: data["email"] }, "getAchievements");
      if (res.includes("f")) {
        document.querySelector("#feedbackReward").style.filter = "grayscale(0)";
      }
    });
    document.querySelector("#filterRecommendations").style.display = "none";
    document.querySelector(`#${from}`).style.display = "none";
    document.querySelector(`#${to}`).style.display = "flex";

    // hide the wallet and the name division
    document.querySelector("#wallet").style.display = "none";
    document.querySelector(
      "#header"
    ).firstElementChild.firstElementChild.style.display = "none";
  } else {
    document.querySelector("#brandsFeedbackDiv").style.visibility = "hidden";
    document.querySelector("#brandsFeedback").value = "default";
    document.querySelector("#feedbackType").value = "default";

    // populating the brands field
    let requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let brands = await fetch(`${NODE_SERVER_URL}/listBrands`, requestOptions)
      .then((response) => response.text())
      .then((result) => result)
      .catch((error) => console.log("error", error));

    if (brands.includes("ERROR")) {
      chrome.tts.speak(`No brands are available as of now`, {
        enqueue: true,
        volume: 0.7,
      });
    } else {
      brands = JSON.parse(brands);

      const brandDiv = document.querySelector("#brandsFeedback");

      brands.forEach((item) => {
        const option = document.createElement("option");
        option.setAttribute("value", item["bName"].toLowerCase());
        option.textContent = item["bName"].toUpperCase();
        brandDiv.appendChild(option);
      });
    }

    document.querySelector("#filterRecommendations").style.display = "none";
    document.querySelector(`#${from}`).style.display = "none";
    document.querySelector(`#${to}`).style.display = "flex";

    // hide the wallet and the name division
    document.querySelector("#wallet").style.display = "none";
    document.querySelector(
      "#header"
    ).firstElementChild.firstElementChild.style.display = "none";
  }

  chrome.storage.local.set({ currentSection: to });
}

// making the heading work as the link to the RECEOMMENDATIONS section
document
  .querySelector("#extensionHeading h1")
  .addEventListener("click", async () => {
    const fromSection = await chrome.storage.local
      .get(["currentSection"])
      .then((result) => {
        return result["currentSection"];
      })
      .catch((err) => {
        return err;
      });

    console.log("FROM: " + fromSection);

    if (fromSection !== "") {
      navigateTo(fromSection, "recommendations");
    } else {
      if (
        document.querySelector("#loginForm").style.display === "none" &&
        document.querySelector("#signupForm").style.display === "flex"
      ) {
        location.reload();
      }
    }
  });

// logging in the user
document
  .querySelector("#submitLoginForm")
  .addEventListener("click", async (el) => {
    el.preventDefault();
    const pwd = document.querySelector("#loginPwd");
    const email = document.querySelector("#loginEmail");

    if (
      (pwd.value === "" || email.value === "") &&
      document.querySelector("#loginOTP").style.display == "none"
    ) {
      document.querySelector("#loginError").style.visibility = "visible";
      document.querySelector("#loginError").textContent = "Provide all values";
    } else if (document.querySelector("#loginOTP").style.display == "none") {
      document.querySelector("#loginError").style.visibility = "hidden";
      document.querySelector("#loader").style.display = "flex";
      document.querySelector("#loginForm").style.display = "none";

      await commonLogin(false);
    } else await verifyLoginOTP(document.querySelector("#loginOTP").value);
  });

document.querySelectorAll("footer p").forEach((node) => {
  node.addEventListener("click", async (el) => {
    const fromSection = await chrome.storage.local
      .get(["currentSection"])
      .then((data) => {
        console.log(data);
        return data["currentSection"];
      });
    console.log("From: " + fromSection);
    console.log("To: " + el.target.id.split("To")[1]);

    if (fromSection !== "") {
      navigateTo(fromSection, el.target.id.split("To")[1]);
    } else {
      console.log("LOG IN FIRST");
      if (document.querySelector("#signupForm").style.display === "flex") {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          "Login/signup first";
      } else {
        document.querySelector("#loginError").style.visibility = "visible";
        document.querySelector("#loginError").textContent =
          "Login/signup first";
      }
    }
  });
});

document.querySelector("#takeToSignup").addEventListener("click", () => {
  document.querySelector("#loginForm").style.display = "none";
  document.querySelector("#signupForm").style.display = "flex";
  document.querySelector("#loginError").style.visibility = "hidden";
});

// signing up the user
document
  .querySelector("#submitSignupForm")
  .addEventListener("click", async (el) => {
    el.preventDefault();

    if (el.target.value == "Validate Wallet") {
      await chrome.storage.local.clear();
      await chrome.storage.local.set({
        cart: { count: 0, tagAmount: 0 },
        currentSection: "",
        username: "",
        email: "",
        score: 0,
        tag: "",
      });
      await checkWallet();
      return;
    }

    const email = document.querySelector("#signupEmail").value;
    const name = document.querySelector("#signupName").value;
    let phone = document.querySelector("#signupPhone").value;

    // will remove spaces, "(", ")", from phone numbers
    phone = phone.replaceAll("(", "");
    phone = phone.replaceAll(")", "");
    phone = phone.replaceAll(" ", "");

    const gender = document.querySelector("#signupGender").value;
    const DOB = document.querySelector("#signupDOB").value;
    const pwd = document.querySelector("#signupPwd").value;

    const age =
      new Date().getFullYear() -
      document.querySelector("#signupDOB").value.split("-")[0];
    let ageGroup;

    if (age <= 14) ageGroup = "kids";
    else if (age >= 15 && age <= 25) ageGroup = "youth";
    else if (age >= 26 && age <= 50) ageGroup = "adult";
    else if (age > 50) ageGroup = "old";

    console.log(grabInterestValues("true").trim());
    const d = new Date();

    const interestsOptions = ["Clothing", "Furniture", "Electronics", "Food"];

    const signupOTPDiv = document.querySelector("#signupOTP");
    const divsToBeChanged = [
      "signupName",
      "signupEmail",
      "signupPhone",
      "signupDOB",
      "signupGender",
      "signupPwd",
    ];

    if (el.target.value == "GET OTP") {
      if (name == "") {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          "Name should not be empty";
      } else if (phone.includes("e") || !Number(phone)) {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          phone == ""
            ? "Phone number should not be empty"
            : "Phone number should not have alphabets";
      } else if (DOB === "") {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          "Please select your DOB";
      } else if (gender === "default") {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          "Please select a gender";
      } else if (pwd.length < 8) {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          "Password should be between 8-12 characters";
      } else if (!grabInterestValues()) {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector("#signupError").textContent =
          "Select atleast 1 interest";
      }
      // if every input is valid
      else {
        // have to make a call to GLITCH server to send the OTP and verify it
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        let raw = JSON.stringify({
          name: name,
          email: email,
          phone: phone,
        });

        let requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        const sendOTP = await fetch(`${GLITCH_SERVER}/sendOTP`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            console.log("Inside the GLITCH function to send OTP");
            console.log(result);
            return result;
          })
          .catch((error) => {
            console.log(error);
            return { error: error };
          });

        interestsOptions.forEach((item, index) => {
          if (!(sendOTP.error != undefined)) {
            document.getElementsByName(`${item}`)[0].style.cursor = "no-drop";
            document
              .getElementsByName(`${item}`)[0]
              .setAttribute("disabled", true);
          }
        });

        // make some UI changes ("sendOTP.error != undefined" corresponds to ERRONEOUS case)
        if (!(sendOTP.error != undefined)) {
          signupOTPDiv.style.cursor = "auto";
          signupOTPDiv.removeAttribute("disabled");
        }

        divsToBeChanged.forEach((div) => {
          if (!(sendOTP.error != undefined)) {
            document.querySelector(`#${div}`).setAttribute("disabled", true);
            document.querySelector(`#${div}`).style.cursor = "no-drop";
          }
        });

        // some error occured
        if (sendOTP.error != undefined) {
          document.querySelector("#signupError").style.visibility = "visible";
          document.querySelector("#signupError").textContent = sendOTP.error;
        } else {
          document.querySelector("#signupError").style.visibility = "hidden";
          document.querySelector("#signupError").textContent = "";

          document
            .querySelector("#submitSignupForm")
            .setAttribute("value", "Verify OTP");
        }
      }
    }
    // Verifying the OTP
    else if (el.target.value == "Verify OTP") {
      const privateKey = await chrome.storage.local
        .get("privateKey")
        .then((data) => data.privateKey);

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      let raw = JSON.stringify({
        phone,
        name,
        email,
        privateKey,
        buyerDob: DOB,
        buyerGender: gender,
        buyerAgeGroup: ageGroup,
        otp: signupOTPDiv.value,
        buyerInterests: grabInterestValues("true").trim(),
      });

      let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const verifyOTP = await fetch(
        `${GLITCH_SERVER}/verifyOTP`,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          console.log("Inside the GLITCH function to verify OTP");
          console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          return { error: error };
        });

      if (verifyOTP.error != undefined) {
        document.querySelector("#signupError").style.visibility = "visible";
        document.querySelector(
          "#signupError"
        ).textContent = `${verifyOTP.error}. Reloading!!`;

        // Resetting the window as new OTP has to be requested
        setTimeout(() => {
          location.reload();
        }, 5000);
      } else {
        const r = await serverCall(
          {
            uDOB: DOB,
            uName: name,
            uEmail: email,
            uPhone: phone,
            uGender: gender,
            uAgeGroup: ageGroup,
            interests: grabInterestValues("true").trim(),
            uPwd: document.querySelector("#signupPwd").value,
            lastLogin: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
          },
          "createUser"
        );

        console.log(r);

        // checking whether the mnemonic field is set! If yes, then send an intimation email to the user about the new wallet
        const { address, privateKey, mnemonic, password, keystore } =
          await chrome.storage.local.get().then((data) => {
            return {
              address: data["address"],
              mnemonic: data["mnemonic"],
              keystore: data["keystore"],
              password: data["keystorePwd"],
              privateKey: data["privateKey"],
            };
          });
        if (mnemonic) {
          await serverCall(
            {
              address,
              mnemonic,
              to: email,
              team: name,
              privateKey,
              password,
              keystore,
            },
            "",
            "https://versatilevats.com/ibm/c4c/extension/mail.php"
          );

          // remove the keystore, and password from the local storage, and mnemonic
          await chrome.storage.local.remove("keystore");
          await chrome.storage.local.remove("mnemonic");
          await chrome.storage.local.remove("keystorePwd");
        }

        chrome.storage.local.set({
          tag: "",
          score: 0,
          email: email,
          phone: phone,
          username: name,
          cart: { count: 0, tagAmount: 0 },
          currentSection: "recommendations",
          pwd: document.querySelector("#signupPwd").getAttribute("pwd"),
        });

        document.querySelector("#score").textContent = 0;
        document.querySelector("#header").style.display = "block";
        document.querySelector("#username").textContent = name;

        document.querySelector("#loader").style.display = "none";

        const { tfuels, walletAddress } = await chrome.storage.local
          .get(["tfuels", "address"])
          .then((data) => {
            return {
              tfuels: data["tfuels"],
              walletAddress: data["address"],
            };
          });
        document.querySelector("#tfuels").textContent = tfuels;
        document.querySelector("#walletAddress").textContent = walletAddress;

        // deploying the smart contracts for the 4 NFTs
        serverCall({ phone }, "deployContract", THETA_URL);

        // navigating to the recommendations section
        navigateTo("signupForm", "recommendations");
      }
    }
  });

function grabInterestValues(createUser = "") {
  const nameElements = ["Clothing", "Food", "Electronics", "Furniture"];
  let selected = 0;
  let interests = "";

  nameElements.forEach((item) => {
    if (document.getElementsByName(item)[0].checked) {
      if (createUser == "") selected++;
      else {
        interests += document.getElementsByName(item)[0].value + " ";
      }
    }
  });

  if (createUser == "") return selected;
  else return interests;
}

document.querySelector("#interestOptions").addEventListener("click", (el) => {
  const totalSelected = grabInterestValues();

  if (totalSelected >= 3) {
    document.querySelector("#signupError").style.visibility = "visible";
    document.querySelector("#signupError").textContent =
      "A max  of 2 interests can be selected";

    document.querySelector("#submitSignupForm").style.visibility = "hidden";
  } else {
    document.querySelector("#submitSignupForm").style.visibility = "visible";

    document.querySelector("#signupError").style.visibility = "hidden";
  }
});

document.querySelector("#feedbackType").addEventListener("click", (e) => {
  if (e.target.value === "Brand Feeback")
    document.querySelector("#brandsFeedbackDiv").style.visibility = "visible";
  else document.querySelector("#brandsFeedbackDiv").style.visibility = "hidden";
});

document
  .querySelector("#submitFeedback")
  .addEventListener("click", async (el) => {
    el.preventDefault();

    let msg = document.querySelector("#feedbackMsg").value;
    const type = document.querySelector("#feedbackType").value;

    if (msg == "") {
      document.querySelector("#feedbackError").style.visibility = "visible";
      document.querySelector("#feedbackError").textContent =
        "Please provide a message";
    } else if (type == "default") {
      document.querySelector("#feedbackError").style.visibility = "visible";
      document.querySelector("#feedbackError").textContent =
        "Please select a feedback type";
    } else {
      document.querySelector("#feedbackError").style.visibility = "hidden";

      let sendTo = "";
      // if the feeback is BRANDS FEEDBACK, then the email shoudl be sent to the particular brand email
      if (type === "Brand Feeback") {
        sendTo = document.querySelector("#brandsFeedback").value.toLowerCase();
        if (
          document.querySelector("#brandsFeedbackDiv").style.visibility ===
          "hidden"
        ) {
          document.querySelector("#brandsFeedbackDiv").style.visibility =
            "visible";
          document.querySelector("#feedbackError").style.visibility = "visible";
          document.querySelector("#feedbackError").textContent =
            "Make sure that you want to submit the feedback to the selected brand only ";
          return;
        }
      }

      await chrome.storage.local
        .get(["email", "username", "address"])
        .then(async (data) => {
          // fetch the tone of the feedback
          const tone = await serverCall(
            {
              feedback: msg,
            },
            "getFeebackTone"
          );

          let feedbackTone = JSON.parse(tone);

          if (feedbackTone.error != "") feedbackTone = "NA";
          else feedbackTone = feedbackTone.result.replaceAll("\n", "");

          console.log(feedbackTone);

          const res = await serverCall(
            {
              email: data["email"],
              name: data["username"],
              type: type,
              msg: msg,
              sendTo: sendTo,
              tone: feedbackTone,
            },
            "createFeedback"
          );

          document.querySelector("#feedbackMsg").value = "";

          document.querySelector("#feedbackType").value = "default";
          document.querySelector("#brandsFeedbackDiv").style.visibility =
            "hidden";

          // sending "10 tfuels" to the user for submitting the first feedback
          if (res.includes("Achievement")) {
            serverCall(
              {
                from: "0x74c0073A1b141aFd67764AB114Fc0beAd5043D8F",
                to: data["address"],
                amount: 10,
              },
              "sendTfuel",
              THETA_URL
            );
            chrome.tts.speak(
              `Hi ${data["username"]}, your first feedback was successfully submitted. 10 tfuels will be credited into your wallet. Congrats on unlocking the feedback badge`,
              { enqueue: true, volume: 0.7 }
            );
            navigateTo("feedbackForm", "rewards");
          } else {
            chrome.tts.speak(
              `Hi ${data["username"]}, your feedback was successfully submitted`,
              { enqueue: true, volume: 0.7 }
            );
          }
        });
    }
  });

async function populateBrands() {
  var requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  let brands = await fetch(`${NODE_SERVER_URL}/listBrands`, requestOptions)
    .then((response) => response.text())
    .then((result) => result)
    .catch((error) => console.log("error", error));

  if (brands.includes("ERROR")) {
    chrome.tts.speak(`No brands are available as of now`, {
      enqueue: true,
      volume: 0.7,
    });
  } else {
    brands = JSON.parse(brands);

    const brandDiv = document.querySelector("#brandName");
    const option = document.createElement("option");
    option.setAttribute("value", "default");
    option.textContent = "Select all brands";
    brandDiv.appendChild(option);

    brands.forEach((item) => {
      const option = document.createElement("option");
      option.setAttribute("value", item["bName"].toLowerCase());
      option.textContent = item["bName"].toUpperCase();
      brandDiv.appendChild(option);
    });
  }
}

async function populateProducts(products) {
  document.querySelector("#filterRecommendations").value = "";
  document.querySelector("#filterRecommendations").style.display = "block";

  const mainDiv = document.querySelector("#brandsProducts");
  mainDiv.textContent = "";

  products = JSON.parse(products);

  await chrome.storage.local.get(["cart"]).then(async (data) => {
    for (let a = 0; a < products.length; a++) {
      const mainContainer = document.createElement("div");
      mainContainer.style.width = "90%";
      mainContainer.style.margin = "auto";

      const firstChild = document.createElement("div");
      firstChild.style.display = "flex";
      firstChild.style.borderRadius = "10px";
      firstChild.style.alignItems = "center";
      firstChild.style.justifyContent = "space-between";
      firstChild.style.background = "rgb(240, 240, 240)";

      const firstPara = document.createElement("p");
      firstPara.style.fontSize = "1rem";
      firstPara.style.cursor = "pointer";
      firstPara.textContent = products[a]["pName"]
        ? products[a]["pName"]
        : products[a]["pName"];

      let addIcon = document.createElement("img");
      addIcon.width = 20;
      addIcon.height = 20;
      addIcon.style.cursor = "pointer";

      let showAddIcon = true;
      // count for cart is 0 for empty carts
      if (data["cart"].count > 0) {
        for (let object in data["cart"]) {
          if (
            object === products[a]["pLoc"]
              ? products[a]["pLoc"]
              : products[a]["ploc"]
          ) {
            showAddIcon = false;
            break;
          }
        }
      }

      addIcon.addEventListener(
        "click",
        async (
          event,
          name = products[a]["pName"] == undefined
            ? products[a]["pname"]
            : products[a]["pName"],
          company = products[a]["companyName"] == undefined
            ? products[a]["companyname"].toUpperCase()
            : products[a]["companyName"].toUpperCase(),
          desc = products[a]["pDesc"] == undefined
            ? products[a]["pdesc"]
            : products[a]["pDesc"],
          img = products[a]["pLoc"] == undefined
            ? products[a]["ploc"]
            : products[a]["pLoc"],
          price = products[a]["pPrice"] == undefined
            ? products[a]["pprice"]
            : products[a]["pPrice"],
          pickup = products[a]["pickup"],
          companyType = products[a]["pCategory"] == undefined
            ? products[a]["pcategory"]
            : products[a]["pCategory"]
        ) => {
          // Adding the object to the CART
          if (
            event.target.getAttribute("id") === "add" &&
            data["cart"].tagAmount == 0
          ) {
            await chrome.storage.local.get(["cart"]).then((row) => {
              let newCart = row["cart"];
              newCart.count = row["cart"].count + 1;
              newCart[img] = {
                company: company,
                desc: desc,
                name: name,
                price: price,
                pickup: pickup,
                companyType: companyType,
              };

              chrome.storage.local.set({
                cart: newCart,
              });

              cartCount.textContent = parseInt(cartCount.textContent) + 1;

              // replace the button with the MINUS BUTTON
              event.target.src = "https://img.icons8.com/fluency/30/minus.png";
              event.target.setAttribute("id", "minus");
            });
          } else if (
            event.target.getAttribute("id") === "add" &&
            data["cart"].tagAmount > 0
          ) {
            document.querySelector("#error").style.visibility = "visible";
            document.querySelector("#error").textContent =
              "Complete the last pickup order first";
          }
          // deleting the object from the CART
          else if (event.target.getAttribute("id") === "minus") {
            await chrome.storage.local.get(["cart"]).then((row) => {
              let newCart = row["cart"];
              newCart.count = row["cart"].count - 1;
              delete newCart[img];

              chrome.storage.local.set({
                cart: newCart,
              });

              cartCount.textContent = parseInt(cartCount.textContent) - 1;

              // replace the button with the ADD BUTTON
              event.target.src =
                "https://img.icons8.com/fluency/30/add--v1.png";
              event.target.setAttribute("id", "add");
            });
          }
        }
      );

      if (showAddIcon) {
        addIcon.src = "https://img.icons8.com/fluency/30/add--v1.png";
        addIcon.setAttribute("id", "add");
      } else {
        addIcon.src = "https://img.icons8.com/fluency/30/minus.png";
        addIcon.setAttribute("id", "minus");
      }

      const secondPara = document.createElement("p");
      secondPara.style.fontSize = "1rem";
      if (products[a]["companyName"] == undefined) {
        secondPara.innerHTML = `By <b>${products[a][
          "companyname"
        ].toUpperCase()}</b>`;
      } else {
        secondPara.innerHTML = `By <b>${products[a][
          "companyName"
        ].toUpperCase()}</b>`;
      }

      firstChild.appendChild(firstPara);
      firstChild.appendChild(secondPara);
      firstChild.appendChild(addIcon);

      const secondChild = document.createElement("div");
      secondChild.style.width = "100%";
      secondChild.style.padding = "10px";
      secondChild.style.display = "flex";
      secondChild.style.alignItems = "center";
      secondChild.style.justifyContent = "space-evenly";

      const secondChildDiv = document.createElement("div");

      const pDesc = document.createElement("p");
      pDesc.textContent = products[a]["pDesc"]
        ? products[a]["pDesc"]
        : products[a]["pdesc"];

      const price = document.createElement("p");
      price.textContent =
        products[a]["pPrice"] == undefined
          ? `$ ${products[a]["pprice"]}`
          : `$ ${products[a]["pPrice"]}`;

      const emptyPara = document.createElement("p");

      const pDetails = document.createElement("p");
      let gender =
        products[a]["pGender"] == undefined
          ? products[a]["pgender"]
          : products[a]["pGender"];
      let ageGroup = products[a]["pAgeGroup"];

      if (products[a]["pAgeGroup"] == undefined) {
        if (products[a]["pAgegroup"] != undefined) {
          ageGroup = products[a]["pAgegroup"];
        } else if (products[a]["pagegroup"] != undefined) {
          ageGroup = products[a]["pagegroup"];
        }
      } else {
        ageGroup = products[a]["pAgeGroup"];
      }

      if (gender == "m") gender = "males";
      else if (gender == "f") gender = "females";
      else gender = "every gender";

      if (ageGroup == "everyone") ageGroup = "every";

      pDetails.innerHTML = `This product is listed for<b>${gender}</b> & for <b>${ageGroup} age group</b>`;

      secondChildDiv.appendChild(pDesc);
      secondChildDiv.appendChild(price);
      secondChildDiv.appendChild(emptyPara);
      secondChildDiv.appendChild(pDetails);

      const img = document.createElement("img");
      img.src =
        products[a]["pLoc"] == undefined
          ? products[a]["ploc"]
          : products[a]["pLoc"];
      img.style.borderRadius = "20px";
      img.setAttribute("width", "80px");
      img.setAttribute("height", "80px");

      if (a % 2 == 0) {
        secondChild.appendChild(secondChildDiv);
        secondChild.appendChild(img);
      } else {
        secondChild.appendChild(img);
        secondChild.appendChild(secondChildDiv);
      }

      mainContainer.appendChild(firstChild);
      mainContainer.appendChild(secondChild);

      mainDiv.appendChild(mainContainer);
    }
  });
}

document.querySelector("#getBrands").addEventListener("click", async (el) => {
  el.preventDefault();

  let category = document.querySelector("#brandCategory").value;
  let gender = document.querySelector("#brandGender").value;
  let age = document.querySelector("#brandAge").value;

  console.log("Category: " + category + " gender: " + gender + " age: " + age);

  let products = await serverCall(
    {
      company: document.querySelector("#brandName").value,
      category: category,
      gender: gender,
      age: age,
    },
    "getBrandProducts"
  );

  if (products.includes("ERROR")) {
    document.querySelector("#brandsProducts").innerHTML = "";
    chrome.tts.speak(`${products.split(":")[1]}`, {
      enqueue: true,
      volume: 0.7,
    });
  } else {
    populateProducts(products);
  }
});

// event listener for the ai button
document.querySelector(".ai").addEventListener("click", (e) => {
  if (e.target.checked) {
    document.querySelector("#aiText").style.color = "#2196F3";
    document.querySelector("#notAI").style.display = "none";
    document.querySelector("#aiSection").style.display = "block";
    document.querySelector("#aiError").style.visibility = "none";
    document.querySelector("#filterRecommendations").style.display = "none";
  } else {
    document.querySelector("#filterRecommendations").style.display = "none";

    document.querySelector("#aiText").style.color = "black";
    document.querySelector("#notAI").style.display = "block";
    document.querySelector("#aiSection").style.display = "none";
    document.querySelector("#aiPrompt").value = "";
  }
  document.querySelector("#brandsProducts").innerHTML = "";
});

function randomPrompt() {
  const prompts = [
    "Products for male",
    "Provide the details for food products for kids",
    "What are the products that can be used by females",
    "Can you list all of the details of clothing products",
  ];

  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Populating the prompt with a random prompt
document.querySelector("#aiPrompt").addEventListener("click", (e) => {
  e.target.value = randomPrompt();
});

// fetching the result for the prompt via the C2Q API
document.querySelector("#aiPrompt").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    if (e.target.value.length < 10) {
      document.querySelector("#aiError").textContent =
        "Alteast provide a prompt of 10 characters";
      document.querySelector("#aiError").style.visibility = "visible";

      document.querySelector("#filterRecommendations").style.display = "none";
    }
    // fetch the result from the Chat2Query API
    else {
      document.querySelector("#brandsProducts").innerHTML = "";

      document.querySelector("#aiError").textContent = "";
      document.querySelector("#aiError").style.visibility = "hidden";

      document.querySelector("#aiLoader").style.display = "block";

      // calling the reqired backend endpoint:
      let products = await serverCall(
        {
          prompt: e.target.value,
        },
        "chat2Query"
      );

      console.log(JSON.parse(products));

      if (products.includes("ERROR")) {
        chrome.tts.speak(`${products.split(":")[1]}`, {
          enqueue: true,
          volume: 0.7,
        });

        document.querySelector("#filterRecommendations").style.display = "none";

        document.querySelector("#aiError").textContent = products.split(":")[1];
        document.querySelector("#aiError").style.visibility = "visible";
      } else {
        document.querySelector("#aiError").textContent = "";
        document.querySelector("#aiError").style.visibility = "hidden";

        populateProducts(products);

        document.querySelector("#filterRecommendations").style.display =
          "block";
      }
    }
    document.querySelector("#aiLoader").style.display = "none";
  }
});

// calling the ML model to grab the lables and then fetch images accordingly
document
  .querySelector("#mlImageInput")
  .addEventListener("change", async (event) => {
    if (event.target.files.length) {
      try {
        document.querySelector("body").style.pointerEvents = "none";
        document.querySelector("#mlLoader").style.visibility = "visible";

        console.log(event.target.files);

        let formdata = new FormData();
        formdata.append("productImg", event.target.files[0]);

        await chrome.storage.local.get(["email"]).then((data) => {
          formdata.append("email", data["email"]);
        });

        var requestOptions = {
          method: "POST",
          body: formdata,
          redirect: "follow",
        };

        const productName = "";

        // Step1: Save the uploaded image to the openshift/temp folder
        const tmpFileName = await fetch(
          `https://versatilevats.com/ennovation/server.php?action=runMLInference&productName=${productName}`,
          requestOptions
        )
          .then((response) => response.text())
          .then((result) => result)
          .catch((error) => console.log("error", error));

        const labels = await fetch(
          `${ML_MODEL_URL}?image=${tmpFileName}&by=customer`
        )
          .then((data) => data.json())
          .then((data) => {
            console.log(data);
            return Object.keys(data);
          });

        console.log(labels);
        // deleting the image
        fetch(
          `https://versatilevats.com/ennovation/server.php?action=unlinkMLImages&image=${tmpFileName}`
        );

        // doing the manipulations:
        let products = await serverCall(
          {
            labels: labels,
          },
          "getLabelProducts"
        );

        populateProducts(products);

        document.querySelector("#mlImageInput").value = "";
        document.querySelector("#mlLabels").style.display = "block";
        document.querySelector("#mlLabels").innerHTML = `Fetched: <b>${labels
          .join(" ")
          .toUpperCase()}</b> images`;

        document.querySelector("body").style.pointerEvents = "auto";
        document.querySelector("#mlLoader").style.visibility = "hidden";
      } catch (err) {
        document.querySelector("#error").style.visibility = "visible";
        document.querySelector("#error").textContent =
          "Network error! Try again";
      }
    }
  });

// requesting OTP when the user is not sure about the password
document
  .querySelector("#requestLoginOTP")
  .addEventListener("click", async (e) => {
    document.querySelector("body").style.pointerEvents = "none";

    let phone = "NA";
    try {
      phone = await chrome.storage.local
        .get(["phone"])
        .then((data) => data["phone"]);
    } catch (err) {
      console.log("Cannot use the Request Login OTP");
    }

    console.log("PHONE:" + phone);

    if (phone == "NA" || phone == undefined || phone == "") {
      document.querySelector("#loginError").style.visibility = "visible";
      document.querySelector("#loginError").textContent = "Login First";
      document.querySelector("body").style.pointerEvents = "auto";
      return;
    }

    if (document.querySelector("#loginOTP").style.display == "none") {
      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      let raw = JSON.stringify({
        phone: phone,
      });

      let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const loginWithOTP = await fetch(
        `${GLITCH_SERVER}/loginWithOTP`,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          console.log("Inside the GLITCH function to get login OTP");
          console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          return { error: error };
        });

      if (loginWithOTP.error == undefined) {
        document.querySelector("#loginOTP").style.display = "inline-block";
        document.querySelector("#loginError").style.visibility = "visible";
        document.querySelector("#loginError").textContent =
          "OTP sent successfully";
      } else {
        document.querySelector("#loginOTP").style.display = "none";
        document.querySelector("#loginError").style.visibility = "visible";
        document.querySelector("#loginError").textContent = loginWithOTP.error;
      }
    } else {
      document.querySelector("#loginOTP").style.display = "none";
      document.querySelector("#loginError").style.visibility = "hidden";
      document.querySelector("#loginError").textContent = "";
    }
    document.querySelector("body").style.pointerEvents = "auto";
  });

// verifying the user's OTP (in case he forgot the PWD) and logging in
document.querySelector("#loginOTP").addEventListener("keydown", async (e) => {
  if (e.code == "Enter") await verifyLoginOTP(e.target.value);
});

const verifyLoginOTP = async (otp) => {
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let phone = await chrome.storage.local
    .get(["phone"])
    .then((data) => data["phone"]);

  let raw = JSON.stringify({
    phone: phone,
    otp: otp,
  });

  let requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const verifyWithOTP = await fetch(
    `${GLITCH_SERVER}/verifyWithOTP`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      console.log("Inside the GLITCH function to get login OTP");
      console.log(result);
      return result;
    })
    .catch((error) => {
      console.log(error);
      return { error: error };
    });

  // if user provided the correct OTP
  if (verifyWithOTP.error == undefined) {
    const pwd = document.querySelector("#loginPwd");
    // const email = document.querySelector("#loginEmail")

    document.querySelector("#loginError").style.visibility = "hidden";
    document.querySelector("#loader").style.display = "flex";
    document.querySelector("#loginForm").style.display = "none";

    await commonLogin(true);
  }
  // if the entered OTP is incorrect
  else {
    document.querySelector("#loginError").style.visibility = "visible";
    document.querySelector(
      "#loginError"
    ).textContent = `${verifyWithOTP.error}. Reloading!!`;

    // Resetting the window as new OTP has to be requested
    setTimeout(() => {
      location.reload();
    }, 5000);
  }
};

const commonLogin = async (bypass) => {
  const pwd = document.querySelector("#loginPwd");
  const email = document.querySelector("#loginEmail");
  const phone = await chrome.storage.local.get().then((data) => data["phone"]);

  // fetching the wallet details
  const fetchPrivateKey = JSON.parse(
    await serverCall(
      {
        email: email.value,
      },
      "getwallet",
      GLITCH_SERVER
    )
  );

  // then call the theta server to get more details
  let getWalletDetails = JSON.parse(
    await serverCall(
      {
        key: fetchPrivateKey.result,
        type: "privateKey",
      },
      "getWallet",
      THETA_URL
    )
  );

  document.querySelector("#tfuels").textContent =
    getWalletDetails.result.balance;
  document.querySelector("#walletAddress").textContent =
    getWalletDetails.result.address;

  await chrome.storage.local.set({
    privateKey: fetchPrivateKey.result,
    address: getWalletDetails.result.address,
    tfuels: getWalletDetails.result.balance,
  });

  let loginRes;

  if (bypass) {
    loginRes = await serverCall(
      {
        phone: phone,
        bypass: true,
      },
      "loginUser"
    );
  } else
    loginRes = await serverCall(
      {
        email: email.value,
        pwd: pwd.value,
        bypass: false,
      },
      "loginUser"
    );

  if (loginRes.includes("ERROR")) {
    document.querySelector("#loader").style.display = "none";
    document.querySelector("#loginForm").style.display = "flex";

    document.querySelector("#loginError").style.visibility = "visible";
    document.querySelector("#loginError").textContent = loginRes.split(":")[1];
  } else {
    console.log(loginRes);

    // fetching the binID, if it exists!!
    const binId = JSON.parse(
      await serverCall(
        {
          phone: loginRes.split(":")[7],
        },
        "findBinId"
      )
    );

    let cartData = await chrome.storage.local.get(["cart"]);
    console.log(cartData.cart);
    console.log(loginRes);
    console.log(loginRes.split(":")[4]);
    await chrome.storage.local.set({
      pwd: pwd.value,
      email: email.value,
      phone: loginRes.split(":")[7],
      score: loginRes.split(":")[1],
      username: loginRes.split(":")[0],
      currentSection: "recommendations",
      tag: loginRes.split(":")[4] == "" ? "NA" : loginRes.split(":")[4],
      cart:
        cartData.count && cartData.cart.count > 0
          ? cartData.cart
          : { count: 0, tagAmount: 0 },
    });

    if (binId.error == "") {
      await chrome.storage.local.set({
        binId: binId.result,
      });
    }

    // No tag is there
    if (loginRes.split(":")[4] == undefined) {
      document.querySelector(
        "#pickupTotal"
      ).parentElement.parentElement.style.display = "none";
      console.log("HIDING THE STUFF");
    }

    // checking the tagAmount
    if (loginRes.split(":")[5] > 0 || loginRes.split(":")[5] != "") {
      if (cartData.cart) {
        cartData.cart.tagAmount = loginRes.split(":")[5];
        cartCount.textContent = cartData.cart.count;
      } else {
        cartCount.textContent = 0;
        cartData = { count: 0, tagAmount: 0 };
      }
      await chrome.storage.local.set({
        cart: cartData.cart,
      });
    } else {
      console.log("LINE 1838");
      cartData.tagAmount = 0;
      await chrome.storage.local.set({
        cart: cartData.cart,
      });
    }

    if (loginRes.split(":")[2] >= 5) {
      document.querySelector("#loginReward").style.filter = "grayscale(0)";
    }

    // paying the user "20 tfuels" for login continuously for 5 days
    if (loginRes.split(":")[2] == 5 && loginRes.split(":")[3] != "old") {
      let address = await chrome.storage.local
        .get(["address"])
        .then((data) => data["address"]);
      serverCall({
        from: "0x74c0073A1b141aFd67764AB114Fc0beAd5043D8F",
        to: address,
        amount: 20,
      });
      chrome.tts.speak(
        `Hi ${
          loginRes.split(":")[0]
        }, congrats on maintaing a login streak of 5 days. You just earned the highest badge of this application.20 tfuels will be added to your wallet`,
        { enqueue: true, volume: 0.7 }
      );
    }

    document.querySelector("#currentLoginStreak").textContent =
      loginRes.split(":")[2];

    console.log("Calling login");
    await populateRecommendations();
    console.log("Outside login");

    document.querySelector("#loader").style.display = "none";

    document.querySelector("#header").style.display = "block";
    document.querySelector("#score").textContent = loginRes.split(":")[1];
    document.querySelector("#username").textContent = loginRes.split(":")[0];

    document.querySelector("#loginForm").style.display = "none";
    document.querySelector("#recommendations").style.display = "flex";
  }
};

// theta wallet fuctions

// 1. Creating a new wallet
document.querySelector("#createWallet").addEventListener("click", async (e) => {
  const newWallet = JSON.parse(
    await serverCall({}, "createKeystore", THETA_URL, "GET")
  );

  document.querySelector("#walletPrivateKey").value =
    newWallet.result.privateKey;
  document.querySelector("#walletAddressInput").value =
    newWallet.result.address;
  document.querySelector("#tfuels").textContent = newWallet.result.balance;

  // storing the variables, will later delete them after sending the email for the new wallet
  chrome.storage.local.set({
    privateKey: newWallet.result.privateKey,
    keystorePwd: newWallet.result.password,
    mnemonic: newWallet.result.mnemonic,
    keystore: newWallet.result.keystore,
    address: newWallet.result.address,
    tfuels: newWallet.result.balance,
  });

  updateSignUpForm();
});

// 2. Checking the existing wallet
async function checkWallet() {
  const privateKeyInput = document.querySelector("#walletPrivateKey").value;
  console.log(privateKeyInput);
  if (privateKeyInput == "") {
    document.querySelector("#signupError").style.visibility = "visible";
    document.querySelector("#signupError").textContent =
      "Provide the private key";
  } else {
    document.querySelector("#signupError").style.visibility = "hidden";
    const walletCheck = JSON.parse(
      await serverCall(
        {
          type: "privateKey",
          key: privateKeyInput,
        },
        "getWallet",
        THETA_URL
      )
    );

    if (walletCheck.error != "") {
      document.querySelector("#signupError").style.visibility = "visible";
      document.querySelector("#signupError").textContent = walletCheck.error;
    } else {
      chrome.storage.local.set({
        address: walletCheck.result.address,
        privateKey: privateKeyInput,
        tfuels: walletCheck.result.balance,
      });
      document.querySelector("#tfuels").textContent =
        walletCheck.result.balance;
      document.querySelector("#walletAddressInput").value =
        walletCheck.result.address;
      updateSignUpForm();
    }
  }
}

// 3. Update the UI after wallet verification
function updateSignUpForm() {
  document.querySelector("#signupError").style.visibility = "hidden";

  document.querySelector("#postWalletVerification").style.display = "block";
  document.querySelector("#walletVerification").style.display = "none";

  document.querySelector("#submitSignupForm").setAttribute("value", "GET OTP");
}
