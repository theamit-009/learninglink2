var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var expressLayout = require('express-ejs-layouts');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');
dotenv.config();
var session = require('express-session');
var flash = require('connect-flash');
const  passport = require('passport');
require('./config/passport')(passport);


var winston = require('./config/winston');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var timesheetRouter = require('./routes/timesheet');

var app = express();


app.use(session({
  secret :'secret',
  resave : false,
  saveUninitialized : false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((request,response,next)=>{
  response.locals.success_msg = request.flash('success_msg');
  response.locals.error_msg = request.flash('error_msg');
  response.locals.error = request.flash('error');
  next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//using  body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// using express layouts
app.use(expressLayout);

app.use(morgan('combined', { stream: winston.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/timesheet',timesheetRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // line to include winston logging
  winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
