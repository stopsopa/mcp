// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=%2Fpages%2Fbash%2Fxx%2Fxx-template.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/pages/bash/xx/xx-template.cjs

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  
# git config core.excludesFile .git/.gitignore_local


# read

# source .env
# source .env.sh
export NODE_OPTIONS=""
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

EEE
      `,
      description: "Status of all things",
      confirm: false,
    },
    [`run mcp-client with intercept`]: {
      command: `   
cat <<EEE      
node mcp-client.js -- node intercept.js var/mcp-server-filesystem -- node node_modules/.bin/mcp-server-filesystem .

Runs http wrapper for MCP (node mcp-client.js)
and that wraps 'mcp-server-filesystem' installed via npm

but it doesn't run directly 'mcp-server-filesystem' MCP but first wraps it with 'intercept.js'
EEE

echo -e "\\n      Press enter to continue\\n"
read
node mcp-client.js -- node intercept.js var/mcp-server-filesystem -- node node_modules/.bin/mcp-server-filesystem .
      `,
      confirm: false,
    },
    [`add custom MCP to VSCode`]: {
      command: `   
cat <<EEE      

follow: https://youtu.be/ZoZxQwp1PiM?t=1352
and use command:

  /bin/bash pass_to_inspect.sh vscode:mcp

to add custom MCP to VSCode

that will generate what we have in .vscode/mcp.json


EEE
      `,
      confirm: false,
    },
    [`coverage`]: {
      command: `   
FILE="coverage/index.html"
# FILE="target/site/jacoco/index.html"
if [ ! -f "\${FILE}" ]; then

  cat <<EEE

  file >\${FILE}< doesn't exist
  
  to generate manually
  mvn clean test jacoco:report

EEE
  
  exit 1
fi  

FILE="file://\$(realpath "\${FILE}")"   

cat <<EEE

Ways to open:
    open "\${FILE}"
    open -a "Google Chrome" "\${FILE}"

EEE

echo -e "\\n      Press enter to continue\\n"
read

open "\${FILE}"
      `,
      confirm: false,
    },

    ...setup,
  };
};
