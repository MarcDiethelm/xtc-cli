// todo: spin off as a module? https://github.com/fs-utils/symlink/blob/master/index.js

var fs      = require('fs');
var nutil   = require('util');
var path    = require('path');
var symlink = {};

/**
 * Async symlink check
 * @param fromPath
 * @param callback This is where JSDoc begins to really suck.
 * Callback params: err, linkPath, is_absolute
 */
symlink.check = function checkSymlink(fromPath, callback) {
	var linkPath;
	var is_absolute;
	var customErr;
	var targetPath;

	fs.lstat(fromPath, function(err, Stat) {

		if (err) {
			if (err.code && err.code === 'ENOENT') {
				customErr = new Error(nutil.format('no such link: %s', fromPath));
				customErr.code = 'ENOENT';
				return callback(customErr);
			}
			return callback(err);
		}

		if (!Stat.isSymbolicLink() ) {
			customErr = new Error(nutil.format('is not a symlink: %s', fromPath));
			customErr.code = 'NOTALINK';
			return callback(customErr);
		}

		// check if we have a broken link
		targetPath = linkPath = fs.readlinkSync(fromPath);
		is_absolute = isAbsolute(linkPath);

		if (!is_absolute) {
			targetPath = path.resolve(fromPath, '..', linkPath);
		}

		fs.open(targetPath, 'r', function(err) {
			if (err) {
				customErr = new Error(nutil.format('broken link: %s --> %s', fromPath, linkPath));
				customErr.code = 'BROKENLINK';
				return callback(customErr);
			}

			return callback(null, linkPath, is_absolute);
		});
	});
};



symlink.mk = function(from, to, type, callback) {

	fs.symlink(to, from, type, callback);

/*	try {
		fs.symlinkSync(to, from, 'junction'); // junction: used on windows instead of symlink (where symlinks need admin permissions)
		//console.log(nutil.format('%s: generator-xtc into node_modules\n', linkVerb));
	} catch (e) {
		callback(e);
	}

	callback(null);*/
};


symlink.rm = function(from, callback) {

	fs.unlink(from, callback);

	/*try {
		fs.unlinkSync(from);
		console.log(nutil.format('%s: removed generator-xtc from node_modules\n', linkVerb));
	} catch (e) {
		if ('ENOENT' === e.code) {
			console.info(nutil.format('%s: remove failed, generator-xtc not found in node_modules\n', linkVerb));
		}
		else {
			e.message = nutil.format('%s: unable to remove generator-xtc from node_modules\n', linkVerb) + e.message;
			throw e;
		}
	}*/
};

module.exports = symlink;

/**
 * Check if a path is absolute or relative
 * http://stackoverflow.com/a/24225816/546491
 * @private
 * @param _path
 * @returns {boolean}
 */
function isAbsolute(_path) {
	return path.resolve(_path) === path.normalize(_path).replace(/(.+)([\/|\\])$/, '$1');
}