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

function GitQuery(repoPath, treeIsh) {
	this.repoPath = repoPath;
	this.treeIsh = treeIsh;
}

GitQuery.prototype.getCommits = function(blobPath, skip, limit, cb) {
	exGit(this.repoPath, ['log', '-n', (limit || 50), '--skip', (skip || 0), '-z', this.treeIsh, '--', blobPath], function(err, data) {
		var parts = (data || '').split('\x00'),
			messages, headers, values, obj, person;

		for(var i = 0; i < parts.length; i++) {
			messages = parts[i].split('\n\n');
			headers = messages[0].split('\n');
			obj = parts[i] = {
				hash: headers[0].slice(7),
				message: messages[1].trim()
			};

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
		}

		cb(null, parts);
	});
}

GitQuery.prototype.getLastCommit = function(treePath, cb) {
	exGit(this.repoPath, ['log', '-1', this.treeIsh, '--', treePath], function(err, data) {
		var parts = (data || '').match(/commit (.*)\nAuthor:\s+(.*)\nDate:\s+(.*)\n\n\s+(.*)/m),
			date, dateFormatted, person;

		if(!parts) {
			cb(err, null);
		} else {
			date = new Date(parts[3]);
			dateFormatted = JSON.stringify(date);
			person = (parts[2] || '').match(/(.*)\s\<(.*)\>/);

			cb(err, {
				hash: parts[1],
				person_name: person[1],
				person_email: person[2],
				date: date,
				message: parts[4],
				dateFormatted: dateFormatted.slice(1, dateFormatted.length - 1)
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

module.exports = GitQuery;