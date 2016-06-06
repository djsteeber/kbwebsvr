/**
 * DataValidator is a module to help with validation of text data.
 * This is used in the server, but could ideally be used in the front end as well, so quicker feedback to the
 * end user is possible.
 * 
 * Lots of todos List them here
 * @type {RegExp[]}
 */
const PHONE_NUMBER_PATTERNS = [
    //US PATTERN - may want to add others
    /^\(?\d{3}\)?[\-\W]?\d{3}\-\d{4}$/
];

const ZIP_CODE_PATTERNS = [
    // untested
  /^[0-9]{5}(\-[0-9]{4})?$/
];

function DataValidator() {
    var self = this;
    
    self.empty = function(value) {
        if ((typeof value === 'undefined') || (value == null) || (value === '')) {
            return true;
        }
        return false;
    };
    
    self.notEmpty =  function (value) {
        return (! self.empty(value));
    };

    self.domain = function(value, ignoreEmptyCheck) {
        if (! ignoreEmptyCheck) {
            if (self.empty(value)) return true;
        }

        return true;  // need to reference RFC for correct format
    };



    /**
     * Simple assumption that an emails has only 1 @ symbol in it.  Need to look at RFC's to force validation
     * @param value
     * @returns {boolean}
     */
    self.email = function (value) {
        if (self.empty(value)) return true;

        var parts = value.split('@');
        if (parts.length != 2) {
            console.log("parts is nto 2");
            return false;
        }
        
        return (self.notEmpty(parts[0]) && self.domain(parts[1], true));
    };


    /**
     * This is the fun one :p
     * @param value
     * @returns {boolean}
     */
    self.phoneNumber = function (value) {
        if (self.empty(value)) return true;
        
        for (var inx in PHONE_NUMBER_PATTERNS) {
            if (PHONE_NUMBER_PATTERNS[inx].test(value)) {
                return true;
            }
        }
        
        return false;
    };


    self.boolean = function (value) {
        return false;
    };
    
    self.string = function (value) {
        if (self.empty(value)) return true;

        return false;
    }
    
    self.number = function(value) {
        if (self.empty(value)) return true;

        return false;
    }

}

module.exports = DataValidator;