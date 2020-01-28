const LocalStrategy = require('passport-local').Strategy;
const pool = require('../db/dbConfig');


module.exports = function(passport) {
    passport.use(
      new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        // Match user
              console.log('email inside  passport:'+email);
              console.log('password inside passport  :'+password);
              pool.query('SELECT sfid,Name,Email,password2__c FROM salesforce.Contact WHERE Email =$1',[email],(error,result)=>{
                    if(error)
                        throw error;
                    console.log('result '+JSON.stringify(result.rows[0].password2__c));
                    console.log('result.rows.length : '+result.rows.length);
                 //   return done(null, {email: 'aim.amit9@gmail.com', name: 'Amit'});
                    let numberOfRecords = result.rows.length;
                  //  console.log('numberOfRecords : '+numberOfRecords);
                  //  console.log('result.rows[0].Password2__c : '+result.rows[0].password2__c);
                  //  console.log('result.rows[0].password2__c : '+result.rows[0].password2__c);
                    if(numberOfRecords == 0)
                    {
                        console.log('I block Email is not registered');
                        return done(null,false,{message:'This email is not registered !'});
                    }
                    else if(numberOfRecords > 0)
                    {
                        console.log('Else block Email is registered');
                        if(result.rows[0].password2__c == password){
                            console.log('Hurrah ! Correct Password .');
                            return done(null, {email: result.rows[0].email, name: result.rows[0].name});
                        }
                        else{
                            console.log('Oh, Alas ! Incorrect Password .');
                            return done(null,false,{message:'Password is incorrect !'})
                        }
                    }
              })
              
      })
    );

    passport.serializeUser(function(user, done) {
    done(null, user);
    });

    passport.deserializeUser(function(user, done) {
      done(null, user);
  });
};
