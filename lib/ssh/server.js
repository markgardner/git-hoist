var net = require('net'),
	path = require('path'),
	fs = require('fs');

exports.start = function(config, users, repos, git) {
	var server = net.createServer(function(socket) {
		socket.setEncoding('utf8');

		if(socket.remoteAddress !== '127.0.0.1') {
			socket.end('no remotes');
		} else {
			socket.on('data', function(data) {
				parts = data.replace(/^[\r\n\s]+|[\r\n\s]+$/g, '').split('\x00');

				var repo = repos[parts[0]],
					username = parts[1],
					access = users.getAccess(repo, username);
					
				socket.end(access.toString());
			});
		}
	});

	server.listen(function() {
		var addr = server.address();

		fs.writeFileSync(path.resolve(__dirname, '../../.port'), addr.port.toString());
	});

	process.on('SIGINT', function() {
		server.closing = true;
		server.close();
	});

	process.on('exit', function() {
		if(!server.closing) {
			server.close();
		}
	});
}