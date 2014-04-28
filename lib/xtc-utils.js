var utils = module.exports;
var path = require('path');
var inquirer = require('inquirer');
var c = require('chalk');
var Q = require('q');
var log = console.log;


utils.checkLocalXtc = function checkLocalXtc(env) {
	if (!env.modulePath) {
		log(c.red('No local xtc install found in'), c.magenta(env.cwd));
		utils.fail();
	}
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
 * @param {number} [code=1]
 * @param {string} [message]
 * @api public
 */
utils.fail = function fail(code, message) {
	message && console.log('\n'+ c.red(message) +'\n');
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