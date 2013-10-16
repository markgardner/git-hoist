var http = require('http');

exports.start = function(config, users, repos, git) {
	if(!config.port) {
		throw new Error('Port must be specified.')
	}

	http.createServer(function(req, res) {
		if(users.authorizeHttp(req, res, repos)) {
			if(req.url.match(/^.*\.git\/(objects|HEAD|info|git-(upload|receive)-pack)/)) {
				git.handle(req, res);
			} else {
				console.log('Web Interface');

				res.writeHead(404);
				res.end();
			}
		}
	}).listen(config.port, config.hostname);
}