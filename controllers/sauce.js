const fs = require("fs"); // permet d'accéder au gestionnaire de fichiers ds Node.js (pour image)
const Sauce = require("../models/sauce");

// Créer d'une nouvelle sauce
exports.createSauce = (req, res) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    // On crée un nouvel objet d'après les info soumis par utilisateur
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save() // On enregistre la nouvelle sauce ds la BDD
    .then(() => {
      res.status(201).json({
        message: "Sauce créée avce succès !",
      });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Modifier une sauce
exports.modifySauce = (req, res) => {
  const sauceObject = req.file
    ? {
        //// Si l'image est modifié
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : //// Sinon
      { ...req.body };
  Sauce.updateOne(
    //// On met à jour la sauce ds la BDD
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: "Sauce modifié !" }))
    .catch((error) => res.status(400).json({ error }));
};

// Supprimer une sauce
exports.deleteSauce = (req, res) => {
  Sauce.findOne({ _id: req.params.id }) //// On recherche la sauce
    .then((sauce) => {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        //// On suppripme le fichier image
        Sauce.deleteOne({ _id: req.params.id }) //// callback quand le fichier image est supprimé
          .then(() => res.status(200).json({ message: "Sauce supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

// Afficher une sauce
exports.getOneSauce = (req, res) => {
  Sauce.findOne({
    ////On recherche une sauce avec son Id
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

// Afficher toutes les sauces
exports.getAllSauces = (req, res) => {
  //// On recherche toutes les sauces
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Mettre à jour les like/dislike d'une sauce
exports.updateLikeSauce = (req, res) => {
  switch (req.body.like) {
    case 0: //// Cas où l'utilisateur change son vote
      Sauce.findOne({ _id: req.params.id }) //// on cherche l'id de la sauce
        .then((sauce) => {
          if (sauce.usersLiked.some((user) => user === req.body.userId)) {
            //// L'utilisateur avait liké
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { likes: -1 }, //// on décrémente de 1 les like
                $pull: { usersLiked: req.body.userId }, //// On retire l'id de l'utilisateur ds tableau des usersLiked
              }
            )
              .then(() => {
                res.status(201).json({ message: "Vote modifié !" });
              })
              .catch((error) => {
                res.status(400).json({ error });
              });
          } else if (
            sauce.usersDisliked.some((user) => user === req.body.userId) //// L'utilisateur avait disliké
          ) {
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { dislikes: -1 }, //// on décrémente de 1 les dislike
                $pull: { usersDisliked: req.body.userId }, //// On retire l'id de l'utilisateur ds tableau des usersDisliked
              }
            )
              .then(() => {
                res.status(201).json({ message: "Vote modifié !" });
              })
              .catch((error) => {
                res.status(400).json({ error });
              });
          } else {
            return res
              .status(400)
              .json({ error: "L'utilisateur n'a pas voté pour cette sauce !" });
          }
        });
      break;

    case 1: //// Cas où l'utilisateur aime la sauce
      Sauce.updateOne(
        { _id: req.params.id },
        {
          $inc: { likes: 1 }, //// On incrémente les like de 1
          $push: { usersLiked: req.body.userId }, //// On ajoute l'id de l'utilisateur au tableau des usersLiked
        }
      )
        .then(() => {
          res.status(201).json({ message: "vote enregistré !" });
        })
        .catch((error) => {
          res.status(400).json({ error });
        });
      break;

    case -1: //// Cas où l'utilisateur n'aime pas la sauce
      Sauce.updateOne(
        { _id: req.params.id },
        {
          $inc: { dislikes: 1 }, // On incrémente les dislike de 1
          $push: { usersDisliked: req.body.userId }, // On ajoute l'id de l'utilisateur au tableau des usersDisliked
        }
      )
        .then(() => {
          res.status(201).json({ message: "vote enregistré !" });
        })
        .catch((error) => {
          res.status(400).json({ error });
        });
      break;
    default:
      res.status(400).json({ error }); // On gère les autres cas
  }
};
