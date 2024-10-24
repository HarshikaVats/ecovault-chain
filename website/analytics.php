<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Ecovault Chain | Stats</title>

    <!-- blocking the unauthorized access (checking the role too) -->
    <script>
        if (!localStorage.getItem("bash")) {
            window.location.href = "./"
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
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js"></script>

    <script src="./js/script.js"></script>
 
    <script src="https://unpkg.com/@descope/web-component@3.25.3/dist/index.js"></script>
    <script src="https://unpkg.com/@descope/web-js-sdk@1.17.0/dist/index.umd.js"></script>   

    <script>
        const sdk = Descope({ projectId: 'P2nCws5VQkucwCVqAiCdzLWjr9QW', 
            persistTokens: true, autoRefresh: true
        })
    </script>
</head>
<body>
    <footer class="footer py-4 bg-warning">
        <div class="container">
            <div class="row justify-content-center align-items-center">
                <div class="col-lg-4 text-lg-start" style="font-weight: bold;" id="brandName"></div>
                <div class="col-lg-4 text-lg-center">
                    <a class="link-dark me-3" href="./products.php" target="_self">Products Page</a>
                </div>
                <div class="col-lg-4 text-lg-end" onclick="logout()" style="cursor: pointer"><u>Logout</u></div>
            </div>
        </div>
    </footer>

    <div style="text-align: center;">
        <img id="loader" src="./assets/loader.svg" alt="" srcset="">
    </div>

    <div id="graphSections" style="display: none;">
        <div class="row p-3 text-center w-100">
            <h4 class="m-3 mb-5">In these section, do have a look at the various graphs and make strategic moves</h4>
            <!-- users gender distribution graph -->
            <div class="col-md-6 mb-5">
                <div id="usersGender" style="height: 400px;"></div>
                <p class="m-2">
                    <span style="border: 2px solid #ffc800; border-radius: 2px;">
                        Number of the male & female customers
                    </span>
                </p> 
            </div>
            <div class="col-md-6 mb-5">
                <div id="usersStreak" style="height: 400px;"></div>
                <p class="m-2">
                    <span style="border: 2px solid #ffc800; border-radius: 2px;">
                        Products according to their company type
                    </span>
                </p> 
            </div>
        </div>
    
        <div class="row p-3 text-center w-100">
            <!-- user's age distribution graph -->
            <div class="col-md-6 m-auto mb-5">
                <div id="usersAge" style="height: 400px"></div>
                <p class="m-2">
                    <span style="border: 2px solid #ffc800; border-radius: 2px;">
                        Age group of the customers
                    </span>
                </p> 
            </div>
            
            <!-- feedbackTones distribution graph -->
            <div class="col-md-6 m-auto mb-5">
                <div id="feedbackTones" style="height: 400px"></div> 
                <p class="m-2">
                    <span style="border: 2px solid #ffc800; border-radius: 2px;">
                        AI analysis of the feedbacks
                    </span>
                </p>
            </div>
        </div>
    
        <div class="row m-5 text-center">
            <div class="col-md-12">
                <h3>Stragtegize your next moves?</h3>
                <p>Send emails to your target audience by selecting from the below options</p>
                <div>
                    <form>
                        <div class="m-3">
                            <div class="m-3">
                                <div class="m-2 d-inline-block">
                                    <label for="age">Age Group</label>
                                    <select name="age" id="age">
                                        <option value="kids">Kids</option>
                                        <option value="youth">Youth</option>
                                        <option value="adult">Adult</option>
                                        <option value="old">Old</option>
                                    </select>
                                </div>
                                <div class="m-2 d-inline-block">
                                    <label for="gender">Gender</label>
                                    <select name="gender" id="gender">
                                        <option value="m">Male</option>
                                        <option value="f">Female</option>
                                    </select>  
                                </div>
                            </div>
                        </div>
                        <textarea class="m-3" placeholder="Enter the email body (maximum 400 characters)" style="resize: none; height: 150px; width: 100%" id="msg" maxlength="400"></textarea>
                        <div>
                            <input type="file" id="attachment" class="m-3">
                        </div>
                        <input type="submit" value="SEND MAILS" id="sendmail">
                    </form>
                    <p id="error" style="display: none" class="text-danger m-2"></p>
                </div>
            </div>
        </div>
    </div>
</body>

<!-- descope script -->
<script>
    sdk.refresh()
</script>

<script>
    let SERVER = "https://node-server-sainipratap-dev.apps.sandbox-m4.g2pi.p1.openshiftapps.com";
    
    document.querySelector("#brandName").textContent = (JSON.parse(localStorage.getItem("bash")).brand).toUpperCase()

    document.querySelector("#sendmail").addEventListener("click", async (el) => {
        el.preventDefault()
        
        let attachmentLink = ""
        
        // upload the attachment to the backend
        if(document.querySelector("#attachment").files[0]) {
                
            document.querySelector("#error").style.display = "none"
            document.querySelector("body").style.pointerEvents = "none"
        
            var formdata = new FormData();
            formdata.append("attachment", document.querySelector("#attachment").files[0]);
            
            var requestOptions = {
                method: 'POST',
                body: formdata,
                redirect: 'follow'
            };
            
            attachmentLink = await  fetch("https://versatilevats.com/ennovation/server.php?action=uploadAttachment", requestOptions)
                .then(response => response.text())
                .then(result => result)
                .catch(error => console.log('error', error));   
                
                console.log(attachmentLink)
            
        }
                
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        
        var raw = JSON.stringify({
            "ageGroup": document.querySelector("#age").value,
            "gender": document.querySelector("#gender").value,
            "msg": document.querySelector("#msg").value,
            "attachment": attachmentLink,
            "companyName": JSON.parse(localStorage.getItem("bash")).brand
        });
        
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };
        
        document.querySelector("body").style.pointerEvents = "none"
        await fetch(`${SERVER}/statEmails`, requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log(result)
                if(result.includes("ERROR")) {
                    document.querySelector("#error").style.display = "block"
                    document.querySelector("#error").textContent = result.split(":")[1]
                } else {
                    alert("Hurray, the emails were sent")
                    document.querySelector("#error").style.display = "none"
                }
                document.querySelector("body").style.pointerEvents = "auto"
                return result;
            })
            .catch(error => console.log('error', error));
            
        document.querySelector("#msg").value = ""
    })
