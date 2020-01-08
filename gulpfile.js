/*
* 针对多页面应用
* 压缩html、css、js、图片
*	编译ES6、less/scss
*	补全css前缀
*	监听文件变化
*   ts
* */
const {src, dest, task, series, watch, parallel} = require('gulp');
const del = require('del');//删除文件
const connect = require('gulp-connect');
//localhost
// const browserSync = require('browser-sync').create();
// const reload = browserSync.reload;

const babel = require('gulp-babel');//编译es6
const less = require('gulp-less');//加载less模块
const css_base64 = require('gulp-css-base64');
const autoPreFixer = require('gulp-autoprefixer');//补全css前缀
const fileInclude = require('gulp-file-include');//引入文件

const minifyJS = require('gulp-uglify');//压缩代码
const minifyCss = require('gulp-clean-css');//压缩css
const minifyHtml = require('gulp-htmlmin');//html 压缩
const minifyImage = require('gulp-imagemin');//图片压缩

const rev = require('gulp-rev');
const revAll = require('gulp-rev-all');//hash
const revCollector = require('gulp-rev-collector');//根据rev生成的manifest.json文件中的映射, 去替换文件名称, 也可以替换路径

const revDel = require('gulp-rev-delete-original');//Delete the original file rewritten by gulp-rev-all.

const browserify = require('browserify');
const sourcemaps = require('gulp-sourcemaps');

const srcPath = {
	root: 'src',
	// html: 'src/**/*.html',//include是公用部分html
	html: ['src/**/*.html', '!src/include/**/*.html'],//include是公用部分html
	images: 'src/img/*',
	js: 'src/js/*.js',
	css: 'src/css/*.less',
	library: 'src/library/*.js'
};
const distPath = {
	root: 'dist',
	html: 'dist',
	images: 'dist/img',
	js: 'dist/js/',
	css: 'dist/css/',
	library: 'src/library/',
	manifest: 'dist/**/*.json'
};


/*html,image,css,js区分prod和dev*/
/*生产环境*/
task('css-build', () => (
	src(srcPath.css)
		.pipe(css_base64({
			maxWeightResource: 8 * 1024
		}))
		.pipe(less())
		.pipe(autoPreFixer({
			overrideBrowserslist: [
				'Android 4.1',
				'iOS 7.1',
				'Chrome > 31',
				'ff > 31',
				'ie >= 8'
			],
			cascade: false
		}))
		.pipe(minifyCss())
		// .pipe(revAll.revision())
		.pipe(rev())
		.pipe(dest(distPath.css))
		// .pipe(revAll.manifestFile({ merge: true}))
		.pipe(rev.manifest({
			merge:true
		}))
		.pipe(dest(distPath.css))
));
task('js-build', () => (
	src(srcPath.js)
		.pipe(babel({
			presets: ['@babel/env'],
			plugins: ['@babel/plugin-transform-runtime']
		}))
		.pipe(minifyJS())
		// .pipe(revAll.revision())
		.pipe(rev())
		.pipe(dest(distPath.js))
		// .pipe(revAll.manifestFile({ merge: true}))
		.pipe(rev.manifest({
			merge:true
		}))
		.pipe(dest(distPath.js))
));
task('library-build', () => (
	src(srcPath.library)
		.pipe(minifyJS())
		.pipe(dest(distPath.library))
));
task('images-build', () => (
	src(srcPath.images)
		// .pipe(minifyImage())
		// .pipe(revAll.revision())
		.pipe(rev())
		.pipe(dest(distPath.images))
		// .pipe(revAll.manifestFile({ merge: true}))
		.pipe(rev.manifest({
			merge:true
		}))
		.pipe(dest(distPath.images))
))
;
task('html-build', () => (
	src([distPath.manifest, ...srcPath.html])
		.pipe(fileInclude({
			prefix: '@@',//变量前缀 @@include
			basepath: './src/include',//引用文件路径
			indent: true//保留文件的缩进
		}))
		.pipe(revCollector({
			replaceReved: true,
		}))
		.pipe(minifyHtml({collapseWhitespace: true}))
		.pipe(dest(distPath.html))
));
/*开发环境*/
task('css-dev', () => (
	src(srcPath.css)
		.pipe(less())//执行less
		.pipe(autoPreFixer({
			overrideBrowserslist: [
				'Android 4.1',
				'iOS 7.1',
				'Chrome > 31',
				'ff > 31',
				'ie >= 8'
			],
			cascade: false
		}))
		.pipe(dest(distPath.css))
		.pipe(connect.reload())
));
task('js-dev', () => (
	src(srcPath.js)
		.pipe(babel({
			presets: ['@babel/env'],
			plugins: ['@babel/plugin-transform-runtime']
		}))
		.pipe(dest(distPath.js))
		.pipe(connect.reload())
));
task('library-dev', () => (
	src(srcPath.library)
		.pipe(dest(distPath.library))
		.pipe(connect.reload())
));
task('images-dev', () => (
	src(srcPath.images)
		.pipe(dest(distPath.images))
		.pipe(connect.reload())
));
task('html-dev', () => {
	return (
		src(srcPath.html)
			.pipe(fileInclude({
				prefix: '@@',//变量前缀 @@include
				basepath: './src/include',//引用文件路径
				indent: true//保留文件的缩进
			}))
			.pipe(minifyHtml({collapseWhitespace: true}))
			.pipe(dest(distPath.html))
			.pipe(connect.reload())
	);
});


task('server', done => {
	connect.server({
		root: 'dist',//根目录
		livereload: true,//自动更新
		port: 9000//端口
	});
	done();
});
//清除dist
task('clean', () => del([distPath.root]));
//清除manifest
task('clean-manifest', () => del([distPath.manifest]));
// //静态服务器
// task('browserSync', () => {
// 	browserSync.init({
// 		server: {
// 			baseDir: './dist'
// 		}
// 	});
// });


/*监听文件*/
task('watcher', done => {
	watch(srcPath.html, series('html-dev'));
	watch(srcPath.css, series('css-dev'));
	watch(srcPath.js, series('js-dev'));
	watch(srcPath.images, series('images-dev'));
	watch(srcPath.library, series('library-dev'));
	done();
});

task('dev', series(
	'clean',
	parallel(
		'html-dev',
		'js-dev',
		'css-dev',
		'images-dev',
		'library-dev'
	),
	'server',
	'watcher'
));
task('build', series(
	'clean',
	parallel(
		'js-build',
		'images-build',
		'library-build',
		'css-build'
	),
	'html-build',
	// 'clean-manifest'
));

// task('init', series('clean', parallel('html', 'less', 'js', 'images')));
// task('default', series('init', 'server', 'watcher'));
// task('build', series('init', 'build'));
