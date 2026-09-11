/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAELLyysW27PRCT53FjYLtJEw9pYv9rvpA",
  authDomain: "rv-online-book-store.firebaseapp.com",
  projectId: "rv-online-book-store",
  storageBucket: "rv-online-book-store.firebasestorage.app",
  messagingSenderId: "831703685308",
  appId: "1:831703685308:web:2ae98e159d7b6e863598b9",
  measurementId: "G-XSW4X7X62P"
};

/* Initialize Firebase */
firebase.initializeApp(firebaseConfig);

/* Connect to Firestore */
const db = firebase.firestore();

const auth = firebase.auth();

console.log("Firebase connected successfully");
console.log(db);

/* =====================================================
   BOOK HAVEN - SCRIPT.JS
===================================================== */







/* =====================================================
   LOCAL STORAGE INITIALIZATION
===================================================== */

function initializeStorage() {

    /* CUSTOMERS */

    if (!localStorage.getItem("customers")) {

        localStorage.setItem(
            "customers",
            JSON.stringify([])
        );
    }


    /* ORDERS */

    if (!localStorage.getItem("orders")) {

        localStorage.setItem(
            "orders",
            JSON.stringify([])
        );
    }


    /* CART */

    if (!localStorage.getItem("cart")) {

        localStorage.setItem(
            "cart",
            JSON.stringify([])
        );
    }


    /* BOOKS */

    if (!localStorage.getItem("books")) {

        localStorage.setItem(
            "books",
            JSON.stringify([])
        );
    }


    /* CATEGORIES */

    if (!localStorage.getItem("categories")) {

        localStorage.setItem(
            "categories",
            JSON.stringify([])
        );
    }

    /* SUBCATEGORIES */

if (!localStorage.getItem("subcategories")) {

    localStorage.setItem(
        "subcategories",
        JSON.stringify({})
    );
}


    /* MANAGERS */

    if (!localStorage.getItem("managers")) {

        localStorage.setItem(
            "managers",
            JSON.stringify([])
        );
    }


    /* MANAGER ID COUNTER */

    if (!localStorage.getItem("lastManagerNumber")) {

        localStorage.setItem(
            "lastManagerNumber",
            "0"
        );
    }
}


/* =====================================================
   STORAGE HELPERS
===================================================== */

function getBooks() {
    return JSON.parse(
        localStorage.getItem("books")
    ) || [];
}


function getCustomers() {
    return JSON.parse(
        localStorage.getItem("customers")
    ) || [];
}


function getOrders() {
    return JSON.parse(
        localStorage.getItem("orders")
    ) || [];
}


function getCart() {
    return JSON.parse(
        localStorage.getItem("cart")
    ) || [];
}


function getCategories() {

    return JSON.parse(
        localStorage.getItem("categories")
    ) || [];
}

/* =====================================================
   SUBCATEGORY STORAGE HELPER
===================================================== */

function getSubcategories() {

    return JSON.parse(
        localStorage.getItem("subcategories")
    ) || {};
}

function getCurrentCustomer() {
    return JSON.parse(
        localStorage.getItem("currentCustomer")
    );
}
/* =====================================================
   MANAGER STORAGE HELPERS
===================================================== */

function getManagers() {

    return JSON.parse(
        localStorage.getItem("managers")
    ) || [];
}

function initializeManagerPermissions() {

    let managers =
        getManagers();


    let changed = false;


    managers.forEach(
        function (manager) {

            if (
                typeof manager.canVerifyPayments ===
                "undefined"
            ) {

                manager.canVerifyPayments =
                    false;

                changed = true;
            }

        }
    );


    if (changed) {

        localStorage.setItem(
            "managers",
            JSON.stringify(managers)
        );

    }
}

function getCurrentManager() {

    return JSON.parse(
        localStorage.getItem("currentManager")
    );
}


function isManagerLoggedIn() {

    return (
        localStorage.getItem("managerLoggedIn")
        === "true"
    );
}

/* =====================================================
   CHECK MANAGER PAYMENT PERMISSION
===================================================== */

function managerCanVerifyPayments() {

    const currentManager =
        getCurrentManager();


    if (
        !isManagerLoggedIn() ||
        !currentManager
    ) {

        return false;
    }


    return (
        currentManager.status ===
            "Approved" &&

        currentManager.canVerifyPayments ===
            true
    );
}

/* =====================================================
   MANAGER FIRESTORE LIVE SYNC
===================================================== */

let managerProfileUnsubscribe =
    null;


function startManagerProfileSync() {

    /* Remove old listener first */

    if (managerProfileUnsubscribe) {

        managerProfileUnsubscribe();

        managerProfileUnsubscribe =
            null;
    }


    const currentManager =
        getCurrentManager();


    const user =
        auth.currentUser;


    /*
       Only start synchronization when
       a Manager is actually logged in.
    */

    if (
        !user ||
        !currentManager ||
        !isManagerLoggedIn()
    ) {

        return;
    }


    /*
       Make sure the Firebase user belongs
       to this Manager session.
    */

    if (
        currentManager.uid &&
        currentManager.uid !== user.uid
    ) {

        return;
    }


    const managerRef =
        db.collection("managers")
            .doc(user.uid);


    managerProfileUnsubscribe =
        managerRef.onSnapshot(

            async function (doc) {

                /* =================================
                   MANAGER PROFILE REMOVED
                ================================= */

                if (!doc.exists) {

                    if (
                        managerProfileUnsubscribe
                    ) {

                        managerProfileUnsubscribe();

                        managerProfileUnsubscribe =
                            null;
                    }


                    localStorage.removeItem(
                        "currentManager"
                    );

                    localStorage.removeItem(
                        "managerLoggedIn"
                    );


                    try {

                        await auth.signOut();

                    }
                    catch (error) {

                        console.error(
                            "Manager sign-out error:",
                            error
                        );
                    }


                    updateNavigation();

                    showPage("home");


                    alert(
                        "Your Manager account is no longer available."
                    );

                    return;
                }


                /* =================================
                   GET LATEST FIRESTORE PROFILE
                ================================= */

                const manager = {

                    ...doc.data(),

                    uid:
                        doc.id
                };


                /* =================================
                   MANAGER DISABLED / NOT APPROVED
                ================================= */

                if (
                    manager.status !==
                    "Approved"
                ) {

                    if (
                        managerProfileUnsubscribe
                    ) {

                        managerProfileUnsubscribe();

                        managerProfileUnsubscribe =
                            null;
                    }


                    localStorage.removeItem(
                        "currentManager"
                    );

                    localStorage.removeItem(
                        "managerLoggedIn"
                    );


                    try {

                        await auth.signOut();

                    }
                    catch (error) {

                        console.error(
                            "Manager sign-out error:",
                            error
                        );
                    }


                    updateNavigation();

                    showPage("home");


                    alert(
                        "Your Manager access has been disabled or is no longer approved."
                    );

                    return;
                }


                /* =================================
                   UPDATE CURRENT MANAGER CACHE
                ================================= */

                localStorage.setItem(
                    "currentManager",
                    JSON.stringify(manager)
                );


                localStorage.setItem(
                    "managerLoggedIn",
                    "true"
                );


                /* =================================
                   UPDATE MANAGER LIST CACHE
                ================================= */

                let managers =
                    getManagers();


                const managerIndex =
                    managers.findIndex(
                        function (item) {

                            return (
                                String(
                                    item.managerId
                                ) ===
                                String(
                                    manager.managerId
                                )
                            );
                        }
                    );


                if (managerIndex >= 0) {

                    managers[
                        managerIndex
                    ] = manager;

                }
                else {

                    managers.push(
                        manager
                    );
                }


                localStorage.setItem(
                    "managers",
                    JSON.stringify(
                        managers
                    )
                );


                console.log(
                    "Manager synchronized from Firestore:",
                    manager
                );


                updateNavigation();


                /*
                   Refresh dashboard so payment
                   permission changes appear immediately.
                */

                loadManagerDashboard();

            },


            function (error) {

                console.error(
                    "Manager live sync error:",
                    error
                );

            }

        );
}



/* =====================================================
   RESTORE MANAGER FIREBASE SESSION
===================================================== */

function restoreManagerSession() {

    auth.onAuthStateChanged(
        function (user) {

            /*
               Only restore if this browser already
               contains a Manager login session.
            */

            if (
                !isManagerLoggedIn() ||
                !getCurrentManager()
            ) {

                return;
            }


            if (!user) {

                localStorage.removeItem(
                    "currentManager"
                );

                localStorage.removeItem(
                    "managerLoggedIn"
                );

                updateNavigation();

                return;
            }


            startManagerProfileSync();
        }
    );
}

function generateManagerId() {

    let lastNumber =
        Number(
            localStorage.getItem(
                "lastManagerNumber"
            )
        ) || 0;


    lastNumber++;


    localStorage.setItem(
        "lastManagerNumber",
        String(lastNumber)
    );


    return (
        "MGR" +
        String(lastNumber).padStart(3, "0")
    );
}


/* =====================================================
   REGISTER MANAGER - FIREBASE + SECURE COUNTER
===================================================== */

async function registerManager(event) {

    event.preventDefault();


    const name =
        document
            .getElementById("managerRegName")
            .value
            .trim();


    const email =
        document
            .getElementById("managerRegEmail")
            .value
            .trim()
            .toLowerCase();


    const phone =
        document
            .getElementById("managerRegPhone")
            .value
            .trim();


    const password =
        document
            .getElementById("managerRegPassword")
            .value;


    if (
        !name ||
        !email ||
        !phone ||
        !password
    ) {

        alert(
            "Please fill all Manager registration fields."
        );

        return;
    }


    try {

        /* =========================================
           CREATE FIREBASE AUTH ACCOUNT
        ========================================= */

        const credential =
            await auth
                .createUserWithEmailAndPassword(
                    email,
                    password
                );


        const user =
            credential.user;


        const counterRef =
            db.collection("settings")
                .doc("managerCounter");


        const managerRef =
            db.collection("managers")
                .doc(user.uid);


        let createdManager =
            null;


        /* =========================================
           COUNTER + MANAGER PROFILE
           ONE ATOMIC TRANSACTION
        ========================================= */

        await db.runTransaction(
            async function (transaction) {

                const counterDoc =
                    await transaction.get(
                        counterRef
                    );


                if (!counterDoc.exists) {

                    throw new Error(
                        "Manager counter was not found."
                    );
                }


                const currentNumber =
                    Number(
                        counterDoc.data()
                            .lastNumber
                    ) || 0;


                const nextNumber =
                    currentNumber + 1;


                const managerId =
                    "MGR" +
                    String(nextNumber)
                        .padStart(
                            3,
                            "0"
                        );


                createdManager = {

                    uid:
                        user.uid,

                    managerId:
                        managerId,

                    managerNumber:
                        nextNumber,

                    name:
                        name,

                    email:
                        email,

                    phone:
                        phone,

                    status:
                        "Pending",

                    canVerifyPayments:
                        false,

                    registeredDate:
                        new Date()
                            .toLocaleString()

                };


                /* UPDATE COUNTER */

                transaction.update(
                    counterRef,
                    {
                        lastNumber:
                            nextNumber
                    }
                );


                /* CREATE MANAGER PROFILE */

                transaction.set(
                    managerRef,
                    createdManager
                );
            }
        );


        console.log(
            "Manager registered securely:",
            createdManager
        );


        /*
           createUserWithEmailAndPassword()
           automatically logs in the new Manager.

           Registration must finish logged out
           until Admin approves the account.
        */

        await auth.signOut();


        localStorage.removeItem(
            "currentManager"
        );

        localStorage.removeItem(
            "managerLoggedIn"
        );

        localStorage.removeItem(
            "currentCustomer"
        );


        event.target.reset();


        updateNavigation();


        alert(
            "Manager registration successful.\n\n" +
            "Manager ID: " +
            createdManager.managerId +
            "\n\nWaiting for Admin approval."
        );


        showPage(
            "accountPage"
        );


        showAccountForm(
            "managerLoginForm"
        );

    }
    catch (error) {

        console.error(
            "Manager registration error:",
            error
        );


        /*
           If Firebase Authentication was created
           but Firestore registration failed,
           make sure the browser is not left logged in.
        */

        try {

            await auth.signOut();

        }
        catch (logoutError) {

            console.error(
                "Registration cleanup error:",
                logoutError
            );
        }


        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            alert(
                "This email is already registered."
            );

        }
        else if (
            error.code ===
            "auth/weak-password"
        ) {

            alert(
                "Password must contain at least 6 characters."
            );

        }
        else {

            alert(
                "Manager registration could not be completed.\n\n" +
                error.message
            );
        }
    }
}

/* =====================================================
   MANAGER LOGIN - FIREBASE AUTH + FIRESTORE
===================================================== */

async function managerLogin(event) {

    event.preventDefault();


    const managerId =
        document
            .getElementById("managerLoginId")
            .value
            .trim()
            .toUpperCase();


    const email =
        document
            .getElementById("managerLoginEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("managerLoginPassword")
            .value;


    if (!managerId || !email || !password) {

        alert(
            "Please enter Manager ID, email and password."
        );

        return;
    }


    try {

        /* =========================================
           LOGIN WITH FIREBASE AUTH
        ========================================= */

        const credential =
            await auth
                .signInWithEmailAndPassword(
                    email,
                    password
                );


        const user =
            credential.user;


        /* =========================================
           GET MANAGER PROFILE FROM FIRESTORE
        ========================================= */

        const managerDoc =
            await db.collection("managers")
                .doc(user.uid)
                .get();


        if (!managerDoc.exists) {

            await auth.signOut();

            alert(
                "Manager profile not found."
            );

            return;
        }


        const manager =
            managerDoc.data();


        /* =========================================
           CHECK MANAGER ID
        ========================================= */

        if (
            String(manager.managerId)
                .toUpperCase() !==
            managerId
        ) {

            await auth.signOut();

            alert(
                "Invalid Manager ID, email or password."
            );

            return;
        }


        /* =========================================
           CHECK ADMIN APPROVAL
        ========================================= */

        if (manager.status === "Pending") {

            await auth.signOut();

            alert(
                "Your Manager account is waiting for Admin approval."
            );

            return;
        }


        if (manager.status === "Disabled") {

            await auth.signOut();

            alert(
                "Your Manager account has been disabled by Admin."
            );

            return;
        }


        if (manager.status !== "Approved") {

            await auth.signOut();

            alert(
                "Manager account is not approved."
            );

            return;
        }


        /* =========================================
           SAVE CURRENT MANAGER
        ========================================= */

        localStorage.setItem(
            "currentManager",
            JSON.stringify(manager)
        );


        localStorage.setItem(
            "managerLoggedIn",
            "true"
        );

       startManagerProfileSync();


        /*
           Remove any old customer profile
           from this browser.
        */

        localStorage.removeItem(
            "currentCustomer"
        );


        event.target.reset();


        updateNavigation();


        console.log(
            "Manager logged in:",
            manager
        );


        alert(
            "Welcome Manager " +
            manager.name +
            "!"
        );


        showPage(
            "managerDashboard"
        );

    }
    catch (error) {

        console.error(
            "Manager login error:",
            error
        );


        if (
            error.code ===
                "auth/invalid-credential" ||
            error.code ===
                "auth/wrong-password" ||
            error.code ===
                "auth/user-not-found"
        ) {

            alert(
                "Invalid Manager ID, email or password."
            );

        }
        else {

            alert(
                "Manager login failed: " +
                error.message
            );
        }
    }
}

/* =====================================================
   MANAGER LOGOUT - FIREBASE AUTH
===================================================== */

async function managerLogout() {

    try {

        await auth.signOut();

       if (managerProfileUnsubscribe) {

    managerProfileUnsubscribe();

    managerProfileUnsubscribe =
        null;
}


        localStorage.removeItem(
            "currentManager"
        );

        localStorage.removeItem(
            "managerLoggedIn"
        );


        updateNavigation();

        showPage("home");


        alert(
            "Manager logged out successfully."
        );

    }
    catch (error) {

        console.error(
            "Manager logout error:",
            error
        );

        alert(
            "Manager logout failed."
        );
    }
}
/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(pageId) {

    const page =
        document.getElementById(pageId);

    if (!page) {
        console.error(
            "Page not found:",
            pageId
        );
        return;
    }

    document
        .querySelectorAll(".page")
        .forEach(function (item) {
            item.classList.remove("active");
        });

    page.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageId === "home") {
        displayBooks();
    }

    if (pageId === "cart") {
        displayCart();
    }

    if (pageId === "history") {
        displayPurchaseHistory();
    }

    if (pageId === "admin") {

        if (!isAdminLoggedIn()) {
            showPage("accountPage");
            showAccountForm("adminLoginForm");
            return;
        }

        updateDashboard();
        displayAdminBooks();
        displayCategories();
        loadAdminCategories();
        loadSubcategoryCategories();
        displaySubcategories();
    }

    if (pageId === "customersPage") {
        displayCustomers();
    }

    if (pageId === "booksPage") {
        displayBookDetails();
    }

    if (pageId === "ordersPage") {
        displayOrderDetails();
    }

    if (pageId === "payment") {
        updatePaymentTotal();
    }

/* =========================================
   MANAGER DASHBOARD
========================================= */

if (pageId === "managerDashboard") {

    // Manager must be logged in
    if (!isManagerLoggedIn()) {

        alert("Manager login required.");

        showPage("accountPage");

        showAccountForm(
            "managerLoginForm"
        );

        return;
    }


    // Load Manager Dashboard information
    loadManagerDashboard();
}
/* =========================================
   MANAGER MANAGEMENT - ADMIN ONLY
========================================= */

if (pageId === "managersPage") {

    // Only Admin can access this page
    if (!isAdminLoggedIn()) {

        alert("Admin permission required.");

        showPage("accountPage");

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    // Display registered Managers
    displayManagers();
}
}


/* =====================================================
   SCROLL TO BOOKS
===================================================== */

function scrollToBooks() {

    const books =
        document.getElementById("booksSection");

    if (books) {
        books.scrollIntoView({
            behavior: "smooth"
        });
    }
}


/* =====================================================
   SHOW ACCOUNT FORM
===================================================== */

function showAccountForm(formId) {

    // Hide every login/register form
    document
        .querySelectorAll(".account-form-section")
        .forEach(function (form) {

            form.classList.remove("active");

        });


    // Show selected form
    const selectedForm =
        document.getElementById(formId);


    if (selectedForm) {

        selectedForm.classList.add("active");

    }


    // Keep dropdown synchronized
    const menu =
        document.getElementById(
            "accountMenuSelect"
        );


    if (menu) {

        menu.value = formId;

    }
}

/* =====================================================
   ACCOUNT DROPDOWN CHANGE
===================================================== */

function changeAccountForm() {

    const menu =
        document.getElementById(
            "accountMenuSelect"
        );


    if (!menu) {
        return;
    }


    showAccountForm(
        menu.value
    );
}

/* =====================================================
   PASSWORD SHOW / HIDE
===================================================== */

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (!input) {
        return;
    }

    if (input.type === "password") {

        input.type = "text";
        button.textContent = "Hide";

    } else {

        input.type = "password";
        button.textContent = "Show";
    }
}


/* =====================================================
   CUSTOMER REGISTER - FIREBASE AUTH + FIRESTORE
===================================================== */

async function registerCustomer(event) {

    event.preventDefault();

    const name =
        document
            .getElementById("regName")
            .value
            .trim();

    const email =
        document
            .getElementById("regEmail")
            .value
            .trim()
            .toLowerCase();

    const phone =
        document
            .getElementById("regPhone")
            .value
            .trim();

    const password =
        document
            .getElementById("regPassword")
            .value;


    if (!name || !email || !phone || !password) {

        alert(
            "Please fill all registration fields."
        );

        return;
    }


    try {

        /* CREATE FIREBASE AUTH ACCOUNT */

        const credential =
            await auth
                .createUserWithEmailAndPassword(
                    email,
                    password
                );


        const user =
            credential.user;


        /* CUSTOMER PROFILE */

        const customer = {

            id: user.uid,

            name: name,

            email: email,

            phone: phone,

            address: null,

            registeredDate:
                new Date().toLocaleString()

        };


        /* SAVE PROFILE TO FIRESTORE */

        await db.collection("customers")
            .doc(user.uid)
            .set(customer);


        console.log(
            "Customer registered:",
            customer
        );


        event.target.reset();


        document.getElementById(
            "loginEmail"
        ).value = email;


        alert(
            "Registration successful. Please login."
        );


        showAccountForm(
            "customerLoginForm"
        );


        updateDashboard();

    }
    catch (error) {

        console.error(
            "Customer registration error:",
            error
        );


        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            alert(
                "This email is already registered."
            );

        }
        else if (
            error.code ===
            "auth/weak-password"
        ) {

            alert(
                "Password must contain at least 6 characters."
            );

        }
        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            alert(
                "Please enter a valid email address."
            );

        }
        else {

            alert(
                "Registration failed: " +
                error.message
            );

        }
    }
}




