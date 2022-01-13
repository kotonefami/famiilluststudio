const electron = require('electron');
const fs = require('fs').promises;
const path = require('path');
const pixels = require('image-pixels');
const URL = require('url').URL;

const { contentSecurityPolicy, mimeTypes, darkModeColor } = require("./config.js");

const dataFolderPath = path.join(electron.app.getPath("userData"), "Data");
const pluginFolderPath = path.join(dataFolderPath, "Plugins");
const settingFilePath = path.join(dataFolderPath, "Setting");
const isMac = process.platform === "darwin";
const isWin = process.platform.startsWith("win");

var mainWindow = null;
var openedFile = null;
var setting = {};
var menu = {};

var updateWindowBounds = async () => {
    var bounds = mainWindow.getBounds();
    setting.windowWidth = bounds.width;
    setting.windowHeight = bounds.height;
    var position = mainWindow.getPosition();
    setting.windowX = position[0];
    setting.windowY = position[0];
};
var updateBackgroundColor = (settingValue) => {
    var darkMode = settingValue || "os";
    var backgroundColor = darkModeColor.light;
    if (darkMode == "dark")
        backgroundColor = darkModeColor.dark;
    else if (darkMode == "light")
        backgroundColor = darkModeColor.light;
    else if (darkMode == "os") {
        if (electron.nativeTheme.shouldUseDarkColors)
            backgroundColor = darkModeColor.dark;
        else
            backgroundColor = darkModeColor.light;
    }
    mainWindow.setBackgroundColor(backgroundColor);
};
var fileOpen = async (filePath, asNew = true) => {
    var rawContent = await fs.readFile(filePath);
    if (rawContent.slice(0, 7).equals(Buffer.from([0x6D, 0x64, 0x69, 0x70, 0x61, 0x63, 0x6B])) === "mdipack") {
        require("lib/main/providers/mdp.js")
        require("lib/main/providers/clip.js")
        require("lib/main/providers/psd.js")
        require("lib/main/providers/fic.js")
    } else {
        try {
            mainWindow.webContents.send("fileOpen", {
                type: "rawImage",
                asNew: asNew,
                path: filePath,
                data: await pixels(filePath, {cache: false})
            });
        } catch {
            mainWindow.webContents.send("err", "not image file");
        }
    }
}
var fileOpenDialog = async (asNew = true) => {
    var result = await electron.dialog.showOpenDialog(mainWindow, {
        properties: ["openFile"],
        filters: [{name: "画像ファイル", extensions: Object.keys(mimeTypes)}]
    });
    if (!result.canceled) fileOpen(result.filePaths[0], asNew);
};

