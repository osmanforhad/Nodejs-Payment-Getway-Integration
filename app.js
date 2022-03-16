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

app.post("/paystack/pay", (request, response) => {
  const form = _.pick(request.body, ["amount", "email", "full_name"]);
  form.metadata = {
    full_name: form.full_name,
  };
  form.amount *= 100;
  initializePayment(form, (error, body) => {
    if (error) {
      //handle errors
      console.log(error);
      return response.redirect("/error");
      return;
    }
    response = JSON.parse(body);
    response.redirect(response.addTrailers.authorization_url);
  });
});

app.get("/paystack/callback", (request, response) => {
  const ref = request.query.reference;
  verifyPayment(ref, (error, body) => {
    if (error) {
      //handle errors appropriately
      console.log(error);
      return response.redirect("/error");
    }
    response = JSON.parse(body);

    const data = _.at(response.data, [
      "reference",
      "amount",
      "customer.email",
      "metadata.full_name",
    ]);
    [reference, amount, email, full_name] = data;
    newDonor = { reference, amount, email, full_name };
    const donor = new Donor(newDonor);
    donor
      .save()
      .then((donor) => {
        if (!donor) {
          return response.redirect("/error");
        }
        response.redirect("/receipt/" + donor._id);
      })
      .catch((e) => {
        response.redirect("/error");
      });
  });
});

app.get("/receipt/:id", (request, response) => {
  const id = request.params.id;
  Donor.findById(id)
    .then((donor) => {
      if (!donor) {
        response.redirect("/error");
      }
      response.render("success.pug", { donor });
    })
    .catch((e) => {
      response.redirect("/error");
    });
});

app.get("/error", (request, response) => {
  response.render("error.pug");
});

app.listen(port, () => {
  console.log(`App is Running on port ${port}`);
});
