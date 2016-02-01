var password = require('password-hash-and-salt');
var mysecret = process.argv[2];
console.log(mysecret);
 
var myuser = [];
 
// Creating hash and salt 
password(mysecret).hash(function(error, hash) {
    if(error)
        throw new Error('Something went wrong!');
 
    // Store hash (incl. algorithm, iterations, and salt) 
    myuser.hash = hash;

    console.log(myuser.hash);
 
    // Verifying a hash 
    password(mysecret).verifyAgainst(myuser.hash, function(error, verified) {
        if(error)
            throw new Error('Something went wrong!');
        if(!verified) {
            console.log("Don't try! We got you!");
        } else {
            console.log("The secret is...");
        }
    });
})
 
