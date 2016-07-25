var h = require('./helpers');
var PATH = require('path');
var archiver = require('archiver');
var fs = require('fs');
var ufs = require('@irysius/utils').fs;
var targz = require('tar.gz');

function Archive(context) {
	var t = h.targetPathResolver(context.cwd);
	function tar(directory, file = '') {
		var foldername = PATH.basename(directory);
		var zipFilename = PATH.resolve(context.cwd, foldername + '.tar.gz');
		var source = PATH.resolve(context.cwd, directory);
		return ufs.stat(source).then(stat => {
			if (!stat) {
				console.log('Missing source path for tar.');
			} else if (!stat.isDirectory()) {
				console.log('Expecting zip source path to be a directory.');
			} else {
				var output = fs.createWriteStream(zipFilename);
				var archive = archiver('tar', { gzip: true });
				process.stdout.write('Writing 0 bytes...');
				return new Promise((resolve, reject) => {
					output.on('close', () => {
						console.log('');
						console.log(`Archive complete at: ${zipFilename}`);
						resolve();
					});
					archive.on('entry', () => {
						process.stdout.clearLine();
						process.stdout.cursorTo(0);
						process.stdout.write(`Writing ${archive.pointer()} bytes...`);
					});
					archive.on('error', err => {
						reject(err);
					});
					archive.pipe(output);
					archive.directory(source, foldername);
					archive.finalize();
				});
			}
		});
	}

	function untar(file, directory = '') {
		var source = PATH.resolve(context.cwd, file);
		return ufs.stat(source).then(stat => {
			if (!stat) {
				console.log('Missing source file for untar.');
			} else if (!stat.isFile()) {
				console.log('Expecting untar source path to be a file.');
			} else {
				var folderName = directory || context.cwd;
				console.log(`Unpacking...`);
				return targz().extract(source, folderName).then(() => {
					console.log(`Unpack to ${folderName} complete`);
				});
			}
		});
	}

	return {
		tar: tar,
		untar: untar
	};
}

module.exports = Archive;