if [ "${1}" = "" ]; then

    echo "${0} error: missing argument"
    exit 1
fi

node intercept.js "var/${1}" -- node node_modules/.bin/tsx src/server.ts