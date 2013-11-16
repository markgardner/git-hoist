var	async = require('async'),
	path = require('path');

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
		}
	], function(err, results) {
		var data = { 
			lastcommit: results[0],
			tree: results[1]
		};

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