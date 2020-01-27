'use strict';
const querystring = require('querystring'),
    fs = require('fs'),
    request = require('request'),
    shelljs = require('shelljs'),
    url = require('url'),
    buffer = require('buffer'),
    crypto = require('crypto');

class utils{
    constructor(){
        this.webBasePath = 'web',
        this.dataPath = 'data';
    }
    parseJson(str) {
        /*
            case 1:
                https://www.cnblogs.com/jun-tao/p/3707663.html
            case 2:
                var code = '"\u2028\u2029"';
                JSON.parse(code); // evaluates to "\u2028\u2029" in all engines
                eval(code); // throws a SyntaxError in old engines
        */
       if (typeof str != 'string') str = str.toString();
        var obj;
        try{
            obj = JSON.parse(str);
        } catch(e) {
          //console.log(e);
          try {
              obj = eval('('+str+')');
          } catch(e) {
              console.log(e);
          }
        }
        return obj;
    }
    scanFiles(scanPath, cb) {
        if (typeof scanPath == 'string') {
            scanPath = [scanPath];
        }
        for(var i=0; i< scanPath.length; i++) {
            var curPath = scanPath[i];
            if(fs.existsSync(curPath) && fs.statSync(curPath).isDirectory()){
                var dirList = fs.readdirSync(curPath);
                var realpath, finfo, children, stat;
                if(dirList.length>0){
                    for(var file of dirList){
                        realpath = curPath + '/' + file;
                        stat = fs.statSync(realpath);
                        finfo = {name: file, path: realpath, isFile: stat.isFile(), size: stat.size, mtime: Math.floor(stat.mtimeMs/1000), ctime: Math.floor(stat.ctimeMs/1000)};
                        if(stat.isFile()){
                            if (!cb(finfo)) {
                                return false;
                            }
                        } else {
                            if (!this.scanFiles(realpath, cb)) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }
    /**
     * 扫描文件夹
     * @param scanPath 字符串路径 或 路径数组
     * @param flat 返回数据是否分层
     * @returns {Array}
     */
    scanFolder(scanPath, flat = false, files = []){
        if (typeof scanPath == 'string') {
            scanPath = [scanPath];
        }
        for(var i=0; i< scanPath.length; i++) {
            var curPath = scanPath[i];
            if(fs.existsSync(curPath) && fs.statSync(curPath).isDirectory()){
                var dirList = fs.readdirSync(curPath);
                var realpath, finfo, children, stat;
                if(dirList.length>0){
                    for(var file of dirList){
                        realpath = curPath + '/' + file;
                        stat = fs.statSync(realpath);
                        finfo = {name: file, path: realpath, isFile: stat.isFile(), size: stat.size, mtime: Math.floor(stat.mtimeMs/1000), ctime: Math.floor(stat.ctimeMs/1000)};
                        if(stat.isFile()){
                            files.push(finfo);
                        } else {
                            if (flat) {
                                files.push(finfo);
                                files = this.scanFolder(realpath, flat, files);
                            } else {
                                children = this.scanFolder(realpath, flat);
                                if(children.length>0){
                                    Object.assign(finfo,{"children":children});
                                }
                                files.push(finfo);
                            }
                        }
                    }
                }
            }
        }
        return files;
    }
    //获取post上传的参数
    postParam(req, item){
        var param = querystring.parse(req.requestData.toString());
        //if (param.hasOwnProperty(item)) {
        if (param[item]) {
            return param[item];
        }
        return null;
    }
    //保存key/value值到配置文件中
    //oper = push 增加到数组尾，add/remove：从对象中增加或删除，其他：直接赋值
    saveKey(file, key, value, oper=null) {
        var infofile = this.dataPath + '/' + file;
        var obj = {};
        if (!fs.existsSync(infofile)) {
            var dir = infofile.substring(0, infofile.lastIndexOf('/'));
            fs.mkdirSync(dir, {recursive: true});
        } else {
            obj = this.parseJson(fs.readFileSync(infofile));
        }
        if (oper == 'push') {
            if (obj[key]) {
                obj[key].push(value);
            } else {
                obj[key] = [value];
            }
        } else if (oper == 'add') {
            if (key == '') {
                obj[value] = value;
            } else {
                if (!obj[key]) {
                    obj[key] = {};
                }
                obj[key][value]=value;
            }
        } else if (oper == 'remove') {
            if (key == '') {
                if (obj[value]) {
                    delete obj[value];
                }
            } else {
                if (obj[key] && obj[key][value]) {
                    delete obj[key][value];
                }
            }
        } else {
            obj[key] = value;
        }
        fs.writeFileSync(infofile, JSON.stringify(obj));
    }
    //保存文件
    saveFile(fileurl, cnt, existOverwrite = false) {
        var pathinfo = url.parse(fileurl);
        var infofile = '/' + pathinfo.hostname + pathinfo.pathname;
        if (infofile.substring(infofile.length-1) == '/') infofile += 'index';
        if (fs.existsSync(this.dataPath + infofile)) {
            if (existOverwrite) {
                fs.unlinkSync(this.dataPath + infofile);
            } else {
                if (fs.readFileSync(this.dataPath + infofile) == cnt) {
                    return
                }
                var idx = 0;
                while(true){
                    idx++;
                    if (!fs.existsSync(this.dataPath + infofile + '.' + idx)) {
                        break;
                    }
                    if (fs.readFileSync(this.dataPath + infofile + '.' + idx) == cnt) {
                        return
                    }
                }
                infofile += '.' + idx;
            }
        }
        var dir = infofile.substring(0, infofile.lastIndexOf('/'));
        fs.mkdirSync(this.dataPath + dir, {recursive: true});
        fs.writeFileSync(this.dataPath + infofile, cnt);
    }
    //下载文件，如果文件存在则跳过
    downloadFile(fileurl, headers = null) {
        var pathinfo = url.parse(fileurl);
        var infofile = '/' + pathinfo.hostname + pathinfo.pathname;
        if (infofile.substring(infofile.length-1) == '/') infofile += 'index';
        var opt = {
            headers: {
              'User-Agent': 'Downloader',
            }
        };
        if (headers) {
            for(var key in headers) {
                opt['headers'][key] = headers[key];
            }
        }
        opt['url'] = fileurl;
        if (!fs.existsSync(this.dataPath + infofile)) {
            console.log('downloading ' + infofile);
            var dir = infofile.substring(0, infofile.lastIndexOf('/'));
            fs.mkdirSync(this.dataPath + dir, {recursive: true});
            request(opt).pipe(fs.createWriteStream(this.dataPath + infofile));
        }
        return infofile;
    }
    //把图片统一转成jpg格式
    parseImage(imgurl) {
        //http://img.xxx.com/538ffe03bf05424baa8421b1cd51b351.webp
        var pathinfo = url.parse(imgurl);
        var format = '.jpg';
        var icon = '/' + pathinfo.hostname + pathinfo.pathname;
        if (fs.existsSync(this.dataPath + icon)) {
            if (!fs.existsSync(this.dataPath + icon + format)) {
                //images(this.dataPath + icon).save(this.dataPath + icon + '.jpg');
                if (shelljs.exec('ffmpeg -i "' + this.dataPath + icon + '" "' + this.dataPath + icon + format + '"').code != 0) {
                    if (fs.existsSync(this.dataPath + icon + format)) {
                        fs.unlinkSync(this.dataPath + icon + format);
                    }
                }
            }
            icon += format;
            if (fs.existsSync(this.dataPath + icon)) {
                return icon;
            }
        } else {
            console.log('not found:' + icon);
        }
        return null;
    }
    readJson(path, obj = {}) {
        try{
            obj = this.parseJson(fs.readFileSync(path));
        } catch(e) {
            console.log('error read json:' + path + ',msg:' + e);
        }
        return obj;
    }
    hashkey(data) {
        return crypto.createHash('md5WithRSAEncryption').update(Buffer.from(data).toString('binary')).digest('hex');
    }
    asyncPost(url, param) {
        console.log('asyncPost:' + url + ',' + JSON.stringify(param));
        var ut = this;
        return new Promise(function(resolve, reject){
            request({
                    method: 'POST',
                    uri: url,
                    formData: param,
                }, function(err, httpResponse, body) {
                    if (err) {
                        console.error('upload failed:', err);
                        reject(err);
                    } else {
                        var data = ut.parseJson(body);
                        if (data && data.status == 200) {
                            resolve(data);
                        } else {
                            reject(data);
                        }
                    }
                });
        });
    }
    waitAsyncStatus(options, resolve, reject) {
        var ut = this;
        request(options, function(err, httpResponse, body) {
            if (err) {
                console.error('upload failed:', err);
                reject(err);
            } else {
                var data = ut.parseJson(body);
                if (data && data.status == 200) {
                } else {
                    reject('return is not json format' + body);
                }
            }
        });
    }
    isIngoreHost(host) {
        var ingoreHost = {'ws.xxx.com:443':1}
        if (ingoreHost[host]) return true;
        return false;
    }
    isNeedHost(host) {
        var needhost = ['xxx.com','xxy.com','xxz.com'];
        for(var i = 0; i < needhost.length; i++) {
            if (host.indexOf(needhost[i]) != -1) return true;
        }
        return true;
        //return false;
    }
}
module.exports=utils;
