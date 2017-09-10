#!/usr/bin/env node

const pckg = require('./package.json');
const program = require('commander');
const colors  = require('colors');
const co = require('co');
const prompt = require('co-prompt');
const debug = require('debug')('nexus-cli');

program
	.version(pckg.version)

program
	.command('login <url>')
	.description('set up ~/.npmrc file to access a Nexus repository')
	.option('-u, --username <username>', 'The user to authenticate as')
	.option('-p, --password <password>', 'The user\'s password')
	.option('-e, --email <email>', 'The user\'s email')
	.option('--scope <scope>')
	.option('--always-auth')
	.action(loginCmd);

program.on('--help', function() {
	console.log();
	console.log('  Examples:');
	console.log();
	console.log('    $ nexus login http://localhost:8081/nexus/content/groups/npm-all');
	console.log();
 });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
	program.outputHelp(colors.red);
}

function loginCmd(url, options) {
	co(function *() {
		var creds = {
			username: options.username,
			password: options.password,
			email: options.email,
			alwaysAuth: options.alwaysAuth || true
		};

		if (!creds.username) {
			creds.username = yield prompt('Username: ');
		}

		if (!creds.email) {
			creds.email = yield prompt('Email: ');
		}

		if (!creds.password) {
			creds.password = yield prompt.password('Password: ');
		}

		const onerror = (res) => {
			switch (res.statusCode) {
				case 404:
					console.error("Invalid repo url: ", url);
					break;
				case 401:
					console.error("Invalid username and password");
					break;
				default:
					console.error("Unable to authenticate with server");
			}
		};

		verifyCredentials(url, creds).then((res) => {
			saveCredentials(url, options.scope, creds);
		}, onerror);
	});
}

function verifyCredentials(repoUrl, creds) {
	console.info('Verify credentials (username=%s, registry=%s)', creds.username, repoUrl);

	return new Promise((resolve, reject) => {
		const url = require('url');

		const options = url.parse(repoUrl);
		const username = encodeURIComponent(creds.username.trim());
		const password = encodeURIComponent(creds.password.trim());
		options.auth = username + ':' + password

		const { request } = require(options.protocol == 'https:' ? 'https' : 'http');
		const req = request(options);

		req.on('error', (err) => {
			reject({ statusCode: 404, statusMessage: 'Not Found' })
		});

		req.on('response', (res) => {
			debug('statusCode:', res.statusCode);
			debug('headers:', res.headers);

			if (res.statusCode == 200) {
				resolve(res);
			} else {
				reject(res);
			}
		});

		req.end();
	});
}

function saveCredentials(registry, scope, newCreds) {
	const npm = require('npm');

	npm.load(() => {
		var creds = npm.config.getCredentialsByURI(npm.config.get('registry'));
		debug("Existing Creds", creds);
		debug("New Creds", creds);

		if (scope) {
			npm.config.set(scope + ':registry', registry, 'user');
		} else {
			npm.config.set('registry', registry, 'user');
		}

		npm.config.setCredentialsByURI(registry, newCreds)
		npm.config.save('user', () => {
			console.log('Saved credentials (username=%s, email=%s) to ~/.npmrc', newCreds.username, newCreds.email);
		})
	})
}
