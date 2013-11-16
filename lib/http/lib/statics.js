var fs = require('fs'),
	path = require('path');

module.exports = function(publicPath) {
	var files = fs.readdirSync(publicPath),
		mime = {
			'js': 'text/javascript',
			'css': 'text/css',
			'png': 'image/png'
		}, cache = {}, filepath;

	for(var i = 0; i < files.length; i++) {
		filepath = path.join(publicPath, files[i]);

		cache['/' + files[i]] = {
			content: fs.readFileSync(filepath),
			mime: mime[filepath.slice(filepath.lastIndexOf('.') + 1)] || 'application/octect'
		};
	}

	return cache;
}