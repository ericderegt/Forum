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

//users routes
// list all users
app.get('/users', function(req,res) {
  db.all("SELECT * FROM users;", {}, function(err, users){
    fs.readFile('./views/users.html', 'utf8', function(error,html){
      var rendered = Mustache.render(html, {allUsers: users});
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



// server listening
app.listen(3000, function(){
  console.log('listening');
});