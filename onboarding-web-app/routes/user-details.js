// routes/user-details.js
const express = require("express");
const router = express.Router();
router.get("/", (req, res) => {
  // If the email link includes user detail query parameters, save them in the session.
  if (
    req.query.name ||
    req.query.email ||
    req.query.phone ||
    req.query.company ||
    req.query.location ||
    req.query.description ||
    req.query.avatar
  ) {
    // Create a completely new object
    req.session.userDetails = {
      name: req.query.name || "",
      email: req.query.email || "",
      phone: req.query.phone || "",
      company: req.query.company || "",
      location: req.query.location || "",
      description: req.query.description || "",
      avatar: req.query.avatar || ""
    };
  }
  
  // Use a completely new object for rendering too
  const userDetailsToRender = req.session.userDetails ? 
    {...req.session.userDetails} : 
    {
      name: "John Williams",
      email: "",
      phone: "(202) 555-0126",
      company: "TechPinnacle Solutions",
      location: "San Francisco, CA",
      description: "A long-standing customer with a passion for technology.",
      avatar: "../assets/img/photos/photo-6.jpg"
    };
  
  // Render the view with these details
  res.render("user-details", userDetailsToRender);
});

module.exports = router;