/* =====================================================
   CUSTOMER LOGIN - FIREBASE AUTH
===================================================== */

async function customerLogin(event) {

    event.preventDefault();

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        document
            .getElementById("loginPassword")
            .value;


    try {

        /* LOGIN USING FIREBASE AUTH */

        const credential =
            await auth
                .signInWithEmailAndPassword(
                    email,
                    password
                );


        const user =
            credential.user;


        /* GET CUSTOMER PROFILE FROM FIRESTORE */

        const customerDoc =
            await db.collection("customers")
                .doc(user.uid)
                .get();


        if (!customerDoc.exists) {

            alert(
                "Customer profile not found."
            );

            await auth.signOut();

            return;
        }


        const customer =
            customerDoc.data();


        /* KEEP CURRENT CUSTOMER FOR EXISTING WEBSITE */

        localStorage.setItem(
            "currentCustomer",
            JSON.stringify(customer)
        );


        console.log(
            "Customer logged in:",
            customer
        );


        event.target.reset();


        updateNavigation();


        alert(
            "Welcome " +
            customer.name +
            "!"
        );


        showPage("home");

    }
    catch (error) {

        console.error(
            "Customer login error:",
            error
        );


        if (
            error.code ===
            "auth/invalid-credential"
        ) {

            alert(
                "Invalid email or password."
            );

        }
        else {

            alert(
                "Login failed: " +
                error.message
            );

        }

    }
}
/* =====================================================
   CUSTOMER LOGOUT - FIREBASE AUTH
===================================================== */

async function customerLogout() {

    try {

        /* SIGN OUT FROM FIREBASE */

        await auth.signOut();


        /* REMOVE LOCAL CUSTOMER COPY */

        localStorage.removeItem(
            "currentCustomer"
        );


        /* UPDATE WEBSITE */

        updateNavigation();

        showPage("home");


        alert(
            "Customer logged out successfully."
        );

    }
    catch (error) {

        console.error(
            "Customer logout error:",
            error
        );

        alert(
            "Logout failed."
        );

    }
}

/* =====================================================
   NAVIGATION
===================================================== */

function updateNavigation() {

    const customer =
        getCurrentCustomer();

    const adminLoggedIn =
        isAdminLoggedIn();

    const managerLoggedIn =
        isManagerLoggedIn();


    const accountButton =
        document.getElementById(
            "accountNav"
        );

    const historyButton =
        document.getElementById(
            "historyNav"
        );


    /* =========================================
       ADMIN LOGGED IN
    ========================================= */

    if (adminLoggedIn) {

        if (accountButton) {

            accountButton.textContent =
                "🛠️ Admin Dashboard";

            accountButton.onclick =
                function () {

                    showPage("admin");

                };
        }


        if (historyButton) {

            historyButton.style.display =
                "none";
        }

        return;
    }


    /* =========================================
       MANAGER LOGGED IN
    ========================================= */

    if (managerLoggedIn) {

        if (accountButton) {

            accountButton.textContent =
                "👨‍💼 Manager Dashboard";

            accountButton.onclick =
                function () {

                    showPage(
                        "managerDashboard"
                    );

                };
        }


        if (historyButton) {

            historyButton.style.display =
                "none";
        }

        return;
    }


    /* =========================================
       CUSTOMER LOGGED IN
    ========================================= */

    if (customer) {

        if (accountButton) {

            accountButton.textContent =
                "Logout";

            accountButton.onclick =
                function () {

                    customerLogout();

                };
        }


        if (historyButton) {

            historyButton.style.display =
                "inline-block";
        }

        return;
    }


    /* =========================================
       NO LOGIN
    ========================================= */

    if (accountButton) {

        accountButton.textContent =
            "Login / Register";

        accountButton.onclick =
            function () {

                showPage(
                    "accountPage"
                );

                showAccountForm(
                    "customerLoginForm"
                );

            };
    }


    if (historyButton) {

        historyButton.style.display =
            "none";
    }
}

/* =====================================================
   ADMIN LOGIN - FIREBASE AUTHENTICATION
===================================================== */

async function adminLogin(event) {

    event.preventDefault();


    /* =========================================
       GET LOGIN DETAILS
    ========================================= */

    /*
       We keep the existing HTML ID
       "adminUsername" for now.

       The field will now contain the
       Admin EMAIL address.
    */

    const email =
        document
            .getElementById(
                "adminUsername"
            )
            .value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById(
                "adminPassword"
            )
            .value;


    if (
        !email ||
        !password
    ) {

        alert(
            "Please enter Admin email and password."
        );

        return;
    }


    try {

        /* =========================================
           FIREBASE AUTHENTICATION
        ========================================= */

        const credential =
            await auth
                .signInWithEmailAndPassword(
                    email,
                    password
                );


        const user =
            credential.user;


        /* =========================================
           CHECK ADMIN ROLE IN FIRESTORE
        ========================================= */

        const adminDoc =
            await db.collection("admins")
                .doc(user.uid)
                .get();


        /* USER IS NOT REGISTERED AS ADMIN */

        if (!adminDoc.exists) {

            await auth.signOut();

            localStorage.removeItem(
                "adminLoggedIn"
            );

            localStorage.removeItem(
                "currentAdmin"
            );


            alert(
                "This account does not have Admin permission."
            );

            return;
        }


        const admin =
            adminDoc.data();


        /* =========================================
           VERIFY ADMIN ROLE
        ========================================= */

        if (
            admin.role !== "admin" ||
            admin.active !== true
        ) {

            await auth.signOut();

            localStorage.removeItem(
                "adminLoggedIn"
            );

            localStorage.removeItem(
                "currentAdmin"
            );


            alert(
                "Admin access is not active."
            );

            return;
        }


        /* =========================================
           VALID ADMIN
        ========================================= */

        const currentAdmin = {

            uid:
                user.uid,

            name:
                admin.name || "Admin",

            email:
                user.email,

            role:
                "admin",

            active:
                true
        };


        localStorage.setItem(
            "currentAdmin",
            JSON.stringify(
                currentAdmin
            )
        );


        localStorage.setItem(
            "adminLoggedIn",
            "true"
        );


        /* =========================================
           CLEAR OTHER ACCOUNT TYPES
        ========================================= */

        localStorage.removeItem(
            "currentCustomer"
        );

        localStorage.removeItem(
            "currentManager"
        );

        localStorage.removeItem(
            "managerLoggedIn"
        );


        /*
           Stop an old Manager Firestore listener
           if one exists in this browser.
        */

        if (
            typeof managerProfileUnsubscribe !==
                "undefined" &&
            managerProfileUnsubscribe
        ) {

            managerProfileUnsubscribe();

            managerProfileUnsubscribe =
                null;
        }


        /* =========================================
           FINISH LOGIN
        ========================================= */

        event.target.reset();


        updateNavigation();


        console.log(
            "Firebase Admin login successful:",
            currentAdmin.email
        );


        alert(
            "Admin login successful."
        );


        showPage(
            "admin"
        );

    }
    catch (error) {

        console.error(
            "Admin login error:",
            error
        );


        localStorage.removeItem(
            "adminLoggedIn"
        );

        localStorage.removeItem(
            "currentAdmin"
        );


        alert(
            "Invalid Admin email or password."
        );
    }
}

/* =====================================================
   GET CURRENT ADMIN
===================================================== */

function getCurrentAdmin() {

    const data =
        localStorage.getItem(
            "currentAdmin"
        );


    if (!data) {
        return null;
    }


    try {

        return JSON.parse(data);

    }
    catch (error) {

        console.error(
            "Current Admin data error:",
            error
        );

        return null;
    }
}


/* =====================================================
   ADMIN LOGIN CHECK
===================================================== */

function isAdminLoggedIn() {

    const currentAdmin =
        getCurrentAdmin();


    const user =
        auth.currentUser;


    if (
        !user ||
        !currentAdmin
    ) {

        return false;
    }


    return (

        localStorage.getItem(
            "adminLoggedIn"
        ) === "true"

        &&

        currentAdmin.uid ===
            user.uid

        &&

        currentAdmin.role ===
            "admin"

        &&

        currentAdmin.active ===
            true
    );
}

/* =====================================================
   RESTORE ADMIN FIREBASE SESSION
===================================================== */

function restoreAdminSession() {

    auth.onAuthStateChanged(
        async function (user) {

            /* =========================================
               NO FIREBASE USER
            ========================================= */

            if (!user) {

                localStorage.removeItem(
                    "adminLoggedIn"
                );

                localStorage.removeItem(
                    "currentAdmin"
                );

                updateNavigation();

                return;
            }


            /*
               Only try to restore Admin mode
               when this browser previously had
               an Admin session.
            */

            const savedAdmin =
                getCurrentAdmin();


            const savedAdminLogin =
                localStorage.getItem(
                    "adminLoggedIn"
                ) === "true";


            if (
                !savedAdmin ||
                !savedAdminLogin
            ) {

                return;
            }


            /* =========================================
               CHECK SAVED UID
            ========================================= */

            if (
                savedAdmin.uid !==
                user.uid
            ) {

                localStorage.removeItem(
                    "adminLoggedIn"
                );

                localStorage.removeItem(
                    "currentAdmin"
                );

                updateNavigation();

                return;
            }


            try {

                /* =====================================
                   LOAD ADMIN PROFILE FROM FIRESTORE
                ===================================== */

                const adminDoc =
                    await db.collection(
                        "admins"
                    )
                    .doc(user.uid)
                    .get();


                /* ADMIN DOCUMENT REMOVED */

                if (!adminDoc.exists) {

                    localStorage.removeItem(
                        "adminLoggedIn"
                    );

                    localStorage.removeItem(
                        "currentAdmin"
                    );


                    updateNavigation();


                    console.warn(
                        "Admin profile not found."
                    );

                    return;
                }


                const admin =
                    adminDoc.data();


                /* =====================================
                   VERIFY ADMIN ROLE
                ===================================== */

                if (
                    admin.role !== "admin" ||
                    admin.active !== true
                ) {

                    localStorage.removeItem(
                        "adminLoggedIn"
                    );

                    localStorage.removeItem(
                        "currentAdmin"
                    );


                    updateNavigation();


                    console.warn(
                        "Admin access is not active."
                    );

                    return;
                }


                /* =====================================
                   RESTORE VALID ADMIN SESSION
                ===================================== */

                const currentAdmin = {

                    uid:
                        user.uid,

                    name:
                        admin.name || "Admin",

                    email:
                        user.email,

                    role:
                        "admin",

                    active:
                        true
                };


                localStorage.setItem(
                    "currentAdmin",
                    JSON.stringify(
                        currentAdmin
                    )
                );


                localStorage.setItem(
                    "adminLoggedIn",
                    "true"
                );


                console.log(
                    "Admin session restored:",
                    currentAdmin.email
                );


                updateNavigation();

            }
            catch (error) {

                console.error(
                    "Admin session restore error:",
                    error
                );
            }
        }
    );
}

/* =====================================================
   ADMIN LOGOUT - FIREBASE
===================================================== */

async function adminLogout() {

    try {

        await auth.signOut();

    }
    catch (error) {

        console.error(
            "Admin logout error:",
            error
        );
    }


    localStorage.removeItem(
        "adminLoggedIn"
    );


    localStorage.removeItem(
        "currentAdmin"
    );


    updateNavigation();


    showPage(
        "home"
    );


    alert(
        "Admin logged out successfully."
    );
}


/* =====================================================
   CATEGORY FILTER
===================================================== */

function loadCategoryFilter() {

    const categorySelect =
        document.getElementById(
            "category"
        );

    if (!categorySelect) {
        return;
    }


  const categories =
    getCategories().sort(function (a, b) {

        return a.localeCompare(
            b,
            undefined,
            { sensitivity: "base" }
        );

    });


    categorySelect.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;


    categories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            categorySelect.appendChild(
                option
            );
        }
    );
}


/* =====================================================
   HOME SUBCATEGORY FILTER
===================================================== */

function loadSubcategoryFilter() {

    const categorySelect =
        document.getElementById("category");

    const subcategorySelect =
        document.getElementById("subcategory");

    if (!categorySelect || !subcategorySelect) {
        return;
    }

    const selectedCategory =
        categorySelect.value;

    const allSubcategories =
        getSubcategories();


    subcategorySelect.innerHTML = `
        <option value="all">
            All Subcategories
        </option>
    `;


    if (selectedCategory === "all") {

        subcategorySelect.disabled = true;

        return;
    }


    subcategorySelect.disabled = false;


    const list =
        allSubcategories[selectedCategory] || [];


    list
        .slice()
        .sort(function (a, b) {

            return a.localeCompare(
                b,
                undefined,
                { sensitivity: "base" }
            );

        })
        .forEach(function (subcategory) {

            const option =
                document.createElement("option");

            option.value = subcategory;

            option.textContent = subcategory;

            subcategorySelect.appendChild(option);

        });
}

/* =====================================================
   SUBCATEGORY FILTER
===================================================== */



function loadSubcategoryCategories() {

    const select =
        document.getElementById(
            "subcategoryCategory"
        );

    if (!select) {
        return;
    }


    const categories =
        getCategories()
            .slice()
            .sort(function (a, b) {

                return a.localeCompare(
                    b,
                    undefined,
                    { sensitivity: "base" }
                );

            });


    select.innerHTML = `
        <option value="">
            Select Category
        </option>
    `;


    categories.forEach(function (category) {

        const option =
            document.createElement("option");

        option.value =
            category;

        option.textContent =
            category;

        select.appendChild(option);

    });
}


/* =====================================================
   ADD SUBCATEGORY
===================================================== */

async function addSubcategory() {

    const categorySelect =
        document.getElementById("subcategoryCategory");

    const input =
        document.getElementById("newSubcategory");

    if (!categorySelect || !input) {
        return;
    }


    const category =
        categorySelect.value;

    const subcategory =
        input.value.trim();


    if (!category) {

        alert("Please select a category first.");

        return;
    }


    if (!subcategory) {

        alert("Please enter a subcategory name.");

        return;
    }


    const allSubcategories =
        getSubcategories();


    if (!allSubcategories[category]) {

        allSubcategories[category] = [];
    }


    const exists =
        allSubcategories[category]
            .some(function (item) {

                return (
                    item.toLowerCase() ===
                    subcategory.toLowerCase()
                );

            });


    if (exists) {

        alert("Subcategory already exists.");

        return;
    }


    allSubcategories[category].push(
        subcategory
    );


   /* =========================================
   SAVE SUBCATEGORIES TO FIRESTORE
========================================= */

try {

    await db.collection("settings")
        .doc("subcategories")
        .set({
            items: allSubcategories
        });

    localStorage.setItem(
        "subcategories",
        JSON.stringify(allSubcategories)
    );

    console.log(
        "Subcategories saved to Firestore:",
        allSubcategories
    );

}
catch (error) {

    console.error(
        "Error saving subcategory:",
        error
    );

    alert(
        "Subcategory could not be saved."
    );

    return;
}

    input.value = "";

    displaySubcategories();

    loadSubcategoryFilter();

    alert("Subcategory added successfully.");
}

/* =====================================================
   DISPLAY SUBCATEGORIES
===================================================== */

