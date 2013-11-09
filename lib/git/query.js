var spawn = require('child_process').spawn;

function exGit(path, args, cb) {
	var proc = spawn('git', args, {
		cwd: path
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

exports.getLastCommit = function(path, cb) {
	exGit(path, ['log', '-1'], function(err, data) {
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

exports.getTree = function(path, treeIsh, treePath, cb) {
	exGit(path, ['ls-tree', '-z', treeIsh, treePath], function(err, data) {
		var lines = (data || '').split('\x00'),
			parts,
			items = [];

		for(var i = 0; i < lines.length; i++) {
			parts = lines[i].match(/(.+) (blob|tree) (.+)\t(.+)/);

			if(!parts) {
				continue;
			}

			items.push({
				mode: parts[1],
				type: parts[2],
				hash: parts[3],
				file: parts[4]
			});
		}

		cb(err, items);
	});
}