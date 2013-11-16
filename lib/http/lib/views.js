var jade = require('jade'),
	fs = require('fs'),
	path = require('path');

function fillCache(viewPath, viewCache) {
	// Cache views
	fs.readdir(viewPath, function(err, files) {
		var filename, filePath, fileContent;

		for(var i = 0; i < files.length; i++) {
			filename = files[i].slice(0, files[i].length - 5);
			filePath = path.join(viewPath, files[i]);
			fileContent = fs.readFileSync(filePath);

			viewCache[filename] = jade.compile(fileContent, {
				filename: filePath,
				pretty: true,
				compileDebug: false
			});
		}
	});
}

function productionGetView(viewPath, locals) {
	return this.viewCache[viewPath](locals);
}

function developmentGetView(viewPath, locals) {
	return jade.renderFile(path.join(this.rootDir, viewPath + '.jade'), locals);
}

module.exports = function(viewPath) {
	this.rootDir = viewPath;
	this.viewCache = {};

	if(process.env.NODE_ENV === 'production') {
		fillCache(viewPath, this.viewCache);

		this.getView = productionGetView;
	} else {
		this.getView = developmentGetView;
	}

	return this;
}