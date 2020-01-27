'use strict';

const querystring = require('querystring'),
  clc = require('cli-color'),
  url = require('url'),
  utils = require('./utils.js');
var ut = new utils();

module.exports = {
  // 模块介绍
  summary: 'AnyProxy文件保存',
  // 发送请求前拦截处理
  *beforeSendRequest(requestDetail) {
    if (requestDetail.requestOptions.hostname == 'log.xxx.com') {
      return {response: {statusCode: 200, header: { 'content-type': 'application/json; charset=utf-8' },
        body: '{"message":"success","server_time":' + Math.floor(Date.now()/1000) + '}'}};
    }
  },
  // 发送响应前处理
  *beforeSendResponse(requestDetail, responseDetail) {
    if (ut.isNeedHost(requestDetail.requestOptions.hostname)) {
      //console.log(clc.red(requestDetail.requestOptions.hostname + ' -> ' + requestDetail.requestOptions.path));
      if ((responseDetail.response.statusCode == 200 || responseDetail.response.statusCode == 206) &&
        (requestDetail.requestOptions.method == 'GET' || requestDetail.requestOptions.method == 'POST')) {
        var pathinfo = url.parse(requestDetail.url);
        /*
Url {
  protocol: 'http:',
  slashes: true,
  auth: null,
  host: 'q.q.com:20',
  port: '20',
  hostname: 'q.q.com',
  hash: '#hdew',
  search: '?dsd=fed&edw=12',
  query: 'dsd=fed&edw=12',
  pathname: '/ade/dewd.php',
  path: '/ade/dewd.php?dsd=fed&edw=12',
  href: 'http://q.q.com:20/ade/dewd.php?dsd=fed&edw=12#hdew' }
Url {
  protocol: 'https:',
  slashes: true,
  auth: null,
  host: 'q.q.com',
  port: null,
  hostname: 'q.q.com',
  hash: '#hdew',
  search: '?dsd=fed&edw=12',
  query: 'dsd=fed&edw=12',
  pathname: '/ade/dewd.php',
  path: '/ade/dewd.php?dsd=fed&edw=12',
  href: 'https://q.q.com/ade/dewd.php?dsd=fed&edw=12#hdew'
        */
        var host = pathinfo.hostname;
        var path = pathinfo.pathname;
        var param = pathinfo.query;
        var obj;
        //console.log(clc.green(host + path) + ':' + clc.blue(param));
        switch(host) {
          case 'api.xxx.com':
          case 'api2.xxx.com':
            switch(path) {
              case '/feed/':
              case '/users/':
                obj = ut.parseJson(responseDetail.response.body);
                if (obj.status_code == 0) {
                  console.log(clc.green('获得'+obj.data.data.length+'条信息'));
                  for(var idx in obj.data.data) {
                    var item = obj.data.data[idx].item;
                    if (!item) continue;
                  }
                }
                break;
              case '/comment/':
                param = querystring.parse(param);
                var post_id = ut.postParam(requestDetail, 'id');
                if (param.get_id && post_id) {
                }
                break;
              default:
            }
            break;
          default:
            if (host == 'qiniuuwmp3.changba.com') {
              console.log(requestDetail);
              console.log(responseDetail);
            }
            if (responseDetail.response.statusCode == 206) {
            //if (requestDetail.requestOptions.headers['Range']) {
              var headers = {}
              var needheaders = ['User-Agent','Cookie']
              for(var i = 0; i < needheaders.length; i++) {
                if (requestDetail.requestOptions.headers[needheaders[i]]) {
                  headers[needheaders[i]] = requestDetail.requestOptions.headers[needheaders[i]];
                }
              }
              ut.downloadFile(requestDetail.url, headers);
            } else {
              ut.saveFile(requestDetail.url, responseDetail.response.body);
            }
        }
      }
    }
  },
  // 是否处理https请求
  *beforeDealHttpsRequest(requestDetail) {
    //console.log(clc.red(requestDetail.host));
    if (ut.isIngoreHost(requestDetail.host)) return false;
    if (ut.isNeedHost(requestDetail.host)) return true;
    return true;
    //return false;
  },
  // 请求出错的事件
  *onError(requestDetail, error) { /* ... */ },
  // https连接服务器出错
  *onConnectError(requestDetail, error) { /* ... */ }
};

