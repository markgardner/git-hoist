var	async = require('async'),
	path = require('path'),
	mime = require('mime'),
	marked = require('marked');

marked.setOptions({
  langPrefix: 'language-'
});

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
		var extension = path.extname(config.blobPath).slice(1),
			isMarked = extension === 'md',
			blob = isMarked ? marked(results[1].toString()) : results[1];

		res.render('blob', { 
			isImg: isImg,
			lastcommit: results[0],
			blob: blob,
			extension: extension,
			isMarked: isMarked
		});
	});
}