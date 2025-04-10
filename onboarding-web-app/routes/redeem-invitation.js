// In your index.js (or appropriate route file)
app.get("/redeem-invitation", (req, res) => {
  // If the email link includes query parameters, store the user details in the session.
  if (req.query.redeem === "true") {
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
  
  // Render the redemption code entry page.
  res.render("redeem-invitation", { layout: false });
});
