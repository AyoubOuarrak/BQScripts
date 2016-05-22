/*
    Google BiqQuery schema generator from a JSON object
    References: https://gist.github.com/oyvindholmstad

    how to run: node bq_schema_gen.js file.json
*/

var fs = require('fs')

// read the json file
function readJson(filename, callback) {
    fs.readFile(filename, 'utf8', function (err,data) {
      if (err) {
        return callback(undefined);
      }
      callback(data);
    });
}   

// write the json file
function writeJsonSchema(data) {
    fs.writeFile("schema.json", data, function(err) {
        if(err) {}
        console.log("Schema saved to schema.json");
    });     
}

function isObject(obj) { return obj.constructor === {}.constructor }
function isString(obj) { return obj.constructor === "test".constructor }
function isArray(obj) { return obj.constructor === [].constructor }
function isNumber(obj) { return !(!(obj <= 0) && !(obj > 0)) }
function isBoolean(obj) { return typeof(obj) == "boolean" } 
    
function getType(object) {
    if (object === null) {
        return "STRING";

    } else if (object === undefined) {
        return "undefined";

    } else if (isString(object)) {
        try {
            var tryDate = new Date(object).getDate();
            if (object.length > 18 && !(!(tryDate <= 0) && !(tryDate > 0))) {
                return "TIMESTAMP";

            } else {
                return "STRING";
            }
        }
        catch(err) {
            return "STRING";
        }

    } else if (isArray(object)) {
        return "Array";

    } else if (isObject(object)) {
        return "Object";

    } else if (isNumber(object)) {
        // the float 4.0 is automatically converted in 4 by  toString()
        if (object.toString().indexOf('.') > 0 && object.toString().indexOf(',') > 0) {
            return "FLOAT";

        } else {
            return "INTEGER";
        }       

    } else if (isBoolean(object)) {
        return "BOOLEAN";   

    } else {
        return undefined;
    }
}

function createField(type, name, mode) {
    if (mode) {
        return {
            name: name,
            type: type,
            mode: mode
        };      
    }
    
    return {
        name: name,
        type: type
    };
}

function traverse(fields, o) {
    for (i in o) {
        var name = i;
        var type = getType(o[i]);
        
        if (type == 'null') {
            // Skip empty fields.
        }

        else if (type == "Array") {
            var field = traverseArray(name, [], o[i]);
            if (field != undefined)
                fields.push(field);
        
        } else if (type == "Object") {
            var field = createField("RECORD", name, undefined);
            field.fields = traverse([], o[i]);
            fields.push(field);

        } else {
            fields.push(createField(type, name, undefined));
        }
    }
    
    return fields;
}

function traverseArray(name, fields, o) {
    if (o.length > 0) {

        // get just the first element of the array and the type
        var firstElement = o[0];
        var type = getType(firstElement);
        
        if (type == 'Object') {
            var field = createField("RECORD", name, "REPEATED");
            field.fields = traverse(fields, firstElement);
            return field;

        } else {
            // If the array only has native types, we only created a simple repeated field
            var field = createField(type, name, "REPEATED");
            return field;
        }
    } 
    return undefined;
} 

var filename = 'data.json'
var arguments = process.argv.slice(2);
if (arguments.length > 0) {
    filename = arguments[0];

} else {
    console.log("Arguments missing"); 
    return;
}

readJson(filename, function(data) {
    if (data != undefined) {
        data = JSON.parse(data);
        fields = [];
        traverse(fields, data);
        writeJsonSchema(JSON.stringify(fields, null, 3));

    } else {
        console.log("Unable to read file " + filename);
    }
});