function displaySubcategories() {

    const categorySelect =
        document.getElementById("subcategoryCategory");

    const container =
        document.getElementById("subcategoryList");


    if (!categorySelect || !container) {
        return;
    }


    const category =
        categorySelect.value;


    container.innerHTML = "";


    if (!category) {
        return;
    }


    const allSubcategories =
        getSubcategories();


    const list =
        (allSubcategories[category] || [])
            .slice()
            .sort(function (a, b) {

                return a.localeCompare(
                    b,
                    undefined,
                    { sensitivity: "base" }
                );

            });


    if (list.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No subcategories added yet.
            </p>
        `;

        return;
    }


    list.forEach(function (subcategory) {

        const item =
            document.createElement("div");


        item.className =
            "category-item";


        const name =
            document.createElement("span");

        name.textContent =
            "↳ " + subcategory;


        const buttons =
            document.createElement("div");


        const editButton =
            document.createElement("button");

        editButton.className =
            "category-edit-btn";

        editButton.textContent =
            "Edit";

        editButton.onclick =
            function () {

                editSubcategory(
                    category,
                    subcategory
                );

            };


        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "category-delete-btn";

        deleteButton.textContent =
            "Delete";

        deleteButton.onclick =
            function () {

                deleteSubcategory(
                    category,
                    subcategory
                );

            };


        buttons.appendChild(editButton);

        buttons.appendChild(deleteButton);

        item.appendChild(name);

        item.appendChild(buttons);

        container.appendChild(item);

    });
}

/* =====================================================
   EDIT SUBCATEGORY
===================================================== */

async function editSubcategory(
    category,
    oldSubcategory
) {

    const newName =
        prompt(
            "Edit subcategory:",
            oldSubcategory
        );


    if (newName === null) {
        return;
    }


    const cleanedName =
        newName.trim();


    if (!cleanedName) {

        alert(
            "Subcategory name cannot be empty."
        );

        return;
    }


    const allSubcategories =
        getSubcategories();


    const list =
        allSubcategories[category] || [];


    const duplicate =
        list.some(function (item) {

            return (
                item.toLowerCase() ===
                    cleanedName.toLowerCase()
                &&
                item.toLowerCase() !==
                    oldSubcategory.toLowerCase()
            );

        });


    if (duplicate) {

        alert(
            "Subcategory already exists."
        );

        return;
    }


    const index =
        list.indexOf(oldSubcategory);


    if (index === -1) {
        return;
    }


    list[index] =
        cleanedName;


    allSubcategories[category] =
        list;


  /* =========================================
   UPDATE SUBCATEGORIES IN FIRESTORE
========================================= */

try {

    await db.collection("settings")
        .doc("subcategories")
        .set({
            items: allSubcategories
        });

    localStorage.setItem(
        "subcategories",
        JSON.stringify(allSubcategories)
    );

    console.log(
        "Subcategory updated in Firestore:",
        oldSubcategory,
        "->",
        cleanedName
    );

}
catch (error) {

    console.error(
        "Error updating subcategory:",
        error
    );

    alert(
        "Subcategory could not be updated."
    );

    return;
}


/* =========================================
   UPDATE SUBCATEGORY NAME INSIDE FIRESTORE BOOKS
========================================= */

try {

    const snapshot =
        await db.collection("books")
            .where(
                "category",
                "==",
                category
            )
            .get();

    const batch =
        db.batch();

    snapshot.forEach(function (doc) {

        const book =
            doc.data();

        const bookSubcategories =
            Array.isArray(book.subcategories)
                ? book.subcategories
                : book.subcategory
                    ? [book.subcategory]
                    : [];

        const updatedSubcategories =
            bookSubcategories.map(
                function (item) {

                    return item === oldSubcategory
                        ? cleanedName
                        : item;
                }
            );

        batch.update(
            doc.ref,
            {
                subcategories:
                    updatedSubcategories,

                subcategory:
                    firebase.firestore.FieldValue.delete()
            }
        );

    });

    await batch.commit();

    console.log(
        "Book subcategories updated:",
        oldSubcategory,
        "->",
        cleanedName
    );

}
catch (error) {

    console.error(
        "Error updating book subcategories:",
        error
    );

    alert(
        "Subcategory was renamed, but some books could not be updated."
    );

    return;
}


/* REFRESH WEBSITE */

displaySubcategories();

loadSubcategoryFilter();

displayBooks();

displayAdminBooks();
}

/* =====================================================
   DELETE SUBCATEGORY
===================================================== */

async function deleteSubcategory(
    category,
    subcategory
) {

    const confirmed =
        confirm(
            "Delete subcategory '" +
            subcategory +
            "'?"
        );


    if (!confirmed) {
        return;
    }


    const allSubcategories =
        getSubcategories();


    const list =
        allSubcategories[category] || [];


    allSubcategories[category] =
        list.filter(function (item) {

            return item !== subcategory;

        });


 /* =========================================
   DELETE SUBCATEGORY FROM FIRESTORE
========================================= */

try {

    await db.collection("settings")
        .doc("subcategories")
        .set({
            items: allSubcategories
        });

    localStorage.setItem(
        "subcategories",
        JSON.stringify(allSubcategories)
    );

    console.log(
        "Subcategory deleted from Firestore:",
        subcategory
    );

}
catch (error) {

    console.error(
        "Error deleting subcategory:",
        error
    );

    alert(
        "Subcategory could not be deleted."
    );

    return;
}


/* =====================================================
   REMOVE DELETED SUBCATEGORY FROM BOOKS
===================================================== */

/* =========================================
   REMOVE SUBCATEGORY FROM FIRESTORE BOOKS
========================================= */

try {

    const snapshot =
        await db.collection("books")
            .where(
                "category",
                "==",
                category
            )
            .get();

    const batch =
        db.batch();

    snapshot.forEach(function (doc) {

        const book =
            doc.data();

        const bookSubcategories =
            Array.isArray(book.subcategories)
                ? book.subcategories
                : book.subcategory
                    ? [book.subcategory]
                    : [];

        const updatedSubcategories =
            bookSubcategories.filter(
                function (item) {
                    return item !== subcategory;
                }
            );

        batch.update(
            doc.ref,
            {
                subcategories:
                    updatedSubcategories,

                subcategory:
                    firebase.firestore.FieldValue.delete()
            }
        );

    });

    await batch.commit();

    console.log(
        "Subcategory removed from affected books:",
        subcategory
    );

}
catch (error) {

    console.error(
        "Error updating affected books:",
        error
    );

    alert(
        "Subcategory was deleted, but some books could not be updated."
    );

    return;
}

/* REFRESH WEBSITE */

displaySubcategories();

loadSubcategoryFilter();

displayBooks();

displayAdminBooks();
}


/* =====================================================
   ADMIN CATEGORY SELECT
===================================================== */

function loadAdminCategories() {

    const select =
        document.getElementById(
            "bookCategory"
        );

    if (!select) {
        return;
    }


    const categories =
        getCategories();


    select.innerHTML = `
    <option value="" disabled selected>
        Select Category
    </option>
`;


    categories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            select.appendChild(
                option
            );
        }
    );
}

/* =====================================================
   LOAD SUBCATEGORIES FOR ADD BOOK
   MULTIPLE SUBCATEGORY VERSION
===================================================== */

function loadBookSubcategories() {

    const categorySelect =
        document.getElementById("bookCategory");

    const container =
        document.getElementById("bookSubcategoryList");


    if (!categorySelect || !container) {
        return;
    }


    const category =
        categorySelect.value;


    container.innerHTML = "";


    if (!category) {

        container.innerHTML = `
            <p class="subcategory-help">
                Select a category first.
            </p>
        `;

        return;
    }


    const allSubcategories =
        getSubcategories();


    const subcategories =
        (allSubcategories[category] || [])
            .slice()
            .sort(function (a, b) {

                return a.localeCompare(
                    b,
                    undefined,
                    { sensitivity: "base" }
                );

            });


    if (subcategories.length === 0) {

        container.innerHTML = `
            <p class="subcategory-help">
                No subcategories available for this category.
            </p>
        `;

        return;
    }


    subcategories.forEach(
        function (subcategory) {

            const label =
                document.createElement("label");

            label.className =
                "book-subcategory-option";


            const checkbox =
                document.createElement("input");

            checkbox.type =
                "checkbox";

            checkbox.name =
                "bookSubcategories";

            checkbox.value =
                subcategory;


            const text =
                document.createElement("span");

            text.textContent =
                subcategory;


            label.appendChild(
                checkbox
            );

            label.appendChild(
                text
            );


            container.appendChild(
                label
            );
        }
    );
}
/* =====================================================
   DISPLAY CATEGORY MANAGEMENT
===================================================== */

function displayCategories() {

    const container =
        document.getElementById(
            "categoryList"
        );

    if (!container) {
        return;
    }


    const categories =
        getCategories();


    container.innerHTML = "";


    categories.forEach(
        function (category, index) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "category-item";


            item.innerHTML = `

                <span>
                    📚 ${category}
                </span>

                <div>

                    <button
                        class="category-edit-btn"
                        onclick="editCategory(${index})"
                    >
                        Edit
                    </button>

                    <button
                        class="category-delete-btn"
                        onclick="deleteCategory(${index})"
                    >
                        Delete
                    </button>

                </div>
            `;


            container.appendChild(
                item
            );
        }
    );
    loadSubcategoryCategories();
}


/* =====================================================
   ADD CATEGORY
===================================================== */

async function addCategory() {

    const input =
        document.getElementById(
            "newCategory"
        );

    if (!input) {
        return;
    }


    const category =
        input.value.trim();


    if (!category) {

        alert(
            "Enter a category name."
        );

        return;
    }


    let categories =
        getCategories();


    const exists =
        categories.some(
            function (item) {

                return (
                    item.toLowerCase() ===
                    category.toLowerCase()
                );
            }
        );


    if (exists) {

        alert(
            "Category already exists."
        );

        return;
    }


   categories.push(category);


/* =========================================
   SAVE CATEGORIES TO FIRESTORE
========================================= */

try {

    await db.collection("settings")
        .doc("categories")
        .set({
            items: categories
        });

    /* Keep local copy for old functions */

    localStorage.setItem(
        "categories",
        JSON.stringify(categories)
    );

    console.log(
        "Categories saved to Firestore:",
        categories
    );

}
catch (error) {

    console.error(
        "Error saving categories:",
        error
    );

    alert(
        "Category could not be saved."
    );

    return;
}


input.value = "";

refreshCategories();

alert(
    "Category added successfully."
);
}


/* =====================================================
   EDIT CATEGORY
===================================================== */

async function editCategory(index) {

    let categories =
        getCategories();


    const oldCategory =
        categories[index];


    const value =
        prompt(
            "Enter new category name:",
            oldCategory
        );


    if (value === null) {
        return;
    }


    const newCategory =
        value.trim();


    if (!newCategory) {

        alert(
            "Category cannot be empty."
        );

        return;
    }


    const duplicate =
        categories.some(
            function (category, currentIndex) {

                return (
                    currentIndex !== index &&
                    category.toLowerCase() ===
                    newCategory.toLowerCase()
                );
            }
        );


    if (duplicate) {

        alert(
            "Category already exists."
        );

        return;
    }


    categories[index] =
        newCategory;


    try {

    await db.collection("settings")
        .doc("categories")
        .set({
            items: categories
        });

    localStorage.setItem(
        "categories",
        JSON.stringify(categories)
    );

    console.log(
        "Category updated in Firestore:",
        oldCategory,
        "->",
        newCategory
    );

}
catch (error) {

    console.error(
        "Error updating category:",
        error
    );

    alert(
        "Category could not be updated."
    );

    return;
}


   /* =========================================
   UPDATE CATEGORY INSIDE FIRESTORE BOOKS
========================================= */

try {

    const snapshot =
        await db.collection("books")
            .where(
                "category",
                "==",
                oldCategory
            )
            .get();


    const batch =
        db.batch();


    snapshot.forEach(function (doc) {

        batch.update(
            doc.ref,
            {
                category: newCategory
            }
        );

    });


    await batch.commit();


    console.log(
        "Book categories updated:",
        oldCategory,
        "->",
        newCategory
    );

}
catch (error) {

    console.error(
        "Error updating book categories:",
        error
    );

    alert(
        "Category was renamed, but some books could not be updated."
    );

    return;
}

    refreshCategories();

    displayBooks();

    displayAdminBooks();
}


/* =====================================================
   DELETE CATEGORY
===================================================== */

async function deleteCategory(index) {

    let categories =
        getCategories();


    const category =
        categories[index];


    const books =
        getBooks();


    const used =
        books.some(
            function (book) {

                return (
                    book.category ===
                    category
                );
            }
        );


    if (used) {

        alert(
            "This category is currently used by a book. Change the book category first."
        );

        return;
    }


    if (
        !confirm(
            "Delete " +
            category +
            " category?"
        )
    ) {
        return;
    }


    categories.splice(
        index,
        1
    );


   /* =========================================
   DELETE CATEGORY FROM FIRESTORE
========================================= */

try {

    await db.collection("settings")
        .doc("categories")
        .set({
            items: categories
        });

    localStorage.setItem(
        "categories",
        JSON.stringify(categories)
    );

    console.log(
        "Category deleted from Firestore:",
        category
    );

}
catch (error) {

    console.error(
        "Error deleting category:",
        error
    );

    alert(
        "Category could not be deleted."
    );

    return;
}


    refreshCategories();
}


/* =====================================================
   REFRESH CATEGORIES
===================================================== */

function refreshCategories() {

    loadCategoryFilter();

    loadAdminCategories();

    displayCategories();
}


/* =====================================================
   DISPLAY BOOKS
===================================================== */

async function displayBooks() {

    const container =
        document.getElementById(
            "bookContainer"
        );

    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "search"
        );

    const categoryInput =
        document.getElementById(
            "category"
        );


        const subcategoryInput =
    document.getElementById(
        "subcategory"
    );

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categoryInput
            ? categoryInput.value
            : "all";

            const subcategory =
        subcategoryInput
            ? subcategoryInput.value
            : "all";


   /* =========================================
   LOAD BOOKS FROM FIRESTORE
========================================= */

let books = [];

try {

    const snapshot =
        await db.collection("books").get();

    snapshot.forEach(function (doc) {

        const data = doc.data();

        books.push({
            ...data,

            /*
               If the book already has an ID,
               keep it.

               Otherwise use Firestore's
               document ID.
            */
            id:
                data.id !== undefined
                    ? data.id
                    : doc.id
        });

    });


    /* =========================================
       KEEP LOCAL COPY FOR CART + OLD FUNCTIONS
    ========================================= */

    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );


    console.log(
        "Books loaded from Firestore:",
        books
    );

}
catch (error) {

    console.error(
        "Error loading books from Firestore:",
        error
    );


    /*
       If internet/Firestore has a temporary
       problem, use the old local copy.
    */

    books = getBooks();

}


    const filtered =
        books.filter(
            function (book) {

                const searchMatch =

                    String(book.title)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(book.author)
                        .toLowerCase()
                        .includes(search);


                const categoryMatch =

                    category === "all"

                    ||

                    book.category ===
                    category;

                /* SUBCATEGORY MATCH */

const bookSubcategories =
    Array.isArray(book.subcategories)
        ? book.subcategories
        : book.subcategory
            ? [book.subcategory]
            : [];


const subcategoryMatch =

    subcategory === "all"

    ||

    bookSubcategories.includes(
        subcategory
    );    


                return (
                    searchMatch &&
                    categoryMatch &&
                    subcategoryMatch
                );
            }
        );


    container.innerHTML = "";


    if (filtered.length === 0) {

        container.innerHTML = `

            <div class="empty-message">
                No books found.
            </div>
        `;

        return;
    }


    filtered.forEach(
        function (book) {

            const stock =
                Number(book.stock) || 0;


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "book-card";


            card.innerHTML = `

                <img
                    src="${book.image}"
                    alt="${book.title}"
                >

                <div class="book-info">

                    <h3>
                        ${book.title}
                    </h3>

                    <p>
                        By ${book.author}
                    </p>

                    <p>
                        Category:
                        ${book.category}
                    </p>

                    <p class="price">
                        ₹${book.price}
                    </p>

                    <p class="stock">
                        Stock: ${stock}
                    </p>

                    ${
                        stock > 0
                        ? `

                        <div class="quantity-selector">

                            <button
                                onclick="changeBookQuantity(${book.id}, -1)"
                            >
                                −
                            </button>

                            <input
                                id="bookQty-${book.id}"
                                type="number"
                                value="1"
                                min="1"
                                max="${stock}"
                                readonly
                            >

                            <button
                                onclick="changeBookQuantity(${book.id}, 1)"
                            >
                                +
                            </button>

                        </div>

                        <button
                            class="add-cart"
                            onclick="addSelectedBookToCart(${book.id})"
                        >
                            🛒 Add to Cart
                        </button>

                        `
                        : `

                        <button
                            class="add-cart"
                            disabled
                        >
                            Out of Stock
                        </button>

                        `
                    }

                </div>
            `;


            container.appendChild(
                card
            );
        }
    );
}


/* =====================================================
   CHANGE STORE QUANTITY
===================================================== */

function changeBookQuantity(
    bookId,
    amount
) {

    const input =
        document.getElementById(
            "bookQty-" + bookId
        );

    if (!input) {
        return;
    }


    let quantity =
        Number(input.value) || 1;

    const maximum =
        Number(input.max) || 1;


    quantity += amount;


    if (quantity < 1) {
        quantity = 1;
    }

    if (quantity > maximum) {
        quantity = maximum;
    }


    input.value =
        quantity;
}


/* =====================================================
   ADD BOOK TO CART
===================================================== */

function addSelectedBookToCart(bookId) {

    const books =
        getBooks();


    const book =
        books.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(bookId)
                );
            }
        );


    if (!book) {

        alert(
            "Book not found."
        );

        return;
    }


    const input =
        document.getElementById(
            "bookQty-" + bookId
        );


    const quantity =
        input
            ? Number(input.value)
            : 1;


    const stock =
        Number(book.stock) || 0;


    if (quantity > stock) {

        alert(
            "Only " +
            stock +
            " books available."
        );

        return;
    }


    let cart =
        getCart();


    const existing =
        cart.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(bookId)
                );
            }
        );


    if (existing) {

        const newQuantity =
            Number(existing.quantity) +
            quantity;


        if (newQuantity > stock) {

            alert(
                "You cannot add more than available stock."
            );

            return;
        }


        existing.quantity =
            newQuantity;

    } else {

        cart.push({

            ...book,

            quantity: quantity
        });
    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    updateCartCount();


    alert(
        book.title +
        " added to cart."
    );
}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

    const element =
        document.getElementById(
            "cartCount"
        );

    if (!element) {
        return;
    }


    const cart =
        getCart();


    const count =
        cart.reduce(
            function (total, book) {

                return (
                    total +
                    (
                        Number(book.quantity)
                        || 1
                    )
                );
            },
            0
        );


    element.textContent =
        count;
}


/* =====================================================
   CART TOTAL
===================================================== */

function calculateCartTotal() {

    return getCart().reduce(
        function (total, book) {

            return (
                total +
                Number(book.price) *
                (
                    Number(book.quantity)
                    || 1
                )
            );
        },
        0
    );
}


/* =====================================================
   DISPLAY CART
===================================================== */

function displayCart() {

    const container =
        document.getElementById(
            "cartItems"
        );

    if (!container) {
        return;
    }


    const cart =
        getCart();


    container.innerHTML = "";


    if (cart.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                <h3>
                    Your cart is empty.
                </h3>

                <p>
                    Add books from the store.
                </p>

            </div>
        `;
    }


    cart.forEach(
        function (book, index) {

            const quantity =
                Number(book.quantity) || 1;

            const subtotal =
                Number(book.price) *
                quantity;


            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "cart-item";


            item.innerHTML = `

                <div>

                    <h3>
                        ${book.title}
                    </h3>

                    <p>
                        ₹${book.price}
                    </p>

                    <div class="cart-quantity">

                        <button
                            onclick="changeCartQuantity(${index}, -1)"
                        >
                            −
                        </button>

                        <strong>
                            ${quantity}
                        </strong>

                        <button
                            onclick="changeCartQuantity(${index}, 1)"
                        >
                            +
                        </button>

                    </div>

                    <p>
                        Subtotal:
                        <strong>
                            ₹${subtotal}
                        </strong>
                    </p>

                </div>

                <button
                    class="remove-btn"
                    onclick="removeFromCart(${index})"
                >
                    Remove
                </button>
            `;


            container.appendChild(
                item
            );
        }
    );


    const total =
        document.getElementById(
            "cartTotal"
        );


    if (total) {

        total.textContent =
            calculateCartTotal();
    }


    updateCartCount();
}


/* =====================================================
   CHANGE CART QUANTITY
===================================================== */

function changeCartQuantity(
    index,
    amount
) {

    let cart =
        getCart();


    if (!cart[index]) {
        return;
    }


    const books =
        getBooks();


    const book =
        books.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(cart[index].id)
                );
            }
        );


    if (!book) {
        return;
    }


    let quantity =
        Number(cart[index].quantity)
        || 1;


    quantity += amount;


    if (quantity < 1) {
        quantity = 1;
    }


    if (
        quantity >
        Number(book.stock)
    ) {

        alert(
            "Only " +
            book.stock +
            " available."
        );

        return;
    }


    cart[index].quantity =
        quantity;


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    displayCart();
}


/* =====================================================
   REMOVE CART ITEM
===================================================== */

function removeFromCart(index) {

    let cart =
        getCart();


    cart.splice(
        index,
        1
    );


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    displayCart();
}


/* =====================================================
   VALIDATE CART STOCK
===================================================== */

function validateCartStock() {

    const cart =
        getCart();

    const books =
        getBooks();


    for (const cartBook of cart) {

        const book =
            books.find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(cartBook.id)
                    );
                }
            );


        if (!book) {

            alert(
                cartBook.title +
                " is no longer available."
            );

            return false;
        }


        if (
            Number(cartBook.quantity) >
            Number(book.stock)
        ) {

            alert(
                "Only " +
                book.stock +
                " copies of " +
                book.title +
                " are available."
            );

            return false;
        }
    }


    return true;
}


/* =====================================================
   CART -> DELIVERY ADDRESS
===================================================== */

function goToPayment() {

    const customer =
        getCurrentCustomer();


    if (!customer) {

        alert(
            "Please login before purchasing."
        );

        showPage("accountPage");

        showAccountForm(
            "customerLoginForm"
        );

        return;
    }


    if (getCart().length === 0) {

        alert(
            "Your cart is empty."
        );

        return;
    }


    if (!validateCartStock()) {
        return;
    }


    loadSavedAddress();


    /*
       IMPORTANT:
       Address comes BEFORE payment.
    */

    showPage(
        "deliveryAddress"
    );
}


/* =====================================================
   LOAD SAVED ADDRESS
===================================================== */

function loadSavedAddress() {

    const customer =
        getCurrentCustomer();

    if (!customer) {
        return;
    }


    const address =
        customer.address || {};


    setField(
        "deliveryName",
        address.name ||
        customer.name ||
        ""
    );

    setField(
        "deliveryPhone",
        address.phone ||
        customer.phone ||
        ""
    );

    setField(
        "deliveryAddressText",
        address.address ||
        ""
    );

    setField(
        "deliveryCity",
        address.city ||
        ""
    );

    setField(
        "deliveryState",
        address.state ||
        ""
    );

    setField(
        "deliveryPincode",
        address.pincode ||
        ""
    );
}


function setField(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value;
    }
}


/* =====================================================
   SAVE DELIVERY ADDRESS
===================================================== */

async function saveDeliveryAddress(event) {

    event.preventDefault();


    let customer =
        getCurrentCustomer();


    if (!customer) {

        alert(
            "Please login first."
        );

        showPage("accountPage");

        return;
    }


    const address = {

        name:
            document
                .getElementById("deliveryName")
                .value
                .trim(),

        phone:
            document
                .getElementById("deliveryPhone")
                .value
                .trim(),

        address:
            document
                .getElementById("deliveryAddressText")
                .value
                .trim(),

        city:
            document
                .getElementById("deliveryCity")
                .value
                .trim(),

        state:
            document
                .getElementById("deliveryState")
                .value
                .trim(),

        pincode:
            document
                .getElementById("deliveryPincode")
                .value
                .trim()
    };


    customer.address =
        address;


    localStorage.setItem(
        "currentCustomer",
        JSON.stringify(customer)
    );


   /* =========================================
   SAVE ADDRESS TO FIRESTORE
========================================= */

try {

    await db.collection("customers")
        .doc(String(customer.id))
        .update({
            address: address
        });


    localStorage.setItem(
        "currentCustomer",
        JSON.stringify(customer)
    );


    console.log(
        "Customer address saved:",
        address
    );

}
catch (error) {

    console.error(
        "Address save error:",
        error
    );

    alert(
        "Address could not be saved."
    );

    return;
}

    updatePaymentTotal();


    showPage("payment");
}


