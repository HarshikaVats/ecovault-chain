<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>EcoVault Chain | Products</title>

    <!-- Favicon-->
    <link rel="icon" type="image/x-icon" href="assets/logo.png" />
    <!-- Font Awesome icons (free version)-->
    <script src="https://use.fontawesome.com/releases/v6.3.0/js/all.js" crossorigin="anonymous"></script>
    <!-- Google fonts-->
    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css" />
    <link href="https://fonts.googleapis.com/css?family=Roboto+Slab:400,100,300,700" rel="stylesheet" type="text/css" />
    <!-- Core theme CSS (includes Bootstrap)-->
    <link href="css/styles.css" rel="stylesheet" />

    <!-- Bootstrap core JS-->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js"></script>

    <script src="./js/script.js"></script>
  
    <script src="https://unpkg.com/@descope/web-component@3.25.3/dist/index.js"></script>
    <script src="https://unpkg.com/@descope/web-js-sdk@1.17.0/dist/index.umd.js"></script>

    <script>
        const sdk = Descope({ projectId: 'P2nCws5VQkucwCVqAiCdzLWjr9QW', 
            persistTokens: true, autoRefresh: true
        })
    
        if (!localStorage.getItem("bash")){
            window.location.href = "./"
        }
    </script>
    
    <style>
        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
        
        .rotating-image {
            animation: rotate 2s linear infinite;
        }
    </style>
</head>
<body class="bg-light">
    <!-- Header -->
    <footer class="footer py-4 bg-warning">
        <div class="container">
            <div class="row justify-content-center align-items-center">
                <div class="col-lg-4 text-lg-start text-uppercase" style="font-weight: bold;" id="brandName"></div>
                <div class="col-lg-4 text-lg-center">
                    <a class="link-dark" href="./analytics.php" target="_self">Analytics Page</a>
                </div>
                <div class="col-lg-4 text-lg-end" onclick="logout()" style="cursor: pointer"><u>Logout</u></div>
            </div>
        </div>
    </footer>

    <section class="page-section" style="" id="portfolio">
        <div class="container">
            <div class="text-center m-1">
                <p id="walletDetails" style="text-align: center; display: none">Your Theta wallet <span id="thetaWallet" style="font-weight: bold"></span> has <span id="tfuels" style="font-weight: bold"></span> tfuels</p>
                <h2 class="section-heading text-uppercase">Products</h2>
                <div style="position: relative">
                    <a id="addProductBtn" class="btn btn-primary btn-sm text-uppercase m-3">Add more</a>
                    <img id="loader" class="rotating-image" style="position: absolute; top: 10px; display: none" width="40" height="40" src="https://img.icons8.com/ios-filled/40/loading-sign.png" alt="loading-sign"/>
                </div>
            </div>
    
            <!-- form for adding products -->
            <form id="addProductForm" style="display: none; position: relative">
                <div class="row align-items-stretch m-3">
                    <div class="col-md-6 m-auto">
                        <div class="form-group m-2">
                            <input class="form-control" id="productTitle" maxlength="20" type="text" placeholder="Product Name (max 20 characters) *"
                                required />
                        </div>
                        <div class="form-group m-2">
                            <input class="form-control" id="productDesc" type="text" maxlength="20"
                                placeholder="Description (max 20 characters) *" required />
                        </div>
                        <div class="form-group m-2 text-center">
                            <div class="row">
                                <div class="col-md-4 mb-2">
                                    <input class="form-control" id="productPrice" type="number" style="width: 100%;" min="0" required placeholder="Price ($)*">
                                </div>
                                <div class="col-md-4 mb-2">
                                    <select class="form-control" name="gender" id="gender" style="width: 100%;" required>
                                        <option value="default">Target gender*</option>
                                        <option value="everyone">Everyone</option>
                                        <option value="m">Male</option>
                                        <option value="f">Female</option>
                                    </select>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <select class="form-control" name="ageGroup" id="ageGroup" style="width: 100%" required>
                                        <option value="default">Target age group*</option>
                                        <option value="kids">Kids (10-14)</option>
                                        <option value="youth">Youth (15-25)</option>
                                        <option value="adult">Adult (26-50)</option>
                                        <option value="old">Old (50+)</option>
                                        <option value="everyone">For all age groups</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="text-center mt-2">
                             <input type="checkbox" name="productPickup" id="productPickup" required>
                            <label for="productPickup">Available for pickup?</label>
                        </div>
                        <div class="text-center m-2" id="imageDivision" style="display: none">
                            <input type="file" class="form-control" style="text-align: center; padding: 0" accept="image/*" id="productImage">
                        </div>
                        <div class="text-center m-3" style="display: none; font-size: 0.9rem">
                            <div style="display: block">
                                <p>
                                    <img id="delLabel" style="cursor: pointer" width="16" height="16" src="https://img.icons8.com/office/16/delete-sign.png" alt="delete-sign"/>
                                    The image is having a <span id="mlLabel" style="font-weight: bold"></span>
                                </p>    
                            </div>
                            <div style="display:none; text-align: center">
                                <p>If the tag is wrong, then please delete it & write the new one</p>
                                <div class="m-auto text-center w-50">
                                    <input id="newLabel" placeholder="Enter new label" style="display: none; width:100%; text-align: center; margin: auto; border-radius: 2px" maxlength=20></input>
                                </div>
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="w-50 m-auto text-center">
                                <input type="submit" id="submitProduct" class="btn btn-primary btn-sm text-uppercase w-100"
                                value="Create Product" style="display: none">
                            </div>
                        </div>
                        <div class="invalid-feedback text-center m-2" id="productError">Product Error</div>
                    </div>
                </div>
            </form>
    
            <!-- product cards will be added -->
            <div class="row" id="productCards">
                
            </div>
        </div>
    </section>

    <!-- loader -->
    <div id="loading" class="flex-column justify-content-center align-items-center" style="width: 90vw; height: 50vh; display: flex; margin: auto;">
        <img src="./assets/loader.svg">
        <h2 id="loadingText">Fetching the products</h2>
    </div>
</body>
    
<script>
    let MODEL = "https://ml-model-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com>"
    let SERVER = "https://node-server-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com"
    let THETA_SERVER = "https://theta-server-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com"
</script>

<script>
    document.querySelectorAll("input").forEach((input) => {
        input.setAttribute("autocomplete", "off");
    });
</script>
<script src="./js/product.js"></script>

</html>
