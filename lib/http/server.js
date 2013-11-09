var http = require('http'),
	https = require('https'),
	webui = require('./webui');

exports.start = function(config, users, repos, git) {
	var server;

	if(!config.port) {
		throw new Error('Port must be specified.')
	}

	function serverHandle(req, res) {
		if(users.authorizeHttp(req, res, repos)) {
			if(req.url.match(/^.*\.git\/(objects|HEAD|info|git-(upload|receive)-pack)/)) {
				git.handle(req, res);
			} else {
				webui.handle(req, res, repos, git, config);
			}
		}
	}

	if(config.cert) {
		server = https.createServer(config.cert, serverHandle);
	} else {
		server = http.createServer(serverHandle);
	}

	server.listen(config.port, config.hostname);
}