/* =====================================================
   PAYMENT TOTAL
===================================================== */

function updatePaymentTotal() {

    const total =
        calculateCartTotal();


    // NORMAL PAYMENT PAGE TOTAL

    const paymentTotal =
        document.getElementById(
            "paymentTotal"
        );

    if (paymentTotal) {

        paymentTotal.textContent =
            total;
    }


    // UPI PAYMENT TOTAL

    const upiPaymentAmount =
        document.getElementById(
            "upiPaymentAmount"
        );

    if (upiPaymentAmount) {

        upiPaymentAmount.textContent =
            total;
    }
}

function changePaymentMethod() {

    const onlinePaymentDetails =
        document.getElementById(
            "onlinePaymentDetails"
        );

    const continueButton =
        document.getElementById(
            "continuePaymentBtn"
        );

    if (onlinePaymentDetails) {

        onlinePaymentDetails.style.display =
            "none";
    }

    if (continueButton) {

        continueButton.style.display =
            "block";
    }


    // CLEAR OLD TRANSACTION ID

    const transactionInput =
        document.getElementById(
            "paymentTransactionId"
        );

    if (transactionInput) {

        transactionInput.value = "";
    }
}

function continueSelectedPayment() {

    const payment =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    if (!payment) {

        alert(
            "Please select a payment method."
        );

        return;
    }


    // ==========================================
    // ONLINE UPI PAYMENT
    // ==========================================

    if (payment.value === "UPI") {

        const onlinePaymentDetails =
            document.getElementById(
                "onlinePaymentDetails"
            );

        const continueButton =
            document.getElementById(
                "continuePaymentBtn"
            );


        updatePaymentTotal();


        if (onlinePaymentDetails) {

            onlinePaymentDetails.style.display =
                "block";
        }


        if (continueButton) {

            continueButton.style.display =
                "none";
        }


        onlinePaymentDetails?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        return;
    }


    // ==========================================
    // CASH ON DELIVERY
    // ==========================================

    if (
        payment.value ===
        "Cash on Delivery"
    ) {

        const confirmCOD =
            confirm(
                "Place this order using Cash on Delivery?"
            );


        if (!confirmCOD) {

            return;
        }


        processPayment();
    }
}

function copyAdminUpiId() {

    const upiElement =
        document.getElementById(
            "adminUpiId"
        );


    if (!upiElement) {

        return;
    }


    const upiId =
        upiElement.textContent.trim();


    navigator.clipboard
        .writeText(upiId)
        .then(function () {

            alert(
                "UPI ID copied!"
            );

        })
        .catch(function () {

            alert(
                "Unable to copy UPI ID."
            );

        });
}
//==========================================
// Confirm Online Payment
//===========================================
async function confirmOnlinePayment() {

    const customer =
        getCurrentCustomer();


    // ==========================================
    // CHECK CUSTOMER
    // ==========================================

    if (!customer) {

        alert(
            "Please login before placing the order."
        );

        return;
    }


    // ==========================================
    // CHECK CART
    // ==========================================

    const cart =
        getCart();


    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        showPage("cart");

        return;
    }


    // ==========================================
    // CHECK STOCK
    // ==========================================

    if (!validateCartStock()) {

        return;
    }


    // ==========================================
    // GET TRANSACTION ID
    // ==========================================

    const transactionInput =
        document.getElementById(
            "paymentTransactionId"
        );


    if (!transactionInput) {

        alert(
            "Transaction ID field not found."
        );

        return;
    }


    const transactionId =
        transactionInput.value.trim();


    if (transactionId === "") {

        alert(
            "Please enter the UPI transaction/reference ID."
        );

        transactionInput.focus();

        return;
    }


    // BASIC LENGTH CHECK

    if (transactionId.length < 6) {

        alert(
            "Please enter a valid transaction/reference ID."
        );

        transactionInput.focus();

        return;
    }


    // ==========================================
    // PREVENT SAME REFERENCE ID BEING REUSED
    // ==========================================

    let orders =
        getOrders();


    const transactionAlreadyUsed =
        orders.some(function (order) {

            return (
                order.transactionId &&
                String(order.transactionId)
                    .toLowerCase() ===
                transactionId.toLowerCase()
            );

        });


    if (transactionAlreadyUsed) {

        alert(
            "This transaction/reference ID has already been submitted."
        );

        return;
    }


    // ==========================================
    // CREATE ORDER
    // ==========================================

    const order = {

        id:
            "BH" + Date.now(),

        customerId:
            customer.id,

        customer:
            customer.name,

        email:
            customer.email,

        phone:
            customer.phone,

        address:
            customer.address,

        books:
            cart.map(function (book) {

                return {

                    ...book,

                    quantity:
                        Number(book.quantity)
                        || 1

                };

            }),

        total:
            calculateCartTotal(),

        paymentMethod:
            "UPI",

        transactionId:
            transactionId,

        paymentStatus:
            "Pending Verification",

        status:
            "Payment Verification Pending",
        
        stockReduced: false,    

        date:
            new Date()
                .toLocaleString()

    };


   // ==========================================
// SAVE ORDER TO FIRESTORE
// ==========================================

try {

    await db.collection("orders")
        .doc(String(order.id))
        .set(order);

    console.log(
        "UPI order saved to Firestore:",
        order
    );


    // Keep local copy for existing functions

    orders.push(order);

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    // Save latest order for receipt

    localStorage.setItem(
        "latestOrder",
        JSON.stringify(order)
    );

}
catch (error) {

    console.error(
        "Error saving UPI order:",
        error
    );

    alert(
        "Order could not be saved. Please try again."
    );

    return;
}


    // ==========================================
    // CLEAR CART
    // ==========================================

    localStorage.setItem(
        "cart",
        JSON.stringify([])
    );


    // ==========================================
    // UPDATE WEBSITE
    // ==========================================

    updateCartCount();

    displayBooks();

    displayCart();

    updateDashboard();


    // ==========================================
    // GENERATE RECEIPT
    // ==========================================

    generateReceipt(order);


    alert(
        "Payment details submitted successfully!\n\n" +
        "Your payment is waiting for admin verification."
    );


    showPage("receipt");
}




/* =====================================================
   PROCESS PAYMENT
===================================================== */

async function processPayment() {

    const customer =
        getCurrentCustomer();


    if (!customer) {

        alert(
            "Please login first."
        );

        return;
    }


    const cart =
        getCart();


    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        showPage("cart");

        return;
    }


    if (!validateCartStock()) {
        return;
    }


    const payment =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    if (!payment) {

        alert(
            "Please select a payment method."
        );

        return;
    }


    const order = {

        id:
            "BH" + Date.now(),

        customerId:
            customer.id,

        customer:
            customer.name,

        email:
            customer.email,

        phone:
            customer.phone,

        address:
            customer.address,

        books:
            cart.map(
                function (book) {

                    return {

                        ...book,

                        quantity:
                            Number(book.quantity)
                            || 1
                    };
                }
            ),

        total:
            calculateCartTotal(),

        paymentMethod:
            payment.value,

       status:
    "Awaiting Admin Confirmation",

stockReduced:
    false,

date:
    new Date()
        .toLocaleString()
    };

let orders =
    getOrders();


// ==========================================
// SAVE COD ORDER TO FIRESTORE
// ==========================================

try {

    await db.collection("orders")
        .doc(String(order.id))
        .set(order);

    console.log(
        "COD order saved to Firestore:",
        order
    );


    // Keep local copy for existing functions

    orders.push(order);

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );

}
catch (error) {

    console.error(
        "Error saving COD order:",
        error
    );

    alert(
        "Order could not be saved. Please try again."
    );

    return;
}



    localStorage.setItem(
        "latestOrder",
        JSON.stringify(order)
    );


    localStorage.setItem(
        "cart",
        JSON.stringify([])
    );


    updateCartCount();

    displayBooks();

    displayCart();

    updateDashboard();

    generateReceipt(order);


   alert(
    "Order placed successfully!\n\n" +
    "Your Cash on Delivery order is waiting for Admin confirmation."
);


    showPage("receipt");
}


/* =====================================================
   REDUCE STOCK AFTER PURCHASE - FIRESTORE
===================================================== */

async function reducePurchasedStock(cart) {

    try {

        await db.runTransaction(
            async function (transaction) {

                const updates = [];


                /*
                   FIRST READ ALL BOOKS
                */

                for (const cartBook of cart) {

                    const bookRef =
                        db.collection("books")
                            .doc(String(cartBook.id));


                    const bookDoc =
                        await transaction.get(bookRef);


                    if (!bookDoc.exists) {

                        throw new Error(
                            cartBook.title +
                            " is no longer available."
                        );
                    }


                    const bookData =
                        bookDoc.data();


                    const currentStock =
                        Number(bookData.stock) || 0;


                    const quantity =
                        Number(cartBook.quantity) || 1;


                    if (quantity > currentStock) {

                        throw new Error(
                            "Not enough stock for " +
                            cartBook.title +
                            ". Available: " +
                            currentStock
                        );
                    }


                    updates.push({

                        ref: bookRef,

                        newStock:
                            currentStock -
                            quantity

                    });
                }


                /*
                   AFTER ALL READS,
                   UPDATE STOCK
                */

                updates.forEach(
                    function (item) {

                        transaction.update(
                            item.ref,
                            {
                                stock:
                                    item.newStock
                            }
                        );

                    }
                );

            }
        );


        console.log(
            "Book stock updated in Firestore."
        );


        /*
           Reload books and refresh
           local book cache
        */

        await displayBooks();


        return true;

    }
    catch (error) {

        console.error(
            "Stock update error:",
            error
        );


        alert(
            "Stock could not be updated.\n\n" +
            error.message
        );


        return false;
    }
}

/* =====================================================
   RECEIPT
===================================================== */

function generateReceipt(order) {

    const container =
        document.getElementById(
            "receiptContent"
        );

    if (!container) {
        return;
    }


    let booksHTML = "";


    order.books.forEach(
        function (book) {

            const quantity =
                Number(book.quantity)
                || 1;

            const subtotal =
                Number(book.price) *
                quantity;


            booksHTML += `

                <div class="receipt-book">

                    <p>

                        <strong>
                            ${book.title}
                        </strong>

                        <br>

                        ₹${book.price}
                        ×
                        ${quantity}

                    </p>

                    <strong>
                        ₹${subtotal}
                    </strong>

                </div>
            `;
        }
    );


    const address =
        order.address || {};


    container.innerHTML = `

        <h1>
            📚 Book Haven
        </h1>

        <h2>
            Purchase Receipt
        </h2>

        <p>
            <strong>Order No:</strong>
            ${order.id}
        </p>

        <p>
            <strong>Customer:</strong>
            ${order.customer}
        </p>

        <p>
            <strong>Date:</strong>
            ${order.date}
        </p>

        <p>
            <strong>Payment:</strong>
            ${order.paymentMethod}
        </p>

        ${
    order.paymentMethod === "UPI"
        ? `
            <p>
                <strong>Transaction ID:</strong>
                ${order.transactionId || "-"}
            </p>

            <p>
                <strong>Payment Status:</strong>
                ${order.paymentStatus || "Pending Verification"}
            </p>
        `
        : ""
}


        <p>
            <strong>Delivery Address:</strong><br>

            ${address.name || ""}<br>

            ${address.address || ""}<br>

            ${address.city || ""}
            ${address.state || ""}<br>

            ${address.pincode || ""}

        </p>

        <hr>

        ${booksHTML}

        <hr>

        <h2>
            Total: ₹${order.total}
        </h2>
    `;
}


/* =====================================================
   DOWNLOAD / PRINT RECEIPT
===================================================== */

function downloadReceipt() {

    window.print();
}


/* =====================================================
   PURCHASE HISTORY
===================================================== */

async function displayPurchaseHistory() {

    const customer =
        getCurrentCustomer();


    if (!customer) {

        alert(
            "Please login to view purchase history."
        );

        showPage("accountPage");

        showAccountForm(
            "customerLoginForm"
        );

        return;
    }


    const container =
        document.getElementById(
            "historyContainer"
        );


    const countElement =
        document.getElementById(
            "totalPurchases"
        );


    if (!container) {
        return;
    }

/* =========================================
   LOAD CUSTOMER ORDERS FROM FIRESTORE
========================================= */

let customerOrders = [];

try {

    const snapshot =
        await db.collection("orders")
            .where(
                "customerId",
                "==",
                String(customer.id)
            )
            .get();


    snapshot.forEach(
        function (doc) {

            const data =
                doc.data();


            customerOrders.push({

                ...data,

                id:
                    data.id !== undefined
                        ? data.id
                        : doc.id

            });

        }
    );


    /*
       Sort using BH timestamp ID.
       Oldest first because your existing
       code below uses .reverse().
    */

    customerOrders.sort(
        function (a, b) {

            const aId =
                Number(
                    String(a.id)
                        .replace(/\D/g, "")
                ) || 0;

            const bId =
                Number(
                    String(b.id)
                        .replace(/\D/g, "")
                ) || 0;


            return aId - bId;
        }
    );


    console.log(
        "Customer orders loaded from Firestore:",
        customerOrders
    );

}
catch (error) {

    console.error(
        "Error loading purchase history:",
        error
    );


    /*
       Temporary fallback to old local orders
       if Firestore cannot be reached.
    */

    const orders =
        getOrders();


    customerOrders =
        orders.filter(
            function (order) {

                return (
                    String(order.customerId) ===
                    String(customer.id)
                );

            }
        );
}


    if (countElement) {

        countElement.textContent =
            customerOrders.length;
    }


    container.innerHTML = "";


    if (customerOrders.length === 0) {

        container.innerHTML = `

            <div class="empty-message">
                No purchase history found.
            </div>
        `;

        return;
    }


    customerOrders
        .slice()
        .reverse()
        .forEach(
            function (order) {

                let booksHTML = "";


                order.books.forEach(
                    function (book) {

                        booksHTML += `

                            <p>

                                📚 ${book.title}

                                -
                                Quantity:
                                ${book.quantity || 1}

                            </p>
                        `;
                    }
                );


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "history-card";


                card.innerHTML = `

                    <h3>
                        Order #${order.id}
                    </h3>

                    <p>
                        <strong>Date:</strong>
                        ${order.date}
                    </p>

                    ${booksHTML}

                 <p>
    <strong>
        Payment Method:
    </strong>

    ${order.paymentMethod}
</p>


${
    order.paymentMethod === "UPI"
        ? `
            <p>
                <strong>
                    Transaction ID:
                </strong>

                ${order.transactionId || "-"}
            </p>


            <p>
                <strong>
                    Payment Status:
                </strong>

                <span class="${
                    order.paymentStatus === "Verified"
                        ? "payment-verified"
                        : order.paymentStatus === "Rejected"
                            ? "payment-rejected"
                            : "payment-pending"
                }">

                    ${
                        order.paymentStatus === "Verified"
                            ? "🟢 Verified"
                            : order.paymentStatus === "Rejected"
                                ? "🔴 Rejected"
                                : "🟡 Pending Verification"
                    }

                </span>
            </p>
            ${
    order.paymentStatus === "Verified" &&
    order.paymentVerifiedDate
        ? `
            <p>
                <strong>
                    Payment Verified:
                </strong>

                ${order.paymentVerifiedDate}
            </p>
        `
        : ""
}


${
    order.paymentStatus === "Rejected" &&
    order.paymentRejectedDate
        ? `
            <p>
                <strong>
                    Payment Rejected:
                </strong>

                ${order.paymentRejectedDate}
            </p>
        `
        : ""
}

        `

        : `
            <p>
                <strong>
                    Payment Status:
                </strong>

                <span class="payment-cod">
                    🚚 Cash on Delivery
                </span>
            </p>
        `
}


<p>
    <strong>
        Total:
    </strong>

    ₹${order.total}
</p>


<p>
    <strong>
        Order Status:
    </strong>

    ${order.status}
</p>

                `;


                container.appendChild(
                    card
                );
            }
        );
}


/* =====================================================
   ADMIN DASHBOARD COUNTS
===================================================== */

async function updateDashboard() {

    /* BOOK COUNT */

    setText(
        "totalBooks",
        getBooks().length
    );


    /* CUSTOMER COUNT */

    setText(
        "totalCustomers",
        getCustomers().length
    );


   /* =========================================
   MANAGER COUNT FROM FIRESTORE
========================================= */

try {

    const managerSnapshot =
        await db.collection("managers")
            .get();


    setText(
        "totalManagers",
        managerSnapshot.size
    );


    console.log(
        "Total Firestore Managers:",
        managerSnapshot.size
    );

}
catch (error) {

    console.error(
        "Error loading Manager count:",
        error
    );


    /* TEMPORARY FALLBACK */

    setText(
        "totalManagers",
        getManagers().length
    );
}


    /* =========================================
       ORDER COUNT FROM FIRESTORE
    ========================================= */

    try {

        const snapshot =
            await db.collection("orders")
                .get();


        setText(
            "totalOrders",
            snapshot.size
        );


        console.log(
            "Total Firestore orders:",
            snapshot.size
        );

    }
    catch (error) {

        console.error(
            "Error loading order count:",
            error
        );


        /* FALLBACK */

        setText(
            "totalOrders",
            getOrders().length
        );
    }
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
    }
}
/* =====================================================
   LOAD MANAGER DASHBOARD - FIRESTORE
===================================================== */

