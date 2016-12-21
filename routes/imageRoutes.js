// include my model for this application
var mongoModel = require("../models/mongoModel.js");
var AWSModel = require("../models/awsModel.js");
var fs = require('fs');
var multer = require('multer');
var upload = multer({
  dest: 'secrets/'
});



//To get around mongo issues raised at the last minutes, image objects are being stored in memory.
//in scale this would all be done with mongo, and we had that 99% working, 
//but our time was better spent on the UI than troubleshooting this mongo issue
var photoBank = [];
//initPhotoBank();

var userFavs = [];



//test data
function initPhotoBank() {
  carl = {};
  carl.filename = 'https://s3-us-west-2.amazonaws.com/droper/' + "banks1" + ".jpg";
  carl.latitude = "0.0";
  carl.longitude = "0.0";
  carl.device = "1";
  carl.caption = "";
  photoBank.push(carl);
  carl1 = {};
  carl1.latitude = "0.0";
  carl1.longitude = "0.0";
  carl1.device = "1";
  carl1.caption = "";
  carl1.filename = 'https://s3-us-west-2.amazonaws.com/droper/' + "banks2" + ".jpg";
  photoBank.push(carl1);
  carl2 = {};
  carl2.latitude = "0.0";
  carl2.longitude = "0.0";
  carl2.device = "1";
  carl2.caption = "";
  carl2.filename = 'https://s3-us-west-2.amazonaws.com/droper/' + "banks3" + ".jpeg";
  photoBank.push(carl2);
}

// Define the routes for this controller
exports.init = function(app) {
  app.get('/api/db/:collection', doRetrieve); // CRUD Retrieve

  app.post('/apiv1/upload', upload.single('photo'), getImage);

  app.post('/apiDroid/upload', upload.single('uploaded_file'), getImageDroid);

  app.get('/apiv1/local_feed', returnFeed);

  app.get('/', home);

  app.get('/apiv1/collection', collection);

  app.post('/apiv1/favorites', upload.any(), favorites);

}

home = function(req, res) {
  res.send("The app is working in deploy! ON BRANCH DEPLOY");
}

favorites = function(req, res) {
  //if user is already in memory, update
  device = req.body.device;
  imageObject = {};
  imageObject.latitude = req.body.latitude;
  imageObject.longitude = req.body.longitude;
  imageObject.device = req.body.device;
  imageObject.caption = req.body.caption;
  imageObject.filename = req.body.url;
  imageObject.favorite = req.body.favorite;
  found = false;
  for (var i = userFavs.length - 1; i >= 0; i--) {
    if (userFavs[i].device != null && userFavs[i].device == device) {
      found = true;
      duplicate = false;
      duplicateIndex = 0;
      for (var j = userFavs[i].images.length - 1; j >= 0; j--) {
        if (userFavs[i].images[j].filename == imageObject.filename) {
          duplicate = true;
          duplicateIndex = j;
        }
      }
      if (duplicate) {
        userFavs[i].images.splice(duplicateIndex, 1);
        res.send("removed favorite");
      } else {
        userFavs[i].images.push(imageObject);
        res.send('ayyy you got it');
      }
    }
  }
  if (!found) {
    user = {};
    user.device = device;
    user.images = [];
    user.images.push(imageObject);
    userFavs.push(user);
    res.send('Thats your first favorite!');
  }
  console.log("user favs", userFavs);
}

collection = function(req, res) {
  //console.log("device is", req.param("device"));
  found = false;
  for (var i = userFavs.length - 1; i >= 0; i--) {

    if (userFavs[i].device == req.param("device")) {
      responseObj = {};
      responseObj.images = userFavs[i].images;
      res.send(responseObj);
      found = true;
    }
  }
  if (!found) {
    res.send({});
  }
}

getImageDroid = function(req, res) {
  console.log(req.body);
  res.send("oh wow max");


}

getImage = function(req, res) {
  imageObject = {};
  b64string = req.body.imageData;
  imageObject.latitude = req.body.latitude;
  imageObject.longitude = req.body.longitude;
  imageObject.device = req.body.deviceID;
  imageObject.caption = req.body.caption;
  imageObject.favorite = req.body.favorite;
  filename = Date.now() + imageObject.longitude;
  imageObject.filename = filename + ".jpg";
  console.log("storing image from deivce" + imageObject.device);
  fs.writeFile("pictures/" + imageObject.filename, new Buffer(b64string, "base64"), function(err) {
    AWSModel.upload("pictures/" + imageObject.filename);
    console.log("image saved!");
    res.send('https://s3-us-west-2.amazonaws.com/droper/' + filename + ".jpg");
    //clean up, remove file form local storage so its only on aws
    fs.unlink("pictures/" + imageObject.filename);
    // console.log(imageObject);
    imageObject.filename = 'https://s3-us-west-2.amazonaws.com/droper/' + filename + ".jpg";
    photoBank.push(imageObject);
  });

  //do mongo stuff here
  // mongoModel.create("images", imageObject);

}


//return last 6 images uploaded
returnFeed = function(req, res) {
  responseObj = {};
  if (photoBank.length > 6) {
    responseObj.images = photoBank.slice(photoBank.length - 6, photoBank.length);
  } else {
    responseObj.images = photoBank;
  }
  console.log(responseObj);
  res.send(responseObj);
  //no need to actually download file, just do it client side. Send client public URL to image
  //AWSModel.download(photoBank[0], res);
}


doCreate = function(req, res) {

  console.log("1. Starting doCreate in dbRoutes");

  if (Object.keys(req.body).length == 0) {
    res.send(false);
    return;
  }



  mongoModel.create(req.params.collection,
    req.body,
    function(result) {
      res.send(result);


      console.log("2. Done with callback in dbRoutes create");
    });
  console.log("3. Done with doCreate in dbRoutes");
}



doRetrieve = function(req, res) {

  mongoModel.retrieve(
    req.params.collection,
    req.query,
    function(modelData) {
      res.send(modelData);
    });
}

doUpdate = function(req, res) {
  // if there is no filter to select documents to update, select all documents
  var filter = req.body.find ? JSON.parse(req.body.find) : {};
  // if there no update operation defined, render an error page.
  if (!req.body.update) {
    res.render('message', {
      title: 'Mongo Demo',
      obj: "No update operation defined"
    });
    return;
  }
  var update = JSON.parse(req.body.update);

  mongoModel.update(req.params.collection, filter, update,
    function(status) {
      res.send(status);
    });
}


doDelete = function(req, res) {
  // if there is no filter to select documents to update, select all documents
  var filter = req.body.find ? JSON.parse(req.body.find) : {};


  mongoModel.Mdelete(req.params.collection, filter,
    function(status) {
      res.render('message', {
        title: 'Mongo Demo',
        obj: status
      });
    });
}