var	async = require('async'),
	GitQuery = require('../../git/query');

module.exports = function(req, res, config, next) {
	var gitPath = config.git.dirMap(config.repo),
		gitQuery = new GitQuery(gitPath, config.branch),
		treePath = (config.extraParams.join('/') || '.') + '/';

	async.parallel([
		function(cb) {
			gitQuery.getLastCommit(treePath, function(err, lastCommit) {
				cb(null, lastCommit);
			});
		},
		function(cb) {
			gitQuery.getTree(treePath, function(err, tree) {
				cb(null, tree);
			});
		}
	], function(err, results) {
		res.render('tree', { 
			lastcommit: results[0],
			tree: results[1]
		});
	});
}