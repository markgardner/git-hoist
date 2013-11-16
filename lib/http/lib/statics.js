var fs = require('fs'),
	path = require('path'),
	mime = require('mime');

function fillCache(publicPath, cache, rootPath) {
	// Cache views
	fs.readdir(publicPath, function(err, files) {
		var filename, filePath, stats, relativePath;

		for(var i = 0; i < files.length; i++) {
			filePath = path.join(publicPath, files[i]);
			stats = fs.statSync(filePath);

			if(stats.isDirectory()) {
				fillCache(filePath, cache, rootPath);
			} else {
				relativePath = path.relative(rootPath, path.join(publicPath, files[i]));
				
				cache['/' + relativePath] = {
					content: fs.readFileSync(filePath),
					mime: mime.lookup(filePath)
				};
			}
		}
	});
}

function production(filePath) {
	return this.cache[filePath];
}

function development(filePath) {
	filePath = path.join(this.rootDir, filePath);

	if(fs.existsSync(filePath)) {
		return {
			content: fs.readFileSync(filePath),
			mime: mime.lookup(filePath)
		};
	} else {
		return null;
	}
}

function Statics(publicPath) {
	this.rootDir = publicPath;
	this.cache = {};

	if(process.env.NODE_ENV === 'production') {
		fillCache(publicPath, this.cache, publicPath);

		this.getFile = production;
	} else {
		this.getFile = development;
	}
}

module.exports = function(publicPath) {
	return new Statics(publicPath);
}