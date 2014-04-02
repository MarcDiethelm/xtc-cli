#!/usr/bin/env node

/**
 * xtc-cli
 *
 * xtc command line tools
 */

'use strict';

var cmdr = require('commander');
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
	var xtcMain = env.modulePath;
	var xtcJson = env.modulePackage;


	cmdr.version(require('../package').version);


	cmdr
		.command('help')
		.description('Shows this usage information')
		.action(function(cmd) {
			cmdr.help();
		});


	cmdr
		.command('info')
		.description('Information about the project setup')
		.action(function(cmd) {
			var info =
				c.underline('\nProject information\n\n') +
				'xtc version: %s\n'
			;

			log(info, xtcJson.version);
		});


	cmdr
		.command('start')
		.description('Starts the xtc server')
		.action(function(cmd) {

			u.checkLocalXtc(env);

			require('child_process')
				.spawn('node', [xtcMain], {
					stdio: 'inherit'
				})
				.on('exit', function (code) {
					process.exit(code);
				})
			;
		});


	cmdr
		.command('build')
		.description('Start frontend asset build. Run with `--dist` for minified distribution build.')
		.option('-d, --dist', 'Run build in distribution mode. Output is minified.')
		.action(function(cmd) {

			u.checkLocalXtc(env);

			var spawn = require('child_process').spawn
			   ,grunt
			;

			if (!cmd.dist) {
				grunt = spawn('grunt', ['--base=./node_modules/xtc'], {
					stdio: 'inherit'
				});
			}
			else {
				grunt = spawn('grunt', ['--base=./node_modules/xtc', '--dist'], {
					stdio: 'inherit'
				});
			}

			grunt.on('exit', function (code) {
				process.exit(code);
			})
		});


	cmdr
		.command('mkmod')
		.description('Create new Terrific frontend modules')
		.action(function(cmd) {

			u.checkLocalXtc(env);

			require('child_process')
				.spawn('yo', ['xtc:module', '--path='+path.dirname(env.modulePath)], {
					stdio: 'inherit'
				})
				.on('exit', function (code) {
					process.exit(code);
				})
			;
		});


	cmdr
		.command('mkskin')
		.description('Create new skins for a Terrific frontend module')
		.action(function(cmd) {

			u.checkLocalXtc(env);

			require('child_process')
				.spawn('yo', ['xtc:skin', '--path='+path.dirname(env.modulePath)], {
					stdio: 'inherit'
				})
				.on('exit', function (code) {
					process.exit(code);
				})
			;
		});


	cmdr
		.command('setup')
		.description('Launch project setup')
		.action(function(cmd) {

			require('child_process')
				.spawn('yo', ['xtc'], {
					stdio: 'inherit'
				})
				.on('exit', function (code) {
					if (code !== 0) {
						console.log(c.magenta('I think something went wrong...'));
					}
					process.exit(code);
				});
		});


	cmdr
		.command('install') // TODO: refactor this with promises and modules
		.description('Install xtc and set up a project')
		.action(function(cmd) {

			var config = {};

			log(c.magenta('\nxtc install\n'));

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
					choices.push(new inquirer.Separator(), '#develop branch', new inquirer.Separator());
					//choices.push('tarball', new inquirer.Separator());

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
						} /*else if (config.xtcVersion == 'tarball') { // todo: need a prompt for tarball location
							xtcInstallArg = '/Users/marc/projects/xtc-0.8.0-beta6.tgz';
							expectStr = 'xtc@';
						}*/ else {
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

								// run generator

								log(c.magenta('\nStarting project setup...\n'));

								//log(c.magenta('\nyo xtc\t\tto start the project generator.\n'));

								require('child_process')
									.spawn('yo', ['xtc'], {
										stdio: 'inherit'
									})
									.on('exit', function (code) {
										if (code !== 0) {
											console.log(c.magenta('\nI think something went wrong.\n'));
										}
										process.exit(code);
									});
							})
						;

					});

					/*var ui = new inquirer.ui.BottomBar();

					// Or simply write output
					ui.log.write("something just happened.");*/

				});

			});
		});


	cmdr.parse(process.argv);


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