if (!electron.app.requestSingleInstanceLock()) {
    electron.app.exit();
} else {
    electron.app.once('ready', async () => {
        await fs.mkdir(dataFolderPath, {recursive: true});
        await fs.mkdir(pluginFolderPath, {recursive: true});

        try {
            var text = await fs.readFile(settingFilePath, "utf8");
            if (text == "") text = "{}";
            setting = JSON.parse(text);
        } catch (e) {
            console.error(e);
            setting = {};
        }
        if (!("windowWidth" in setting && "windowHeight" in setting && "windowX" in setting && "windowY" in setting)) {
            var winSize = electron.screen.getPrimaryDisplay().size;
            setting.windowWidth = winSize.width;
            setting.windowHeight = winSize.height;
            setting.windowX = 0;
            setting.windowY = 0;
        }

        // CSPヘッダー 設定
        (function() {
            var policies = ["default-src", "connect-src", "img-src", "child-src", "font-src", "frame-src", "manifest-src", "media-src", "object-src", "prefetch-src", "script-src", "script-src-elem", "script-src-attr", "style-src", "style-src-elem", "style-src-attr", "worker-src", "base-uri", "form-action", "frame-ancestors", "navigate-to"];
            var cspDirectives = [];
            for (var i = 0; i < policies.length; i++) {
                var cspDirective = [policies[i]];
                if (contentSecurityPolicy[policies[i]].length == 0) {
                    cspDirective.push("'none'");
                } else {
                    for (var s = 0; s < contentSecurityPolicy[policies[i]].length; s++) {
                        if (contentSecurityPolicy[policies[i]][s] == "self") {
                            cspDirective.push("'self'");
                        } else if (contentSecurityPolicy[policies[i]][s] == "unsafe-inline") {
                            cspDirective.push("'unsafe-inline'");
                        } else if (contentSecurityPolicy[policies[i]][s] == "unsafe-eval") {
                            cspDirective.push("'unsafe-eval'");
                        } else if (contentSecurityPolicy[policies[i]][s].startsWith("sha")) {
                            cspDirective.push("'" + contentSecurityPolicy[policies[i]][s] + "'");
                        } else {
                            cspDirective.push(contentSecurityPolicy[policies[i]][s]);
                        }
                    }
                }
                cspDirectives.push(cspDirective.join(" "));
            }
            if (contentSecurityPolicy.blockAllMixedContent) cspDirectives.push("block-all-mixed-content");
            if (contentSecurityPolicy.upgradeInsecureRequests) cspDirectives.push("upgrade-insecure-requests");
            electron.session.defaultSession.webRequest.onHeadersReceived({urls: ["<all_urls>"]}, (details, callback) => {
                details.responseHeaders['Content-Security-Policy'] = cspDirectives.join("; ");
                callback({responseHeaders: details.responseHeaders});
            });
        })();

        mainWindow = new electron.BrowserWindow({
            title: electron.app.name,
            x: setting.windowX,
            y: setting.windowY,
            width: setting.windowWidth,
            height: setting.windowHeight,
            minWidth: 450,
            minHeight: 300,
            show: false,
            icon: path.join(__dirname, 'images', 'icon.png'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                preload: path.join(__dirname, 'lib', 'main', 'preload.js'),
            }
        });
        updateBackgroundColor(setting.darkMode);

        mainWindow.loadURL(require('url').format({
            pathname: path.join(__dirname, 'lib', 'renderer', 'index.html'),
            protocol: 'file:',
            slashes: true
        }));

        mainWindow.on('resized', updateWindowBounds);
        mainWindow.on('moved', updateWindowBounds);
        mainWindow.on('blur', () => mainWindow.webContents.send("windowFocusing", false));
        mainWindow.on('focus', () => mainWindow.webContents.send("windowFocusing", true));

        mainWindow.once('ready-to-show', mainWindow.show);
        electron.app.on('window-all-closed', electron.app.quit);

        mainWindow.webContents.once('did-finish-load', () => {
            if (openedFile !== null)
                fileOpen(openedFile);
            else if (isWin && !~process.argv[0].endsWith("electron.exe") && process.argv.length >= 2)
                fileOpen(process.argv[1]);
        });
        electron.app.on('second-instance', (e, argv) => {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            if (argv.length >= 3) {
                fileOpen(argv[argv.length - 1]);
            }
        });
        // TODO: すでに開いていますが、続行しますか？
        electron.app.on('open-file', (e, file) => {
            e.preventDefault();

            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            fileOpen(file);
        });

        mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
            const url = new URL(navigationUrl);
            if (!(url.protocol === "file:")) {
                event.preventDefault();
            }
        })
        electron.app.on('render-process-gone', (event, webContents, details) => {
            if (details.reason !== "clean-exit") {
                switch (electron.dialog.showMessageBoxSync({
                    message: "レンダープロセスが異常終了しました",
                    detail: "理由: " + details.reason + "\n終了コード: " + details.exitCode,
                    type: "error",
                    buttons: ["何もしない", "再起動", "終了"],
                    cancelId: 0
                })) {
                    case 1:
                        electron.app.relaunch();
                        electron.app.exit(details.exitCode);
                        break;
                    case 2:
                        electron.app.exit(details.exitCode);
                        break;
                }
            }
        });
    });
}

if (isMac) {
    electron.app.once('will-finish-launching', () => {
        electron.app.once('open-file', (e, file) => {
            e.preventDefault();
            openedFile = file;
        });
    });
}

