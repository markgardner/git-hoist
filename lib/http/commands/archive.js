var	async = require('async'),
	path = require('path');

module.exports = function(req, res, config, next) {
	res.writeHead(200, {
		'Content-Type': 'application/octet-stream',
		'Content-Disposition': 'attachment; filename="' + config.repo + '.zip"'
	});
	

	config.gitQuery.makeArchive(config.blobPath, res);
}