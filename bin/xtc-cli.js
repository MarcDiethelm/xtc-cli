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
var u = require('../lib/xtc-utils.js');
u.spawn = require('superspawn').spawn;

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

	//var argv = env.argv;
	//var cliPackage = require('../package');
	var xtcMain = env.modulePath;
	var xtcJson = env.modulePackage;


	cmdr.version(require('../package').version);


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
		.description('Starts the xtc server. Use `-p [number]` to force a port.')
		.option('-p, --port [number]', 'Specify the port that xtc should listen on.')
		.action(function(cmd) {

			var xtcArgs = [xtcMain];

			u.checkLocalXtc(env);
			cmd.port && xtcArgs.push('--port='+ cmd.port);
			u.spawn('node', xtcArgs, { stdio: 'inherit' })
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
		.command('setup')
		.description('Launch project setup')
		.action(function(cmd) {

			u.checkLocalXtc(env);
			u.spawn('yo', ['xtc'], { stdio: 'inherit'})
				.catch(u.fail)
			;
		});


	cmdr
		.command('install')
		.description('Install xtc and set up a project')
		.action(function(cmd) {

			var config = {};

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
				// npm install xtc@version
				.then(function( answers ) {
					var xtcInstallArg;

					config.xtcVersion = answers.xtcVersion;

					if (config.xtcVersion == '#develop branch') {
						xtcInstallArg = 'git://github.com/marcdiethelm/xtc.git#develop';
					} else if (config.xtcVersion == 'tarball') { // todo: need a prompt for tarball location (and then save that…)
						xtcInstallArg = '/Users/marc/projects/xtc-0.8.0-rc1.tgz';
					} else {
						xtcInstallArg = 'xtc@'+ config.xtcVersion;
					}

					log(c.magenta('\nInstalling xtc module %s...\n'), config.xtcVersion);

					return u.spawn('npm', ['install', xtcInstallArg], { stdio: 'inherit'});
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

					return u.spawn('npm', ['install'], {
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
					return u.spawn('yo', ['xtc'], { stdio: 'inherit'});
				})
				.catch(function(code) {
					u.fail(code, 'I think something went wrong...');
				})
				.done(null, u.fail);
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
