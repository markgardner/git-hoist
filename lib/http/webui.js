var path = require('path'),
	statics = require('./lib/statics')(path.join(__dirname, 'public')),
	views = require('./lib/views')(path.join(__dirname, 'views')),
	commands = require('./lib/commands')(path.join(__dirname, 'commands'))
	GitQuery = require('../git/query');

exports.handle = function(req, res, repos, git, site) {
	// /:repo?/:operation?/:branch?
	// Get the main params
	var startTime = process.hrtime(),
		params = req.url.slice(1).split('/'),
		config = {
			git: git,
			repos: repos,
			repo: params[0],
			operation: (params[0] ? (params[1] || 'tree') : 'list').toLowerCase(),
			branch: params[2] || 'master',
			extraParams: params.slice(3)
		},
		command = commands[config.operation],
		file;

	if(config.repo) {
		config.gitPath = config.git.dirMap(config.repo);
		config.gitQuery = new GitQuery(config.gitPath, config.branch);
		config.blobPath = config.extraParams.join('/');
		config.treePath = (config.blobPath || '.') + '/';
		config.treeParentPath = config.treePath === './' ? '' : path.resolve('/' + config.treePath, '..')
	}

	res.render = function(view, locals) {
		locals.site = site;
		locals.renderTime = process.hrtime(startTime);
		locals.renderTimeSpan = (locals.renderTime[0] * 1e3) + (locals.renderTime[1] / 1e6);
		locals.blobPath = config.blobPath;
		locals.treePath = config.treePath;
		locals.parentPath = config.treeParentPath;

		locals.commandUrl = function(command, commandPath, branch) {
			var prefix = '/' + config.repo + '/' + command + '/' + (branch || config.branch);

			if(commandPath !== '/') {
				return path.join(prefix, commandPath)
			}
			return prefix;
		}

		this.end(views.getView(view, locals));
	}

	res.notFound = function() {
		res.writeHead(404, {
			'Content-Type': 'text/plain'
		});
		res.end('Not Found');
	}

	if(command) {
		command(req, res, config, res.notFound);
	} else {
		file = statics.getFile(req.url);

		if(file && file.content) {
			res.writeHead(200, {
				'Content-Type': file.mime
			});
			res.end(file.content);
		} else {
			res.notFound();			
		}
	}
}