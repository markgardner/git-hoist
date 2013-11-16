var	async = require('async'),
	path = require('path'),
	mime = require('mime');

module.exports = function(req, res, config, next) {
	config.gitQuery.getBlob(config.blobPath, function(err, blob) {
		if(!err && blob !== undefined) {
			res.writeHead(200, {
				'Content-Type': mime.lookup(config.blobPath)
			});
			res.end(blob);
		} else {
			res.notFound();
		}
	});
}