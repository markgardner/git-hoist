var usernames, users, groups, realm;

function Basic(config) {
	usernames = Object.keys(config.users);
	users = config.users;
	groups = config.groups;
	realm = config.realm || 'GitHoist';
}

Basic.prototype.getAccess = function(repo, username) {
	var user = users[username];

	if(repo && user) {
		if(repo.access[username]) {
			return repo.access[username];
		} else if(user.groups) {
			for(var i = 0; i < user.groups.length; i++) {
				if(repo.access['@' + user.groups]) {
					return repo.access['@' + user.groups];
				}
			}
		}
	}

	return 0;
}

Basic.prototype.getUsernames = function() {
	return usernames;
}

Basic.prototype.getUserInfo = function(username) {
	return users[username];
}

Basic.prototype.authorizeHttp = function(req, res) {
	var user,
		isValid = false,
		authBuff, userParts;

	if(req.headers.authorization && req.headers.authorization.indexOf('Basic ') === 0) {
		authBuff = new Buffer(req.headers.authorization.slice(6), 'base64');
		userParts = authBuff.toString().split(':');

		if(users[userParts[0]] && users[userParts[0]].password === userParts[1]) {
			isValid = true;
		}
	}

	if(!isValid) {
		res.writeHead(401, {
			'WWW-Authenticate': 'Basic realm="' + realm + '"'
		});
		res.end('Authentication Required');
	}

	return isValid;
}

module.exports = Basic;