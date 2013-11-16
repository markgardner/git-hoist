var fs = require('fs'),
	path = require('path');

module.exports = function(commandPath) {
	var files = fs.readdirSync(commandPath), 
		commands = {},
		filePath, fileName;

	for(var i = 0; i < files.length; i++) {
		fileName = path.basename(files[i], '.js');
		filePath = path.join(commandPath, files[i]);

		commands[fileName] = require(filePath);
	}

	return commands;
}