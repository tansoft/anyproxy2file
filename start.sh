#!/bin/bash

#检查系统环境中是否有可用的程序
checkfn(){
	# check if fn is already checked
	eval "chk=\"\$$1\""
	if [ ! -z "$chk" ]; then
		return 0
	fi
	for fn in "$@"
	do
		ret=`(which $fn) 2>/dev/null`
		if [ ! -z "$ret" ]; then
			eval "$1=\"$ret\""
			return 0
		fi
	done
	echo "[ERROR]$fn not found."
	return 1
}

checkfn ruby || exit 1
checkfn curl || exit 1
#install brew if not exist
checkfn brew || $ruby -e "$($curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
checkfn brew || exit 1
checkfn npm || brew install npm
checkfn npm || exit 1
checkfn anyproxy || npm install -g anyproxy
checkfn anyproxy || exit 1

cd `dirname $0`
#svn up
if [ ! -d 'node_modules/shelljs' ]; then
	npm update
#	cp -f hacker/anyproxy/lib/requestHandler.js node_modules/anyproxy/lib/requestHandler.js
#	cp -f hacker/anyproxy/bin/startServer.js node_modules/anyproxy/bin/startServer.js
#	cp -f hacker/anyproxy/proxy.js node_modules/anyproxy/proxy.js
#	cp -f hacker/anyproxy/dist/proxy.js node_modules/anyproxy/dist/proxy.js
#	#copy rootca if need
#	#cp -f hacker/rootCA.* ~/.anyproxy/certificates/
fi

#anyproxy --rule rule.js --intercept --ws-intercept --ignore-unauthorized-ssl

node anyspider.js
