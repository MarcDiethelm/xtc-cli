#!/usr/bin/env node

/**
 * xtc-cli
 *
 * xtc command line tools
 *
 * Heavily borrowed from gulp
 */

'use strict';

var c = require('chalk');
var path = require('path');
var inquirer = require('inquirer');
var Liftoff = require('liftoff');
var u = require('../lib/xtc-utils.js')

var log = console.log;
/*
var semver = require('semver');
var archy = require('archy');

var resolve = require('resolve');
var findup = require('findup-sync');
var gutil = require('gulp-util');
var prettyTime = require('pretty-hrtime');
*/



function handleArguments(env) {

	var argv = env.argv;
	var cliPackage = require('../package');
	var versionFlag = argv.v || argv.version;
	//var tasksFlag = argv.T || argv.tasks;
	var command = argv._[0];
	var args = env.argv._.slice(1);
	//var toRun = tasks.length ? tasks : ['default'];

	if (versionFlag) {
		//log('CLI version', cliPackage.version);
		log(cliPackage.version);
		/*if (env.modulePackage) {
			log('Local version', env.modulePackage.version);
		}*/
		process.exit(0);
	}


	/*if (process.cwd() !== env.cwd) {
		process.chdir(env.cwd);
		console.log('Working directory changed to', c.magenta(env.cwd));
	}*/


	else if ('help' === command || !command) {
		log(c.magenta('\nxtc help\n'));
	}


	else if ('install' === command) { // TODO: refactor this with promises and modules
		log(c.magenta('\nxtc install\n'));

		var config = {};

		inquirer.prompt([
			{
				type : 'confirm',
				name : 'IsPathOk',
				message : 'Your project will be set up in ' +env.cwd +' Ok?',
				default: true
			}
		], function( answers ) {
			//config.projectPath = answers.projectPath;
			if (!answers.IsPathOk) {
				log('Change to the desired directory and try again.');
				process.exit(0);
			}

			// get list of xtc versions from npm
			u.pkgInfo('xtc', function(versions) {

				var choices = versions.slice();

				choices.unshift(new inquirer.Separator());
				choices.push(new inquirer.Separator(), '#develop branch', new inquirer.Separator(), 'tarball', new inquirer.Separator());

				// let the user choose the version to install. default to latest

				inquirer.prompt([
					{
						type : 'list',
						name : 'xtcVersion',
						message : 'Choose a  version to install',
						paginated : true,
						default: 0,
						choices : choices
					}
				], function( answers ) {
					var xtcInstallArg
						,expectStr
					;
					config.xtcVersion = answers.xtcVersion;

					if (config.xtcVersion == '#develop branch') {
						xtcInstallArg = 'git://github.com/marcdiethelm/xtc.git#develop';
						expectStr = 'xtc@';
					} else if (config.xtcVersion == 'tarball') { // todo: need a prompt for tarball location
						xtcInstallArg = '/Users/marc/projects/xtc/xtc-0.8.0-beta6.tgz';
						expectStr = 'xtc@';
					} else {
						xtcInstallArg = 'xtc@'+ config.xtcVersion;
						expectStr = 'xtc@'+ config.xtcVersion +' node_modules/xtc';
					}

					// npm install xtc@version (versioned generator is in xtc's dependencies)

					var nexpect = require('nexpect');

					log(c.magenta('\nInstalling xtc module %s...\n'), config.xtcVersion);

					nexpect.spawn('npm', ['install', xtcInstallArg], { verbose: true })
						.expect(expectStr)
						.run(function (err, stdout, exitcode) {
							if (err) {
								// todo
								throw err;
								process.exit(1);
							}
							log(c.cyan('\nxtc module installed successfully'));

							try {
								require('fs').symlinkSync(path.join(process.cwd(), 'node_modules/xtc/node_modules/generator-xtc'), path.join(process.cwd(), 'node_modules/generator-xtc'), 'dir');
							} catch (e) {
								if (e.code === 'EEXIST') {
									console.info(c.grey('generator-xtc already linked to node_modules'));
								}
								else {
									throw e;
								}
							}

							// run generator

							log(c.magenta('\nStarting project setup...\n'));

							//log(c.magenta('\nyo xtc\t\tto start the project generator.\n'));

							require('child_process')
								.spawn('yo', ['xtc', '--path='+path.dirname(env.modulePath)], {
									stdio: 'inherit'
								})
								.on('exit', function (code) {
									if (code !== 0) {
										console.log(c.magenta('I think something went wrong...'));
									}
									process.exit(code);
								});

							/*nexpect.spawn('yo', ['xtc'], { verbose: true })
								.expect('')
								.run(function (err, stdout, exitcode) {
									if (err) {
										// todo
										console.error('There was an error');
										throw err;
										process.exit(1);
									}

									console.log(c.cyan('\nxtc setup complete\n'));
									process.exit(0);
								})
							;*/
						})
					;

				});

				/*var ui = new inquirer.ui.BottomBar();

				// Or simply write output
				ui.log.write("something just happened.");*/

			});

		});
	}


	else if ('setup' === command) {

		log(c.magenta('\nlaunching project setup...\n'));

		require('child_process')
			.spawn('yo', ['xtc', '--path='+path.dirname(env.modulePath)], {
				stdio: 'inherit'
			})
			.on('exit', function (code) {
				if (code !== 0) {
					console.log(c.magenta('I think something went wrong...'));
				}
				process.exit(code);
			});
	}


	else if ('build' === command) {
		//u.checkLocalXtc(env);

		if (!argv.dist) {
			log(c.magenta('launching xtc dev build...'));
		}
		else if (argv.dist === true) {
			log(c.magenta('launching xtc dist build...'));
		}
		log(c.magenta('build location: %s'), env.cwd);
		process.exit(0);
	}


	else if ('mkmod' === command) {

		//var moduleNames = args;

		u.checkLocalXtc(env);

		require('child_process')
			.spawn('yo', ['xtc:module', '--path='+path.dirname(env.modulePath)], {
				stdio: 'inherit'
			})
			.on('exit', function (code) {
				process.exit(code);
			})
		;
	}


	else if ('mkskin' === command) {

		//var skinNames = args;

		u.checkLocalXtc(env);

		require('child_process')
			.spawn('yo', ['xtc:skin', '--path='+path.dirname(env.modulePath)], {
				stdio: 'inherit'
			})
			.on('exit', function (code) {
				process.exit(code);
			})
		;
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var cli = new Liftoff({
	name: 'xtc'
});

cli.launch(handleArguments);