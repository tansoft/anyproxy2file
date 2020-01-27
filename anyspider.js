'use strict';

const AnyProxy = require('anyproxy'),
  WebParser = require('./webParser');

if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
    AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
      // let users to trust this CA before using proxy
      if (!error) {
        const certDir = require('path').dirname(keyPath);
        console.log('The cert is generated at', certDir);
        /*const isWin = /^win/.test(process.platform);
        if (isWin) {
          exec('start .', { cwd: certDir });
        } else {
          exec('open .', { cwd: certDir });
        }*/
      } else {
        console.error('error when generating rootCA', error);
      }
    });
  }
const options = {
  port: 8001,
  rule: require('./rule'),
  webInterface: {
    enable: true,
    webPort: 8002
  },
  throttle: 10000,
  forceProxyHttps: false,
  wsIntercept: true, // websocket代理
  silent: false
};

const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => { /* */ });
proxyServer.on('error', (e) => { /* */ });

const webOptions = {
    webPort: 8003
};
var webParser = new WebParser(webOptions);
webParser.start().then(() => {
    proxyServer.start();
})
.catch((e) => {
  console.log(e);
  //this.emit('error', e);
});

//when finished
//proxyServer.close();
