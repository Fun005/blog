
var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');
    Comment = require('../models/Comment.js');
var passport = require('passport');

module.exports = function(app){
  app.get('/', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第 page 页的 10 篇文章
    Post.getTen(null, page, function (err, posts, total) {
      if (err) {
        posts = [];
      } 
      res.render('index', {
        title: '主页',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) === 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reg',checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg',checkNotLogin);
  app.post('/reg',function(req,res){
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if(password_re != password){
      req.flash('error','两次输入的密码不一致！');
      return res.redirect('/reg');
    }
    //生成密码的md5值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: req.body.name,
        password: password,
        email:req.body.email
    });
    //检查用户名是否存在
    User.get(newUser.name,function(err,user){
      if(user){
        req.flash('error','用户已存在!');
        return res.redirect('/reg');//用户名存在则返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function(err,user){
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user = user;//用户信息存入session
        req.flash('success','注册成功!');
        res.redirect('/');//注册成功后返回主页
      });
    });
  });

  app.get('/login',checkNotLogin);
  app.get("/login/github", passport.authenticate("github", {session: false}));
app.get("/login/github/callback", passport.authenticate("github", {
  session: false,
  failureRedirect: '/login',
  successFlash: '登陆成功！'
}), function (req, res) {
  req.session.user = {name: req.user.username, head: "https://gravatar.com/avatar/" + req.user._json.gravatar_id + "?s=48"};
  res.redirect('/');
});
  app.get('/login',function(req,res){
  	res.render('login',{
      title:'登录',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });

  app.post('/login',checkNotLogin);
  app.post('/login',function(req,res){
    //生成密码的md5值
    var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name,function(err,user){
      if(!user){
        req.flash('error','用户不存在！');
        return res.redirect('/login');//用户不存在跳到登录页
      }
      //检查密码一致
      if(user.password!=password){
        req.flash('error','密码错误!');
        return res.redirect('/login');//跳到登录页
      }
      //用户名密码都匹配后，将用户信息存入session
      req.session.user = user;
      req.flash('success','登陆成功！');
      res.redirect('/');
    });
  });

  app.get('/post',checkLogin);
  app.get('/post',function(req,res){
  	res.render('post',{
      title:'发表',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });

  app.post('/post',checkLogin);
  app.post('/post',function(req,res){
    var currentUser = req.session.user,
        tags = [req.body.tag1,req.body.tag2,req.body.tag3],
        post = new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
    post.save(function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      req.flash('success','发布成功！');
      res.redirect('/');
    });
  });

  app.get('/logout',checkLogin);
  app.get('/logout',function(req,res){
    req.session.user = null;
    req.flash('success','登出成功！');
    res.redirect('/');//登出后跳到主页
  });

  app.get('/upload',checkLogin);
  app.get('/upload',function(req,res){
    res.render('upload',{
      title:'文件上传',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });

  app.get('/archive',function(req,res){
    Post.getArchive(function(err,posts){
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('archive',{
        title:'存档',
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });

  app.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('tags', {
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/links',function(req,res){
    res.render('links',{
      title:'友情链接',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });

  app.get('/search',function(req,res){
    Post.search(req.query.keyword,function(err,posts){
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('search',{
        title:"SEARCH:"+req.query.keyword,
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });

  app.get('/u/:name', function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    // User.get(req.params.name, function (err, user) {
    //   if (err) {
    //     req.flash('error', err); 
    //     return res.redirect('/');
    //   }
      // if (!user) {
      //   req.flash('error', '用户不存在!'); 
      //   return res.redirect('/');
      // }
      //查询并返回该用户第 page 页的 10 篇文章
      Post.getTen(user.name, page, function (err, posts, total) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        res.render('user', {
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) === 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    }); 
  // });

  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/u/:name/:day/:title',function(req,res){
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
               date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var comment = {
        name:req.body.name,
        head:head,
        email:req.body.email,
        website:req.body.website,
        time:time,
        content:req.body.content
    };
    var  newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
    newComment.save(function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      req.flash('success','留言成功！');
      res.redirect('back');
    });
  });

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      res.render('edit', {
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
      Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
      if (err) {
        req.flash('error', err); 
        return res.redirect(url);//出错！返回文章页
      }
      req.flash('success', '修改成功!');
      res.redirect(url);//成功！返回文章页
    });
  });

  app.get('/remove/:name/:day/:title',checkLogin);
  app.get('/remove/:name/:day/:title',function(req,res){
    var currentUser = req.session.user;
    Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','删除成功！');
      res.redirect('/');
    });
  });

  app.get('/reprint/:name/:day/:title', checkLogin);
  app.get('/reprint/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err);
        return res.redirect(back);
      } 
      var currentUser = req.session.user,
        reprint_from = {name: post.name, day: post.time.day, title: post.title},
        reprint_to = {name: currentUser.name, head: currentUser.head};
      Post.reprint(reprint_from, reprint_to, function (err, post) {
        if (err) {
          req.flash('error', err);
          return res.redirect('back');
        } 
        req.flash('success', '转载成功!');
        var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
        //跳转到转载后的文章页面
        res.redirect(url);
      });
    });
  });

  app.post('/upload',checkLogin);
  app.post('/upload',function(req,res){
    for(var i in req.files){
      if(req.files[i].size === 0){
        //使用同步方式删除一个文件
        fs.unlinkSync(req.files[i].path);
        console.log('成功移除一个空文件!');
      }else{
        var target_path='./public/images/'+req.files[i].name;
        //使用同步方式重命名一个文件
        fs.renameSync(req.files[i].path,target_path);
        console.log('成功重命名文件！');
      }
    }
    req.flash('success','上传文件成功！');
    res.redirect('/upload');
  });

  app.use(function(req,res){
    res.render("404");
  });

  function checkLogin(req,res,next){
    if(!req.session.user){
      req.flash('error','未登录！');
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req,res,next){
    if(req.session.user){
      req.flash('error','已登录！');
      res.redirect('back');
    }
    next();
  }
  
};

/*
req.body： 就是 POST 请求信息解析过后的对象，例如我们要访问用户传递的 name="password" 域的值，只需访问
req.body['password'] 或 req.body.password 即可。
res.redirect： 重定向功能，实现了页面的跳转，更多关于 res.redirect 的信息请查阅：http://expressjs.com/api.html#res.redirect
User：在前面的代码中，我们直接使用了 User 对象。User 是一个描述数据的对象，即 MVC 架构中的模型。前面我们使用了许多视图
和控制器，这是第一次接触到模型。与视图和控制器不同，模型是真正与数据打交道的工具，没有模型，网站就只是一个外壳，不能发
挥真实的作用，因此它是框架中最根本的部分
*/