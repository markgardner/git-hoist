var jade = require('jade'),
	path = require('path'),
	fs = require('fs'),
	async = require('async'),
	GitQuery = require('../git/query');

var viewCache = {},
	publicCache = {},
	viewpath = path.join(__dirname, 'views'),
	publicPath = path.join(__dirname, 'public');

// Cache views
fs.readdir(viewpath, function(err, files) {
	var filename, filePath, fileContent;

	for(var i = 0; i < files.length; i++) {
		filename = files[i].slice(0, files[i].length - 5);
		filePath = path.join(viewpath, files[i]);
		fileContent = fs.readFileSync(filePath);

		viewCache[filename] = jade.compile(fileContent, {
			filename: filePath,
			pretty: true,
			compileDebug: false
		});
	}
});

// Cache public files
fs.readdir(publicPath, function(err, files) {
	var mime = {
		'js': 'text/javascript',
		'css': 'text/css',
		'png': 'image/png'
	}, filepath;

	for(var i = 0; i < files.length; i++) {
		filepath = path.join(publicPath, files[i]);

		publicCache['/' + files[i]] = {
			content: fs.readFileSync(filepath),
			mime: mime[filepath.slice(filepath.lastIndexOf('.') + 1)] || 'application/octect'
		};
	}
});

exports.command_tree = function(req, res, config, next) {
	var gitPath = config.git.dirMap(config.repo),
		gitQuery = new GitQuery(gitPath, config.branch),
		treePath = (config.extraParams.join('/') || '.') + '/';

	async.parallel([
		function(cb) {
			gitQuery.getLastCommit(treePath, function(err, lastCommit) {
				cb(null, lastCommit);
			});
		},
		function(cb) {
			gitQuery.getTree(treePath, function(err, tree) {
				cb(null, tree);
			});
		}
	], function(err, results) {
		res.render('summary', { 
			lastcommit: results[0],
			tree: results[1]
		});
	});
}

exports.command_list = function(req, res, config, next) {
	var repos = config.repos,
		git = config.git,
		keys = Object.keys(config.repos);

	async.map(keys, function(repo, cb) {
		var gitQuery = new GitQuery(git.dirMap(repo), 'master');

		console.log(gitQuery)

		gitQuery.getLastCommit('./', function(err, lastCommit) {
			var obj = repos[repo];

			cb(null, {
				name: repo,
				lastCommit: lastCommit,
				title: obj.title || repo,
				description: obj.description,
				website: obj.website,
				owner: obj.owner
			});
		});
	}, function(err, results) {
		res.render('list', { repos: results });
	});
}

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
		fileCache = publicCache[req.url],
		command = this['command_' + config.operation];

	res.render = function(view, locals) {
		locals.site = site;

		this.end(viewCache[view](locals));
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