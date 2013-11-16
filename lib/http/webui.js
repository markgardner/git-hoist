var path = require('path'),
	statics = require('./lib/statics')(path.join(__dirname, 'public')),
	views = require('./lib/views')(path.join(__dirname, 'views')),
	commands = require('./lib/commands')(path.join(__dirname, 'commands'));

exports.handle = function(req, res, repos, git, site) {
	// /:repo?/:operation?/:branch?
	// Get the main params
	var params = req.url.toLowerCase().slice(1).split('/'),
		config = {
			git: git,
			repos: repos,
			repo: params[0],
			operation: params[0] ? (params[1] || 'tree') : 'list',
			branch: params[2] || 'master',
			extraParams: params.slice(3)
		},
		fileCache = statics[req.url],
		command = commands[config.operation];

	res.render = function(view, locals) {
		locals.site = site;

		locals.commandUrl = function(command, commandPath, branch) {
			return path.join('/' + config.repo + '/' + command + '/' + (branch || config.branch), commandPath);
		}

		this.end(views.getView(view, locals));
	}

	res.notFound = function() {
		res.writeHead(404);
		res.end('Not Found');
	}

	if(fileCache && fileCache.content) {
		res.writeHead(200, {
			'Content-Type': fileCache.mime
		});
		res.end(fileCache.content);
	} else if(command) {
		command(req, res, config, res.notFound);
	} else {
		res.notFound();
	}
}