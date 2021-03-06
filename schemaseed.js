var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./dbforum.db');

// schema
db.serialize(function(){
  db.run("CREATE TABLE users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR, email VARCHAR);");
  db.run("CREATE TABLE topics (topic_id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT, body TEXT, votes INTEGER, user_id INTEGER, location VARCHAR, time DATETIME DEFAULT (DATETIME('now','localtime')), FOREIGN KEY (user_id) REFERENCES users(user_id));");
  db.run("CREATE TABLE comments (comment_id INTEGER PRIMARY KEY AUTOINCREMENT, comment TEXT, user_id INTEGER, topic_id INTEGER, commentLocation VARCHAR, commentTime DATETIME DEFAULT (DATETIME('now','localtime')), FOREIGN KEY (user_id) REFERENCES users(user_id), FOREIGN KEY (topic_id) REFERENCES topics(topic_id));");
});

// seed users
db.run("INSERT INTO users (username, email) VALUES ('eric', 'eric@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('gabby', 'gabby@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('john', 'john@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('fritz', 'fritz@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('simmy', 'simmy@gmail.com');");

// seed topics
db.run("INSERT INTO topics (topic, body, votes, user_id, location) VALUES ('First topic test', 'Test body', 0, 1, 'New York, NY');");
db.run("INSERT INTO topics (topic, body, votes, user_id, location) VALUES ('Forums are awesome', 'Hello', 0, 2, 'New York, NY');");
db.run("INSERT INTO topics (topic, body, votes, user_id, location) VALUES ('Seed seed seed', 'Heres some body', 0, 1, 'New York, NY');");
db.run("INSERT INTO topics (topic, body, votes, user_id, location) VALUES ('Fridge check', 'Beer', 0, 3, 'New York, NY');");
db.run("INSERT INTO topics (topic, body, votes, user_id, location) VALUES ('Do what you love', 'Huh?', 0, 2, 'New York, NY');");

// seed comments
db.run("INSERT INTO comments (comment, user_id, topic_id, commentLocation) VALUES ('This forum sucks so far', 2, 1, 'New York, NY');");
db.run("INSERT INTO comments (comment, user_id, topic_id, commentLocation) VALUES ('Heady topper', 1, 2, 'New York, NY');");
db.run("INSERT INTO comments (comment, user_id, topic_id, commentLocation) VALUES ('Fridge is empty', 4, 3, 'New York, NY');");

// inner join test
// db.all("SELECT comment, topic, votes, username FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id;")

// left join group by
// select t.topic_id, count(c.comment_id), username, location, votes from topics t left join comments c on t.topic_id = c.topic_id left join users u on t.user_id = u.user_id group by t.topic_id;

// seconds since a post
// select strftime('%s','now') - strftime('%s',commentTime) from comments;

// SELECT t.topic_id, COUNT(c.comment_id) as numComments, STRFTIME('%s','now') - STRFTIME('%s',time) as seconds, username, location, votes, topic FROM topics t LEFT JOIN comments c ON t.topic_id = c.topic_id LEFT JOIN users u ON t.user_id = u.user_id group by t.topic_id order by votes DESC;