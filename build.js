const { contentSecurityPolicy, mimeTypes } = require("./src/config.js");

const fs = require("fs").promises;
const { build } = require("electron-builder");

(async function() {
    var appInfo = JSON.parse(await fs.readFile("package.json"));

    const fileAssociations = [
      {
        "ext": "fic",
        "name": appInfo.name + " Canvas Data",
        "role": "Editor",
        "icon": "src/images/file-fic.icns"
      },
      {
        "ext": "fip",
        "name": appInfo.name + " Plugin",
        "role": "Editor",
        "icon": "src/images/file-fip.icns"
      },
      {
        "ext": Object.keys(mimeTypes),
        "role": "Editor",
      }
    ];

    build({
      config: {
        extraMetadata: {
          main: "src/app.js"
        },
        // extraResources: [
        //   {
        //     "from": "resources",
        //     "to": "",
        //     "filter": ["**/*"]
        //   }
        // ],
        appId: appInfo.appId,
        files: [
          "src/**/*",
          "!*.js",
          "!*.sh",
          "!**/*.mdp",

          "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
          "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
          "!**/node_modules/*.d.ts",
          "!**/node_modules/.bin",
          "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
          "!.editorconfig",
          "!**/._*",
          "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
          "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
          "!**/{appveyor.yml,.travis.yml,circle.yml}",
          "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
        ],
        directories: {
          output: "build"
        },
        win: {
          target: "nsis",
          icon: "src/images/icon.png",
          fileAssociations: fileAssociations
        },
        mac: {
          target: "dmg",
          icon: "src/images/icon.png",
          fileAssociations: fileAssociations
        },
      },
    }).catch(err => {
        throw err;
    });
})();
