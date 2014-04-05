var utils = module.exports;
var path = require('path');
var c = require('chalk');
var log = console.log;


utils.checkLocalXtc = function checkLocalXtc(env) {
	if (!env.modulePath) {
		log(c.red('No local xtc install found in'), c.magenta(env.cwd));
		log(c.red('Try running: npm install xtc'));
		//process.exit(1);
	}
};


utils.pkgInfo = function pkgInfo(moduleName, cb) {

	var Client = require('npm-pkginfo'),
		client
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
		cb(err, pkg ? Object.keys(pkg.versions) : null);
	});
};