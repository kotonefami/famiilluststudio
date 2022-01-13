const electron = require('electron');

var menuEvent = [];
var fileOpenEvent = [];
var osTheme = {
    isDark: false,
    _onUpdate: []
};
var isWindowFocusing = true;
electron.ipcRenderer.on('updateTheme', (event, isDarkNew) => {
    osTheme.isDark = isDarkNew;
    osTheme._onUpdate.forEach(onUpdate => {
        onUpdate();
    });
});
electron.ipcRenderer.on('menu', (event, value) => {
    menuEvent.forEach(func => {
        func(value);
    });
});
electron.ipcRenderer.on('windowFocusing', (event, value) => {
    isWindowFocusing = value;
});
electron.ipcRenderer.on('fileOpen', (event, value) => {
    fileOpenEvent.forEach(func => {
        func(value);
    });
});

electron.contextBridge.exposeInMainWorld("CoreFLS", {
    request: async (type, value) => await electron.ipcRenderer.invoke("request", {type: type, value: value}),
    control: async (type, value) => await electron.ipcRenderer.invoke("control", {type: type, value: value}),
    osTheme: {
        get: function() {
            return (osTheme.isDark ? "dark" : "light");
        },
        onUpdate: function(func) {
            osTheme._onUpdate.push(func);
        }
    },
    window: {
        isFocusing: function() {
            return isWindowFocusing;
        }
    },
    onMenu: function(func) {
        menuEvent.push(func);
    },
    onFileOpen: function(func) {
        fileOpenEvent.push(func);
    }
});
