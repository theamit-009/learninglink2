module.exports = {
    ensureAuthenticated: (request, response, next)=> {
      if (request.isAuthenticated()) {
        return next();
      }
      request.flash('error_msg', 'Please log in first to proceed further !');
      response.redirect('/users/login');
    }
  };
  