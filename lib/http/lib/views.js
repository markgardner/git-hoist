var jade = require('jade'),
	fs = require('fs'),
	path = require('path');

function fillCache(viewPath, cache) {
	// Cache views
	fs.readdir(viewPath, function(err, files) {
		var filename, filePath, fileContent, stats;

		for(var i = 0; i < files.length; i++) {
			filePath = path.join(viewPath, files[i]);
			stats = fs.statSync(filePath);

			if(stats.isDirectory()) {
				fillCache(filePath, cache);
			} else {
				filename = files[i].slice(0, files[i].length - 5);
				fileContent = fs.readFileSync(filePath);

				cache[filename] = jade.compile(fileContent, {
					filename: filePath,
					pretty: true,
					compileDebug: false
				});
			}
		}
	});
}

function production(viewPath, locals) {
	return this.cache[viewPath](locals);
}

function development(viewPath, locals) {
	locals = locals || {};
	locals.pretty = true;
	locals.compileDebug = false;
	
	return jade.renderFile(path.join(this.rootDir, viewPath + '.jade'), locals);
}

module.exports = function(viewPath) {
	this.rootDir = viewPath;
	this.cache = {};

	if(process.env.NODE_ENV === 'production') {
		fillCache(viewPath, this.cache);

		this.getView = production;
	} else {
		this.getView = development;
	}

	return this;
}