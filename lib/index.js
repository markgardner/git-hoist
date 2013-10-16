exports.access = require('./access_enum');
exports.auth = {
	Basic: require('./auth/basic'),
	Digest: null,
	OAuth: null,
	LDAP: null
};

var _ = require('underscore'),
	pushover = require('pushover'),
	async = require('async'),
	http_server = require('./http/server'),
	ssh_auth_server = require('./ssh/server');

function configureRepos(config, repos, cb) {
	var git = pushover(config.directory, { autoCreate: false }),
		default_access = config.default_access,
		keys = Object.keys(repos),
		key;

	for(var i = 0; i < keys.length; i++) {
		key = keys[i];

		repos[key].access = _.extend({}, default_access, repos[key].access);

		if(!key.match(/.git$/)) { 
			repos[key + '.git'] = repos[key];

			delete repos[key];
		}
	}

	async.reject(keys, git.exists.bind(git), function(results) {
		if(results.length) {
			async.map(results, git.create.bind(git), function() {
				cb(git);
			});
		} else {
			cb(git);
		}
	});
}

exports.start = function(opts) {
	var config = opts.config,
		users = opts.users,
		repos = opts.repos;

	if(!config.http && !config.ssh) {
		throw new Error('Unable to configure a service, you must configure a http, https or ssh service.');
	}

	if(!config.repo || !config.repo.directory) {
		throw new Error('A repository root directory was not specified.')
	}

	configureRepos(config.repo, repos, function(git) {
		if(config.http) {
			http_server.start(config.http, users, repos, git);
		}

		if(config.ssh) {
			ssh_auth_server.start(config.ssh, users, repos, git);
		}
	});
};