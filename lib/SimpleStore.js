var users, groups;

function SimpleStore(config) {
	users = config.users;
	groups = config.groups;
}

SimpleStore.prototype.getAccess = function(repo, username) {
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

module.exports = SimpleStore;