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
const revCollector = require('gulp-rev-collector');//根据rev生成的manifest.json文件中的映射, 去替换文件名称, 也可以替换路径
const jEditor = require('gulp-json-editor');
const cheerio = require('gulp-cheerio');//allows you to manipulate HTML and XML files using cheerio.

// const sourcemaps = require('gulp-sourcemaps');
const baseConfig = require('./gulp.config');

/*html,image,css,js区分prod和dev*/
/*生产环境*/
task('css-build', () => (
	src(baseConfig.srcPath.css)
		.pipe(css_base64({
			maxWeightResource: 8 * 1024
		}))
		.pipe(less())
		.pipe(autoPreFixer(baseConfig.autoPreFixerConfig))
		.pipe(minifyCss())
		.pipe(rev())
		.pipe(dest(baseConfig.buildPath.css))
		.pipe(rev.manifest(
			baseConfig.buildPath.manifestPath,
			{
				base: baseConfig.buildPath.manifestBase,
				merge: true
			}
		))
		.pipe(jEditor(function (json) {
			const newJson = {};
			for (let key in json){
				newJson[key.split('.css')[0] + '.less'] = json[key];
			}
			return newJson;
		}))
		.pipe(dest(baseConfig.buildPath.manifestBase))
));
task('js-build', () => (
	src(baseConfig.srcPath.js)
		.pipe(babel({
			presets: ['@babel/env'],
			plugins: ['@babel/plugin-transform-runtime']
		}))
		.pipe(minifyJS())
		.pipe(rev())
		.pipe(dest(baseConfig.buildPath.js))
		.pipe(rev.manifest(
			baseConfig.buildPath.manifestPath,
			{
				base: baseConfig.buildPath.manifestBase,
				merge: true
			}
		))
		.pipe(dest(baseConfig.buildPath.manifestBase))
));
task('images-build', () => (
	src(baseConfig.srcPath.images)
		.pipe(minifyImage())
		.pipe(rev())
		.pipe(dest(baseConfig.buildPath.images))
		.pipe(rev.manifest(
			baseConfig.buildPath.manifestPath,
			{
				base: baseConfig.buildPath.manifestBase,
				merge: true
			}
		))
		.pipe(dest(baseConfig.buildPath.manifestBase))
));
task('html-build', () => (
	src([baseConfig.buildPath.manifestPath, baseConfig.srcPath.html])
		.pipe(fileInclude({
			prefix: '@@',//变量前缀 @@include
			basepath: './src/include',//引用文件路径
			indent: true//保留文件的缩进
		}))
		.pipe(revCollector({
			replaceReved: true
		}))
		.pipe(minifyHtml({collapseWhitespace: true}))
		.pipe(dest(baseConfig.buildPath.html))
));
/*开发环境*/
task('css-dev', () => (
	src(baseConfig.srcPath.css)
		.pipe(css_base64({
			maxWeightResource: 8 * 1024
		}))
		.pipe(less())
		.pipe(dest(baseConfig.distPath.css))
		.pipe(connect.reload())
));
task('js-dev', () => (
	src(baseConfig.srcPath.js)
		.pipe(babel({
			presets: ['@babel/env'],
			plugins: ['@babel/plugin-transform-runtime']
		}))
		.pipe(minifyJS())
		.pipe(dest(baseConfig.distPath.js))
		.pipe(connect.reload())
));
task('images-dev', () => (
	src(baseConfig.srcPath.images)
		.pipe(dest(baseConfig.distPath.images))
		.pipe(connect.reload())
));
task('html-dev', () => {
	return (
		src([baseConfig.srcPath.html])
			.pipe(fileInclude({
				prefix: '@@',//变量前缀 @@include
				basepath: './src/include',//引用文件路径
				indent: true//保留文件的缩进
			}))
			.pipe(cheerio($ => {
				$('link').each((i, v) => {
					$(v).attr('href', $(v).attr('href').replace('.less', '.css'));
				});
			}))
			.pipe(minifyHtml({collapseWhitespace: true}))
			.pipe(dest(baseConfig.distPath.html))
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
task('clean-build', () => del([baseConfig.buildPath.root]));
task('clean-dev', () => del([baseConfig.distPath.root]));

/*监听文件*/
task('watcher', done => {
	watch(baseConfig.srcPath.html, series('html-dev'));
	watch(baseConfig.srcPath.css, series('css-dev'));
	watch(baseConfig.srcPath.js, series('js-dev'));
	watch(baseConfig.srcPath.images, series('images-dev'));
	done();
});

task('dev', series(
	'clean-dev',
	series(
		'js-dev',
		'css-dev',
		'images-dev'
	),
	'html-dev',
	'server',
	'watcher'
));
task('build', series(
	'clean-build',
	series(
		'css-build',
		'js-build',
		'images-build'
	),
	'html-build'
));

