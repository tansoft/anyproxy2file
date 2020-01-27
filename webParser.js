'use strict';

const DEFAULT_WEB_PORT = 8003; // port for web interface

const express = require('express'),
  url = require('url'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  path = require('path'),
  events = require('events'),
  juicer = require('juicer'),
  ip = require('ip'),
  compress = require('compression'),
  utils = require('./utils.js');
  //images = require('images');

const MAX_CONTENT_SIZE = 1024 * 2000; // 2000kb
/**
 *
 *
 * @class webParser
 * @extends {events.EventEmitter}
 */
class webParser extends events.EventEmitter {

  /**
   * Creates an instance of webParser.
   *
   * @param {object} config
   * @param {number} config.webPort
   *
   * @memberOf webParser
   */
  constructor(config) {
    super();
    const self = this;
    self.webPort = config.webPort || DEFAULT_WEB_PORT;
    self.config = config || {};

    self.app = this.getServer();
    self.server = null;
  }

  /**
   * get the express server
   */
  getServer() {
    const self = this;
    const ipAddress = ip.address();
      // userRule = proxyInstance.proxyRule,
    let ruleSummary = '',
      customMenu = [];
    var ut = new utils();

    try {
      ruleSummary = ''; //userRule.summary();
      customMenu = ''; // userRule._getCustomMenu();
    } catch (e) { }

    const myAbsAddress = 'http://' + ipAddress + ':' + self.webPort + '/',
      staticDir = path.join(__dirname, ut.webBasePath);

    const app = express();
    app.use(compress()); //invoke gzip
    app.use((req, res, next) => {
      res.setHeader('note', 'THIS IS A REQUEST FROM ANYPROXY WEB INTERFACE');
      return next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}))

    app.get('/sample-api', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      var id = null;
      var key;
      if (req.query && req.query.id) {
        id = req.query.id;
      }
      var settings = ut.readJson(ut.dataPath + '/settings.json', {name:{}, icon:{}});
      ut.scanFiles([ut.dataPath + '/files', ut.dataPath + '/files2'], function(obj) {
        obj = ut.parseJson(fs.readFileSync(path.join(ut.dataPath, '/file.dat'), { encoding: 'utf8' }));
        if (true) {
          return false;
        }
        return true;
      });
      //fs.unlinkSync(obj.path);
      var names = []
      //names.push({'a':'b'});
      names.sort(function (a, b) {
        return Math.round(Math.random())?1:-1;
      });
      // http://www.xxx.com/538ffe03bf05424baa8421b1cd51b351~200x200.webp.jpg
      var hashkey = img.split('.com/')[1].split('~')[0];
      var ret = []
      ret.push({type: 'message', value: '没有需要处理的数据了！'});
      res.json(ret);
    });

    app.use((req, res, next) => {
      const indexTpl = fs.readFileSync(path.join(staticDir, '/index.html'), { encoding: 'utf8' }),
        opt = {
          rule: ruleSummary || '',
          customMenu: customMenu || [],
          ipAddress: ipAddress || '127.0.0.1'
        };

      if (url.parse(req.url).pathname === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(juicer(indexTpl, opt));
      } else {
        next();
      }
    });
    //res.setHeader('Content-Type', mime.lookup(req.url));
    app.use(express.static(staticDir));
    return app;
  }

  start() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.server = self.app.listen(self.webPort);
      resolve();
    })
  }

  close() {
    this.server && this.server.close();
    this.server = null;
    this.proxyInstance = null;
  }
}

module.exports = webParser;
