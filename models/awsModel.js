var bucketName = 'droper';
var bucketRegion = 'us-west-2';
var path = require('path');


var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('secrets/config.json');
// Create S3 service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01'
});
console.log("AWS config succesful");

//upload_test('pictures/fire.jpg');

exports.upload = function(file) {


  // call S3 to retrieve upload file to specified bucket
  var uploadParams = {
    Bucket: bucketName,
    Key: '',
    Body: ''
  };
  var fileStream = fs.createReadStream(file);
  fileStream.on('error', function(err) {
    console.log('File Error', err);
  });
  uploadParams.Body = fileStream;
  uploadParams.Key = path.basename(file);

  // call S3 to retrieve upload file to specified bucket
  s3.upload(uploadParams, function(err, data) {
    if (err) {
      console.log("Error", err);
    }
    if (data) {
      console.log("Upload Success", data.Location);
    }
  });


}

exports.download = function(imageName, res) {

  s3.getObject({
      Bucket: bucketName,
      Key: imageName
    },
    function(error, data) {
      if (error != null) {
        console.log("Failed to retrieve an object: " + error);
      } else {
        console.log("Loaded " + data.ContentLength + " bytes");
        // File is loaded into data,
        //can be written to disk or passed straight to user.
        image = {}
        image.data = data;
        res.send(image);
      }
    }
  );
}

//get_data_from_file('pictures/test1.txt');

function get_data_from_file(location) {
  fs.readFile(location, 'utf8', function(err, data) {
    if (err) {
      return console.log(err);
    }
    image_decode_test(data);


  });


}

function image_decode_test(data) {

  fs.writeFile("pictures/output.txt", data, function(err) {
    console.log("itxt saved!");
  });
  fs.writeFile("pictures/plzwork.jpg", data, 'base64', function(err) {
    console.log("image saved!");
  });



}









/*  old method for AUTH, leftover from uploader lib
exports.get_keys = function() {
  keyFile = fs.readFile('secrets/accessKey.secret', function(err, data) {
    AWSKey = data;
    //console.log("AWS Key is " + data);
    secretsFile = fs.readFile('secrets/secret.secret', function(err, data) {
      AWSSecret = data;
      //console.log("Aws Secret is " + data);
      console.log("AWS auth ready to go");
    });
  });
}
*/