async function loadManagerDashboard() {

    const currentManager =
        getCurrentManager();

    const user =
        auth.currentUser;


    /* =========================================
       CHECK MANAGER LOGIN
    ========================================= */

    if (
        !currentManager ||
        !isManagerLoggedIn() ||
        !user
    ) {

        alert(
            "Manager login required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "managerLoginForm"
        );

        return;
    }


    try {

        /* =========================================
           GET MANAGER FROM FIRESTORE
        ========================================= */

        const managerDoc =
            await db.collection("managers")
                .doc(user.uid)
                .get();


        if (!managerDoc.exists) {

            localStorage.removeItem(
                "currentManager"
            );

            localStorage.removeItem(
                "managerLoggedIn"
            );

            await auth.signOut();

            updateNavigation();

            showPage("home");

            alert(
                "Manager account was not found."
            );

            return;
        }


        const manager = {

            ...managerDoc.data(),

            uid:
                managerDoc.id
        };


        /* =========================================
           CHECK MANAGER STATUS
        ========================================= */

        if (
            manager.status !==
            "Approved"
        ) {

            localStorage.removeItem(
                "currentManager"
            );

            localStorage.removeItem(
                "managerLoggedIn"
            );

            await auth.signOut();

            updateNavigation();

            showPage("home");

            alert(
                "Your Manager access is not active."
            );

            return;
        }


        /* =========================================
           UPDATE CURRENT MANAGER CACHE
        ========================================= */

        localStorage.setItem(
            "currentManager",
            JSON.stringify(manager)
        );


        /* =========================================
           LOAD STORE DATA FROM FIRESTORE
        ========================================= */

        const results =
            await Promise.all([

                db.collection("books")
                    .get(),

                db.collection("customers")
                    .get(),

                db.collection("orders")
                    .get()

            ]);


        const booksSnapshot =
            results[0];

        const customersSnapshot =
            results[1];

        const ordersSnapshot =
            results[2];


        const books = [];

        const customers = [];

        const orders = [];


        /* =========================================
           BUILD BOOK ARRAY
        ========================================= */

        booksSnapshot.forEach(
            function (doc) {

                const data =
                    doc.data();

                books.push({

                    ...data,

                    id:
                        data.id !== undefined
                            ? data.id
                            : doc.id

                });
            }
        );


        /* =========================================
           BUILD CUSTOMER ARRAY
        ========================================= */

        customersSnapshot.forEach(
            function (doc) {

                const data =
                    doc.data();

                customers.push({

                    ...data,

                    id:
                        data.id !== undefined
                            ? data.id
                            : doc.id

                });
            }
        );


        /* =========================================
           BUILD ORDER ARRAY
        ========================================= */

        ordersSnapshot.forEach(
            function (doc) {

                const data =
                    doc.data();

                orders.push({

                    ...data,

                    id:
                        data.id !== undefined
                            ? data.id
                            : doc.id

                });
            }
        );


        /* =========================================
           UPDATE LOCAL CACHE
           Existing Manager sections still use it.
        ========================================= */

        localStorage.setItem(
            "books",
            JSON.stringify(books)
        );

        localStorage.setItem(
            "customers",
            JSON.stringify(customers)
        );

        localStorage.setItem(
            "orders",
            JSON.stringify(orders)
        );


        console.log(
            "Manager Dashboard loaded from Firestore:",
            {
                books:
                    books.length,

                customers:
                    customers.length,

                orders:
                    orders.length
            }
        );


        /* =========================================
           CALCULATE TOTAL STOCK
        ========================================= */

        const totalStock =
            books.reduce(

                function (
                    total,
                    book
                ) {

                    return (
                        total +
                        Number(
                            book.stock || 0
                        )
                    );
                },

                0
            );


        /* =========================================
           UPDATE DASHBOARD CARDS
        ========================================= */

        setText(
            "managerTotalBooks",
            books.length
        );


        setText(
            "managerTotalStock",
            totalStock
        );


        setText(
            "managerTotalCustomers",
            customers.length
        );


        setText(
            "managerTotalOrders",
            orders.length
        );


        /* =========================================
           MANAGER WELCOME MESSAGE
        ========================================= */

        const welcome =
            document.getElementById(
                "managerWelcome"
            );


        if (welcome) {

            welcome.textContent =
                "Welcome " +
                manager.name +
                " (" +
                manager.managerId +
                ") - Manage stock and customer activity.";
        }


        /* =========================================
           LOAD MANAGER STOCK
        ========================================= */

        displayManagerStock();


        /* =========================================
           LOAD CUSTOMER ACTIVITY
        ========================================= */

        displayManagerCustomerActivity();


        /* =========================================
           PAYMENT VERIFICATION PERMISSION
        ========================================= */

        const paymentPermissionCard =
            document.getElementById(
                "managerPaymentPermissionCard"
            );


        const paymentVerificationSection =
            document.getElementById(
                "managerPaymentVerification"
            );


        if (
            managerCanVerifyPayments()
        ) {

            if (
                paymentPermissionCard
            ) {

                paymentPermissionCard
                    .style
                    .display =
                    "block";
            }

        }
        else {

            if (
                paymentPermissionCard
            ) {

                paymentPermissionCard
                    .style
                    .display =
                    "none";
            }


            if (
                paymentVerificationSection
            ) {

                paymentVerificationSection
                    .style
                    .display =
                    "none";
            }
        }

    }
    catch (error) {

        console.error(
            "Manager Dashboard Firestore error:",
            error
        );


        alert(
            "Manager Dashboard data could not be loaded."
        );
    }
}

/* =====================================================
   OPEN MANAGER PAYMENT VERIFICATION
===================================================== */

function showManagerPaymentVerification() {

    /* MANAGER MUST BE LOGGED IN */

    if (!isManagerLoggedIn()) {

        alert(
            "Manager login required."
        );

        showPage("accountPage");

        showAccountForm(
            "managerLoginForm"
        );

        return;
    }


    /* CHECK ADMIN PERMISSION */

    if (!managerCanVerifyPayments()) {

        alert(
            "You do not have permission to verify customer payments. Please contact the Admin."
        );

        return;
    }


    const paymentSection =
        document.getElementById(
            "managerPaymentVerification"
        );


    if (!paymentSection) {

        console.error(
            "Manager payment verification section not found."
        );

        return;
    }


    paymentSection.style.display =
        "block";


    displayManagerPaymentOrders();
}

/* =====================================================
   CLOSE MANAGER PAYMENT VERIFICATION
===================================================== */

function closeManagerPaymentVerification() {

    const paymentSection =
        document.getElementById(
            "managerPaymentVerification"
        );


    if (paymentSection) {

        paymentSection.style.display =
            "none";

    }
}

/* =====================================================
   DISPLAY PENDING PAYMENTS - MANAGER
===================================================== */

async function displayManagerPaymentOrders() {

    const container =
        document.getElementById(
            "managerPaymentOrders"
        );


    if (!container) {
        return;
    }


    /* =========================================
       SECURITY CHECK
    ========================================= */

    if (
        !isManagerLoggedIn() ||
        !managerCanVerifyPayments()
    ) {

        container.innerHTML = `
            <div class="empty-message">
                You do not have permission
                to view customer payments.
            </div>
        `;

        return;
    }


    /* =========================================
   LOAD ORDERS FROM FIRESTORE
========================================= */

let orders = [];

try {

    const snapshot =
        await db.collection("orders")
            .get();


    snapshot.forEach(
        function (doc) {

            const data =
                doc.data();

            orders.push({

                ...data,

                id:
                    data.id !== undefined
                        ? data.id
                        : doc.id
            });

        }
    );


    /* SORT ORDERS */

    orders.sort(
        function (a, b) {

            const aId =
                Number(
                    String(a.id)
                        .replace(/\D/g, "")
                ) || 0;

            const bId =
                Number(
                    String(b.id)
                        .replace(/\D/g, "")
                ) || 0;

            return aId - bId;
        }
    );


    /*
       Keep the full Firestore order list locally
       because Manager verify/reject functions
       still use getOrders().
    */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    console.log(
        "Manager orders loaded from Firestore:",
        orders
    );

}
catch (error) {

    console.error(
        "Error loading Manager orders:",
        error
    );

    orders =
        getOrders();
}


    /* =========================================
       GET ONLY PENDING UPI PAYMENTS
    ========================================= */

    const pendingOrders =
        orders.filter(
            function (order) {

                return (

                    order.paymentMethod === "UPI" &&

                    (
                        !order.paymentStatus ||

                        order.paymentStatus ===
                        "Pending Verification"
                    )

                );

            }
        );


    container.innerHTML = "";


    /* =========================================
       NO PENDING PAYMENTS
    ========================================= */

    if (
        pendingOrders.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">

                <h3>
                    No Pending Payments
                </h3>

                <p>
                    There are currently no
                    customer UPI payments
                    waiting for verification.
                </p>

            </div>
        `;

        return;
    }


    /* =========================================
       DISPLAY PAYMENT ORDERS
    ========================================= */

    pendingOrders
        .slice()
        .reverse()
        .forEach(
            function (order) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "manager-payment-order-card";


                card.innerHTML = `

                    <h3>
                        💳 Order #${order.id}
                    </h3>


                    <p>
                        <strong>
                            Customer:
                        </strong>

                        ${order.customer}
                    </p>


                    <p>
                        <strong>
                            Email:
                        </strong>

                        ${order.email}
                    </p>


                    <p>
                        <strong>
                            Order Date:
                        </strong>

                        ${order.date}
                    </p>


                    <p>
                        <strong>
                            Amount:
                        </strong>

                        ₹${order.total}
                    </p>


                    <p>
                        <strong>
                            Payment Method:
                        </strong>

                        ${order.paymentMethod}
                    </p>


                    <p>
                        <strong>
                            Transaction / Reference ID:
                        </strong>

                        ${order.transactionId || "-"}
                    </p>


                    <p>
                        <strong>
                            Payment Status:
                        </strong>

                        <span class="payment-pending">
                            ${
                                order.paymentStatus ||
                                "Pending Verification"
                            }
                        </span>
                    </p>


                    <div
                        class="payment-verification-buttons"
                    >

                        <button
                            type="button"
                            class="verify-payment-btn"
                            onclick="managerVerifyPayment('${order.id}')"
                        >
                            ✓ Verify Payment
                        </button>


                        <button
                            type="button"
                            class="reject-payment-btn"
                            onclick="managerRejectPayment('${order.id}')"
                        >
                            ✕ Reject Payment
                        </button>

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );
}

/* =====================================================
   VERIFY PAYMENT - MANAGER
===================================================== */

async function managerVerifyPayment(orderId) {

    /* =========================================
       MANAGER LOGIN CHECK
    ========================================= */

    if (!isManagerLoggedIn()) {

        alert(
            "Manager login required."
        );

        return;
    }


    /* =========================================
       ADMIN PERMISSION CHECK
    ========================================= */

    if (!managerCanVerifyPayments()) {

        alert(
            "You do not have permission to verify customer payments."
        );

        return;
    }


    /* =========================================
       GET CURRENT MANAGER
    ========================================= */

    const currentManager =
        getCurrentManager();


    if (!currentManager) {

        alert(
            "Manager information not found."
        );

        return;
    }


    /* =========================================
       GET FRESH MANAGER RECORD
    ========================================= */

    const managers =
        getManagers();


    const manager =
        managers.find(
            function (item) {

                return (
                    String(item.managerId) ===
                    String(currentManager.managerId)
                );

            }
        );


    if (
        !manager ||
        manager.status !== "Approved" ||
        manager.canVerifyPayments !== true
    ) {

        alert(
            "Your payment verification permission is not available."
        );

        return;
    }


    /* =========================================
       FIND ORDER
    ========================================= */

    let orders =
        getOrders();


    const index =
        orders.findIndex(
            function (order) {

                return (
                    String(order.id) ===
                    String(orderId)
                );

            }
        );


    if (index === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    const order =
        orders[index];


    /* =========================================
       ONLY UPI PAYMENT
    ========================================= */

    if (
        order.paymentMethod !== "UPI"
    ) {

        alert(
            "This is not a UPI payment."
        );

        return;
    }


    /* =========================================
       CHECK PAYMENT IS STILL PENDING
    ========================================= */

    if (
        order.paymentStatus &&
        order.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed.\n\n" +
            "Current Status: " +
            order.paymentStatus
        );

        displayManagerPaymentOrders();

        return;
    }


    /* =========================================
       CONFIRM WITH MANAGER
    ========================================= */

    const confirmed =
        confirm(
            "Have you confirmed that the payment was received?\n\n" +

            "Order: " +
            order.id +

            "\nCustomer: " +
            order.customer +

            "\nAmount: ₹" +
            order.total +

            "\nTransaction ID: " +
            (order.transactionId || "-")
        );


    if (!confirmed) {
        return;
    }


    /* =========================================
       CHECK AGAIN BEFORE CHANGING STOCK
    ========================================= */

    orders =
        getOrders();


    const freshIndex =
        orders.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                    String(orderId)
                );

            }
        );


    if (freshIndex === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    const freshOrder =
        orders[freshIndex];


    if (
        freshOrder.paymentStatus &&
        freshOrder.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed by another user."
        );

        displayManagerPaymentOrders();

        return;
    }


    /* =========================================
       REDUCE STOCK ONLY ONCE
    ========================================= */

    if (!freshOrder.stockReduced) {

        if (
            !validateOrderStock(
                freshOrder.books
            )
        ) {

            alert(
                "Payment was found, but the order cannot be confirmed because there is not enough stock."
            );

            return;
        }


     const stockUpdated =
    await reducePurchasedStock(
        freshOrder.books
    );

if (!stockUpdated) {
    return;
}

freshOrder.stockReduced =
    true;
    }
    /* =========================================
       VERIFY PAYMENT
    ========================================= */

    freshOrder.paymentStatus =
        "Verified";


    freshOrder.status =
        "Order Confirmed";


    freshOrder.paymentVerifiedDate =
        new Date().toLocaleString();


    /* =========================================
       SAVE WHO VERIFIED PAYMENT
    ========================================= */

    freshOrder.paymentVerifiedByRole =
        "Manager";


    freshOrder.paymentVerifiedByManagerId =
        manager.managerId;


    freshOrder.paymentVerifiedByManagerName =
        manager.name;

       /* =========================================
   SAVE VERIFIED ORDER TO FIRESTORE
========================================= */

try {

    await db.collection("orders")
        .doc(String(freshOrder.id))
        .set(
            freshOrder,
            { merge: true }
        );

    console.log(
        "Manager verification saved to Firestore:",
        freshOrder.id
    );

}
catch (error) {

    console.error(
        "Error saving payment verification:",
        error
    );

    alert(
        "Payment verification could not be saved online."
    );

    return;
}


    /* =========================================
       SAVE ORDERS
    ========================================= */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    /* =========================================
       UPDATE LATEST ORDER
    ========================================= */

    const latestOrder =
        JSON.parse(
            localStorage.getItem(
                "latestOrder"
            ) || "null"
        );


    if (
        latestOrder &&
        String(latestOrder.id) ===
        String(orderId)
    ) {

        latestOrder.paymentStatus =
            "Verified";


        latestOrder.status =
            "Order Confirmed";


        latestOrder.stockReduced =
            freshOrder.stockReduced;


        latestOrder.paymentVerifiedDate =
            freshOrder.paymentVerifiedDate;


        latestOrder.paymentVerifiedByRole =
            "Manager";


        latestOrder.paymentVerifiedByManagerId =
            manager.managerId;


        latestOrder.paymentVerifiedByManagerName =
            manager.name;


        localStorage.setItem(
            "latestOrder",
            JSON.stringify(latestOrder)
        );
    }


    /* =========================================
       REFRESH WEBSITE
    ========================================= */

    displayManagerPaymentOrders();

    displayOrderDetails();

    displayPurchaseHistory();

    displayBooks();

    displayCart();

    displayBookDetails();

    updateDashboard();


    alert(
        "Payment verified successfully!\n\n" +

        "Verified By: " +
        manager.name +

        "\nManager ID: " +
        manager.managerId
    );
}

/* =====================================================
   REJECT PAYMENT - MANAGER
===================================================== */

async function managerRejectPayment(orderId) {

    /* =========================================
       MANAGER LOGIN CHECK
    ========================================= */

    if (!isManagerLoggedIn()) {

        alert(
            "Manager login required."
        );

        return;
    }


    /* =========================================
       ADMIN PERMISSION CHECK
    ========================================= */

    if (!managerCanVerifyPayments()) {

        alert(
            "You do not have permission to reject customer payments."
        );

        return;
    }


    /* =========================================
       GET CURRENT MANAGER
    ========================================= */

    const currentManager =
        getCurrentManager();


    if (!currentManager) {

        alert(
            "Manager information not found."
        );

        return;
    }


    /* =========================================
       GET FRESH MANAGER RECORD
    ========================================= */

    const managers =
        getManagers();


    const manager =
        managers.find(
            function (item) {

                return (
                    String(item.managerId) ===
                    String(currentManager.managerId)
                );

            }
        );


    if (
        !manager ||
        manager.status !== "Approved" ||
        manager.canVerifyPayments !== true
    ) {

        alert(
            "Your payment verification permission is not available."
        );

        return;
    }


    /* =========================================
       GET ORDERS
    ========================================= */

    let orders =
        getOrders();


    const index =
        orders.findIndex(
            function (order) {

                return (
                    String(order.id) ===
                    String(orderId)
                );

            }
        );


    if (index === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    const order =
        orders[index];


    /* =========================================
       ONLY UPI PAYMENT
    ========================================= */

    if (
        order.paymentMethod !== "UPI"
    ) {

        alert(
            "This is not a UPI payment."
        );

        return;
    }


    /* =========================================
       CHECK PAYMENT IS STILL PENDING
    ========================================= */

    if (
        order.paymentStatus &&
        order.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed.\n\n" +
            "Current Status: " +
            order.paymentStatus
        );


        displayManagerPaymentOrders();

        return;
    }


    /* =========================================
       CONFIRM REJECTION
    ========================================= */

    const confirmed =
        confirm(
            "Are you sure you want to reject this payment?\n\n" +

            "Order: " +
            order.id +

            "\nCustomer: " +
            order.customer +

            "\nAmount: ₹" +
            order.total +

            "\nTransaction ID: " +
            (order.transactionId || "-")
        );


    if (!confirmed) {
        return;
    }


    /* =========================================
       GET FRESH ORDER AGAIN
    ========================================= */

    orders =
        getOrders();


    const freshIndex =
        orders.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                    String(orderId)
                );

            }
        );


    if (freshIndex === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    const freshOrder =
        orders[freshIndex];


    /* =========================================
       CHECK AGAIN
    ========================================= */

    if (
        freshOrder.paymentStatus &&
        freshOrder.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed by another user."
        );


        displayManagerPaymentOrders();

        return;
    }


    /* =========================================
       REJECT PAYMENT
    ========================================= */

    freshOrder.paymentStatus =
        "Rejected";


    freshOrder.status =
        "Payment Failed";


    freshOrder.paymentRejectedDate =
        new Date().toLocaleString();


    /* =========================================
       SAVE WHO REJECTED PAYMENT
    ========================================= */

    freshOrder.paymentRejectedByRole =
        "Manager";


    freshOrder.paymentRejectedByManagerId =
        manager.managerId;


    freshOrder.paymentRejectedByManagerName =
        manager.name;

   /* =========================================
   SAVE REJECTED ORDER TO FIRESTORE
========================================= */

try {

    await db.collection("orders")
        .doc(String(freshOrder.id))
        .set(
            freshOrder,
            { merge: true }
        );

    console.log(
        "Manager rejection saved to Firestore:",
        freshOrder.id
    );

}
catch (error) {

    console.error(
        "Error saving payment rejection:",
        error
    );

    alert(
        "Payment rejection could not be saved online."
    );

    return;
}

    /* =========================================
       SAVE ORDERS
    ========================================= */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    /* =========================================
       UPDATE LATEST ORDER
    ========================================= */

    const latestOrder =
        JSON.parse(
            localStorage.getItem(
                "latestOrder"
            ) || "null"
        );


    if (
        latestOrder &&
        String(latestOrder.id) ===
        String(orderId)
    ) {

        latestOrder.paymentStatus =
            "Rejected";


        latestOrder.status =
            "Payment Failed";


        latestOrder.paymentRejectedDate =
            freshOrder.paymentRejectedDate;


        latestOrder.paymentRejectedByRole =
            "Manager";


        latestOrder.paymentRejectedByManagerId =
            manager.managerId;


        latestOrder.paymentRejectedByManagerName =
            manager.name;


        localStorage.setItem(
            "latestOrder",
            JSON.stringify(latestOrder)
        );
    }


    /* =========================================
       REFRESH WEBSITE
    ========================================= */

    displayManagerPaymentOrders();

    displayOrderDetails();

    displayPurchaseHistory();

    updateDashboard();


    alert(
        "Payment rejected.\n\n" +

        "Rejected By: " +
        manager.name +

        "\nManager ID: " +
        manager.managerId
    );
}



/* =====================================================
   DISPLAY MANAGER STOCK
===================================================== */

