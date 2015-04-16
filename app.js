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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// route for homepage - SQL query pulls in topic information from topics table and user information from users table
app.get('/', function (req,res){
  db.all("SELECT topic, votes, username FROM topics INNER JOIN users ON topics.user_id = users.user_id;", {}, function(err, posts) {
    fs.readFile('./views/index.html', 'utf8', function(error, html) {
      var rendered = Mustache.render(html, {allPosts: posts});
      res.send(rendered);
    });
  });
});

// users routes
// list all users
app.get('/users', function(req,res) {
  db.all("SELECT * FROM users;", {}, function(err, users){
    fs.readFile('./views/users.html', 'utf8', function(error,html){
      var rendered = Mustache.render(html, {allUsers: users});
      res.send(rendered);
    });
  });
});

// show user's page
app.get('/users/:user_id', function(req,res){
  var id = req.params.user_id;

  // IS THERE A BETTER WAY TO DO THIS ?!?!!?
  db.all("SELECT * FROM users WHERE user_id = '" + id + "';", {}, function(err, userInfo){ // made three sql queries because i needed to run two objects on my mustache template(userPage.html)
    db.all("SELECT * FROM topics WHERE user_id = '" + id + "';", {}, function(err, userTopics){
      db.all("SELECT * FROM comments WHERE user_id = '" + id + "';", {}, function(error, userComments){
        fs.readFile('./views/userPage.html', 'utf8', function(error, html){
          var rendered = Mustache.render(html, {username: userInfo[0].username, posts: userTopics, comments: userComments});
          res.send(rendered);
        });
      });
    });
  });
});

// edit user's page
app.get('/users/:user_id/edit', function(req,res){
  var id = req.params.user_id;
  db.all("SELECT * FROM users WHERE user_id = '" + id + "';", {}, function(err,userInfo){
    fs.readFile('./views/editUser.html', 'utf8', function(error, html){
      console.log(userInfo[0]);
      var rendered = Mustache.render(html, userInfo[0]);
      res.send(rendered);
    });
  });
});

// create user page
app.get('/users/create', function (req,res){
  fs.readFile('./views/create.html', 'utf8', function(err, html){
    res.send(fs.readFileSync('./views/create.html', 'utf8'));
  });
});

// create user post route
app.post('/users', function(req, res){ // takes input from users/create into req.body and inserts into users table within DB
  db.run("INSERT INTO users (username, email) VALUES ('" + req.body.username + "', '" + req.body.email + "');");
  res.send('User created!');
});

// edit user put route
app.put('/users/:user_id', function(req,res){
  var id = req.params.user_id;
  var userInfo = req.body;
  db.run("UPDATE users SET username = '" + userInfo.username + "', email = '" + userInfo.email + "' WHERE user_id = " + id + ";");
  res.redirect('/users/' + id);
});

// delete user route
app.delete('/users/:user_id', function(req,res){
  var id = req.params.user_id;
  db.run("DELETE FROM users WHERE user_id = " + id + ";");
  res.redirect('/users');
});


// topics routes
// individual topic page
app.get('/topics/:topic_id', function(req,res){
  var topic = req.params.topic_id;
  db.all("SELECT topic, votes, username FROM topics inner join users on topics.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, topicInfo) {
    db.all("SELECT comment, topic, username FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, commentsInfo) {

    });
  });
});


// server listening
app.listen(3000, function(){
  console.log('listening');
});