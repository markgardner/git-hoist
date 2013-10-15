var net = require('net'),
	path = require('path'),
	fs = require('fs');

function writeAuthKeys(config, users, remoteAddr) {
	var usernames = users.getUsernames(), 
		authorized_keys = '',
		commandPath = path.resolve(__dirname, '../../bin/git-hoist-shell'),
		info, i;

	for(i = 0; i < usernames.length; i++) {
		info = users.getUserInfo(usernames[i]);

		if(info.pubKey) {
			authorized_keys += 'command="' + commandPath + ' ' + usernames[i] + ' ' + remoteAddr.port + '" ' + info.pubKey + '\n';
		}
	}

	fs.writeFileSync(config.auth_keys, authorized_keys);
}

exports.start = function(config, users, repos, git) {
	var server = net.createServer(function(socket) {
		socket.setEncoding('utf8');

		if(socket.remoteAddress !== '127.0.0.1') {
			socket.end('remote connections not accepted');
		} else {
			socket.on('data', function(data) {
				var parts = data.replace(/^[\r\n\s]+|[\r\n\s]+$/g, '').split('\x00'),
					repo = repos[parts[0]],
					username = parts[1],
					access = users.getAccess(repo, username),
					path = git.dirMap(parts[0]),
					buf = new Buffer(Buffer.byteLength(path) + 4);

				buf.writeUInt32LE(access || 0, 0);
				buf.write(path, 4);
					
				socket.end(buf);
			});
		}
	});

	server.listen(function() {
		writeAuthKeys(config, users, server.address());
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