const express = require("express");

const app = express();

app.get("/trip/:id", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  res.json({
    tripId: req.params.id,
    destination: "Rome",
    hotel: "Hilton",
  });
});

app.listen(3000);
