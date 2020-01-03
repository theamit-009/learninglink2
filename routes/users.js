var express = require('express');
var router = express.Router();
const pool = require('../db/dbConfig');
var passport = require('passport');
const ensureAuthenticated = require('../config/auth');
const jsforce = require('jsforce');
const jpegExif = require('jpeg-exif');
const exif = require('exif-parser')
const Request = require("request");
const fs= require('fs');



var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_ID, 
  api_secret: process.env.API_SECRET
}); 



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



router.get('/login',(request,response)=>{
  response.render('login');
})

router.get('/loginTopM',(request,response)=>{
  response.render('loginTopM');
});

router.post('/login',passport.authenticate('local', {
  successRedirect: '/users/dashboard',
  failureRedirect: '/users/login',
  failureFlash: true
}),(request,response)=>{
  const {email,password} = request.body;
  console.log('email : '+email+' passoword '+password);
  let errors = [];

  if (!email || !password) {
    errors.push({ msg: 'Please enter all fields' });
  }
  
  pool.query('SELECT Id,Name FROM salesforce.Contact',(error,result)=>{
    if(error){
      console.log('error');
    }
    console.log('Result Records '+JSON.stringify(result.rows));
  }) 

  if(errors.length >0 ){
    response.render('login',{errors})
  }
  else{
    //response.send('authentication is under process');
    request.flash('success_msg','Hello You are in dashboard !');
    response.redirect('/users/dashboard');
  }
  
}) 

router.post('/loginTopM',(request,response)=>{
  const {email,password} = request.body;
  console.log('Salesforce User Details');
  console.log('Username : '+email+' Password : '+password);
  const conn = new jsforce.Connection({
    loginUrl : 'https://test.salesforce.com'
  });

  conn.login(email, password + process.env.SECURITY_TOKEN, function(err, userInfo) 
  {
    if (err) { 
        return console.error(err);
    }

    console.log('Authenticated With User Id:  '+userInfo.orgId);
    conn.query("SELECT Id, Name FROM Account", function(err, result) {
      if (err) { return console.error(err); }
      console.log("total : " + result.totalSize);
      console.log("fetched : " + result.records.length);
      console.log("done ? : " + result.done);
      if (!result.done) {
        // you can use the locator to fetch next records set.
        // Connection#queryMore()
        console.log("next records URL : " + result.nextRecordsUrl);
      }
    });
    
  });
  
})

router.get('/dashboard',(request,response)=>{
  if(request.isAuthenticated()){
    var name = request.user.name;
    var email = request.user.email;
    console.log('name in dashboard'+name);
    console.log('email in dashboard'+email);
    response.render('dashboard',{name:name,email:email});
  }
  else
  {
    request.flash('error_msg', 'Please log in first to proceed further !');
    response.redirect('/users/login');
  }
  
});

router.get('/forgotpassword',(request,response)=>{
  var verifyDiv = false;
  var sendOtpDiv = true;
  response.render('forgotpassword');
});

router.get('/getemailforotp',(request,response)=>{
  var email = request.body.email;
  var verifyDiv = true;
  var sendOtpDiv = false;
  response.render('forgotpassword');
});

router.get('/logout', (request, response) => {
  request.logout();
  request.flash('success_msg', 'You are logged out');
  response.redirect('/users/login');
});




router.get('/timesheet',function(request,response){
  if(request.isAuthenticated()){
    
    response.render('timesheet');
  }
  else
  {
    request.flash('error_msg', 'Please log in first to proceed further !');
    response.redirect('/users/login');
  }
  
});

router.post('/timesheet',upload.single('profile'), async(req,res)=>{

  console.log('File Info '+req.file+' Size'+req.file.size);

  var buffer = fs.readFileSync(req.file.path);
  const parser = exif.create(buffer)
  const exifResult = parser.parse()
  
  console.log('Exif Data'+JSON.stringify(exifResult, null, 2));
  console.log('Model '+exifResult.tags.Model);
  var latitude = exifResult.tags.GPSLatitude;
  var longitude = exifResult.tags.GPSLongitude;
  console.log('GPS lattitude '+exifResult.tags.GPSLatitude);
  console.log('GPS longitude '+exifResult.tags.GPSLongitude);
  console.log('DateTimeOriginal : '+exifResult.tags.DateTimeOriginal);
  //var dateformatted = datetime.strptime(exifResult.tags.DateTimeOriginal, 'DD : MM : YY HH:MM:SS');
 // console.log('dateformatted '+dateformatted);
  var jpegParsedData = jpegExif.parseSync(req.file.path);
  var apiResponse = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=40.780&longitude=-73.967&localityLanguage=en';
 
 var api="https://us1.locationiq.com/v1/reverse.php?key=46568f29e6783a&lat="+latitude+"&lon="+longitude+"&format=json";
 var nomiAPI ="https://nominatim.openstreetmap.org/reverse?format=json&lat="+latitude+"&lon="+longitude+"&zoom=18&addressdetails=1";
 var newAPI = "https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?prox=26.463075444444442%2C80.29341877777777%2C250&mode=retrieveAddresses&maxresults=1&gen=9&app_id=devportal-demo-20180625&app_code=9v2BkviRwi9Ot26kp2IysQ";
 var questAPI = "http://open.mapquestapi.com/geocoding/v1/reverse?key=KEY&location="+latitude+","+longitude+"&includeRoadMetadata=true&includeNearestIntersection=true";
  Request.get(questAPI, (error, response, body) => {
      if(error) {
          return console.dir(error);
      }
      console.dir('API Response  : '+JSON.stringify(body,null,2));
  });
  const result = await cloudinary.v2.uploader.upload(req.file.path)
  //res.send(result);

  res.render('uploadResult',{result : result, lat : exifResult.tags.GPSLatitude, long : exifResult.tags.GPSLongitude })

});


module.exports = router;
