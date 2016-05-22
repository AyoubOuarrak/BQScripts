/*
    Flatten a field from a json object
*/
var fs = require('fs')
var filename = 'data.json'
var field;

// read arguments
var arguments = process.argv.slice(2);
if (arguments.length > 0) {
    filename = arguments[0];
    field = arguments[1];
    
    if (filename == undefined || field == undefined) {
        console.log("Argument missing"); 
        return;
    }
} else {
    console.log("Arguments missing, two arguments needed: [json] [field]"); 
    return;
}

// read the json object
function readJson(filename, callback) {
    fs.readFile(filename, 'utf8', function (err,data) {
      if (err) {
        return callback(undefined);
      }
      callback(data);
    });
}   

// flatten the field passed by arguments and save a new valid json file
function validate(json, field) {
    // remove data string globaly
    var validJson = json.replace(/\"/+field+/\":\"{/g, '');

    // remove all \ 
    validJson = validJson.replace(/\\/g, '');

    // remove the }" (data field closure)
    validJson = validJson.replace(/}\"/g, '');

    // in case of "[\" \"]", the replace above will remove the \, causing a invalid json
    // to avoid this, re-add \" just in the case of "["
    validJson = validJson.replace(/\"\[\"/g, '"[\\"');
    validJson = validJson.replace(/\"\]\"/g, '\\"]"');

    fs.writeFile("valid_data.json", validJson, function(err) {
        if(err) {}
        console.log("Data sample saved to valid_data.json");
    }); 
}

readJson(filename, function(data) {
    if (data != undefined) {
        validate(data, field);

    } else {
        console.log("Unable to read file " + filename);
    }
});