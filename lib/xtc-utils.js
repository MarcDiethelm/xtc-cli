var utils = module.exports;
var fs = require('fs');
var path = require('path');
var nutil = require('util');
var assert = require('assert');
var inquirer = require('inquirer');
var c = require('chalk');
var Q = require('q');
var symlink = require('./symlink');
var log = console.log;


utils.checkLocalXtc = function checkLocalXtc(env) {
	if (!env.modulePath) {
		log(c.red('No local xtc install found in'), c.magenta(env.cwd));
		utils.fail();
	}
};


utils.readProjectJson = function readProjectJson() {
	try {
		return projectJson = require(path.join(process.cwd(), './package.json'));
	} catch (e) {
		log(c.red('No package.json found in'), c.magenta(process.cwd()));
		utils.fail();
	}
};


/**
 * @param {string} path
 * @returns {Q.promise}
 */
utils.readXtcfile = function readXtcfile(path) {
	var deferred = Q.defer();
	assert(typeof path === 'string');
	//return Q.nfcall(fs.readFile, path, {encoding: 'utf8'});
	fs.readFile(path, {encoding: 'utf8'}, function(err, content) {
		err
			? deferred.reject(err)
			: deferred.resolve(JSON.parse(content))
		;
	});
	return deferred.promise;
};


utils.doctorGeneratorSymlink = function(env, skipFixing) {

	var deferred = Q.defer();
	var fromPath = path.join(env.projectRoot, 'node_modules/generator-xtc');
	var toPath = path.join(env.xtcRoot, 'node_modules/generator-xtc');
	var u = utils;

	u.checkGeneratorSymlink(env)
		.then(function(success) {
			log(success + '\n');
			deferred.resolve();
		}, function(err) {

			if (skipFixing) return deferred.reject(err);

			Q.fcall(function() {
				if ('BROKENLINK' === err.code) {
					return [
						u.removeGeneratorSymlink(fromPath),
						u.makeGeneratorSymlink(fromPath, toPath)
					];
				}
				else if ('NOTALINK' === err.code) {
					u.fail(null, 'Expected symlink but found a file/directory: %s\nDelete or move it and try again.', fromPath);
					return [];
				}
				return [u.makeGeneratorSymlink(fromPath, toPath)];
			})
			.spread(function() {
				Array.prototype.forEach.call(arguments, function(arg) {
					log(c.cyan(arg));
					deferred.resolve();
				});
			})
			.catch(function(err) {
				deferred.reject(err);
			});
		});

	return deferred.promise;
};


utils.checkGeneratorSymlink = function(env) {

	var deferred = Q.defer();
	var fromPath = path.join(env.projectRoot, 'node_modules/generator-xtc');

	symlink.check(fromPath, function(err, linkPath, isAbsolute) {
		//err = new Error(nutil.format('no such link: %s', fromPath));
		//err.code = 'ENOENT';
		//err = new Error('is not a link');
		//err.code = 'NOTALINK';
		//err = new Error(nutil.format('Broken: %s --> %s', fromPath, linkPath));
		//err.code = 'BROKENLINK';

		if (err) return deferred.reject(err);

		var type = 'win32' === process.platform  ? 'junction' : 'symlink';
		var isAbsoluteStr = isAbsolute ? 'absolute' : 'relative';
		var successMsg = nutil.format('Type is %s %s\n%s --> %s', isAbsoluteStr, type, fromPath, linkPath);
		return deferred.resolve(successMsg);
	});

	return deferred.promise;
};


utils.removeGeneratorSymlink = function(path) {
	var deferred = Q.defer();

	symlink.rm(path, function(err) {
		if (err) return deferred.reject(err);
		return deferred.resolve(nutil.format('Removed symlink: %s', path));
	});

	return deferred.promise;
};


utils.makeGeneratorSymlink = function(from, to) {
	var deferred = Q.defer();
	var isWindows = 'win32' === process.platform;

	// Must symlink the generator from xtc's modules up to the project's modules.
	// Else Yeoman won't find it.

	// symlink, junction permissions etc on windows:
	// http://superuser.com/a/343079
	var linkVerb = isWindows ? 'junction' : 'symlink';
	// we can use sane relative symlinks everywhere, except on Windows
	// "Windows junction points require the destination path to be absolute. When using 'junction', the destination argument will automatically be normalized to absolute path."
	to = isWindows ? to : path.relative(path.resolve(from, '..'), to);

	 // junction: used on windows instead of symlink (where symlinks need admin permissions)
	symlink.mk(from, to, 'junction', function(err) {

		if (err) {
			if ('EEXIST' === err.code) {
				return deferred.reject(new Error(nutil.format('%s: generator-xtc already exists in node_modules\n', linkVerb)));
			}
			else if ('EPERM' === err.code) {
				return deferred.reject(new Error(nutil.format('permission error: creating %s to generator-xtc\n%s --> %s\n', linkVerb, src, dest)));
			}
			return deferred.reject(err);
		}

		return deferred.resolve(nutil.format('Created %s: %s --> %s\n', linkVerb, from, to));
	});

	return deferred.promise;
};


utils.pkgInfo = function pkgInfo(moduleName) {

	var Client = require('npm-pkginfo')
		,client
		,deferred = Q.defer()
	;

	// note: the memory store is only for testing / examples
	// in production you should either use the fsStore (see commented lines below)
	// or another custom store
	/*client = new Client({
		cacheStore: new Client.stores.memory()
	});*/

	// Uncomment below to use the fs cache store
	client = new Client({
		cacheDir: path.resolve(__dirname, '../cache')
	});

	// fetch a module from NPM
	client.get(moduleName, function(err, pkg) {
		if (err) {
			deferred.reject(err);
		}
		else {
			deferred.resolve(pkg ? Object.keys(pkg.versions) : null);
		}
	});

	return deferred.promise;
};


utils.nl = function nl(count) {
	count = count || 1;

	while (count > 0) {
		console.log('');
		count--;
	}
};


utils.prompt = function prompt(prompt) {
	var deferred = Q.defer();
	inquirer.prompt(prompt, deferred.resolve);
	return deferred.promise;
};


/**
 * Exit the process.
 * @param {number} [code=1] Exit Code
 * @param {string} [message] Error message
 * @param {...string} [logArgs] additional arguments to the console.log function
 * @api public
 */
utils.fail = function fail(code, message, logArgs) {
	logArgs = Array.prototype.slice.call(arguments, 2);
	logArgs.unshift('\n'+ c.red(message) +'\n');

	message && console.log.apply(null, logArgs);
	process.exit(code || 1);
};

/**
 * Print the stack of the supplied error and exit.
 * @param {error} err
 * @api public
 */
utils.trace = function trace(err) {
	var code;
	console.assert(err instanceof Error, 'err is not of type Error');
	err.code === typeof Number && (code = err.code);
	utils.fail(code, err.stack);
};