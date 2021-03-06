const basePaths = '';
const baseConfig = {
	srcPath: {
		root: basePaths + 'src',
		html: basePaths + 'src/*.html',
		css: basePaths + 'src/css/*.less',
		js: basePaths + 'src/js/*.js',
		images: basePaths + 'src/img/*'
	},
	distPath: {
		root: basePaths + 'dist',
		html: basePaths + 'dist',
		css: basePaths + 'dist/css/',
		js: basePaths + 'dist/js/',
		images: basePaths + 'dist/img',
		manifestPath: 'dist/rev-manifest.json',
		manifestBase:'dist',
	},
	pathsTest: {
		root: basePaths + '/dist_test',
		html: basePaths + '/dist_test',
		css: basePaths + '/dist_test/css/',
		js: basePaths + '/dist_test/js/',
		images: basePaths + '/dist_test/img',
		manifest: 'dist/**/*.json'
	},
	buildPath: {
		root: basePaths + 'build',
		html: basePaths + 'build',
		css: basePaths + 'build/css',
		js: basePaths + 'build/js',
		images: basePaths + 'build/img',
		manifestPath: 'build/rev-manifest.json',
		manifestBase:'build',
	},
	autoPreFixerConfig: {
		overrideBrowserslist: ['last 2 version']
	},
};
module.exports = baseConfig;
