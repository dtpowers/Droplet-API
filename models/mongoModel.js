// Retrieve
var MongoClient = require('mongodb').MongoClient;

var assert = require('assert');
// Connect to the db
//var "mongodb://localhost:27017/drop"
var mongo_url = 'mongodb://heroku_xmw8jw3w:34djcljgm0e2ri740bq3vtjl2v@ds041536.mlab.com:41536/heroku_xmw8jw3w';
var mongoDB;
MongoClient.connect(mongo_url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected to MongoDB");
  // assign db to global
  mongoDB = db;
});


//

exports.create = function(collection, data, callback) {
  console.log("4. Start insert function in mongoModel");
  // Do an asynchronous insert into the given collection
  mongoDB.collection(collection).insertOne(
    data, // the object to be inserted
    function(err, status) { // callback upon completion
      if (err) doError(err);
      console.log("5. Done with mongo insert operation in mongoModel");
      // use the callback function supplied by the controller to pass
      // back true if successful else false
      var success = (status.result.n == 1 ? true : false);
      callback(success);
      console.log("6. Done with insert operation callback in mongoModel");
    });
  console.log("7. Done with insert function in mongoModel");
}


exports.retrieve = function(collection, query, callback) {

  mongoDB.collection(collection).find(query).toArray(function(err, docs) {
    if (err) doError(err);
    // docs are MongoDB documents, returned as an array of JavaScript objects
    // Use the callback provided by the controller to send back the docs.
    callback(docs);
  });
}

exports.update = function(collection, filter, update, callback) {
  mongoDB
    .collection(collection) // The collection to update
    .updateMany( // Use updateOne to only update 1 document
      filter, // Filter selects which documents to update
      update, // The update operation
      {
        upsert: false
      }, // If document not found, insert one with this update
      // Set upsert false (default) to not do insert
      function(err, status) { // Callback upon error or success
        if (err) doError(err);
        callback('Modified ' + status.modifiedCount +
          ' and added ' + status.upsertedCount + " documents");
      });
}


exports.Mdelete = function(collection, filter, callback) {
  mongoDB
    .collection(collection)
    .deleteOne(
      filter,
      function(err, status) { // Callback upon error or success
        if (err) doError(err);
        callback('Modified ' + status.modifiedCount +
          ' and added ' + status.upsertedCount + " documents");
      });
}



var doError = function(e) {
  console.error("ERROR: " + e);
  throw new Error(e);
}