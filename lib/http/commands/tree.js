var	async = require('async'),
	path = require('path'),
	marked = require('marked');

marked.setOptions({
  langPrefix: 'language-'
});

module.exports = function(req, res, config, next) {
	async.parallel([
		function(cb) {
			config.gitQuery.getLastCommit(config.treePath, function(err, lastCommit) {
				cb(null, lastCommit);
			});
		},
		function(cb) {
			config.gitQuery.getTree(config.treePath, function(err, tree) {
				cb(null, tree);
			});
		},
		function(cb) {
			config.gitQuery.getBlob(path.join(config.treePath, 'README.md'), function(err, blob) {
				if(blob) {
					cb(null, marked(blob.toString()));
				} else if(config.treePath === './') {
					cb(null, false);
				} else {
					cb();
				}
			});
		}
	], function(err, results) {
		var data = { 
				lastcommit: results[0],
				tree: results[1],
				readme: results[2]
			};

		if(data.tree === false) {
			data.tree = [];
			data.emptyRepo = true;
		}

		async.each(data.tree, function(item, cb) {
			config.gitQuery.getLastCommit(item.file, function(err, lastcommit) {
				item.lastcommit = lastcommit;

				cb(err);
			});
		}, function(err){
			res.render('tree', data);
		});
	});
}