
/**
 * Module dependencies.
 */

var express = require('express');
// var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var express = require('express');
// var favicon = require('serve-favicon');
// var logger = require('morgan');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
// var session = require('express-session');
// var multer  = require('multer');
var routes = require('./routes/index');
var flash = require('connect-flash');
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags:'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});
var app = express();
var passport = require('passport'),GithubStrategy=require('passport-github').Strategy;


// all environments
app.set('port', process.env.PORT || 3000);//设置端口为  process.env.PORT 或  3000
app.set('views', path.join(__dirname, 'views'));//设置 views 文件夹为存放视图文件的目录，
//即存放模板文件，__dirname 为全局变量，存储着当前正在执行脚本所在的目录名
app.set('view engine', 'ejs');//设置视图模版引擎为 ejs
//app.use(express.favicon());connect 内建的中间件，使用默认的 favicon 图标，
// 如果想使用自己的图标，需改为app.use(express.favicon(__dirname 
// + '/public/images/favicon.ico'));
// 这里我们把自定义的 favicon.ico 放到了 public/images 文件夹下
app.use(flash());
app.use(express.favicon(__dirname + '/public/images/favicon.ico')); 
app.use(express.logger('dev'));//connect 内建的中间件，在开发环境下使用，在终端显示简单的日志
app.use(express.logger({stream:accessLog}));
app.use(express.json());
//app.use(express.bodyParser({keepExtensions:true,uploadDir:'./public/images'}));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());	//Cookie 解析的中间件
app.use(express.session({			//提供会话支持
	secret:settings.cookieSecret,	//secret 用来防止篡改 cookie
	key:settings.db,				//key 的值为cookie 的名字
	cookie:{maxAge:1000 * 60 * 60 * 24 * 30},	//30days
	store:new MongoStore({		//store 参数为MongoStore 实例，
		db:settings.db,			//把会话信息存储到数据库中，以避免丢失
	    url:'mongodb://localhost/blog'
	})
}));

app.use(passport.initialize());//初始化 Passporte

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err,req,res,next){
	var meta = "["+new Date()+']'+req.url+'\n';
	errorLog.write(meta+err.stack+'\n');
	next();
});

passport.use(new GithubStrategy({
  clientID: "cd6bb6fb7356b6b2774a",
  clientSecret: "fdfc2bc66c99eb581f5ce65cad06359ddef078ec",
  callbackURL: "http://localhost:3000/login/github/callback"
}, function(accessToken, refreshToken, profile, done) {
  done(null, profile);
}));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

routes(app);