#!/usr/bin/env node

/**
 * xtc-cli
 *
 * xtc command line tools
 */

'use strict';

var cmdr = require('commander');
var c = require('chalk');
var Liftoff = require('liftoff');
var inquirer = require('inquirer');
var semver = require('semver');
var Q = require('q');
var u = require('../lib/xtc-utils.js');
u.spawn = require('superspawn').spawn;

var rcVersion = 0;
var log = console.log;
/*
var semver = require('semver');
var archy = require('archy');

var resolve = require('resolve');
var findup = require('findup-sync');
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');
*/

/*
https://github.com/harthur/nomnom
looks very very interesting too. certainly better documented than commander.
 */


function handleArguments(env) {

	//var argv = env.argv;
	//var cliPackage = require('../package');
	var xtcMain = env.modulePath;
	var xtcJson = env.modulePackage;
	var xtcfile = env.configPath || 'xtcfile.json';


	cmdr.version(require('../package').version);


	cmdr
		.command('start')
		.description('Starts the xtc server. Use `-p [number]` to force a port.')
		.option('-p, --port [number]', 'Specify the port that xtc should listen on.')
		.action(function(cmd) {
			var xtcArgs
				,projectJson
			;

			u.checkLocalXtc(env);

			if (semver.gte(xtcJson.version, '0.8.0-beta8')) {
				xtcArgs = [u.readProjectJson().main, 'server.js'];
			}
			else {
				xtcArgs = [xtcMain];
			}

			cmd.port && xtcArgs.push('--port='+ cmd.port);
			u.spawn(
					'node'
					,xtcArgs
					,{ stdio: 'inherit' }
				)
				.catch(u.fail)
			;
		});


	cmdr
		.command('build')
		.description('Start frontend asset build. Use `-d` for production build to dist target.')
		.option('-d, --dist', 'Run build in distribution mode. Output is minified.')
		.action(function(cmd) {

			var xtcArgs = ['--base=./node_modules/xtc']
				,grunt
			;

			u.checkLocalXtc(env);
			cmd.dist && xtcArgs.push('--dist');
			u.spawn('grunt', xtcArgs, { stdio: 'inherit' })
				.catch(u.fail)
			;
		});


	cmdr
		.command('mkmod')
		.description('Create new Terrific frontend modules')
		.action(function(cmd) {

			u.checkLocalXtc(env);
			u.spawn('yo', ['xtc:module'], { stdio: 'inherit' })
				.catch(u.fail)
			;
		});


	cmdr
		.command('mkskin')
		.description('Create new skins for a Terrific frontend module')
		.action(function(cmd) {

			u.checkLocalXtc(env);
			u.spawn('yo', ['xtc:skin'], { stdio: 'inherit'})
				.catch(u.fail)
			;
		});


	cmdr
		.command('install')
		.description('Install xtc and launch project setup')
		.action(function(cmd) {

			var config = {
					xtcSrc: {
						type: null
						,src: null
					}
				},
				store = u.readXtcfile(xtcfile) || config
			;

			log(c.magenta('\nxtc install\n'));

			///////////////////////////////////////////////////////////////////
			// Ask user if cwd is the desired install location
			u.prompt({
					type : 'confirm',
					name : 'IsPathOk',
					message : 'Your project will be set up in ' +env.cwd +' Ok?',
					default: true
				})
				.then(
					function( answers ) {
						//config.projectPath = answers.projectPath;
						if (!answers.IsPathOk) {
							u.fail(0, 'Change to the desired directory and try again.')
						}
					},
					function(err) {
						u.fail(null, err.stack);
					}
				)

				///////////////////////////////////////////////////////////////////
				// Get list of xtc versions from npm (or cache)
				.then(function() {
					log('Getting list of xtc versions from npm...');
					return u.pkgInfo('xtc');
				})
				.catch(function(err) {
					if (err.message === 'getaddrinfo ENOTFOUND') {
						u.fail(null, 'DNS error. Are you offline?');
					} else {
						u.fail(err.stack);
					}
				})

				///////////////////////////////////////////////////////////////////
				// let the user choose the version to install. default to latest
				.then(function(versions) {

					var choices = versions.slice();

					choices.unshift(new inquirer.Separator());
					choices.push(new inquirer.Separator(), '#develop branch', new inquirer.Separator());
					choices.push('tarball', new inquirer.Separator());

					return u.prompt([
						{
							type : 'list',
							name : 'xtcVersion',
							message : 'Choose a version to install',
							paginated : true,
							default: 0,
							choices : choices
						}
					]);
				})
				.catch(function(err) {
					u.fail(null, err.stack);
				})

				///////////////////////////////////////////////////////////////////
				// Write choices back to xtcfile
				.then(function(answers) {

					if ('#develop branch' == answers.xtcVersion) {
						config.xtcSrc.type = 'tarball';
						config.xtcSrc.src = 'https://github.com/MarcDiethelm/xtc/archive/develop.tar.gz';
						// this fails on Windows with "Invalid tar file": https://gist.github.com/janwidmer/9d0b8bd45678019d1a28
						//config.xtcSrc.type = 'git'; config.xtcSrc.src = 'git://github.com/marcdiethelm/xtc.git#develop';
					} else if (answers.xtcVersion == 'tarball') { // todo: need a prompt for tarball location (and then save that…)
						config.xtcSrc.type = 'tarball';
						config.xtcSrc.src = '/Users/marc/projects/xtc-0.8.0-rc1.tgz';
					} else {
						config.xtcSrc.type = 'npm';
						config.xtcSrc.src = 'xtc@'+ answers.xtcVersion;
					}

					store.rcVersion     = rcVersion;
					store.xtcSrc        = {
						type: config.xtcSrc.type
						,src: config.xtcSrc.src
					};

					 // we only know the xtc version when source is npm
					store.xtcVersion = 'npm' === config.xtcSrc.type
						? answers.xtcVersion
						: null
					;

					return Q.nfcall(require('fs').writeFile, xtcfile, JSON.stringify(store, null, 2))
				})
				.then(function() {
						console.log('\nCreated xtcfile');
					}, function(err) {
						console.error('\nUnable to write xtcfile.\nReason: %s\n', err.message);
					}
				)

				///////////////////////////////////////////////////////////////////
				// npm install xtc@version
				.then(function() {

					log(c.magenta('\nInstalling xtc module %s...'), config.xtcSrc.src);

					return u.spawn('npm', ['install', '--production', config.xtcSrc.src], {
						stdio: 'inherit'
					});
				})
				.then(function() {
						log(c.cyan('\nxtc module installed successfully'));
					},
					u.trace
				)

				///////////////////////////////////////////////////////////////////
				// bundledDependencies don't have their dependencies installed. need to do that ourselves.
				// generator-xtc is in xtc's bundledDependencies
				// https://github.com/npm/npm/issues/2442
				.then(function() {
					log(c.magenta('\nInstalling generator-xtc dependencies...\n'));

					return u.spawn('npm', ['install', '--production'], {
						stdio: 'inherit'
					   ,cwd: './node_modules/generator-xtc'
					});
				})
				.then(function() {
						log(c.cyan('\ngenerator-xtc dependencies installed successfully'));
					},
					u.trace
				)

				///////////////////////////////////////////////////////////////////
				// run project generator
				.then(function() {
					log(c.magenta('\nStarting project setup...\n'));
					return u.spawn('yo', ['xtc:app'], { stdio: 'inherit'});
				})
				.catch(function(code) {
					u.fail(code, 'I think something went wrong...');
				})

				///////////////////////////////////////////////////////////////////
				// Install any remaining dependencies. e.g. hipsum
				.then(function() {
					log(c.magenta('\nInstalling remaining project dependencies...\n'));

					return u.spawn('npm', ['install', '--production'], {
						stdio: 'inherit'
					});
				})
				.then(function() {
						log(c.cyan('\nremaining project dependencies install complete\n'));
						return true;
					},
					u.trace
				)
				.then(function() {
					var outro =
						'\nInstallation complete!\n\n' +

						chalk.cyan('xtc build')     +'\t\tstarts dev build\n' +
						chalk.cyan('xtc start')     +'\t\tstarts the server\n\n' +

						chalk.cyan('xtc help')      +'\t\tlist available commands\n\n'

						//chalk.cyan('npm run mkmod') +    '\t\tcreate a frontend module\n' +
						//chalk.cyan('npm run mkskin') +    '\t\tcreate a skin for a frontend module\n'
					;
					log(outro);
				})
				.done(null, u.fail);
		});


	cmdr
		.command('setup')
		.description('Launch project setup') // does not install any dependencies
		.action(function(cmd) {

			u.checkLocalXtc(env);
			u.spawn('yo', ['xtc:app'], {stdio: 'inherit'})
				.catch(u.fail)
			;
		});


	cmdr
		.command('info')
		.description('Information about the project setup')
		.action(function(cmd) {
			var info =
				c.underline('\nproject information\n') +
					'xtc version:\t %s\n',
				store = u.readXtcfile(xtcfile)
			;

			log(info, xtcJson.version);
			if (store) {
				log(c.underline('xtc source'));
				log('type:\t\t %s', store.xtcSrc.type);
				log('src:\t\t %s', store.xtcSrc.src);
			}
			u.nl();
		});


	cmdr
		.command('help [command]')
		.description('Show usage information')
		.action(function(cmd) {
			'string' === typeof cmd
				? cmdr.emit(cmd, null, ['--help'])
				: cmdr.outputHelp()
			;
			process.exit();
		});


	/*cmdr
		.command('update')
		.description('Update xtc module and create new project files in a folder for safe manual merging.')
		.action(function(cmd) {

			log('not implemented yet')

			u.checkLocalXtc(env);

			// you have version xx, you can update to versions [xy, xz, ...]

			// npm update xtc module

			// read install config and run a setup with pre-filled defaults (from original/last install)
			// write files to a new folder project-update-x.y.z for manual merging by the user.
		});*/


	cmdr.parse(process.argv);

	if (!cmdr.args.length) cmdr.help();


	/*if (process.cwd() !== env.cwd) {
		process.chdir(env.cwd);
		console.log('Working directory changed to', c.magenta(env.cwd));
	}*/
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cli = new Liftoff({
	name: 'xtc'
});

cli.launch(handleArguments);
