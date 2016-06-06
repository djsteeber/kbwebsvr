var RestSchema = require('./rest-schema');

var user = {
    login: {isString: true, isRequired: true, isUnique: true},
    name: {isObject: personsName},
    email: {isEmail: true, isUnique: true},
    password: {isString: true, isRequired: false, isUnique: false, isPassword: true},
    //TODO:  Need to change this to isArray as there can be multiple
    roles: {isRequired:true, isOneOf: [roles]}, // move these roles to a roles.js file
    member: {isBoolean:true},
    officer: {isBoolean: true},
    board: {isBoolean: true},
    rangeCaptain: {isBoolean:true},
    bartender: {isBoolean: true},
    clubPosition: {isString: true}

};

/* converter functions
TODO find a place to put these functions
 */
function toLower(value) {
    value.lowercase();
}



/* validation functions
TODO find a better place for this
 */
function minSize(size) {
    return function(value) {
        if (value) {
            if (typedef value ==='string') {
                return value.length >= size;
            }
        }
        return false;
    }
}
function maxSize(size) {
    return function(value) {
        if (value) {
            if (typedef value ==='string') {
                return value.length <= size;
            }
        }
        return false;
    }
}

function passwordStrength(level) {
    if (level === 'high') {
        return function (value) {
            return true;
        }
    } else if (level === 'medium') {
        return function (value) {
            return true;
        }
    }
    return function (value) {
        return true;
    }
}


var personsName = new RestSchema(
    {
        
    }
);

/* types are also functions */

function stringType() {
    checkType: function(value) {
        return (typeof value === 'string');
    },
    convert: function(value) {
        return value.toString();
    },
    stringify: function(value) {
        return value.toString();
    }
}
function arrayType(element) {
    var elementType = typeof element;
    
    return function() {
        checkType: function(value) {
            return (typeof value === elementType);
        },
        convert: function(value) {
            //TODO need to create convert function
          return value;  
        },
        stringify: function(value) {
            //TODO need to create stringify function
            return value;
        }
    }
}


//TODO:  put hashing function in here
function passwordType() {
    checkType: function(value) {
        return (typeof value === 'string');
    },
    convert: function(value) {
        return value.toString();
    },
    stringify: function(value) {
        return value.toString();
    }
}

function booleanType() {
    checkType: function(value) {
        return (typeof value === 'string');
    },
    convert: function(value) {
        return value.toString();
    },
    stringify: function(value) {
        return value.toString();
    }
}



//TODO  need to do some research so that the functions can be passed in, instead of strings, and store them
//  in a validation or conversion library
var user = new RestSchema(
    {
        login:      {type: stringType, converters: [toLower], validators: [minSize(8), maxSize(90)]},
        password:   {type: passwordType, converters: [], validators: [passwordStrength('high')]},
        //'name': {type: personsName},
        //roles: {type: array(stringType)}, // move these roles to a roles.js file
        member:     {type: booleanType},
        officer:    {type: booleanType},
        board:      {type: booleanType},
        bartender:  {type: booleanType}
    }  
);

module.exports({user: user});


// some simple test stuff.  Remove when done

var jsonObject = {
    login: 'djsteeber@yahoo.com',
    password: 'here is a weird password phrase',
    member: true,
    board: true,
    officer: false,
    bartender: false

};
user.validateInput(jsonObject);


