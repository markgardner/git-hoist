module.exports = function(req, res, config, next) {
	config.gitQuery.getDiff(function(err, diff) {
		res.render('commit', diff);
	});
}