</script>
    
<script src="https://cdn.canvasjs.com/canvasjs.min.js"></script>
<script>
    function explodePie (e) {
        if(typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
            e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
        } else {
            e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
        }
        e.chart.render();
    }

    window.onload = async function () {
        let requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };

        const brandName = JSON.parse(localStorage.getItem("bash")).brand.toLowerCase()

        const results = await fetch(`${SERVER}/getChartValues?brand=${brandName}`, requestOptions)
        .then(response => response.text())
        .then(result => result)
        .catch(error => console.log('error', error));

        const data = JSON.parse(results)
        console.log(data);

        document.querySelector("#graphSections").style.display = "block"
        document.querySelector("#loader").style.display = "none"

        var usersGenderChart = new CanvasJS.Chart("usersGender", {
            animationEnabled: true,
            title:{
                text: "User's gender distribution",
                fontFamily: 'Roboto Slab, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji'
            },
            legend:{
                cursor: "pointer",
                itemclick: explodePie,
            },
            data: [{
                type: "pie",
                showInLegend: true,
                toolTipContent: "{name}: <strong>{y}</strong>",
                indexLabel: "{name} - {y}",
                dataPoints: [
                    { y: data[0][0], name: "Males", exploded: true },
                    { y: data[0][1], name: "Females" }
                ]
            }]
        });
        usersGenderChart.render();

        var usersAgeChart = new CanvasJS.Chart("usersAge", {
            animationEnabled: true,
            title:{
                text: "User's age distribution",
                fontFamily: 'Roboto Slab, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji'
            },
            legend:{
                cursor: "pointer",
                itemclick: explodePie,
            },
            data: [{
                type: "pie",
                showInLegend: true,
                toolTipContent: "{name}: <strong>{y}</strong>",
                indexLabel: "{name} - {y}",
                dataPoints: [
                    { y: data[1][0], name: "Kids" },
                    { y: data[1][1], name: "Youth", exploded: true },
                    { y: data[1][2], name: "Adult" },
                    { y: data[1][3], name: "Old" }
                ]
            }]
        });
        usersAgeChart.render();

        var usersStreakChart = new CanvasJS.Chart("usersStreak", {
            animationEnabled: true,
            title:{
                text: "Product's categories",
                fontFamily: 'Roboto Slab, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji'
            },
            legend:{
                cursor: "pointer",
                itemclick: explodePie,
            },
            data: [{
                type: "pie",
                showInLegend: true,
                toolTipContent: "{name}: <strong>{y}</strong>",
                indexLabel: "{name} - {y}",
                dataPoints: [
                    { y: data[2][0], name: "Clothing", exploded: true },
                    { y: data[2][1], name: "Food" },
                    { y: data[2][2], name: "Electronics" },
                    { y: data[2][3], name: "Furniture" }
                ]
            }]
        });
        usersStreakChart.render();

        var feedbackTones = new CanvasJS.Chart("feedbackTones", {
            animationEnabled: true,
            title:{
                text: "Product's categories",
                fontFamily: 'Roboto Slab, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji'
            },
            legend:{
                cursor: "pointer",
                itemclick: explodePie,
            },
            data: [{
                type: "pie",
                showInLegend: true,
                toolTipContent: "{name}: <strong>{y}</strong>",
                indexLabel: "{name} - {y}",
                dataPoints: [
                    { y: data[3][0], name: "Neutral", exploded: true },
                    { y: data[3][1], name: "Frustrated" },
                    { y: data[3][2], name: "Encouraging" },
                    { y: data[3][3], name: "Constructive" },
                    { y: data[3][4], name: "Appreciative" }
                ]
            }]
        });
        feedbackTones.render();
    }
</script>

    <script>
        document.querySelectorAll("input").forEach((input) => {
            input.setAttribute("autocomplete", "off");
        });
    </script>
</html>