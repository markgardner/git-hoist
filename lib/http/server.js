var http = require('http');

exports.start = function(config, users, repos, git) {
	if(!config.port) {
		throw new Error('Port must be specified.')
	}

	http.createServer(function(req, res) {
		console.log(req.method, req.url);

		res.writeHead(404);
		res.end();
	}).listen(config.port, config.hostname);
}