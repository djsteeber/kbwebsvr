var Ajv = require('ajv')

var ajv = new Ajv();

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


var schema = {
    "title": "Example Schema",
    "type": "object",
    "properties": {
        login: {
            type: 'string',
        },
        password: {
            type: 'string',
        },
        name: {
            type: "object",
            "$ref": "#/definitions/personName"
        }
    },
    "required": ["name"],
    definitions: {
        "personName": {
            type: 'object',
            properties: {
                "firstName": {
                    "type": "string"
                },
                "lastName": {
                    "type": "string"
                },
                "fullName": {
                    "description": "Full Name",
                    "type": "string"
                }
            },
            required: ["firstName", "lastName"]
        }
    }
};

var data = {name: {firstName: 'Dale', lastName2: 'Steeber'}};

var validate = ajv.compile(schema);
var valid = validate(data);
if (!valid) console.log(validate.errors);