function displayManagerStock() {

    const container =
        document.getElementById(
            "managerStockList"
        );


    if (!container) {

        console.error(
            "managerStockList container not found."
        );

        return;
    }


    const books =
        getBooks();


    container.innerHTML = "";


    /* =========================================
       NO BOOKS
    ========================================= */

    if (books.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                <h3>
                    No books available.
                </h3>

            </div>
        `;

        return;
    }


    /* =========================================
       DISPLAY EVERY BOOK
    ========================================= */

    books.forEach(function (book) {

        const card =
            document.createElement("div");


        card.className =
            "manager-stock-card";


        card.innerHTML = `

            <div class="manager-stock-info">

                <h3>
                    📚 ${book.title}
                </h3>

                <p>
                    Author:
                    ${book.author}
                </p>

                <p>
                    Category:
                    ${book.category}
                </p>

                <p>
                    Current Stock:

                    <strong>
                        ${book.stock}
                    </strong>
                </p>

            </div>


            <div class="manager-stock-control">

                <input
                    type="number"
                    id="managerStock-${book.id}"
                    value="${book.stock}"
                    min="0"
                >


                <button
                    type="button"
                    onclick="updateManagerStock(${book.id})"
                >
                    Update Stock
                </button>

            </div>

        `;


        container.appendChild(card);

    });
}

/* =====================================================
   UPDATE STOCK - MANAGER
===================================================== */

function updateManagerStock(bookId) {

    /* =========================================
       CHECK MANAGER LOGIN
    ========================================= */

    if (!isManagerLoggedIn()) {

        alert("Manager login required.");

        showPage("accountPage");

        showAccountForm(
            "managerLoginForm"
        );

        return;
    }


    /* =========================================
       GET CURRENT MANAGER
    ========================================= */

    const currentManager =
        getCurrentManager();


    if (!currentManager) {

        alert("Manager session not found.");

        return;
    }


    /* =========================================
       CHECK LATEST ADMIN APPROVAL
    ========================================= */

    const managers =
        getManagers();


    const manager =
        managers.find(function (item) {

            return (
                item.managerId ===
                currentManager.managerId
            );

        });


    if (
        !manager ||
        manager.status !== "Approved"
    ) {

        localStorage.removeItem(
            "currentManager"
        );

        localStorage.removeItem(
            "managerLoggedIn"
        );


        updateNavigation();


        alert(
            "Manager permission denied."
        );


        showPage("home");

        return;
    }


    /* =========================================
       GET STOCK INPUT
    ========================================= */

    const input =
        document.getElementById(
            "managerStock-" + bookId
        );


    if (!input) {

        alert("Stock input not found.");

        return;
    }


    const newStock =
        Number(input.value);


    /* =========================================
       VALIDATE STOCK
    ========================================= */

    if (
        !Number.isInteger(newStock) ||
        newStock < 0
    ) {

        alert(
            "Please enter a valid stock quantity."
        );

        return;
    }


    /* =========================================
       FIND BOOK
    ========================================= */

    let books =
        getBooks();


    const book =
        books.find(function (item) {

            return (
                String(item.id) ===
                String(bookId)
            );

        });


    if (!book) {

        alert("Book not found.");

        return;
    }


    const oldStock =
        Number(book.stock) || 0;


    /* =========================================
       UPDATE STOCK
    ========================================= */

    book.stock =
        newStock;


    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );


    /* =========================================
       REFRESH WEBSITE
    ========================================= */

    displayManagerStock();

    displayBooks();

    displayAdminBooks();

    updateDashboard();

    loadManagerDashboard();


    alert(
        "Stock updated successfully.\n\n" +
        "Book: " +
        book.title +
        "\n" +
        "Old Stock: " +
        oldStock +
        "\n" +
        "New Stock: " +
        newStock
    );
}

/* =====================================================
   DISPLAY CUSTOMER ACTIVITY - MANAGER
===================================================== */

function displayManagerCustomerActivity() {

    const container =
        document.getElementById(
            "managerCustomerActivity"
        );


    /* =========================================
       CHECK CONTAINER
    ========================================= */

    if (!container) {

        console.error(
            "managerCustomerActivity container not found."
        );

        return;
    }


    /* =========================================
       GET ORDERS
    ========================================= */

    const orders =
        getOrders();


    // Clear old activity
    container.innerHTML = "";


    /* =========================================
       NO CUSTOMER ACTIVITY
    ========================================= */

    if (orders.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                <h3>
                    No customer activity available.
                </h3>

                <p>
                    Customer purchases will appear here.
                </p>

            </div>

        `;

        return;
    }


    /* =========================================
       SHOW NEWEST ORDERS FIRST
    ========================================= */

    const latestOrders =
        orders.slice().reverse();


    latestOrders.forEach(function (order) {


        /* =====================================
           CALCULATE TOTAL QUANTITY
        ===================================== */

        let totalQuantity = 0;


        if (Array.isArray(order.books)) {

            totalQuantity =
                order.books.reduce(
                    function (total, book) {

                        return (
                            total +
                            Number(
                                book.quantity || 1
                            )
                        );

                    },
                    0
                );
        }


        /* =====================================
           CREATE ACTIVITY CARD
        ===================================== */

        const card =
            document.createElement("div");


        card.className =
            "manager-activity-card";


        card.innerHTML = `

            <h3>
                👤 ${order.customer || "Customer"}
            </h3>


            <p>
                <strong>Order No:</strong>
                ${order.id || "-"}
            </p>


            <p>
                <strong>Purchased Date:</strong>
                ${order.date || "-"}
            </p>


            <p>
                <strong>Quantity Purchased:</strong>
                ${totalQuantity}
            </p>


            <p>
                <strong>Total:</strong>
                ₹${order.total || 0}
            </p>


            <p>
                <strong>Status:</strong>
                ${order.status || "Purchased"}
            </p>

        `;


        container.appendChild(card);

    });
}

/* =====================================================
   ADD BOOK
===================================================== */

/* =====================================================
   ADD BOOK
   MULTIPLE SUBCATEGORY VERSION
===================================================== */

function addBook(event) {

    event.preventDefault();


    if (!isAdminLoggedIn()) {

        alert(
            "Admin login required."
        );

        return;
    }


    /* GET SELECTED SUBCATEGORIES */

    const selectedSubcategories =
        Array.from(
            document.querySelectorAll(
                'input[name="bookSubcategories"]:checked'
            )
        ).map(function (checkbox) {

            return checkbox.value;

        });


    /* REQUIRE AT LEAST ONE */

    if (selectedSubcategories.length === 0) {

        alert(
            "Please select at least one subcategory."
        );

        return;
    }


    /* CREATE BOOK */

    const book = {

        id: Date.now(),

        title:
            document
                .getElementById("bookTitle")
                .value
                .trim(),

        author:
            document
                .getElementById("bookAuthor")
                .value
                .trim(),

        price:
            Number(
                document
                    .getElementById("bookPrice")
                    .value
            ),

        category:
            document
                .getElementById("bookCategory")
                .value,

        subcategories:
            selectedSubcategories,

        stock:
            Number(
                document
                    .getElementById("bookStock")
                    .value
            ),

        image:
            document
                .getElementById("bookImage")
                .value
                .trim()
    };


    /* SAVE BOOK TO FIRESTORE */

db.collection("books")
    .doc(String(book.id))
    .set(book)
    .then(function () {

        console.log(
            "Book saved to Firestore:",
            book
        );

        alert(
            "Book added successfully."
        );

    })
    .catch(function (error) {

        console.error(
            "Error adding book:",
            error
        );

        alert(
            "Book could not be added."
        );

    });


    event.target.reset();


    loadAdminCategories();


    const subcategoryContainer =
        document.getElementById(
            "bookSubcategoryList"
        );


    if (subcategoryContainer) {

        subcategoryContainer.innerHTML = `
            <p class="subcategory-help">
                Select a category first.
            </p>
        `;
    }


    displayAdminBooks();

    displayBooks();

    updateDashboard();


}

/* =====================================================
   DISPLAY ADMIN BOOKS
===================================================== */

async function displayAdminBooks() {

    const container =
        document.getElementById(
            "adminBooks"
        );

    if (!container) {
        return;
    }


    let books = [];

try {

    const snapshot =
        await db.collection("books").get();

    snapshot.forEach(function (doc) {

        const data = doc.data();

        books.push({
            ...data,
            id:
                data.id !== undefined
                    ? data.id
                    : doc.id
        });

    });

    console.log(
        "Admin books loaded from Firestore:",
        books
    );

}
catch (error) {

    console.error(
        "Error loading admin books:",
        error
    );

    books = getBooks();
}


    container.innerHTML = "";


    books.forEach(
        function (book) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "admin-book-card";


            card.innerHTML = `

                <img
                    src="${book.image}"
                    alt="${book.title}"
                >

                <div class="admin-book-info">

                    <h3>
                        ${book.title}
                    </h3>

                    <p>
                        <strong>Author:</strong>
                        ${book.author}
                    </p>

                    <p>
                        <strong>Category:</strong>
                        ${book.category}
                    </p>

                    <p>
                        <strong>Price:</strong>
                        ₹${book.price}
                    </p>

                    <p>
                        <strong>Stock:</strong>
                        ${book.stock}
                    </p>

                    <div class="admin-book-actions">

                        <button
                            class="edit-btn"
                            onclick="editBook('${book.id}')"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteBook('${book.id}')"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;


            container.appendChild(
                card
            );
        }
    );
}


/* =====================================================
   EDIT BOOK SUBCATEGORY MODAL VARIABLES
===================================================== */

let editingBookId = null;
let editingBookData = null;

/* =====================================================
   OPEN EDIT BOOK SUBCATEGORY MODAL
===================================================== */

function openEditBookSubcategoryModal(
    bookId,
    updatedBook
) {

    const books = getBooks();

   const book =
    books.find(function (item) {

        return (
            String(item.id) ===
            String(bookId)
        );
    });

    if (!book) {

        alert("Book not found.");

        return;
    }


    editingBookId = bookId;

    editingBookData = updatedBook;


    const modal =
        document.getElementById(
            "editBookSubcategoryModal"
        );


    const list =
        document.getElementById(
            "editBookSubcategoryList"
        );


    const bookName =
        document.getElementById(
            "editBookSubcategoryBookName"
        );


    if (!modal || !list) {
        return;
    }


    if (bookName) {

    bookName.textContent =
        updatedBook.title;

}


    /* GET SUBCATEGORIES */

    const allSubcategories =
        getSubcategories();


    const availableSubcategories =
        allSubcategories[
            updatedBook.category
        ] || [];


    /* =====================================================
   GET CURRENT SUBCATEGORIES
===================================================== */

let currentSubcategories = [];


/* KEEP OLD SUBCATEGORIES ONLY IF CATEGORY IS SAME */

if (book.category === updatedBook.category) {

    currentSubcategories =
        Array.isArray(book.subcategories)

            ? book.subcategories

            : book.subcategory

                ? [book.subcategory]

                : [];

}

    list.innerHTML = "";


    /* NO SUBCATEGORIES */

    if (
        availableSubcategories.length === 0
    ) {

        list.innerHTML = `
            <p class="subcategory-help">
                No subcategories available
                for this category.
            </p>
        `;

    }


    /* CREATE CHECKBOXES */

    availableSubcategories.forEach(
        function (subcategory) {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "edit-subcategory-checkbox";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.value =
                subcategory;


            checkbox.name =
                "editBookSubcategories";


            /* AUTO CHECK EXISTING SUBCATEGORY */

            if (
                currentSubcategories.includes(
                    subcategory
                )
            ) {

                checkbox.checked = true;

            }


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                subcategory;


            label.appendChild(
                checkbox
            );


            label.appendChild(
                text
            );


            list.appendChild(
                label
            );

        }
    );


    /* SHOW MODAL */

    modal.style.display =
        "flex";
}

/* =====================================================
   CLOSE EDIT BOOK SUBCATEGORY MODAL
===================================================== */

function closeEditBookSubcategoryModal() {

    const modal =
        document.getElementById(
            "editBookSubcategoryModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    editingBookId = null;

    editingBookData = null;
}

/* =====================================================
   SAVE EDITED BOOK WITH SELECTED SUBCATEGORIES
===================================================== */

async function saveEditedBookSubcategories() {

    /* CHECK EDITING DATA */

    if (
        editingBookId === null ||
        !editingBookData
    ) {

        alert(
            "No book is being edited."
        );

        return;
    }


    /* GET CHECKED SUBCATEGORIES */

    const selectedSubcategories =
        Array.from(
            document.querySelectorAll(
                'input[name="editBookSubcategories"]:checked'
            )
        ).map(
            function (checkbox) {

                return checkbox.value;

            }
        );


    /* REQUIRE AT LEAST ONE */

    if (
        selectedSubcategories.length === 0
    ) {

        alert(
            "Please select at least one subcategory."
        );

        return;
    }


    /* ADD SUBCATEGORIES TO UPDATED BOOK */

    editingBookData.subcategories =
        selectedSubcategories;


    /* REMOVE OLD PROPERTY */

    delete editingBookData.subcategory;


   /* =========================================
   UPDATE BOOK IN FIRESTORE
========================================= */

try {

    await db.collection("books")
        .doc(String(editingBookId))
        .set(
            editingBookData,
            { merge: true }
        );

   /* =========================================
   UPDATE LOCAL BOOK CACHE
========================================= */

let books =
    getBooks();


const index =
    books.findIndex(
        function (book) {

            return (
                String(book.id) ===
                String(editingBookId)
            );
        }
    );


if (index >= 0) {

    books[index] = {
        ...books[index],
        ...editingBookData
    };


    localStorage.setItem(
        "books",
        JSON.stringify(books)
    );
}

    console.log(
        "Book updated in Firestore:",
        editingBookData
    );

}
catch (error) {

    console.error(
        "Error updating book:",
        error
    );

    alert(
        "Book could not be updated."
    );

    return;
}


    /* CLOSE MODAL */

    closeEditBookSubcategoryModal();


    /* REFRESH */

    displayAdminBooks();

    displayBooks();

    updateDashboard();


    alert(
        "Book updated successfully."
    );
}

/* =====================================================
   EDIT BOOK
===================================================== */

function editBook(bookId) {

    let books =
        getBooks();

    const index =
        books.findIndex(function (book) {

            return String(book.id) ===
                   String(bookId);

        });


    if (index === -1) {

        alert("Book not found.");

        return;
    }


    const book =
        books[index];


    /* ===============================
       TITLE
    =============================== */

    const newTitle =
        prompt(
            "Edit Book Title:",
            book.title
        );

    if (newTitle === null) {
        return;
    }


    /* ===============================
       AUTHOR
    =============================== */

    const newAuthor =
        prompt(
            "Edit Author:",
            book.author
        );

    if (newAuthor === null) {
        return;
    }


    /* ===============================
       PRICE
    =============================== */

    const newPrice =
        prompt(
            "Edit Price:",
            book.price
        );

    if (newPrice === null) {
        return;
    }


    /* ===============================
       STOCK
    =============================== */

    const newStock =
        prompt(
            "Edit Stock:",
            book.stock
        );

    if (newStock === null) {
        return;
    }


    /* ===============================
       CATEGORY
    =============================== */

    const categories =
        getCategories();

    const categoryMessage =
        "Available Categories:\n\n" +
        categories.join("\n") +
        "\n\nEnter Category:";


    const newCategory =
        prompt(
            categoryMessage,
            book.category || ""
        );


    if (newCategory === null) {
        return;
    }


    const cleanedCategory =
        newCategory.trim();


    if (!categories.includes(cleanedCategory)) {

        alert(
            "Please enter an existing category."
        );

        return;
    }



    /* ===============================
       IMAGE
    =============================== */

    const newImage =
        prompt(
            "Edit Book Image URL:",
            book.image || ""
        );

    if (newImage === null) {
        return;
    }


    /* ===============================
       UPDATE BOOK
    =============================== */

   const updatedBook = {

    ...book,

    title:
        newTitle.trim(),

    author:
        newAuthor.trim(),

    price:
        Number(newPrice),

    category:
        cleanedCategory,

    stock:
        Number(newStock),

    image:
        newImage.trim()

};


  /* =====================================================
   OPEN SUBCATEGORY CHECKBOX WINDOW
===================================================== */

openEditBookSubcategoryModal(
    bookId,
    updatedBook
);
}

/* =====================================================
   DELETE BOOK
===================================================== */

async function deleteBook(bookId) {

    if (
        !confirm(
            "Are you sure you want to delete this book?"
        )
    ) {
        return;
    }

/* =========================================
   DELETE BOOK FROM FIRESTORE
========================================= */

try {

    await db.collection("books")
        .doc(String(bookId))
        .delete();

    console.log(
        "Book deleted from Firestore:",
        bookId
    );

}
catch (error) {

    console.error(
        "Error deleting book:",
        error
    );

    alert(
        "Book could not be deleted."
    );

    return;
}


    displayAdminBooks();

    displayBooks();

    updateDashboard();
}


/* =====================================================
   OPEN ADMIN DETAIL PAGES
===================================================== */

function openCustomersPage() {

    if (!isAdminLoggedIn()) {

        showPage("accountPage");

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    showPage(
        "customersPage"
    );
}

    /* =====================================================
   OPEN MANAGER MANAGEMENT PAGE
===================================================== */

function openManagersPage() {

    // Check whether Admin is logged in
    if (!isAdminLoggedIn()) {

        alert("Admin permission required.");

        // Send user to Account page
        showPage("accountPage");

        // Automatically open Admin Login
        showAccountForm("adminLoginForm");

        return;
    }


   


    // Open Manager Management page
    showPage("managersPage");

    
}
/* =====================================================
   DISPLAY MANAGERS - ADMIN
===================================================== */

async  function displayManagers() {

    const container =
        document.getElementById("managersList");


    // Stop if Manager container is not found
    if (!container) {

        console.error(
            "Manager list container not found."
        );

        return;
    }


   /* =========================================
   LOAD MANAGERS FROM FIRESTORE
========================================= */

let managers = [];

try {

    const snapshot =
        await db.collection("managers")
            .get();


    snapshot.forEach(
        function (doc) {

            const data =
                doc.data();


            managers.push({

                ...data,

                uid:
                    data.uid ||
                    doc.id

            });
        }
    );


    /* SORT BY MANAGER ID */

    managers.sort(
        function (a, b) {

            return String(
                a.managerId || ""
            ).localeCompare(
                String(
                    b.managerId || ""
                )
            );
        }
    );


    /* KEEP LOCAL CACHE UPDATED */

    localStorage.setItem(
        "managers",
        JSON.stringify(
            managers
        )
    );


    console.log(
        "Managers loaded from Firestore:",
        managers
    );

}
catch (error) {

    console.error(
        "Error loading Managers from Firestore:",
        error
    );


    container.innerHTML = `
        <div class="empty-message">

            <h3>
                Could not load Managers.
            </h3>

            <p>
                Please check the Console
                for the Firestore error.
            </p>

        </div>
    `;

    return;
}


    // Clear old Manager cards
    container.innerHTML = "";


    // If no Managers are registered
    if (managers.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                <h3>
                    No Manager registrations found.
                </h3>

                <p>
                    New Manager registration requests
                    will appear here.
                </p>

            </div>
        `;

        return;
    }


    // Display every Manager
    managers.forEach(function (manager) {

        const card =
            document.createElement("div");


        card.className =
            "manager-detail-card";


        // Status CSS class
        const statusClass =
            String(manager.status || "Pending")
                .toLowerCase();


        card.innerHTML = `

            <h3>
                👨‍💼 ${manager.name}
            </h3>


            <p>

                <strong>
                    Manager ID:
                </strong>

                <span class="manager-id">
                    ${manager.managerId}
                </span>

            </p>


            <p>
                <strong>Email:</strong>
                ${manager.email}
            </p>


            <p>
                <strong>Phone:</strong>
                ${manager.phone}
            </p>


            <p>
                <strong>Registered:</strong>
                ${manager.registeredDate}
            </p>


            <p>

                <strong>Status:</strong>

                <span
                    class="manager-status ${statusClass}"
                >
                    ${manager.status}
                </span>

            </p>

            <div class="manager-payment-permission">

    <p>
        <strong>
            Payment Verification:
        </strong>

        ${
            manager.canVerifyPayments
                ? `
                    <span class="payment-permission-allowed">
                        ✅ Allowed
                    </span>
                `
                : `
                    <span class="payment-permission-denied">
                        ❌ Not Allowed
                    </span>
                `
        }

    </p>

</div>


            <div class="manager-actions">


                ${
                    manager.status === "Pending"

                    ? `

                    <button
                        class="manager-approve-btn"
                        onclick="approveManager('${manager.managerId}')"
                    >
                        ✓ Approve
                    </button>

                    `

                    : ""
                }
                ${
    manager.status === "Approved"
        ? `

            ${
                manager.canVerifyPayments
                    ? `
                        <button
                            class="manager-payment-remove-btn"
                            onclick="removeManagerPaymentPermission('${manager.managerId}')"
                        >
                            ✕ Remove Payment Permission
                        </button>
                    `
                    : `
                        <button
                            class="manager-payment-allow-btn"
                            onclick="allowManagerPaymentPermission('${manager.managerId}')"
                        >
                            ✓ Allow Payment Verification
                        </button>
                    `
            }

        `
        : ""
}

                <button
                    class="manager-edit-btn"
                    onclick="editManager('${manager.managerId}')"
                >
                    ✏ Edit
                </button>


                ${
                    manager.status === "Approved"

                    ? `

                    <button
                        class="manager-disable-btn"
                        onclick="disableManager('${manager.managerId}')"
                    >
                        Disable
                    </button>

                    `

                    : ""
                }


                ${
                    manager.status === "Disabled"

                    ? `

                    <button
                        class="manager-enable-btn"
                        onclick="enableManager('${manager.managerId}')"
                    >
                        Enable
                    </button>

                    `

                    : ""
                }


                <button
                    class="manager-delete-btn"
                    onclick="removeManager('${manager.managerId}')"
                >
                    🗑 Remove
                </button>


            </div>
        `;


        container.appendChild(card);

    });
}

