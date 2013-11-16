var spawn = require('child_process').spawn,
	path = require('path');

function exGit(repoPath, args, cb) {
	var proc = spawn('git', args, {
		cwd: repoPath
	}), result = null, err = null;

	proc.stdout.setEncoding('utf8');
	proc.stdout.on('data', function(data) {
		result = data;
	});
	proc.stderr.on('data', function(data) {
		err = data;
	});

	proc.on('close', function() {
		cb(err, result);
	});
}

function GitQuery(repoPath, treeIsh) {
	this.repoPath = repoPath;
	this.treeIsh = treeIsh;
}

GitQuery.prototype.getLastCommit = function(treePath, cb) {
	exGit(this.repoPath, ['log', '-1', this.treeIsh, treePath], function(err, data) {
		var parts = (data || '').match(/commit (.*)\nAuthor:\s+(.*)\nDate:\s+(.*)\n\n\s+(.*)/m);

		if(!parts) {
			cb(err, null);
		} else {
			cb(err, {
				hash: parts[1],
				person: parts[2],
				date: parts[3],
				message: parts[4]
			});
		}
	});
}

GitQuery.prototype.getTree = function(treePath, cb) {
	exGit(this.repoPath, ['ls-tree', '-z', this.treeIsh, treePath], function(err, data) {
		var lines = (data || '').split('\x00'),
			parts, item,
			trees = [], blobs = [];

		for(var i = 0; i < lines.length; i++) {
			parts = lines[i].match(/(.+) (blob|tree) (.+)\t(.+)/);

			if(!parts) {
				continue;
			}

			item = {
				mode: parts[1],
				type: parts[2],
				hash: parts[3],
				file: parts[4]
			};

			(item.type === 'tree' ? trees : blobs).push(item);
		}

		cb(err, trees.concat(blobs));
	});
}

module.exports = GitQuery;