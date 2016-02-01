var assert = require("assert");
//var should = require("should");
var jsc = require("../json-schema-convertor");

var convertor = new jsc();

describe ('json-schema-validator', function() {
    describe('#convert()', function () {
        var schema = {date: {isDate: true}};
        var data = {date: '2016-01-01'};

        var newData = convertor.convert(data, schema);

        console.log(JSON.stringify(newData));

    });
});