// メニュー設定
function genMenu() {
    var menu = new electron.Menu();
    Array.prototype.forEach.call(arguments, menuObj => menu.append(new electron.MenuItem(menuObj)));
    return menu;
};
var windowMenuHeader = [
    {label: electron.app.name + ' について', click: () => mainWindow.webContents.send("menu", {"menu": "window", "type": "about"})},
    {label: 'バージョン ' + electron.app.getVersion(), enabled: false},
    {label: 'アップデートを確認する', click: () => mainWindow.webContents.send("menu", {"menu": "window", "type": "about"})},
    {type: 'separator'},
    {label: '環境設定', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send("menu", {"menu": "window", "type": "preference"})},
    {type: 'separator'}
];
var windowMenuFooter = [
    {type: 'separator'},
    {label: electron.app.name + ' を終了', accelerator: 'CmdOrCtrl+Q', click: async () => {
        await fs.writeFile(settingFilePath, JSON.stringify(setting));
        electron.app.quit();
    }}
];
menu = genMenu(
  ...(isMac ? [{
    label: electron.app.name,
    submenu: genMenu(...(windowMenuHeader.concat(windowMenuFooter)))
  }] : []),
  {
    label: 'ファイル',
    submenu: genMenu(
      {label: '新規作成', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send("menu", {"menu": "file", "type": "create-canvas"})},
      {type: 'separator'},
      {label: '開く', accelerator: 'CmdOrCtrl+O', click: async () => await fileOpenDialog(true)},
      {id: 'openAsLayer', label: 'レイヤーとして開く', accelerator: 'CmdOrCtrl+Shift+O', click: async () => await fileOpenDialog(false)},
      {type: 'separator'},
      {id: 'save', label: '保存', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send("menu", {"menu": "file", "type": "save"})},
      {id: 'saveAsNewFile', label: '名前を付けて保存', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send("menu", {"menu": "file", "type": "save-as-new-file"})},
      {type: 'separator'},
      {id: 'closeCanvas', label: '閉じる', accelerator: 'CmdOrCtrl+W', click: () => mainWindow.webContents.send("menu", {"menu": "file", "type": "close-canvas"})},
      {type: 'separator'},
      {id: 'render', label: '書き出し', accelerator: 'CmdOrCtrl+Shift+A', click: () => mainWindow.webContents.send("menu", {"file": "about", "type": "render"})}
    )
  },
  {
    label: '編集',
    submenu: genMenu(
      {label: '取り消す', role: 'undo'},
      {label: 'やり直す', role: 'redo'},
      {type: 'separator'},
      {label: 'カット', role: 'cut'},
      {label: 'コピー', role: 'copy'},
      {label: 'ペースト', role: 'paste'},
      {type: 'separator'},
      {label: 'すべて選択', role: 'selectAll'}
    )
  },
  {
    label: '表示',
    submenu: genMenu(
      {id: 'resetPosition', label: '位置をリセット', click: () => mainWindow.webContents.send("menu", {"menu": "display", "type": "reset-position"})},
      {id: 'resetSize', label: 'サイズをリセット', click: () => mainWindow.webContents.send("menu", {"menu": "display", "type": "reset-size"})},
      {type: 'separator'},
      {
        label: 'デバッグ',
        submenu: genMenu(
          {id: 'contextRefresh', label: 'キャンバスのコンテキストを再取得する', click: () => mainWindow.webContents.send("menu", {"menu": "debug", "type": "context-refresh"})},
          {type: 'separator'},
          {label: "スクリプトを再読み込み", role: 'reload', accelerator: 'CmdOrCtrl+Alt+R'},
          {label: "スクリプトを強制的に再読み込み", role: 'forcereload', accelerator: 'CmdOrCtrl+Alt+Shift+R'},
          {type: 'separator'},
          {label: "開発者ツールを開く", role: "toggledevtools", accelerator: 'CmdOrCtrl+Alt+I'}
        )
      }
    )
  },
  {
    label: 'ウィンドウ',
    submenu: genMenu(
      ...(isWin ? windowMenuHeader : []),
      {label: 'プラグイン マネージャー', click: () => mainWindow.webContents.send("menu", {"menu": "window", "type": "plugin-manager"})},
      {type: 'separator'},
      {label: '最小化', role: 'minimize'},
      ...(isWin ? windowMenuFooter : [])
    )
  }
);
electron.Menu.setApplicationMenu(menu);

// IPCイベント設定
electron.nativeTheme.on("updated", () => {
    mainWindow.webContents.send("updateTheme", electron.nativeTheme.shouldUseDarkColors);
});

electron.ipcMain.handle('request', async (event, option) => {
    if (option.type === "version") {
        return {
            name: electron.app.name,
            build: 0,
            version: {
                app: electron.app.getVersion(),
                electron: process.versions.electron,
                chromium: process.versions.chrome,
                node: process.versions.node
            },
            isAlternativeCore: false
        };
    } else if (option.type === "setting") {
        return setting;
    } else if (option.type === "themeEvent") {
        mainWindow.webContents.send("updateTheme", electron.nativeTheme.shouldUseDarkColors);
    } else if (option.type === "openFile") {
        option.value.forEach(async file => {
            await fileOpen(file);
        });
    }
});
electron.ipcMain.handle('control', async (event, option) => {
    if (option.type === "setting") {
        setting = option.value;
        updateBackgroundColor(setting.darkMode);
        await fs.writeFile(settingFilePath, JSON.stringify(setting));
    } else if (option.type === "canvasRelationMenu") {
        menu.getMenuItemById("openAsLayer").enabled = option.value;
        menu.getMenuItemById("save").enabled = option.value;
        menu.getMenuItemById("saveAsNewFile").enabled = option.value;
        menu.getMenuItemById("closeCanvas").enabled = option.value;
        menu.getMenuItemById("render").enabled = option.value;
        menu.getMenuItemById("resetPosition").enabled = option.value;
        menu.getMenuItemById("resetSize").enabled = option.value;
        menu.getMenuItemById("contextRefresh").enabled = option.value;
    } else if (option.type === "addRecentDocument") {
        electron.app.addRecentDocument(option.value);
    } else if (option.type === "clearRecentDocuments") {
        electron.app.clearRecentDocuments();
    } else if (option.type === "uploadBackgroundImage") {
        let destFileDir = path.join(dataFolderPath, "Appearance");
        let fileNameExtensions = file.name.split(".");
        let destFilePath = path.join(destFileDir, "Background");
        await fs.mkdir(destFileDir, {recursive: true});
        await fs.copyFile(file.path, destFilePath);
        return destFilePath;
    }
});
