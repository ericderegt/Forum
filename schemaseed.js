var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./dbforum.db');

// schema
// db.run("CREATE TABLE users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR, email VARCHAR);");
// db.run("CREATE TABLE topics (topic_id INTEGER PRIMARY KEY AUTOINCREMENT, topic VARCHAR, votes INTEGER, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(user_id));");
// db.run("CREATE TABLE comments (comment_id INTEGER PRIMARY KEY AUTOINCREMENT, comment TEXT, user_id INTEGER, topic_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(user_id), FOREIGN KEY (topic_id) REFERENCES topics(topic_id));");

// seed users
db.run("INSERT INTO users (username, email) VALUES ('eric', 'eric@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('gabby', 'gabby@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('john', 'john@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('fritz', 'fritz@gmail.com');");
db.run("INSERT INTO users (username, email) VALUES ('simmy', 'simmy@gmail.com');");

// seed topics
db.run("INSERT INTO topics (topic, votes, user_id) VALUES ('First topic test', 0, 1);");
db.run("INSERT INTO topics (topic, votes, user_id) VALUES ('Forums are awesome', 0, 2);");
db.run("INSERT INTO topics (topic, votes, user_id) VALUES ('Seed seed seed', 0, 1);");
db.run("INSERT INTO topics (topic, votes, user_id) VALUES ('Fridge check', 0, 3);");
db.run("INSERT INTO topics (topic, votes, user_id) VALUES ('Do what you love', 0, 2);");

// seed comments
db.run("INSERT INTO comments (comment, user_id, topic_id) VALUES ('This forum sucks so far', 2, 1);");
db.run("INSERT INTO comments (comment, user_id, topic_id) VALUES ('Heady topper', 1, 2);");
db.run("INSERT INTO comments (comment, user_id, topic_id) VALUES ('Fridge is empty', 4, 3);");

// inner join test
// db.all("SELECT comment, topic, votes, username FROM comments inner join topics on comments.topic_id = topics.topic_id inner join users on comments.user_id = users.user_id;")

