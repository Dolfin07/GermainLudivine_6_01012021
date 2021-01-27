require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Bloque les tentatives de connexion après 100 essais pdt 15 minutes (attaque force brute)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Importer les routes sauces et utilisateurs
const sauceRoutes = require("./routes/sauce");
const userRoutes = require("./routes/user");

const User = require("./models/User");

//Connexion à la bdd MongoDB
mongoose
  .connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

const app = express();

// Helmet aide à sécuriser les applications Express en définissant divers en-têtes HTTP.
app.use(helmet());

app.use(limiter);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

//Gestion du format texte
app.use(bodyParser.json());

//Gestion du format image
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/sauces", sauceRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;
