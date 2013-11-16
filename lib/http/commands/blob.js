var	async = require('async'),
	path = require('path'),
	mime = require('mime');

module.exports = function(req, res, config, next) {
	var isImg = mime.lookup(config.blobPath).indexOf('image/') === 0;

	async.parallel([
		function(cb) {
			config.gitQuery.getLastCommit(config.blobPath, cb);
		},
		function(cb) {
			if(isImg) {
				cb();
			} else {
				config.gitQuery.getBlob(config.blobPath, cb);
			}
		}
	], function(err, results) {
		res.render('blob', { 
			isImg: isImg,
			lastcommit: results[0],
			blob: results[1]
		});
	});
}