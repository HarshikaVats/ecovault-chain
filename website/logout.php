<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoVault Chain | Logout</title>

    <!-- Favicon-->
    <link rel="icon" type="image/x-icon" href="assets/logo.jpg" />

    <script src="https://unpkg.com/@descope/web-js-sdk@1.17.0/dist/index.umd.js"></script>
</head>
<body>
    <script>
        const sdk = Descope({ projectId: 'P2nCws5VQkucwCVqAiCdzLWjr9QW', 
            persistTokens: true, autoRefresh: true
        })

        const logout = async () => {
            await sdk.logoutAll();
            localStorage.removeItem("bash");
            window.location.href = "./";
        };

        logout()
    </script>
</body>
</html>