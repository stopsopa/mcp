set -e
set -x
(
    rm -rf dist.js
    ln node_modules/@modelcontextprotocol/server-filesystem/dist/index.js dist.js
)