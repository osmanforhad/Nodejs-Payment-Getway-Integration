const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const pug = require("pug");
const _ = require("lodash");
const path = require("path");

const { Donor } = require("./models/DonorModel");

const { initializePayment, verifyPayment } =
  require("./config/paystack")(request);

const port = process.env.PORT || 5000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public/")));

app.set("view engine", pug);

app.get("/", (request, response) => {
  response.render("index.pug");
});

app.listen(port, () => {
  console.log(`App is Running on port ${port}`);
});
