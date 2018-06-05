var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);



// Routes
// If no matching route is found default to home
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

// If no matching route is found default to home
app.get("/savedarticles", function (req, res) {
  res.sendFile(path.join(__dirname, "./public/savedarticles.html"));
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.nyt.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    
    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });
    
    // If we were able to successfully scrape and save an Article, send a message to the client
    res.status(200);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  console.log("getting all articles");
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
      console.log("/articles sending json");
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/saved", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({saved: true})
    .populate("notes")
    .then(function (dbSaved) {
      
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbSaved);
      console.log(dbSaved);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  console.log("getting json for article " + req.params.id);
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("notes")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      console.log("/articles/:id sending json");
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client

      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/savearticle/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })
    .then( function (dbArticle){
      console.log("updating /articles/:id saving and sending json");
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/unsavearticle/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false })
    .then(function (dbArticle) {
      console.log("updating /articles/:id saving and sending json");
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/savenote/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
    // save the new note that gets posted to the Notes collection
    db.Note.create(req.body)
      .then(function (dbNote) {
        console.log(dbNote._id);
        // If a Note was created successfully, find one Article (there's only one)from the req.params.id and and update it's "note" property with the _id of the new note
        // { new: true } tells the query that we want it to return the updated Article -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        console.log("updating article: " + req.params.id + " with note: " + dbNote._id);
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { notes: dbNote._id } }, { new: true });
      })
      .then(function (dbArticle) {
        console.log("success");
        // If the Article was updated successfully, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        console.log("an error occurred: " + err);
        console.log(err);
        // If an error occurs, send it back to the client
        res.json(err);
      });
    });


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});