var spawn = require('child_process').spawn,
	path = require('path');

function exGit(repoPath, args, cb, noEncoding) {
	var proc = spawn('git', args, {
		cwd: repoPath
	}), result = null, err = null;

	if(!noEncoding) {
		proc.stdout.setEncoding('utf8');
	}

	proc.stdout.on('data', function(data) {
		if(result) {
			result += data;
		} else {
			result = data;
		}
	});

	proc.stderr.on('data', function(data) {
		err = data;
	});

	proc.on('close', function() {
		cb(err, result);
	});
}

function parseCommit(commit) {
	var messages = commit.split('\n\n'),
		headers = messages[0].split('\n'),
		obj = {
			hash: headers[0].slice(7),
			message: (messages[1] || '').trim()
		}, values, person;

	for(var x = 1; x < headers.length; x++) {
		values = headers[x].split(': ');

		if(values[0] === 'Author') {
			person = values[1].match(/(.*)\s\<(.*)\>/);
			
			obj.person_name = person[1];
			obj.person_email = person[2];
		} else if(values[0] === 'Date') {
			obj.date = new Date(values[1]);
			obj.dateFormatted = JSON.stringify(obj.date);
			obj.dateFormatted = obj.dateFormatted.slice(1, obj.dateFormatted.length - 1);
		} else {
			obj[values[0].toLowerCase()] = values[1];
		}
	}

	return obj;
}

function GitQuery(repoPath, treeIsh) {
	this.repoPath = repoPath;
	this.treeIsh = treeIsh;
}

GitQuery.prototype.getCommitCount = function(blobPath, cb) {
	exGit(this.repoPath, ['rev-list', '--count', this.treeIsh, '--', blobPath], function(err, count) {
		cb(err, parseInt(count));
	});
}

GitQuery.prototype.getLastCommit = function(blobPath, cb) {
	this.getCommits(blobPath, 0, 1, function(err, commits) {
		cb(err, commits && commits[0]);
	});
}

GitQuery.prototype.getCommits = function(blobPath, skip, limit, cb) {
	exGit(this.repoPath, ['log', '-n', (limit || 50), '--skip', (skip || 0), '-z', this.treeIsh, '--', blobPath], function(err, data) {
		if(!data) {
			return cb(err, []);
		}

		var parts = data.split('\x00'), i = 0;
		for(; i < parts.length; i++) {
			parts[i] = parseCommit(parts[i]);
		}

		cb(null, parts);
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
				file: parts[4],
				name: path.basename(parts[4])
			};

			(item.type === 'tree' ? trees : blobs).push(item);
		}

		cb(err, trees.concat(blobs));
	});
}

GitQuery.prototype.getBlob = function(treePath, cb) {
	exGit(this.repoPath, ['show', this.treeIsh + ':' + treePath], cb, true);
}

GitQuery.prototype.getDiff = function(cb) {
	exGit(this.repoPath, ['log', '-1', '-p', this.treeIsh], function(err, data) {
		if(!data) {
			return cb(err, []);
		}

		var diffSplit = '\ndiff --git ', files = [],
			diffStartIdx = data.indexOf(diffSplit),
			commit = parseCommit(data.slice(0, diffStartIdx)),
			diffs = data.slice(diffStartIdx + 12).split('\ndiff --git ');


		for(var i = 0, obj; i < diffs.length; i++) {
			files.push({
				name: diffs[i].match(/b\/(.*)/)[1],
				diff: diffs[i].slice(diffs[i].indexOf('@@')).split('\n')
			});
		}

		cb(err, {
			commit: commit,
			files: files
		});
	});
}

GitQuery.prototype.getBranches = function(cb) {
	exGit(this.repoPath, ['branch'], function(err, data) {
		if(!data) {
			return cb(err, ['master']);
		}

		var branches = data.split('\n'),
			i = 0, results = [];

		for(; i < branches.length; i++) {
			if(branches[i]) {
				results.push(branches[i].slice(2));
			}
		}

		cb(err, results);
	});
}

module.exports = GitQuery;