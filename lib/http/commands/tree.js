var	async = require('async'),
	path = require('path'),
	GitQuery = require('../../git/query');

module.exports = function(req, res, config, next) {
	var gitPath = config.git.dirMap(config.repo),
		gitQuery = new GitQuery(gitPath, config.branch),
		treePath = (config.extraParams.join('/') || '.') + '/',
		treeParentPath = treePath === './' ? '' : path.resolve('/' + treePath, '..');

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
		var data = { 
			lastcommit: results[0],
			tree: results[1],
			parentPath: treeParentPath
		};

		async.each(data.tree, function(item, cb) {
			gitQuery.getLastCommit(item.file, function(err, lastcommit) {
				item.lastcommit = lastcommit;

				cb(err);
			});
		}, function(err){
			res.render('tree', data);
		});
	});
}