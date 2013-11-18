var	async = require('async'),
	path = require('path');

module.exports = function(req, res, config, next) {
	var page = parseInt(req.query.page) || 1;

	async.parallel([
		function(cb) {
			config.gitQuery.getTree(config.blobPath, function(err, tree) {
				cb(err, tree && tree[0] && tree[0].type);
			});
		},
		function(cb) {
			config.gitQuery.getCommits(config.blobPath, (page - 1) * 50, 50, function(err, commits) {
				var dayMilliseconds = 1000 * 60 * 60 * 24,
					months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
					time, day, lastDay = 0, date,
					days = [], items;

				for(var i = 0; i < commits.length; i++) {
					time = commits[i].date.getTime();
					day = time - (time % dayMilliseconds);

					if(day !== lastDay) {
						date = commits[i].date;
						days.push({
							date: months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(),
							commits: (items = [])
						});
						lastDay = day;
					}

					items.push(commits[i]);
				}

				cb(err, days);
			});
		},
		function(cb) {
			config.gitQuery.getCommitCount(config.blobPath, cb);
		}
	], function(err, results) {
		var pages = [], pageCount = Math.ceil(results[2] / 50);

		for(var i = 1; i <= pageCount; i++) {
			pages.push(i);
		}

		res.render('commits', {
			type: results[0],
			days: results[1],
			total: results[2],
			current: page,
			pages: pages,
			url: req.pathname
		});
	});
}