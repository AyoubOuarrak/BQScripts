/*
    Google BiqQuery schema types check
*/

var fs = require('fs')
var jsonFilename = undefined;
var schemaFilename = undefined;
var jsonSample;
var schema;
var arguments = process.argv.slice(2);

if (arguments.length > 0) {
    jsonFilename = arguments[0];
    schemaFilename = arguments[1];

    if (schemaFilename == undefined || jsonFilename == undefined) {
        console.log("Argument missing"); 
        return;
    }
} else {
    console.log("Arguments missing, two arguments needed: [json] [schema]"); 
    return;
}

function readJson(jsonFilename, callback) {
    fs.readFile(jsonFilename, 'utf8', function(err, data) {
      return !err ? callback(data) : callback(undefined);
    });
}  

function readSchema(schemaFilename, callback) {
    fs.readFile(schemaFilename, 'utf8', function(err, data) {
        return !err ? callback(data) : callback(undefined);
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
            var tryDate = new Date(object);
            if (object.length > 18 && !isNaN(tryDate.getTime())) {
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

function subField(type, name, mode) {
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

function traverse(fields, o, schema) {
    for (i in o) {
        var name = i;
        var type = getType(o[i]);

        if (type == 'null') {
            // Skip empty fields.
        }

        else if (type == "Array") {
            var field = traverseArray(name, [], o[i], schema);
            if (field != undefined)
                fields.push(field);
        
        } else if (type == "Object") {
            var field = subField("RECORD", name, undefined);
            field.fields = traverse([], o[i], schema);
            fields.push(field);

        } else {
            if(schema.indexOf(name) == -1)
                console.log('"' + name + '" missing from the schema\n');

            else if(schema[schema.indexOf(name)+1] != type)
                console.log('"' + name + '"  dont match the type in the schema\n' + 
                            '--> schema:' + schema[schema.indexOf(name)+1] +' json:' + type + '\n');

            fields.push(subField(type, name, undefined));
        }
    }
    
    return fields;
}

function traverseArray(name, fields, o, schema) {
    if (o.length > 0) {

        // get just the first element of the array and the type
        var firstElement = o[0];
        var type = getType(firstElement);

        if (type == 'Object') {
            var field = subField("RECORD", name, "REPEATED");
            field.fields = traverse(fields, firstElement, schema);
            return field;

        } else {

            if(schema.indexOf(name) == -1)
                console.log('"' + name + '" missing from the schema\n');

            else if(schema[schema.indexOf(name)+1] != type)
                console.log('"' + name + '"  dont match the type in the schema\n' + 
                            '--> schema:' + schema[schema.indexOf(name)+1] +' json:' + type + '\n');

            var field = subField(type, name, "REPEATED");
            return field;
        }
    } 
    return undefined;
} 

readJson(jsonFilename, function(data) {
    if (data != undefined) {
        jsonSample = JSON.parse(data);
    } else {
        console.log("Unable to read file " + jsonFilename);
        return;
    }
});

readSchema(schemaFilename, function(data) {
    if (data != undefined) {
        schema = data;
        fields = [];
        
        // regex magic to clean the schema and json syntax
        var schema = schema.split(' ').join('')
        schema = schema.replace(/([\[\]{},"])/g, ' ').split("name") + '';
        schema = schema.split("type") + '';
        schema = schema.split("mode") + '';
        schema = schema.split("fields") + '';
        schema = schema.replace(/([,\s])/g, '');
        schema = schema.split(':');
        
        traverse(fields, jsonSample, schema);
    } else {
        console.log("Unable to read file " + schemaFilename);
        return;
    }
});

