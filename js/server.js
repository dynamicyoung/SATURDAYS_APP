var express = require('express');
var app = express();
var http = require('http').Server(app);

//express 指定 資料夾路徑到網頁
app.use("/", express.static(__dirname + '/'));

//指定 port  3000
http.listen(1234, function () {    
    console.log('listening on http://127.0.0.1:1234');
});