require("dotenv").config();
const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const { createJWT, ES256KSigner } = require("did-jwt");
const { ethers } = require("ethers");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS
app.use(cors());

// ✅ Set up express-session middleware
app.use(session({
  secret: "your-secret-key", // Replace with your own secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Change to true if using HTTPS in production
}));

// ✅ Make session variable available to all views via res.locals
app.use((req, res, next) => {
  res.locals.inRedeemMode = req.session.inRedeemMode || false;
  next();
});

// Optional: make userDetails available in every view via locals
app.use((req, res, next) => {
    res.locals.userDetails = req.session.userDetails || {};
    next();
});

// ✅ Set up Handlebars as the template engine
app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/bootstrap-theme")));
app.use(express.static(path.join(__dirname, "assets")));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/models", express.static(path.join(__dirname, "models")));
app.use(express.static("public"));

const credentialRoutes = require("./routes/credential");	
app.use("/api", credentialRoutes);

// ✅ Middleware for handling form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ Set up storage for uploaded images (Multer)
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Ensure Private Key is Loaded Securely
const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE";
if (!PRIVATE_KEY || PRIVATE_KEY.length !== 64) {
  console.error("❌ Private key is missing or invalid. Ensure a valid 64-character hex key is set.");
  process.exit(1);
}

// ✅ Home Page Route
app.get("/", (req, res) => res.render("home", { layout: false }));

// ✅ Redeem Invitation Route: Check query parameter and set session
app.get("/redeem-invitation", (req, res) => {
  if (req.query.redeem === "true") {
    req.session.inRedeemMode = true;
  }
  // Render the redeem invitation page (or redirect as needed)
  res.render("redeem-invitation", { layout: false });
});

// Other routes – note that the session flag is available via res.locals.inRedeemMode
const invitation = require("./routes/invitation.js");
app.get("/invitation", invitation);

const setupIdentity = require("./routes/setup-identity.js");
app.get("/setup-identity", setupIdentity);

const adminDashboard = require("./routes/admin-dashboard.js");
app.get("/admin-dashboard", adminDashboard);

const tickets = require("./routes/tickets.js");
app.get("/tickets", tickets);

const inviteRouter = require("./routes/invite.js");
app.use("/invite", inviteRouter);

const usersRouter = require("./routes/users.js");
app.get("/users", usersRouter);

const usersDetailsRouter = require("./routes/user-details.js");
app.get("/user-details", usersDetailsRouter);

// ✅ ID Verification Route
app.post("/verify-id", upload.single("id_image"), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: "No ID image uploaded" });
  }
  try {
      console.log("📸 Received ID image:", req.file.filename);
      res.json({ message: "✅ ID Verified Successfully" });
  } catch (error) {
      console.error("❌ Error verifying ID:", error);
      res.status(500).json({ error: "ID Verification Failed" });
  }
});

// ✅ DID Issuance Function
async function issueDIDToken(did) {
  try {
      const signer = ES256KSigner(Buffer.from(PRIVATE_KEY, "hex"));
      const jwt = await createJWT(
          { aud: "https://example.com", exp: Math.floor(Date.now() / 1000) + 60 * 60 },
          { issuer: did, signer }
      );
      return jwt;
  } catch (error) {
      console.error("❌ Error creating JWT:", error);
      throw new Error("DID issuance failed.");
  }
}

// ✅ Generate DID Route
app.post("/generate-did", async (req, res) => {
  try {
      const did = "did:ethr:0xYourEthereumAddress"; // Replace with a real DID
      const jwt = await issueDIDToken(did);
      res.json({ did, jwt });
  } catch (error) {
      console.error("❌ Error issuing DID:", error);
      res.status(500).json({ error: "Failed to issue DID" });
  }
});

// In your index.js (or appropriate route file)
app.post("/redeem-invitation", (req, res) => {
    const code = req.body.code;
    
    // For demo purposes, assume that the correct redemption code is "123456"
    if (code === "123456") {
      req.session.inRedeemMode = true;
      res.redirect("/setup-identity");
    } else {
      // If the code is invalid, re-render the redemption page with an error message.
      res.render("redeem-invitation", { layout: false, error: "Invalid redemption code. Please try again." });
    }
  });
  
  //  Logout Route: clear the session and redirect to sign in page
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        // Optionally, you might redirect back to a safe page
        return res.redirect("/user-details");
      }
      // Redirect to the sign-in page after session cleared
      res.redirect("/");
    });
  });
  

  

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
