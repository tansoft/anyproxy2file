# 本工具用于抓包并把文件直接保存下来

## 环境要求
* ruby
* curl

## 使用方法
``` bash
./start.sh
```
* 抓包机器设置代理到 http://xxxx:8001/
* 抓包机器需要先安装根证书，在 http://xxxx:8002/ RootCA 扫二维码或下载rootca导入
* 访问 http://xxxx:8002/ 进行抓包观察
* 文件保存在 data 目录中
* http://xxxx:8003/ 是一个简单的http服务，代码参见webParser.js