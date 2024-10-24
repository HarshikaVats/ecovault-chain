<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>EcoVault Chain | Home</title>

        <!-- redirecting -->
        <script>
            if(localStorage.getItem("bash") && JSON.parse(localStorage.getItem("bash")).email) {
                window.location.href = "./products.php"
            }
        </script>
        
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
          
        <!-- Descope sdks -->
        <script src="https://unpkg.com/@descope/web-component@3.25.3/dist/index.js"></script>
        <script src="https://unpkg.com/@descope/web-js-sdk@1.17.0/dist/index.umd.js"></script>

        <script>
            let SERVER = "https://node-server-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com"
            console.log("Setting up the server variable: " + SERVER)
        </script>
    </head>
    
    <body id="page-top" style="position: relative;">
        <!-- Navigation-->
        <nav class="navbar navbar-expand-lg navbar-dark fixed-top" id="mainNav">
            <div class="container">
                <a class="navbar-brand" href="#page-top">EcoVault Chain</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
                    Menu
                    <i class="fas fa-bars ms-1"></i>
                </button>
                <div class="collapse navbar-collapse" id="navbarResponsive">
                    <ul class="navbar-nav text-uppercase ms-auto py-4 py-lg-0">
                        <li class="nav-item"><a class="nav-link" href="#services">Services</a></li>
                        <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                        <li class="nav-item"><a class="nav-link" href="#login">Login</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        
        <!-- Masthead-->
        <header class="masthead d-flex flex-column justify-content-center align-items-center" style="height: 100vh;">
            <div class="container">
                <div class="masthead-subheading">Where shops transform to brands</div>
                <a class="btn btn-primary btn-xl text-uppercase" href="#services">Know more</a>
            </div>
        </header>
        
        <!-- Services-->
        <section class="page-section" id="services">
            <div class="container">
                <div class="text-center">
                    <h2 class="section-heading text-uppercase">Services</h2>
                    <h3 class="section-subheading text-muted">Providing three ways to interact with the project</h3>
                </div>
                <div class="row text-center">
                    <div class="col-md-4">
                        <span class="fa-stack fa-4x">
                            <i class="fas fa-circle fa-stack-2x text-primary"></i>
                            <i class="fas fa-shopping-cart fa-stack-1x fa-inverse"></i>
                        </span>
                        <h4 class="my-3">Website</h4>
                        <p class="text-muted" style="text-align: justify">Brands can upload their products on the website, which will be visible to the end customers. A brand can also view the analytics of their customers and can send notifications to increase the engagement</p>
                    </div>
                    <div class="col-md-4">
                        <span class="fa-stack fa-4x">
                            <i class="fas fa-circle fa-stack-2x text-primary"></i>
                            <i class="fas fa-laptop fa-stack-1x fa-inverse"></i>
                        </span>
                        <h4 class="my-3">WhatsApp support</h4>
                        <p class="text-muted" style="text-align: center">Customers can use WhatsApp for a wide range of functionalities. They can list products of different companies, check the product from WhatsApp and, get the feedback submitted by them</p>
                    </div>
                    <div class="col-md-4">
                        <span class="fa-stack fa-4x">
                            <i class="fas fa-circle fa-stack-2x text-primary"></i>
                            <i class="fas fa-lock fa-stack-1x fa-inverse"></i>
                        </span>
                        <h4 class="my-3">Extension</h4>
                        <p class="text-muted" style="text-align: justify">Customers can use the extension to view products of a particular brand, personalized recommendations, submit feedback and earn badges. The extension acts as an engaging platform for customers.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- About-->
        <section class="page-section" id="about">
            <div class="container">
                <div class="text-center">
                    <h2 class="section-heading text-uppercase">About</h2>
                    <h3 class="section-subheading text-muted">What brands can do here?</h3>
                </div>
                <ul class="timeline">
                    <li>
                        <div class="timeline-image"><img class="rounded-circle img-fluid" src="assets/img/about/1.jpg" alt="..." /></div>
                        <div class="timeline-panel">
                            <div class="timeline-heading">
                                <h4>Signup</h4>
                                <h4 class="subheading">Create your account</h4>
                            </div>
                            <div class="timeline-body"><p class="text-muted">Join EcoVault Chain by first signing in. Create your account as a brand, provide us with your name, category, and contact details.</p></div>
                        </div>
                    </li>
                    <li class="timeline-inverted">
                        <div class="timeline-image"><img class="rounded-circle img-fluid" src="assets/img/about/2.jpg" alt="..." /></div>
                        <div class="timeline-panel">
                            <div class="timeline-heading">
                                <h4>Products</h4>
                                <h4 class="subheading">List your products</h4>
                            </div>
                            <div class="timeline-body"><p class="text-muted">Then add your products & list it for the customers to know more. Add image, description & link for more reach</p></div>
                        </div>
                    </li>
                    <li>
                        <div class="timeline-image"><img class="rounded-circle img-fluid" src="assets/img/about/3.jpg" alt="..." /></div>
                        <div class="timeline-panel">
                            <div class="timeline-heading">
                                <h4>Analysis</h4>
                                <h4 class="subheading">Know your stats</h4>
                            </div>
                            <div class="timeline-body"><p class="text-muted">The analysis page shows the customer's engagement for your reference. Graphs are for age, gender, and number of products</p></div>
                        </div>
                    </li>
                    <li class="timeline-inverted">
                        <div class="timeline-image"><img class="rounded-circle img-fluid" src="assets/img/about/4.jpg" alt="..." /></div>
                        <div class="timeline-panel">
                            <div class="timeline-heading">
                                <h4>Seasonal updates</h4>
                                <h4 class="subheading">Interact with customers</h4>
                            </div>
                            <div class="timeline-body"><p class="text-muted">Send seasonal updates to your customers for a new product launch or any announcement. Selected customers will receive the update</p></div>
                        </div>
                    </li>
                    <li class="timeline-inverted">
                        <div class="timeline-image">
                            <h4>
                                Be a part
                                <br />
                                Of Our
                                <br />
                                journey!
                            </h4>
                        </div>
                    </li>
                </ul>
            </div>
        </section>
        
        <!-- Clients-->
        <div class="py-5">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-3 col-sm-6 my-3">
                        <img class="img-fluid img-brand d-block mx-auto" src="assets/img/logos/nestle.svg" alt="..." aria-label="Nestle Logo" />
                    </div>
                    <div class="col-md-3 col-sm-6 my-3">
                        <img class="img-fluid img-brand d-block mx-auto" src="assets/img/logos/adidas.svg" alt="..." aria-label="Adidas  Logo" />
                    </div>
                    <div class="col-md-3 col-sm-6 my-3">
                        <img class="img-fluid img-brand d-block mx-auto" src="assets/img/logos/bosch.svg" alt="..." aria-label="Bosch Logo" />
                    </div>
                    <div class="col-md-3 col-sm-6 my-3">
                        <img class="img-fluid img-brand d-block mx-auto" src="assets/img/logos/IKEA.svg" style="width: 150px; height: 100px" alt="..." aria-label="IKEA Logo" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Contact-->
        <section class="page-section" id="login">
            <div class="container" id="loginForm" style="width: 80%; height: 90%; border-radius: 4px">
            </div>
        </section>

        <!-- Footer-->
        <footer class="footer py-4 bg-warning">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-4 text-lg-start">Copyright &copy; EcoVault Chain</div>
                    <div class="col-lg-4 my-3 my-lg-0">
                        <a class="btn btn-dark btn-social mx-2" href="" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                        <a class="btn btn-dark btn-social mx-2" href="" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a class="btn btn-dark btn-social mx-2" href="" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                    <div class="col-lg-4 text-lg-end">
                        <a class="link-dark text-decoration-none me-3">Simplicity is the key</a>
                    </div>
                </div>
            </div>
        </footer>
    </body>

    <script>
        const sdk = Descope({ projectId: 'P2nCws5VQkucwCVqAiCdzLWjr9QW', 
            persistTokens: true, autoRefresh: true
        })

        const getBrand = (sdk) => {
            return sdk.me()
                .then(me => {
                    console.log(me.data);
                    let bash = {
                        brand: me.data.givenName,
                        email: me.data.loginIds[0],
                        role: me.data.roleNames[0],
                        wallet: "",
                        balance: 0,
                        privateKey: me.data.customAttributes.wallet,
                    }
                    localStorage.setItem('bash', JSON.stringify(bash))
                    if(me.data.customAttributes.wallet) {
                        window.location.href = './products.php'
                    }
                })
                .catch(error => {
                    console.error('Error fetching brand details:', error);
                    return "error"; 
                });
        };
        
        const sessionToken = sdk.getSessionToken()
        console.log(sessionToken);

        // either the sessionToken is not there or has been expired
        if (!sessionToken) {
            let container = document.getElementById('loginForm');
            container.innerHTML = '<descope-wc project-id="P2nCws5VQkucwCVqAiCdzLWjr9QW" flow-id="theta-2024-final"></descope-wc>';
  
            const wcElement = document.getElementsByTagName('descope-wc')[0];

            const onSuccess = (pass) => {
              console.log(pass),
              getBrand(sdk)
            };
            const onError = (err) => console.log(err);
  
            wcElement.addEventListener('success', onSuccess);
            wcElement.addEventListener('error', onError);
        }
    </script>

    <script>
        document.querySelectorAll("input").forEach((input) => {
            input.setAttribute("autocomplete", "off");
        });
    </script>
    <script src="./js/script.js"></script>
</html>