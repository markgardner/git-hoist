var githoist = require('../../lib/index'),
	path = require('path'),
	fs = require('fs'),
	homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

githoist.start({
	config: {
		http: {
			sitename: 'Git-Hoist Sample',
			hostname: 'localhost',
			port: 9080/*,
			cert: {
				key: fs.readFileSync(path.join(__dirname, 'host.key')),
				cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
			}*/
		},
		ssh: {
			auth_keys: path.join(homeDir, '.ssh/authorized_keys')
		},
		repo: {
			default_access: {
				'@admins': githoist.access.READ + githoist.access.WRITE,
				'@limited': githoist.access.READ
			},
			directory: path.join(homeDir, '.githoist/repos')
		}
	},
	users: new githoist.auth.Basic({
		groups: ['admins', 'limited'],
		users: {
			mark: {
				password: 'test',
				//sshKey: '<* you pub ssh key *>',
				groups: ['admins']
			}
		}
	}),
	repos: {
		'test-repo.git': {
			access: {
				mark: githoist.access.READ + githoist.access.WRITE
			},
			owner: 'Kevin Smiles',
			description: 'Describe it',
			website: 'http://www.smiles.bak/',
			title: 'This is a test Repo'
		}
	}
})