var path = require('path'),
	url = require('url'),
	statics = require('./lib/statics')(path.join(__dirname, 'public')),
	views = require('./lib/views')(path.join(__dirname, 'views')),
	commands = require('./lib/commands')(path.join(__dirname, 'commands'))
	GitQuery = require('../git/query');

exports.handle = function(req, res, repos, git, site) {
	// /:repo?/:operation?/:branch?
	// Get the main params
	var startTime = process.hrtime(),
		urlParsed = url.parse(req.url, true),
		params = urlParsed.pathname.slice(1).split('/'),
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

	req.pathname = urlParsed.pathname;
	req.query = urlParsed.query;

	res.render = function(view, locals) {
		locals.site = site;
		locals.renderTime = process.hrtime(startTime);
		locals.renderTimeSpan = (locals.renderTime[0] * 1e3) + (locals.renderTime[1] / 1e6);
		locals.blobPath = config.blobPath;
		locals.treePath = config.treePath;
		locals.parentPath = config.treeParentPath;
		locals.trails = {};
		locals.repo = config.repo;
		locals.command = config.operation;

		// Create breadcrumbs
		for(var i = 0, trail = '', len = config.extraParams.length; i < len; i++) {
			trail += '/' + config.extraParams[i];

			locals.trails[trail] = {
				name: config.extraParams[i],
				last: i === (len - 1)
			};
		}

		locals.commandUrl = function(command, commandPath, branch) {
			var prefix = '/' + config.repo,
				branch = (branch || config.branch);

			if(command === 'tree' && branch === 'master' && commandPath === '/') {
				return prefix;
			}

			return path.join(prefix + '/' + command + '/' + branch, commandPath);
		}

		this.writeHead(200, {
			'Content-Type': 'text/html; charset=utf-8'
		});

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