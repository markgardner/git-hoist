var	async = require('async'),
	path = require('path');

module.exports = function(req, res, config, next) {
	config.gitQuery.getCommits(config.blobPath, 0, 50, function(err, commits) {
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

		res.render('commits', {
			days: days
		});
	});
}