//////questions for monday
// things i should refactor/put into functions or different files
// how to do sub-comments
// how to deploy on port 80


// variable declaration
var express = require('express');
var sqlite3 = require('sqlite3');
var fs = require('fs');
var Mustache = require('mustache');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var marked = require('marked');
var request = require('request');

var db = new sqlite3.Database('./dbforum.db');
var app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(methodOverride('_method'));
app.use('/static', express.static('views'));

// route for homepage - SQL query pulls in topic information from topics table, user information from users table and counts total # of comments for each topic
app.get('/', function(req, res) {
  db.all("SELECT t.topic_id, COUNT(c.comment_id) as numComments, username, location, votes, topic FROM topics t LEFT JOIN comments c ON t.topic_id = c.topic_id LEFT JOIN users u ON t.user_id = u.user_id group by t.topic_id order by votes DESC;", {}, function(err, posts) {
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
  var id = req.params.user_id;

  // made three sql queries because i needed to run two objects on my mustache template (userPage.html)
  db.all("SELECT * FROM users WHERE user_id = '" + id + "';", {}, function(err, userInfo) {
    db.all("SELECT * FROM topics WHERE user_id = '" + id + "';", {}, function(err, userTopics) {
      db.all("SELECT comment, topic, username, commentLocation FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id WHERE comments.user_id = " + id + ";", {}, function(error, userComments) {
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
  request('http://ipinfo.io/json', function(error, response, body){
    var parsed = JSON.parse(body);
    var location = parsed.city + ", " + parsed.region;
    db.all("SELECT user_id FROM users WHERE username = '" + req.body.username + "';", {}, function(err,users){
      var id = users[0].user_id;
      db.run("INSERT INTO topics (topic, body, votes, user_id, location) VALUES ('" + req.body.topic + "', '" + req.body.body + "', 0, " + id + ", '" + location + "');");
      res.redirect('/');
    });
  });
});

// sort by category
app.get('/topics', function(req,res){
  db.all("SELECT t.topic_id, COUNT(c.comment_id) as numComments, username, location, votes, topic, time FROM topics t LEFT JOIN comments c ON t.topic_id = c.topic_id LEFT JOIN users u ON t.user_id = u.user_id group by t.topic_id order by " + req.query.sort + " DESC;", {}, function(err, posts) {
    fs.readFile('./views/index.html', 'utf8', function(error, html) {
      var rendered = Mustache.render(html, {
        allPosts: posts
      });
      res.send(rendered);
    });
  });
});

// upvote topic
app.get('/upvote/:topic_id', function(req,res){
  var topic = req.params.topic_id;
  db.run("UPDATE topics SET votes = votes + 1 WHERE topic_id = " + topic + ";");
  res.redirect('/');
});

// individual topic page
app.get('/topics/:topic_id', function(req, res) {
  var topic = req.params.topic_id;

  db.all("SELECT topic, body, votes, username, topic_id, location, time FROM topics inner join users on topics.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, topicInfo) {
    db.all("SELECT comment, topic, username, commentLocation, commentTime FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, commentsInfo) {
      db.all("SELECT COUNT(comment) AS commentCount FROM comments WHERE topic_id = " + topic + ";", {}, function(err,comments){
        counter = comments[0].commentCount;
        var bodymarked = marked(topicInfo[0].body);

        var htmlComments = commentsInfo.map(function(e) {
          e.comment = marked(e.comment);
          return e;
        });

        fs.readFile('./views/topicPage.html', 'utf8', function(err, html) {
          var rendered = Mustache.render(html, {
            topic: topicInfo[0].topic,
            body: bodymarked,
            time: topicInfo[0].time,
            topicUser: topicInfo[0].username,
            topic_id: topicInfo[0].topic_id,
            location: topicInfo[0].location,
            upvotes: topicInfo[0].votes,
            count: counter,
            comments: htmlComments
          });
          res.send(rendered);
        });
      });
    });
  });
});

// edit topic page
app.get('/topics/:topic_id/edit', function(req,res){
  var topic = req.params.topic_id;
  db.all("SELECT topic, body, votes, username, topic_id, location FROM topics inner join users on topics.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, topicInfo) {
    db.all("SELECT comment, topic, username, comment_id, commentLocation FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id WHERE topics.topic_id = " + topic + ";", {}, function(err, commentsInfo) {
      fs.readFile('./views/editTopic.html', 'utf8', function(err, html) {
        var rendered = Mustache.render(html, {
          topic: topicInfo[0].topic,
          body: topicInfo[0].body,
          location: topicInfo[0].location,
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
  db.run("UPDATE topics SET topic = '" + topicInfo.topic + "', body = '" + topicInfo.body + "', location = '" + topicInfo.location + "' WHERE topic_id = " + id + ";");
  res.redirect('/topics/' + id + '/edit');
});

// delete topic route. **this also deletes all associated comments**.
app.delete('/topics/:topic_id', function(req, res) {
  var id = req.params.topic_id;
  db.run("DELETE FROM topics WHERE topic_id = " + id + ";");
  db.run("DELETE FROM comments WHERE topic_id = " + id + ";");
  res.redirect('/');
});

/////////////////
// comment routes
/////////////////

// comment post route
app.post('/comments', function(req,res){
  request('http://ipinfo.io/json', function(error, response, body){
    var parsed = JSON.parse(body);
    var location = parsed.city + ", " + parsed.region;
    db.all("SELECT user_id FROM users WHERE username = '" + req.body.username + "';", {}, function(err,users){
      var id = users[0].user_id;
      var comment = req.body.comment;
      db.run("INSERT INTO comments (comment, user_id, topic_id, commentLocation) VALUES ('" + comment + "', " + id + " , " + req.body.topic_id + ", '" + location + "');");
      res.redirect('/topics/' + req.body.topic_id);
    });
  });
});

// edit comment put route
app.put('/comments/:comment_id', function(req, res) {
  var id = req.params.comment_id;
  var commentInfo = req.body;
  db.run("UPDATE comments SET comment = '" + commentInfo.comment + "', commentLocation = '" + commentInfo.location + "' WHERE comment_id = " + id + ";");
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