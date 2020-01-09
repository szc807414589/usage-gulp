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
// const revAll = require('gulp-rev-all');//hash
const revCollector = require('gulp-rev-collector');//根据rev生成的manifest.json文件中的映射, 去替换文件名称, 也可以替换路径
const jeditor = require('gulp-json-editor');


const sourcemaps = require('gulp-sourcemaps');
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
			// baseConfig.buildPath.manifest,
			// {
			// 	merge: true
			// }
		))
		.pipe(jeditor(function (json) {
			const newJson = {};
			for (let key in json){
				newJson[key.split('.css')[0] + '.less'] = json[key];
			}
			return newJson;
		}))
		.pipe(dest(baseConfig.buildPath.css))
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
			// baseConfig.buildPath.manifest,
			// {
			// 	merge: true
			// }
		))
		.pipe(dest(baseConfig.buildPath.js))
));
task('images-build', () => (
	src(baseConfig.srcPath.images)
		.pipe(minifyImage())
		.pipe(rev())
		.pipe(dest(baseConfig.buildPath.images))
		.pipe(rev.manifest(
			// baseConfig.buildPath.manifest,
			// {
			// 	merge: true
			// }
		))
		.pipe(dest(baseConfig.buildPath.images))
));
task('html-build', () => (
	src([baseConfig.buildPath.manifest, baseConfig.srcPath.html])
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
		.pipe(autoPreFixer(baseConfig.autoPreFixerConfig))
		.pipe(rev())
		.pipe(dest(baseConfig.distPath.css))
		.pipe(rev.manifest({
			merge: true
		}))
		.pipe(jeditor(function (json) {
			const newJson = {};
			for (let key in json){
				newJson[key.split('.css')[0] + '.less'] = json[key];
			}
			return newJson;
		}))
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
		.pipe(rev())
		.pipe(dest(baseConfig.distPath.js))
		.pipe(rev.manifest({
			merge: true
		}))
		.pipe(dest(baseConfig.distPath.js))
		.pipe(connect.reload())
));
task('images-dev', () => (
	src(baseConfig.srcPath.images)
		.pipe(rev())
		.pipe(dest(baseConfig.distPath.images))
		.pipe(rev.manifest({
			merge: true
		}))
		.pipe(dest(baseConfig.distPath.images))
		.pipe(connect.reload())
));
task('html-dev', () => {
	return (
		src([baseConfig.distPath.manifest, baseConfig.srcPath.html])
			.pipe(fileInclude({
				prefix: '@@',//变量前缀 @@include
				basepath: './src/include',//引用文件路径
				indent: true//保留文件的缩进
			}))
			.pipe(revCollector({
				replaceReved: true
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
//清除manifest
task('clean-manifest-build', () => del([baseConfig.buildPath.manifest]));
task('clean-manifest-dev', () => del([baseConfig.distPath.manifest]));

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
	parallel(
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
	parallel(
		'js-build',
		'images-build',
		'css-build'
	),
	'html-build'
	// 'clean-manifest-build'
));

// task('init', series('clean', parallel('html', 'less', 'js', 'images')));
// task('default', series('init', 'server', 'watcher'));
// task('build', series('init', 'build'));
