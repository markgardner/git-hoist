var usernames, users, groups;

function SimpleUserStore(config) {
	usernames = Object.keys(config.users);
	users = config.users;
	groups = config.groups;
}

SimpleUserStore.prototype.getAccess = function(repo, username) {
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

SimpleUserStore.prototype.getUsernames = function() {
	return usernames;
}

SimpleUserStore.prototype.getUserInfo = function(username) {
	return users[username];
}

module.exports = SimpleUserStore;