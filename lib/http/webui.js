var jade = require('jade'),
	path = require('path'),
	fs = require('fs'),
	async = require('async'),
	gitQuery = require('../git/query');

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

	publicCache['/favicon.ico'] = {};

	for(var i = 0; i < files.length; i++) {
		filepath = path.join(publicPath, files[i]);

		publicCache['/' + files[i]] = {
			content: fs.readFileSync(filepath),
			mime: mime[filepath.slice(filepath.lastIndexOf('.') + 1)] || 'application/octect'
		};
	}
});

exports.command_summary = function(req, res, config, next) {
	var gitPath = config.git.dirMap(config.repo);

	async.parallel([
		function(cb) {
			gitQuery.getLastCommit(gitPath, function(err, lastCommit) {
				cb(null, lastCommit);
			});
		},
		function(cb) {
			gitQuery.getTree(gitPath, 'HEAD', './', function(err, lastCommit) {
				cb(null, lastCommit);
			});
		}
	], function(err, results) {
		res.render('summary', { lastcommit: results[0], tree: results[1] });
	});
}

exports.command_list = function(req, res, config, next) {
	var repos = config.repos,
		git = config.git,
		keys = Object.keys(config.repos);

	async.map(keys, function(repo, cb) {
		gitQuery.getLastCommit(git.dirMap(repo), function(err, lastCommit) {
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
	var params = req.url.toLowerCase().slice(1).split('/').slice(0, 3),
		config = {
			git: git,
			repos: repos,
			repo: params[0],
			operation: params[0] ? (params[1] || 'summary') : 'list',
			branch: params[2] || 'master'
		},
		fileCache = publicCache[req.url];

	res.render = function(view, locals) {
		locals.site = site;

		this.end(viewCache[view](locals));
	}

	if(fileCache) {
		if(fileCache.content) {
			res.writeHead(200, {
				'Content-Type': fileCache.mime
			});
			res.end(fileCache.content);
		} else {
			res.writeHead(404);
			res.end();
		}
	} else {
		this['command_' + config.operation](req, res, config, function(err) {
			res.writeHead(404);
			res.end('Not Found');
		});
	}
}