var	async = require('async'),
	GitQuery = require('../../git/query');

module.exports = function(req, res, config, next) {
	var repos = config.repos,
		git = config.git,
		keys = Object.keys(config.repos);

	async.map(keys, function(repo, cb) {
		var gitQuery;

		if(req.canRead(repo)) {
			gitQuery = new GitQuery(git.dirMap(repo), 'master');

			gitQuery.getLastCommit('./', function(err, lastCommit) {
				var obj = repos[repo];

				cb(null, {
					name: repo,
					lastCommit: lastCommit,
					title: obj.title || repo,
					description: obj.description,
					website: obj.website,
					owner: obj.owner
				});
			});
		} else {
			cb(null, null);
		}
	}, function(err, results) {
		results = results.filter(function(e) {
			return !!e;
		});

		res.render('list', { repos: results });
	});
}