/* =====================================================
   ALLOW MANAGER PAYMENT VERIFICATION - FIRESTORE
===================================================== */

async function allowManagerPaymentPermission(
    managerId
) {

    /* ADMIN CHECK */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* FIND MANAGER IN FIRESTORE */

        const snapshot =
            await db.collection("managers")
                .where(
                    "managerId",
                    "==",
                    managerId
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Manager not found."
            );

            return;
        }


        const managerDoc =
            snapshot.docs[0];

        const manager =
            managerDoc.data();


        /* ONLY APPROVED MANAGER */

        if (
            manager.status !==
            "Approved"
        ) {

            alert(
                "Only approved Managers can receive payment verification permission."
            );

            return;
        }


        if (
            manager.canVerifyPayments ===
            true
        ) {

            alert(
                "This Manager already has payment verification permission."
            );

            return;
        }


        const confirmed =
            confirm(
                "Allow payment verification permission for " +
                manager.name +
                " (" +
                manager.managerId +
                ")?"
            );


        if (!confirmed) {
            return;
        }


        /* UPDATE FIRESTORE */

        await db.collection("managers")
            .doc(managerDoc.id)
            .update({

                canVerifyPayments:
                    true

            });


        console.log(
            "Payment permission allowed:",
            manager.managerId
        );


        /* UPDATE CURRENT BROWSER SESSION IF NEEDED */

        manager.canVerifyPayments =
            true;

        updateCurrentManagerPermission(
            manager
        );


        /* REFRESH ADMIN MANAGER LIST */

        await displayManagers();


        alert(
            "Payment verification permission allowed.\n\n" +
            "Manager: " +
            manager.name +
            "\nManager ID: " +
            manager.managerId
        );

    }
    catch (error) {

        console.error(
            "Error allowing Manager payment permission:",
            error
        );

        alert(
            "Could not allow payment permission.\n\n" +
            error.message
        );
    }
}

/* =====================================================
   REMOVE MANAGER PAYMENT VERIFICATION - FIRESTORE
===================================================== */

async function removeManagerPaymentPermission(
    managerId
) {

    /* ADMIN CHECK */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* FIND MANAGER IN FIRESTORE */

        const snapshot =
            await db.collection("managers")
                .where(
                    "managerId",
                    "==",
                    managerId
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Manager not found."
            );

            return;
        }


        const managerDoc =
            snapshot.docs[0];

        const manager =
            managerDoc.data();


        if (
            manager.canVerifyPayments !==
            true
        ) {

            alert(
                "This Manager does not have payment verification permission."
            );

            return;
        }


        const confirmed =
            confirm(
                "Remove payment verification permission from " +
                manager.name +
                " (" +
                manager.managerId +
                ")?"
            );


        if (!confirmed) {
            return;
        }


        /* UPDATE FIRESTORE */

        await db.collection("managers")
            .doc(managerDoc.id)
            .update({

                canVerifyPayments:
                    false

            });


        console.log(
            "Payment permission removed:",
            manager.managerId
        );


        /* UPDATE CURRENT BROWSER SESSION IF NEEDED */

        manager.canVerifyPayments =
            false;

        updateCurrentManagerPermission(
            manager
        );


        /* REFRESH ADMIN MANAGER LIST */

        await displayManagers();


        alert(
            "Payment verification permission removed.\n\n" +
            "Manager: " +
            manager.name +
            "\nManager ID: " +
            manager.managerId
        );

    }
    catch (error) {

        console.error(
            "Error removing Manager payment permission:",
            error
        );

        alert(
            "Could not remove payment permission.\n\n" +
            error.message
        );
    }
}

/* =====================================================
   UPDATE CURRENT MANAGER PERMISSION
===================================================== */

function updateCurrentManagerPermission(
    manager
) {

    const currentManager =
        getCurrentManager();


    if (!currentManager) {
        return;
    }


    if (
        currentManager.managerId !==
        manager.managerId
    ) {
        return;
    }


    currentManager.canVerifyPayments =
        manager.canVerifyPayments;


    localStorage.setItem(
        "currentManager",
        JSON.stringify(currentManager)
    );
}


/* =====================================================
   APPROVE MANAGER - FIRESTORE
===================================================== */

async function approveManager(managerId) {

    /* =========================================
       ADMIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* =========================================
           FIND MANAGER IN FIRESTORE
        ========================================= */

        const snapshot =
            await db.collection("managers")
                .where(
                    "managerId",
                    "==",
                    managerId
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Manager not found in Firestore."
            );

            return;
        }


        const managerDoc =
            snapshot.docs[0];

        const manager =
            managerDoc.data();


        /* =========================================
           ALREADY APPROVED
        ========================================= */

        if (
            manager.status ===
            "Approved"
        ) {

            alert(
                "This Manager is already approved."
            );

            await displayManagers();

            return;
        }


        /* =========================================
           CONFIRM
        ========================================= */

        const confirmed =
            confirm(
                "Approve this Manager?\n\n" +

                "Manager ID: " +
                manager.managerId +

                "\nManager Name: " +
                manager.name
            );


        if (!confirmed) {
            return;
        }


        /* =========================================
           UPDATE FIRESTORE
        ========================================= */

        await db.collection("managers")
            .doc(managerDoc.id)
            .update({

                status:
                    "Approved",

                approvedDate:
                    new Date()
                        .toLocaleString()

            });


        console.log(
            "Manager approved in Firestore:",
            manager.managerId
        );


        /* =========================================
           IMPORTANT:
           RELOAD FROM FIRESTORE
        ========================================= */

        await displayManagers();


        await updateDashboard();


        alert(
            "Manager approved successfully.\n\n" +

            "Manager ID: " +
            manager.managerId +

            "\nManager Name: " +
            manager.name
        );

    }
    catch (error) {

        console.error(
            "Manager approval error:",
            error
        );


        alert(
            "Manager could not be approved.\n\n" +
            error.message
        );
    }
}
/* =====================================================
   EDIT MANAGER - FIRESTORE
===================================================== */

async function editManager(managerId) {

    /* =========================================
       ADMIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* =========================================
           FIND MANAGER IN FIRESTORE
        ========================================= */

        const snapshot =
            await db.collection("managers")
                .where(
                    "managerId",
                    "==",
                    managerId
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Manager not found."
            );

            return;
        }


        const managerDoc =
            snapshot.docs[0];

        const manager =
            managerDoc.data();


        /* =========================================
           EDIT MANAGER NAME
        ========================================= */

        const newName =
            prompt(
                "Enter Manager Name:",
                manager.name || ""
            );


        if (newName === null) {
            return;
        }


        /* =========================================
           EDIT PHONE
        ========================================= */

        const newPhone =
            prompt(
                "Enter Manager Phone Number:",
                manager.phone || ""
            );


        if (newPhone === null) {
            return;
        }


        const cleanName =
            newName.trim();

        const cleanPhone =
            newPhone.trim();


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            !cleanName ||
            !cleanPhone
        ) {

            alert(
                "Manager name and phone number cannot be empty."
            );

            return;
        }


        /* =========================================
           UPDATE FIRESTORE
        ========================================= */

        await db.collection("managers")
            .doc(managerDoc.id)
            .update({

                name:
                    cleanName,

                phone:
                    cleanPhone,

                updatedDate:
                    new Date()
                        .toLocaleString()

            });


        console.log(
            "Manager details updated:",
            managerId
        );


        /* =========================================
           UPDATE CURRENT MANAGER CACHE
           IF SAME MANAGER IS STORED HERE
        ========================================= */

        const currentManager =
            getCurrentManager();


        if (
            currentManager &&
            currentManager.managerId ===
                managerId
        ) {

            currentManager.name =
                cleanName;

            currentManager.phone =
                cleanPhone;


            localStorage.setItem(
                "currentManager",
                JSON.stringify(
                    currentManager
                )
            );
        }


        /* =========================================
           REFRESH MANAGER LIST
        ========================================= */

        await displayManagers();


        alert(
            "Manager details updated successfully.\n\n" +
            "Manager ID: " +
            manager.managerId
        );

    }
    catch (error) {

        console.error(
            "Manager edit error:",
            error
        );


        alert(
            "Manager details could not be updated.\n\n" +
            error.message
        );
    }
}

/* =====================================================
   DISABLE MANAGER - ADMIN
===================================================== */

function disableManager(managerId) {

    changeManagerStatus(
        managerId,
        "Disabled"
    );
}


/* =====================================================
   ENABLE MANAGER - ADMIN
===================================================== */

function enableManager(managerId) {

    changeManagerStatus(
        managerId,
        "Approved"
    );
}


/* =====================================================
   CHANGE MANAGER STATUS - FIRESTORE
===================================================== */

async function changeManagerStatus(
    managerId,
    newStatus
) {

    /* =========================================
       ADMIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* =========================================
           FIND MANAGER IN FIRESTORE
        ========================================= */

        const snapshot =
            await db.collection("managers")
                .where(
                    "managerId",
                    "==",
                    managerId
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Manager not found."
            );

            return;
        }


        const managerDoc =
            snapshot.docs[0];

        const manager =
            managerDoc.data();


        /* =========================================
           CHECK CURRENT STATUS
        ========================================= */

        if (
            manager.status ===
            newStatus
        ) {

            alert(
                "Manager is already " +
                newStatus +
                "."
            );

            return;
        }


        /* =========================================
           CONFIRM STATUS CHANGE
        ========================================= */

        let message = "";


        if (
            newStatus ===
            "Disabled"
        ) {

            message =
                "Disable this Manager?\n\n" +
                "Manager ID: " +
                manager.managerId +
                "\nManager Name: " +
                manager.name;

        }
        else {

            message =
                "Enable this Manager?\n\n" +
                "Manager ID: " +
                manager.managerId +
                "\nManager Name: " +
                manager.name;
        }


        const confirmed =
            confirm(message);


        if (!confirmed) {
            return;
        }


        /* =========================================
           UPDATE FIRESTORE
        ========================================= */

        await db.collection("managers")
            .doc(managerDoc.id)
            .update({

                status:
                    newStatus

            });


        console.log(
            "Manager status updated:",
            manager.managerId,
            newStatus
        );


        /* =========================================
           UPDATE LOCAL ACTIVE SESSION IF SAME USER
        ========================================= */

        const currentManager =
            getCurrentManager();


        if (
            currentManager &&
            currentManager.managerId ===
                managerId
        ) {

            if (
                newStatus ===
                "Disabled"
            ) {

                localStorage.removeItem(
                    "currentManager"
                );

                localStorage.removeItem(
                    "managerLoggedIn"
                );

            }
            else {

                currentManager.status =
                    newStatus;

                localStorage.setItem(
                    "currentManager",
                    JSON.stringify(
                        currentManager
                    )
                );
            }
        }


        /* =========================================
           REFRESH ADMIN PAGE
        ========================================= */

        await displayManagers();

        updateDashboard();


        alert(
            "Manager " +
            manager.managerId +
            " status changed to " +
            newStatus +
            "."
        );

    }
    catch (error) {

        console.error(
            "Manager status update error:",
            error
        );


        alert(
            "Manager status could not be changed.\n\n" +
            error.message
        );
    }
}

/* =====================================================
   REMOVE MANAGER - FIRESTORE
===================================================== */

async function removeManager(managerId) {

    /* =========================================
       ADMIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* =========================================
           FIND MANAGER IN FIRESTORE
        ========================================= */

        const snapshot =
            await db.collection("managers")
                .where(
                    "managerId",
                    "==",
                    managerId
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Manager not found."
            );

            return;
        }


        const managerDoc =
            snapshot.docs[0];

        const manager =
            managerDoc.data();


        /* =========================================
           CONFIRM REMOVE
        ========================================= */

        const confirmRemove =
            confirm(

                "Are you sure you want to remove this Manager?\n\n" +

                "Manager ID: " +
                manager.managerId +

                "\nName: " +
                manager.name +

                "\n\nThe Manager profile will be removed."

            );


        if (!confirmRemove) {
            return;
        }


        /* =========================================
           DELETE FIRESTORE MANAGER PROFILE
        ========================================= */

        await db.collection("managers")
            .doc(managerDoc.id)
            .delete();


        console.log(
            "Manager removed from Firestore:",
            manager.managerId
        );


        /* =========================================
           UPDATE LOCAL MANAGER CACHE
        ========================================= */

        let managers =
            getManagers();


        managers =
            managers.filter(
                function (item) {

                    return (
                        item.managerId !==
                        managerId
                    );
                }
            );


        localStorage.setItem(
            "managers",
            JSON.stringify(managers)
        );


        /* =========================================
           REMOVE CURRENT SESSION IF NECESSARY
        ========================================= */

        const currentManager =
            getCurrentManager();


        if (
            currentManager &&
            currentManager.managerId ===
                managerId
        ) {

            localStorage.removeItem(
                "currentManager"
            );

            localStorage.removeItem(
                "managerLoggedIn"
            );
        }


        /* =========================================
           REFRESH ADMIN DISPLAY
        ========================================= */

        await displayManagers();

        updateDashboard();


        alert(
            "Manager " +
            manager.managerId +
            " removed successfully."
        );

    }
    catch (error) {

        console.error(
            "Manager removal error:",
            error
        );


        alert(
            "Manager could not be removed.\n\n" +
            error.message
        );
    }
}





