const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user")
      .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        req.body.forEach((fav) => {
          if (!favorite.campsites.includes(fav._id)) {
            favorite.campsites.push(fav._id);
          }
        });
        favorite.save().then((favorite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        });
      } else {
        Favorite.create({ user: req.user._id, campsites: req.body })
          .then((favorite) => {
            console.log("Favorite Created ", favorite);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
          .catch((err) => next(err));
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((response) => {
        res.statusCode = 200;
        if (response) {
          res.setHeader("Content-Type", "application/json");
          res.json(response);
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("You do not have any favorites to delete.");
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end("Operation is not supported");
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        if (!favorite.campsites.includes(req.params.campsiteId)) {
          favorite.campsites.push(req.params.campsiteId);
          favorite.save().then((favorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          });
        } else {
          res.statusCode = 200;
          res.end("That campsite is already in the list of favorites!");
        }
      } else {
        Favorite.create({
          user: req.user._id,
          campsites: [req.params.campsiteId],
        }).then((favorite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        });
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end("Operation is not supported");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((response) => {
        if (response) {
          response.campsites = response.campsites.filter(
            (campsite) => campsite.toString() != req.params.campsiteId
          );
          response.save().then((response) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(response);
          });
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("No favorites to delete.");
        }
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
