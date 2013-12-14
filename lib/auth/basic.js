var url = require('url'),
	qs = require('querystring'),
	access = require('../access_enum');

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
		if(repo.access && repo.access[username]) {
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

Basic.prototype.authorizeHttp = function(req, res, repos) {
	var user,
		isValid = false,
		authBuff, userParts, repo, ps, perm;

	if(req.headers.authorization && req.headers.authorization.indexOf('Basic ') === 0) {
		authBuff = new Buffer(req.headers.authorization.slice(6), 'base64');
		userParts = authBuff.toString().split(':');

		if(users[userParts[0]] && users[userParts[0]].password === userParts[1]) {
			repo = req.url.match(/\/(.+\.git)/);
			req.user = userParts[0];

			if(repo && repo.length === 2) {
				ps = qs.parse(url.parse(req.url).query);
				perm = this.getAccess(repos[repo[1]], userParts[0]);

				if((ps.service === 'git-receive-pack' && access.canWrite(perm)) || (ps.service !== 'git-receive-pack' && access.canRead(perm))) {
					isValid = true;
				}
			} else { // Allow web ui to list repos
				isValid = true;
			}
		}
	}

	if(!isValid) {
		if(req.headers.authorization) {
			res.writeHead(403);
			res.end('You do not have permission');
		} else {
			res.writeHead(401, {
				'WWW-Authenticate': 'Basic realm="' + realm + '"'
			});
			res.end('Authentication Required');
		}
	} else {
		req.getAccess = this.getAccess;
		req.canRead = function(repo) {
			var perm = this.getAccess(repos[repo], this.user);

			return access.canRead(perm);
		};
		req.canWrite = function(repo) {
			var perm = this.getAccess(repos[repo], this.user);

			return access.canRead(perm);
		};
	}

	return isValid;
}

module.exports = Basic;