function openBooksPage() {

    if (!isAdminLoggedIn()) {

        showPage("accountPage");

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    showPage(
        "booksPage"
    );
}


function openOrdersPage() {

    if (!isAdminLoggedIn()) {

        showPage("accountPage");

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    showPage(
        "ordersPage"
    );
}


/* =====================================================
   CUSTOMER DETAILS
===================================================== */

async function displayCustomers() {

    const container =
        document.getElementById(
            "customersList"
        );

    if (!container) {
        return;
    }


   let customers = [];

try {

    const snapshot =
        await db.collection("customers")
            .get();


    snapshot.forEach(
        function (doc) {

            customers.push(
                doc.data()
            );

        }
    );


    localStorage.setItem(
        "customers",
        JSON.stringify(customers)
    );


    console.log(
        "Customers loaded from Firestore:",
        customers
    );

}
catch (error) {

    console.error(
        "Error loading customers:",
        error
    );

    customers =
        getCustomers();

}

    container.innerHTML = "";


    if (customers.length === 0) {

        container.innerHTML = `

            <div class="empty-message">
                No customers registered.
            </div>
        `;

        return;
    }


    customers.forEach(
        function (customer) {

            const address =
                customer.address;


            const addressText =
                address
                    ? [
                        address.address,
                        address.city,
                        address.state,
                        address.pincode
                    ]
                        .filter(Boolean)
                        .join(", ")
                    : "Not added";


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "customer-detail-card";


            card.innerHTML = `

                <h3>
                    👤 ${customer.name}
                </h3>

                <p>
                    <strong>Email:</strong>
                    ${customer.email}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${customer.phone}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${addressText}
                </p>
            `;


            container.appendChild(
                card
            );
        }
    );
}


/* =====================================================
   BOOK DETAILS
===================================================== */

async function displayBookDetails() {

    const container =
        document.getElementById(
            "bookDetailsList"
        );

    const bottomContainer =
        document.getElementById(
            "bookOrderDetails"
        );


    if (!container) {
        return;
    }


    const books =
        getBooks();

   /* =========================================
   LOAD ORDERS FROM FIRESTORE
========================================= */

let orders = [];

try {

    const snapshot =
        await db.collection("orders")
            .get();


    snapshot.forEach(
        function (doc) {

            const data =
                doc.data();

            orders.push({

                ...data,

                id:
                    data.id !== undefined
                        ? data.id
                        : doc.id
            });

        }
    );


    /* Keep local cache */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    console.log(
        "Book purchase data loaded from Firestore:",
        orders
    );

}
catch (error) {

    console.error(
        "Error loading book purchase data:",
        error
    );

    orders =
        getOrders();
}


    container.innerHTML = "";


    books.forEach(
        function (book) {

            let totalPurchased =
                0;


            orders.forEach(
                function (order) {
                   /* Count only confirmed purchases */

if (order.status !== "Order Confirmed") {
    return;
}

                    if (
                        !Array.isArray(
                            order.books
                        )
                    ) {
                        return;
                    }


                    order.books.forEach(
                        function (orderBook) {

                            if (
                                String(orderBook.id) ===
                                String(book.id)
                            ) {

                                totalPurchased +=
                                    Number(
                                        orderBook.quantity
                                    ) || 1;
                            }
                        }
                    );
                }
            );


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "book-detail-card";


            /*
               Customer/order information is NOT
               repeated inside each book card.
            */

            card.innerHTML = `

                <div class="book-detail-header">

                    <img
                        src="${book.image}"
                        class="book-detail-image"
                        alt="${book.title}"
                    >

                    <div class="book-detail-title">

                        <h2>
                            ${book.title}
                        </h2>

                        <p>
                            By ${book.author}
                        </p>

                    </div>

                </div>

                <div class="book-information">

                    <div class="book-info-row">

                        <strong>
                            Category
                        </strong>

                        <span>
                            ${book.category}
                        </span>

                    </div>

                    <div class="book-info-row">

                        <strong>
                            Price
                        </strong>

                        <span>
                            ₹${book.price}
                        </span>

                    </div>

                    <div class="book-info-row">

                        <strong>
                            Current Stock
                        </strong>

                        <span>
                            ${book.stock}
                        </span>

                    </div>

                    <div class="book-info-row">

                        <strong>
                            Quantity Purchased
                        </strong>

                        <span>
                            ${totalPurchased}
                        </span>

                    </div>

                </div>
            `;


            container.appendChild(
                card
            );
        }
    );


    displayBookOrderDetails(
        bottomContainer,
        orders
    );
}


/* =====================================================
   ORDER/CUSTOMER DETAILS AT BOTTOM OF BOOK PAGE
===================================================== */

function displayBookOrderDetails(
    container,
    orders
) {

    if (!container) {
        return;
    }


    if (orders.length === 0) {

        container.innerHTML = `

            <div class="empty-message">
                No order details available.
            </div>
        `;

        return;
    }


    let html = `

        <div class="bottom-order-details">

            <div class="bottom-order-header">

                <h2>
                    📦 Order & Customer Details
                </h2>

                <p>
                    Customer purchase information
                </p>

            </div>

            <div class="bottom-order-table">

                <div class="
                    bottom-order-row
                    bottom-order-heading
                ">

                    <div>Order No</div>

                    <div>Customer</div>

                    <div>Book</div>

                    <div>Quantity</div>

                    <div>Purchased Date</div>

                </div>
    `;


    orders
        .slice()
        .reverse()
        .forEach(
            function (order) {

                if (
                    !Array.isArray(
                        order.books
                    )
                ) {
                    return;
                }


                order.books.forEach(
                    function (book) {

                        html += `

                            <div class="bottom-order-row">

                                <div>
                                    ${order.id}
                                </div>

                                <div>
                                    ${order.customer}
                                </div>

                                <div>
                                    ${book.title}
                                </div>

                                <div>
                                    ${book.quantity || 1}
                                </div>

                                <div>
                                    ${order.date}
                                </div>

                            </div>
                        `;
                    }
                );
            }
        );


    html += `

            </div>

        </div>
    `;


    container.innerHTML =
        html;
}


/* =====================================================
   ORDER DETAILS PAGE
===================================================== */

async function displayOrderDetails() {

    const container =
        document.getElementById(
            "ordersList"
        );

    if (!container) {
        return;
    }


  /* =========================================
   LOAD ADMIN ORDERS FROM FIRESTORE
========================================= */

let orders = [];

try {

    const snapshot =
        await db.collection("orders")
            .get();


    snapshot.forEach(
        function (doc) {

            const data =
                doc.data();

            orders.push({

                ...data,

                id:
                    data.id !== undefined
                        ? data.id
                        : doc.id
            });

        }
    );


    /*
       Sort by order ID timestamp.
       Existing code below uses reverse(),
       so oldest is stored first here.
    */

    orders.sort(
        function (a, b) {

            const aId =
                Number(
                    String(a.id)
                        .replace(/\D/g, "")
                ) || 0;

            const bId =
                Number(
                    String(b.id)
                        .replace(/\D/g, "")
                ) || 0;

            return aId - bId;
        }
    );


    /* Keep local cache for old functions */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    console.log(
        "Admin orders loaded from Firestore:",
        orders
    );

}
catch (error) {

    console.error(
        "Error loading Admin orders:",
        error
    );


    /* Temporary local fallback */

    orders =
        getOrders();
}


    container.innerHTML = "";


    if (orders.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                No orders found.

            </div>
        `;

        return;
    }


    orders
        .slice()
        .reverse()
        .forEach(
            function (order) {

                let booksHTML = "";


                if (
                    Array.isArray(
                        order.books
                    )
                ) {

                    order.books.forEach(
                        function (book) {

                            booksHTML += `

                                <div class="order-book-item">

                                    <span>
                                        📚 ${book.title}
                                    </span>

                                    <span>
                                        Quantity:
                                        ${book.quantity || 1}
                                    </span>

                                </div>
                            `;
                        }
                    );
                }


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "order-detail-card";


                card.innerHTML = `

                    <h3>
                        📦 Order #${order.id}
                    </h3>

                    <p>
                        <strong>
                            Purchased Customer:
                        </strong>

                        ${order.customer}
                    </p>

                    <p>
                        <strong>
                            Email:
                        </strong>

                        ${order.email}
                    </p>

                    <p>
                        <strong>
                            Purchased Date:
                        </strong>

                        ${order.date}
                    </p>

                   <p>
    <strong>
        Payment Method:
    </strong>

    ${order.paymentMethod}
</p>


${
    order.paymentMethod === "UPI"
        ? `
<div class="admin-payment-info">

    <p>
        <strong>
            Transaction / Reference ID:
        </strong>

        ${order.transactionId || "-"}
    </p>


    <p>
        <strong>
            Payment Status:
        </strong>

        <span class="payment-status">
            ${
                order.paymentStatus ||
                "Pending Verification"
            }
        </span>
    </p>


    ${
        order.paymentStatus === "Verified"
            ? `

                <div class="payment-handled-info">

                    <h4>
                        ✓ Payment Verification Details
                    </h4>


                    <p>
                        <strong>
                            Verified By:
                        </strong>

                        ${
                            order.paymentVerifiedByRole ||
                            "Admin"
                        }
                    </p>


                    ${
                        order.paymentVerifiedByRole ===
                        "Manager"
                            ? `

                                <p>
                                    <strong>
                                        Manager Name:
                                    </strong>

                                    ${
                                        order.paymentVerifiedByManagerName ||
                                        "-"
                                    }
                                </p>


                                <p>
                                    <strong>
                                        Manager ID:
                                    </strong>

                                    ${
                                        order.paymentVerifiedByManagerId ||
                                        "-"
                                    }
                                </p>

                            `
                            : ""
                    }


                    <p>
                        <strong>
                            Verified Date:
                        </strong>

                        ${
                            order.paymentVerifiedDate ||
                            "-"
                        }
                    </p>

                </div>

            `
            : ""
    }


    ${
        order.paymentStatus === "Rejected"
            ? `

                <div class="payment-handled-info">

                    <h4>
                        ✕ Payment Rejection Details
                    </h4>


                    <p>
                        <strong>
                            Rejected By:
                        </strong>

                        ${
                            order.paymentRejectedByRole ||
                            "Admin"
                        }
                    </p>


                    ${
                        order.paymentRejectedByRole ===
                        "Manager"
                            ? `

                                <p>
                                    <strong>
                                        Manager Name:
                                    </strong>

                                    ${
                                        order.paymentRejectedByManagerName ||
                                        "-"
                                    }
                                </p>


                                <p>
                                    <strong>
                                        Manager ID:
                                    </strong>

                                    ${
                                        order.paymentRejectedByManagerId ||
                                        "-"
                                    }
                                </p>

                            `
                            : ""
                    }


                    <p>
                        <strong>
                            Rejected Date:
                        </strong>

                        ${
                            order.paymentRejectedDate ||
                            "-"
                        }
                    </p>

                </div>

            `
            : ""
    }

</div>
        `
        : ""
}


<p>
    <strong>
        Total:
    </strong>

    ₹${order.total}
</p>
                    <p>
                        <strong>
                            Status:
                        </strong>

                        ${order.status}
                    </p>

                    <div class="order-books-list">

                        <strong>
                            Purchased Books
                        </strong>

                        ${booksHTML}

                    </div>
                    ${
    order.paymentMethod === "UPI" &&
    (
        !order.paymentStatus ||
        order.paymentStatus ===
        "Pending Verification"
    )
        ? `
            <div class="payment-verification-buttons">

                <button
                    type="button"
                    class="verify-payment-btn"
                    onclick="verifyOrderPayment('${order.id}')"
                >
                    ✓ Verify Payment
                </button>


                <button
                    type="button"
                    class="reject-payment-btn"
                    onclick="rejectOrderPayment('${order.id}')"
                >
                    ✕ Reject Payment
                </button>

            </div>
        `
        : ""
}

${
    order.paymentMethod ===
        "Cash on Delivery" &&

    order.stockReduced !== true &&

    order.status ===
        "Awaiting Admin Confirmation"

        ? `
            <div class="payment-verification-buttons">

                <button
                    type="button"
                    class="verify-payment-btn"
                    onclick="confirmCODOrder('${order.id}')"
                >
                    ✓ Confirm COD Order
                </button>

            </div>
        `

        : ""
}
                `;


                container.appendChild(
                    card
                );
            }
        );
}

function validateOrderStock(
    orderBooks
) {

    const books =
        getBooks();


    if (!Array.isArray(orderBooks)) {

        return false;
    }


    for (const orderBook of orderBooks) {

        const book =
            books.find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(orderBook.id)
                    );

                }
            );


        if (!book) {

            alert(
                orderBook.title +
                " is no longer available."
            );

            return false;
        }


        const requiredQuantity =
            Number(
                orderBook.quantity
            ) || 1;


        const availableStock =
            Number(book.stock) || 0;


        if (
            requiredQuantity >
            availableStock
        ) {

            alert(
                "Not enough stock for " +
                orderBook.title +
                ".\n\n" +
                "Required: " +
                requiredQuantity +
                "\n" +
                "Available: " +
                availableStock
            );

            return false;
        }
    }


    return true;
}



/* =====================================================
   CONFIRM CASH ON DELIVERY ORDER - ADMIN
===================================================== */

async function confirmCODOrder(orderId) {

    /* =========================================
       ADMIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage(
            "accountPage"
        );

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    try {

        /* =========================================
           LOAD FRESH ORDER FROM FIRESTORE
        ========================================= */

        const orderRef =
            db.collection("orders")
                .doc(String(orderId));


        const orderDoc =
            await orderRef.get();


        if (!orderDoc.exists) {

            alert(
                "Order not found."
            );

            return;
        }


        const order = {

            ...orderDoc.data(),

            id:
                orderDoc.data().id ||
                orderDoc.id

        };


        /* =========================================
           CHECK PAYMENT METHOD
        ========================================= */

        if (
            order.paymentMethod !==
            "Cash on Delivery"
        ) {

            alert(
                "This is not a Cash on Delivery order."
            );

            return;
        }


        /* =========================================
           CHECK ALREADY CONFIRMED
        ========================================= */

        if (
            order.stockReduced === true ||
            order.status ===
                "Order Confirmed"
        ) {

            alert(
                "This order has already been confirmed."
            );

            return;
        }


        /* =========================================
           ADMIN CONFIRMATION
        ========================================= */

        const confirmed =
            confirm(

                "Confirm this Cash on Delivery order?\n\n" +

                "Order: " +
                order.id +

                "\nCustomer: " +
                order.customer +

                "\nAmount: ₹" +
                order.total

            );


        if (!confirmed) {
            return;
        }


        /* =========================================
           REDUCE STOCK
        ========================================= */

        const stockUpdated =
            await reducePurchasedStock(
                order.books
            );


        if (!stockUpdated) {

            return;
        }


        /* =========================================
           UPDATE ORDER
        ========================================= */

        await orderRef.set(
            {

                stockReduced:
                    true,

                status:
                    "Order Confirmed",

                codConfirmedDate:
                    new Date()
                        .toLocaleString(),

                codConfirmedByRole:
                    "Admin"

            },

            {
                merge:
                    true
            }
        );


        console.log(
            "COD order confirmed:",
            order.id
        );


        /* =========================================
           UPDATE LOCAL ORDER CACHE
        ========================================= */

        let orders =
            getOrders();


        const index =
            orders.findIndex(
                function (item) {

                    return (
                        String(item.id) ===
                        String(orderId)
                    );
                }
            );


        if (index >= 0) {

            orders[index].stockReduced =
                true;

            orders[index].status =
                "Order Confirmed";

            orders[index].codConfirmedDate =
                new Date()
                    .toLocaleString();

            orders[index].codConfirmedByRole =
                "Admin";


            localStorage.setItem(
                "orders",
                JSON.stringify(
                    orders
                )
            );
        }


        /* =========================================
           REFRESH
        ========================================= */

        await displayOrderDetails();

        displayPurchaseHistory();

        displayBooks();

        displayBookDetails();

        updateDashboard();


        alert(
            "Cash on Delivery order confirmed successfully."
        );

    }
    catch (error) {

        console.error(
            "COD confirmation error:",
            error
        );


        alert(
            "COD order could not be confirmed.\n\n" +
            error.message
        );
    }
}



async function verifyOrderPayment(orderId) {

    /* =========================================
       ADMIN LOGIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage("accountPage");

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    /* =========================================
       GET CURRENT ORDER
    ========================================= */

    let orders = getOrders();

    let index =
        orders.findIndex(
            function (order) {

                return (
                    String(order.id) ===
                    String(orderId)
                );
            }
        );


    if (index === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    let order =
        orders[index];


    /* =========================================
       UPI PAYMENT CHECK
    ========================================= */

    if (order.paymentMethod !== "UPI") {

        alert(
            "This is not a UPI payment."
        );

        return;
    }


    /* =========================================
       CHECK PAYMENT IS STILL PENDING
    ========================================= */

    if (
        order.paymentStatus &&
        order.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed.\n\n" +
            "Current Status: " +
            order.paymentStatus
        );

        displayOrderDetails();

        return;
    }


    /* =========================================
       ADMIN CONFIRMATION
    ========================================= */

    const confirmed =
        confirm(
            "Verify this customer payment?\n\n" +
            "Order: " +
            order.id +
            "\nTransaction ID: " +
            (order.transactionId || "-") +
            "\nAmount: ₹" +
            order.total
        );


    if (!confirmed) {
        return;
    }


    /* =========================================
       GET FRESH ORDER DATA AGAIN

       Important:
       Manager may have processed this payment
       while Admin confirmation was open.
    ========================================= */

    orders = getOrders();


    index =
        orders.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                    String(orderId)
                );
            }
        );


    if (index === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    order =
        orders[index];


    /* =========================================
       CHECK AGAIN AFTER READING FRESH DATA
    ========================================= */

    if (
        order.paymentStatus &&
        order.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed by another user.\n\n" +
            "Current Status: " +
            order.paymentStatus
        );

        displayOrderDetails();

        return;
    }


    /* =========================================
       STOCK REDUCTION

       Reduce only once.
    ========================================= */

    if (!order.stockReduced) {

        if (
            !validateOrderStock(
                order.books
            )
        ) {

            alert(
                "Payment was found, but the order cannot be confirmed because there is not enough stock."
            );

            return;
        }


       const stockUpdated =
    await reducePurchasedStock(
        order.books
    );

if (!stockUpdated) {
    return;
}
      

order.stockReduced =
    true;
    }

    /* =========================================
       VERIFY PAYMENT
    ========================================= */

    order.paymentStatus =
        "Verified";


    order.status =
        "Order Confirmed";


    order.paymentVerifiedDate =
        new Date().toLocaleString();


    /* =========================================
       SAVE ADMIN AUDIT
    ========================================= */

    order.paymentVerifiedByRole =
        "Admin";

       /* =========================================
   SAVE ADMIN VERIFICATION TO FIRESTORE
========================================= */

try {

    await db.collection("orders")
        .doc(String(order.id))
        .set(
            order,
            { merge: true }
        );

    console.log(
        "Admin verification saved to Firestore:",
        order.id
    );

}
catch (error) {

    console.error(
        "Error saving Admin verification:",
        error
    );

    alert(
        "Payment verification could not be saved online."
    );

    return;
}


    /* =========================================
       SAVE ORDERS
    ========================================= */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    /* =========================================
       UPDATE LATEST ORDER
    ========================================= */

    const latestOrder =
        JSON.parse(
            localStorage.getItem(
                "latestOrder"
            ) || "null"
        );


    if (
        latestOrder &&
        String(latestOrder.id) ===
        String(orderId)
    ) {

        latestOrder.paymentStatus =
            "Verified";


        latestOrder.status =
            "Order Confirmed";


        latestOrder.stockReduced =
            order.stockReduced;


        latestOrder.paymentVerifiedDate =
            order.paymentVerifiedDate;


        latestOrder.paymentVerifiedByRole =
            "Admin";


        localStorage.setItem(
            "latestOrder",
            JSON.stringify(latestOrder)
        );
    }


    /* =========================================
       REFRESH WEBSITE
    ========================================= */

    displayOrderDetails();

    displayPurchaseHistory();

    displayBooks();

    displayCart();

    displayBookDetails();

    updateDashboard();


    alert(
        "Payment verified successfully!\n\n" +
        "Verified By: Admin"
    );
}

async function rejectOrderPayment(orderId) {

    /* =========================================
       ADMIN LOGIN CHECK
    ========================================= */

    if (!isAdminLoggedIn()) {

        alert(
            "Admin permission required."
        );

        showPage("accountPage");

        showAccountForm(
            "adminLoginForm"
        );

        return;
    }


    /* =========================================
       GET CURRENT ORDER
    ========================================= */

    let orders = getOrders();

    let index =
        orders.findIndex(
            function (order) {

                return (
                    String(order.id) ===
                    String(orderId)
                );
            }
        );


    if (index === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    let order =
        orders[index];


    /* =========================================
       UPI PAYMENT CHECK
    ========================================= */

    if (order.paymentMethod !== "UPI") {

        alert(
            "This is not a UPI payment."
        );

        return;
    }


    /* =========================================
       CHECK PAYMENT IS STILL PENDING
    ========================================= */

    if (
        order.paymentStatus &&
        order.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed.\n\n" +
            "Current Status: " +
            order.paymentStatus
        );

        displayOrderDetails();

        return;
    }


    /* =========================================
       ADMIN CONFIRMATION
    ========================================= */

    const confirmed =
        confirm(
            "Reject this customer payment?\n\n" +
            "Order: " +
            order.id +
            "\nTransaction ID: " +
            (order.transactionId || "-") +
            "\nAmount: ₹" +
            order.total
        );


    if (!confirmed) {
        return;
    }


    /* =========================================
       GET FRESH ORDER DATA AGAIN

       Manager or another Admin action may have
       processed the payment while confirmation
       was open.
    ========================================= */

    orders = getOrders();


    index =
        orders.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                    String(orderId)
                );
            }
        );


    if (index === -1) {

        alert(
            "Order not found."
        );

        return;
    }


    order =
        orders[index];


    /* =========================================
       CHECK STATUS AGAIN
    ========================================= */

    if (
        order.paymentStatus &&
        order.paymentStatus !==
            "Pending Verification"
    ) {

        alert(
            "This payment has already been processed by another user.\n\n" +
            "Current Status: " +
            order.paymentStatus
        );

        displayOrderDetails();

        return;
    }


    /* =========================================
       REJECT PAYMENT
    ========================================= */

    order.paymentStatus =
        "Rejected";


    order.status =
        "Payment Failed";


    order.paymentRejectedDate =
        new Date().toLocaleString();


    /* =========================================
       SAVE ADMIN AUDIT
    ========================================= */

    order.paymentRejectedByRole =
        "Admin";

   /* =========================================
   SAVE ADMIN REJECTION TO FIRESTORE
========================================= */

try {

    await db.collection("orders")
        .doc(String(order.id))
        .set(
            order,
            { merge: true }
        );

    console.log(
        "Admin rejection saved to Firestore:",
        order.id
    );

}
catch (error) {

    console.error(
        "Error saving Admin rejection:",
        error
    );

    alert(
        "Payment rejection could not be saved online."
    );

    return;
}


    /* =========================================
       SAVE ORDERS
    ========================================= */

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    /* =========================================
       UPDATE LATEST ORDER
    ========================================= */

    const latestOrder =
        JSON.parse(
            localStorage.getItem(
                "latestOrder"
            ) || "null"
        );


    if (
        latestOrder &&
        String(latestOrder.id) ===
        String(orderId)
    ) {

        latestOrder.paymentStatus =
            "Rejected";


        latestOrder.status =
            "Payment Failed";


        latestOrder.paymentRejectedDate =
            order.paymentRejectedDate;


        latestOrder.paymentRejectedByRole =
            "Admin";


        localStorage.setItem(
            "latestOrder",
            JSON.stringify(latestOrder)
        );
    }


    /* =========================================
       REFRESH WEBSITE
    ========================================= */

    displayOrderDetails();

    displayPurchaseHistory();

    updateDashboard();


    alert(
        "Payment rejected successfully!\n\n" +
        "Rejected By: Admin"
    );
}

/* =====================================================
   LOAD SUBCATEGORIES FROM FIRESTORE
===================================================== */

async function loadSubcategoriesFromFirestore() {

    try {

        const doc =
            await db.collection("settings")
                .doc("subcategories")
                .get();

        if (doc.exists) {

            const data = doc.data();

            const subcategories =
                data.items || {};

            localStorage.setItem(
                "subcategories",
                JSON.stringify(subcategories)
            );

            console.log(
                "Subcategories loaded from Firestore:",
                subcategories
            );

        }

    }
    catch (error) {

        console.error(
            "Error loading subcategories:",
            error
        );

    }
}



/* =====================================================
   LOAD CATEGORIES FROM FIRESTORE
===================================================== */

async function loadCategoriesFromFirestore() {

    try {

        const doc =
            await db.collection("settings")
                .doc("categories")
                .get();

        if (doc.exists) {

            const data = doc.data();

            const categories =
                Array.isArray(data.items)
                    ? data.items
                    : [];

            localStorage.setItem(
                "categories",
                JSON.stringify(categories)
            );

            console.log(
                "Categories loaded from Firestore:",
                categories
            );

        }

    }
    catch (error) {

        console.error(
            "Error loading categories:",
            error
        );

    }
}


/* =====================================================
   RESTORE CUSTOMER FIREBASE SESSION
===================================================== */

function restoreCustomerSession() {

    auth.onAuthStateChanged(
        async function (user) {

            if (!user) {

                localStorage.removeItem(
                    "currentCustomer"
                );

                updateNavigation();

                return;
            }


            try {

                const customerDoc =
                    await db.collection("customers")
                        .doc(user.uid)
                        .get();


                /* =====================================
                   AUTH USER IS A CUSTOMER
                ===================================== */

                if (customerDoc.exists) {

                    const customer = {

                        ...customerDoc.data(),

                        id:
                            customerDoc.data().id ||
                            user.uid
                    };


                    localStorage.setItem(
                        "currentCustomer",
                        JSON.stringify(customer)
                    );


                    console.log(
                        "Customer session restored:",
                        customer
                    );


                    updateNavigation();

                    return;
                }


                /*
                   Firebase user may be a Manager,
                   not a Customer.

                   Prevent an old Customer profile
                   remaining in localStorage.
                */

                localStorage.removeItem(
                    "currentCustomer"
                );


                updateNavigation();

            }
            catch (error) {

                console.error(
                    "Customer session restore error:",
                    error
                );
            }
        }
    );
}

/* =====================================================
   START WEBSITE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        initializeStorage();

        initializeManagerPermissions();

       await loadCategoriesFromFirestore();

       await loadSubcategoriesFromFirestore();

       restoreCustomerSession();

       restoreManagerSession();

       restoreAdminSession();

        loadCategoryFilter();

        loadAdminCategories();

        updateNavigation();

        updateCartCount();

        displayBooks();

        displayCart();

        updateDashboard();

        showPage("home");
    }
);

