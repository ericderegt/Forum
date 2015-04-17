// variable declaration
var express = require('express');
var sqlite3 = require('sqlite3');
var fs = require('fs');
var Mustache = require('mustache');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var db = new sqlite3.Database('./dbforum.db');
var app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(methodOverride('_method'));

// route for homepage - SQL query pulls in topic information from topics table and user information from users table
app.get('/', function(req, res) {
  db.all("SELECT topic, votes, username, topic_id FROM topics INNER JOIN users ON topics.user_id = users.user_id;", {}, function(err, posts) {
    fs.readFile('./views/index.html', 'utf8', function(error, html) {
      var rendered = Mustache.render(html, {
        allPosts: posts
      });
      res.send(rendered);
    });
  });
});

///////////////
// users routes
///////////////

// list all users
app.get('/users', function(req, res) {
  db.all("SELECT * FROM users;", {}, function(err, users) {
    fs.readFile('./views/users.html', 'utf8', function(error, html) {
      var rendered = Mustache.render(html, {
        allUsers: users
      });
      res.send(rendered);
    });
  });
});

// create user page
app.get('/users/new', function(req, res) {
    res.send(fs.readFileSync('./views/create.html', 'utf8'));
});

// show user's page
app.get('/users/:user_id', function(req, res) {
  console.log("problem route is being hit")
  var id = req.params.user_id;

  // IS THERE A BETTER WAY TO DO THIS ?!?!!?
  // made three sql queries because i needed to run two objects on my mustache template (userPage.html)
  db.all("SELECT * FROM users WHERE user_id = '" + id + "';", {}, function(err, userInfo) {
    db.all("SELECT * FROM topics WHERE user_id = '" + id + "';", {}, function(err, userTopics) {
      db.all("SELECT * FROM comments WHERE user_id = '" + id + "';", {}, function(error, userComments) {
        fs.readFile('./views/userPage.html', 'utf8', function(error, html) {
          var rendered = Mustache.render(html, {
            "username": userInfo[0].username,
            posts: userTopics,
            comments: userComments
          });
          res.send(rendered);
        });
      });
    });
  });
});

// edit user's page
app.get('/users/:user_id/edit', function(req, res) {
  var id = req.params.user_id;
  db.all("SELECT * FROM users WHERE user_id = '" + id + "';", {}, function(err, userInfo) {
    fs.readFile('./views/editUser.html', 'utf8', function(error, html) {
      var rendered = Mustache.render(html, userInfo[0]);
      res.send(rendered);
    });
  });
});

// create user post route
app.post('/users', function(req, res) { // takes input from users/create into req.body and inserts into users table within DB
  db.run("INSERT INTO users (username, email) VALUES ('" + req.body.username + "', '" + req.body.email + "');");
  res.redirect('/users');
});

// edit user put route
app.put('/users/:user_id', function(req, res) {
  var id = req.params.user_id;
  var userInfo = req.body;
  db.run("UPDATE users SET username = '" + userInfo.username + "', email = '" + userInfo.email + "' WHERE user_id = " + id + ";");
  res.redirect('/users/' + id);
});

// delete user route
app.delete('/users/:user_id', function(req, res) {
  var id = req.params.user_id;
  db.run("DELETE FROM users WHERE user_id = " + id + ";");
  res.redirect('/users');
});


////////////////
// topics routes
////////////////

// create new topic page
app.get('/topics/new', function(req,res){
  res.send(fs.readFileSync('./views/newTopic.html','utf8'));
});

// new topic post route
app.post('/topics', function(req,res){
  db.all("SELECT user_id FROM users WHERE username = '" + req.body.username + "';", {}, function(err,users){
    var id = users[0].user_id;
    db.run("INSERT INTO topics (topic, votes, user_id) VALUES ('" + req.body.topic + "', 0, " + id + ");");
    res.redirect('/');
  });
});

// individual topic page
app.get('/topics/:topic_id', function(req, res) {
  var topic = req.params.topic_id;
  db.all("SELECT topic, votes, username, topic_id FROM topics inner join users on topics.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, topicInfo) {
    db.all("SELECT comment, topic, username FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, commentsInfo) {
      fs.readFile('./views/topicPage.html', 'utf8', function(err, html) {
        var rendered = Mustache.render(html, {
          topic: topicInfo[0].topic,
          topicUser: topicInfo[0].username,
          topic_id: topicInfo[0].topic_id,
          upvotes: topicInfo[0].votes,
          comments: commentsInfo
        });
        res.send(rendered);
      });
    });
  });
});

// edit topic page
app.get('/topics/:topic_id/edit', function(req,res){
  var topic = req.params.topic_id;
  db.all("SELECT topic, votes, username, topic_id FROM topics inner join users on topics.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, topicInfo) {
    db.all("SELECT comment, topic, username, comment_id FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, commentsInfo) {
      fs.readFile('./views/editTopic.html', 'utf8', function(err, html) {
        var rendered = Mustache.render(html, {
          topic: topicInfo[0].topic,
          topicUser: topicInfo[0].username,
          topic_id: topicInfo[0].topic_id,
          comments: commentsInfo
        });
        res.send(rendered);
      });
    });
  });
});

// edit topic put route
app.put('/topics/:topic_id', function(req, res) {
  var id = req.params.topic_id;
  var topicInfo = req.body;
  db.run("UPDATE topics SET topic = '" + topicInfo.topic + "' WHERE topic_id = " + id + ";");
  res.redirect('/topics/' + id + '/edit');
});

// delete topic route. **this also deletes all associated comments**.
app.delete('/topics/:topic_id', function(req, res) {
  var id = req.params.topic_id;
  db.run("DELETE FROM topics WHERE topic_id = " + id + ";");
  db.run("DELETE FROM comments WHERE topic_id = " + id + ";");
  res.redirect('/');
});

// comment post route
app.post('/comments', function(req,res){
  db.all("SELECT user_id FROM users WHERE username = '" + req.body.username + "';", {}, function(err,users){
    var id = users[0].user_id;
    db.run("INSERT INTO comments (comment, user_id, topic_id) VALUES ('" + req.body.comment + "', " + id + " , " + req.body.topic_id + ");");
    res.redirect('/topics/' + req.body.topic_id);
  });
});

// edit comment put route
app.put('/comments/:comment_id', function(req, res) {
  var id = req.params.comment_id;
  var commentInfo = req.body;
  db.run("UPDATE comments SET comment = '" + commentInfo.comment + "' WHERE comment_id = " + id + ";");
  res.redirect('/topics/' + id + '/edit');
});

// delete comment route
app.delete('/comments/:comment_id', function(req, res) {
  var id = req.params.comment_id;
  db.run("DELETE FROM comments WHERE comment_id = " + id + ";");
  res.redirect('/topics/' + req.body.topic_id);
});


// server listening
app.listen(3000, function() {
  console.log('listening');
});