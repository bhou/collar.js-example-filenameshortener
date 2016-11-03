const fs = require('fs');
const path = require('path');

module.exports = {
	shortenFilename: function (filepath, name, limit, done) {
		// get file name and extension
		var pathObject = path.parse(filepath);
		
		// build the new file path
		if (pathObject.name.length > limit) {
			pathObject.name = pathObject.name.substring(0, limit);
		}
		
		
		// set the output
		var newPath = path.format({
			dir: pathObject.dir,
			root: pathObject.root,
			name: pathObject.name,
			ext: pathObject.ext
		})

		// rename the file
		fs.rename(filepath, newPath, function(error) {
			if (error) {
				return done(error);
			}
			done(null, {path: newPath, name: pathObject.name + pathObject.ext});
		});
	}
}
