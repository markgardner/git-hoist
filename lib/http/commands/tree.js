var	async = require('async'),
	path = require('path'),
	marked = require('marked');

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
			if(config.treePath === './') {
				config.gitQuery.getBlob('README.md', function(err, blob) {
					if(blob) {
						cb(null, marked(blob.toString()));
					} else {
						cb();
					}
				});
			} else {
				cb();
			}
		}
	], function(err, results) {
		var trails = {}, 
			data = { 
				lastcommit: results[0],
				tree: results[1],
				readme: results[2],
				trails: trails,
				repo: config.repo
			};

		// Create breadcrumbs
		for(var i = 0, trail = '', len = config.extraParams.length; i < len; i++) {
			trail += '/' + config.extraParams[i];

			trails[trail] = {
				name: config.extraParams[i],
				last: i === (len - 1)
			};
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