import { Color } from "./lib/color.js";
import { Canvas } from "./lib/canvas.js";
import { Layer, ImageLayer } from "./lib/layer.js";
import { Vector2 } from "./lib/vector.js";

// hours = Math.floor(FLS.Renderer.selectingCanvas.workTime / 3600);
// minutes = Math.floor(FLS.Renderer.selectingCanvas.workTime % 3600 / 60);
// seconds = FLS.Renderer.selectingCanvas.workTime % 3600 % 60;

FLS = {
    Name: "",
    Version: "",
    Build: 0,
    Palette: null,
    Renderer: {
        Area: document.getElementById("area_canvas"),
        Container: document.getElementById("canvas_container"),
        Canvases: [],
        selectingCanvas: null,

        checkBackground: function() {
            CoreFLS.control("canvasRelationMenu", FLS.Renderer.Canvases.length > 0);
            document.getElementById("canvas_container_background").style.display = (FLS.Renderer.Canvases.length > 0 ? "none" : "");
        },
        openCanvas: function(canvas, select = true) {
            FLS.Renderer.Canvases.push(canvas);

            var input = document.createElement("input");
            input.type = "radio";
            input.name = "canvas_list_selector";
            input.value = FLS.Renderer.Canvases.length - 1;
            input.id = "canvas_list_selector_" + input.value;

            input.onchange = function() {
                if (this.checked) {
                    FLS.Renderer.focusCanvas(parseInt(this.value));
                }
            };
            var label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = canvas.name;
            label.oncontextmenu = () => {
                console.log("a");
            };

            document.getElementById("area_canvas_list").appendChild(input);
            document.getElementById("area_canvas_list").appendChild(label);

            canvas._tabInput = input;
            canvas._tabLabel = label;

            if (select) {
                FLS.Renderer.selectingCanvas = canvas;
                input.checked = true;
                FLS.Renderer.focusCanvas(canvas);
            }

            FLS.Renderer.checkBackground();
        },
        closeCanvas: function(canvasId) {
            var canvas = Canvas.get(canvasId);
            if (FLS.Renderer.selectingCanvas == canvas) {
                var canvasIndex = FLS.Renderer.Canvases.indexOf(canvas);
                if (canvasIndex == 0) {
                    if (FLS.Renderer.Canvases.length > 1) {
                        FLS.Renderer.focusCanvas(canvasIndex + 1);
                    } else {
                        FLS.Renderer.selectingCanvas = null;
                    }
                } else if (canvasIndex - 1 < 0) {
                    FLS.Renderer.focusCanvas(0);
                } else {
                    FLS.Renderer.focusCanvas(canvasIndex - 1);
                }
            }
            canvas.draw.element.remove();
            canvas._tabInput.remove();
            canvas._tabLabel.remove();
            FLS.Renderer.Canvases = FLS.Renderer.Canvases.filter(c => c != canvas);

            FLS.Renderer.Canvases.forEach((_canvas, i) => {
                _canvas._tabInput.id = "canvas_list_selector_" + i;
                _canvas._tabInput.value = i;
                _canvas._tabLabel.htmlFor = _canvas._tabInput.id;
            });

            FLS.Renderer.checkBackground();
        },
        focusCanvas: function(canvasId) {
            var canvas = Canvas.get(canvasId);
            FLS.Renderer.selectingCanvas = canvas;
            canvas._tabInput.checked = true;
            canvas.draw.element.style.display = "block";
            canvas._updatePosition();
            var color = FLS.Palette.get();
            canvas.draw.color = new Color(
                Math.floor(color.r() * 255),
                Math.floor(color.g() * 255),
                Math.floor(color.b() * 255)
            );
            FLS.Renderer.Canvases.forEach(_canvas => {
                if (_canvas != canvas) {
                    _canvas.draw.element.style.display = "none";
                }
            });
        }
    },
    Setting: {
        _defaultValue: {
          darkMode: "os",
          font: "Zen_Kaku_Gothic_New",
          transparentColor0: {r: 255, g: 255, b: 255},
          transparentColor1: {r: 200, g: 200, b: 200},
          backgroundImage: ""
        },
        _raw: {},
        _onUpdate: [],
        onUpdate: function(func) {
            FLS.Setting._onUpdate.push(func);
        },
        get: function(key, default_ = null) {
            return (key in FLS.Setting._raw ? FLS.Setting._raw[key] : FLS.Setting._defaultValue[key]);
        },
        set: function(key, value) {
            FLS.Setting._raw[key] = value;

            FLS.Setting._onUpdate.forEach(f => f());
        },
        save: function(value = null) {
            if (value) {
                FLS.Setting._raw = value;
                FLS.Setting._onUpdate.forEach(f => f());
            }
            (async function() {
                await CoreFLS.control("setting", FLS.Setting._raw);
            });
        }
    },
    WindowManager: {
        _windowShow: function(id, manager = null) {
            document.getElementById(id).style.display = "block";
            setTimeout(() => document.getElementById(id).classList.remove("hide"), 20);
            FLS.WindowManager.managers.forEach(_manager => {
                if (_manager !== manager) _manager.hide(true);
            });
        },
        _windowHide: function(id) {
            document.getElementById(id).classList.add("hide");
            setTimeout(() => {
                if (document.getElementById(id).classList.contains("hide"))
                    document.getElementById(id).style.display = "none";
            }, 200);
        },
        preference: {
            settingMap: {
                "darkMode": {
                    "dark": "常にダークモードを使用します。",
                    "light": "常にライトモードを使用します。",
                    "os": "OS の設定を適用します。",
                }
            },
            show: function(skipToggleCheck = false) {
                if (!skipToggleCheck && !document.getElementById("window_preference").classList.contains("hide")) {
                    this.hide(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowShow("window_preference", this);
                }
            },
            hide: function(skipToggleCheck = false) {
                if (!skipToggleCheck && document.getElementById("window_preference").classList.contains("hide")) {
                    this.show(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowHide("window_preference", this);
                }
            },
            setInt: function(element, key) {
                FLS.Setting.set(key, parseInt(element.value));
                FLS.Setting.save();
            },
            setString: function(element, key) {
                FLS.Setting.set(key, element.value);
                FLS.Setting.save();
            },
            setRadio: function(element, key) {
                var value = Array.prototype.filter.call(document.getElementsByName(element.name), e => e.checked)[0].value;
                FLS.Setting.set(key, value);
                if (document.getElementById("preference_" + key + "_description")) {
                    document.getElementById("preference_" + key + "_description").textContent = FLS.WindowManager.preference.settingMap[key][value];
                }
                FLS.Setting.save();
            },
            setColor: function(element, key) {
                FLS.Setting.set(key, {
                    r: parseInt(element.value.slice(1, 3), 16),
                    g: parseInt(element.value.slice(3, 5), 16),
                    b: parseInt(element.value.slice(5, 7), 16)
                });
                FLS.Setting.save();
            },
            reset: async function() {
                FLS.Setting.save({});
            },
            backgroundColor: {
                upload: function() {
                    var file = document.getElementById("preference_backgroundImage").files[0];
                    CoreFLS.control("uploadBackgroundImage", {
                        name: file.name,
                        path: file.path,
                        size: file.size
                    }).then((filePath) => {
                        document.getElementById("preference_backgroundImage_url").value = filePath.replaceAll("\\", "/");
                        FLS.Setting.set("backgroundImage", filePath.replaceAll("\\", "/"));
                        FLS.Setting.save();
                    });
                }
            }
        },
        newCanvas: {
            aspectList: {
                "640:480": "VGA",
                "800:600": "Super VGA",
                "1024:768": "XGA",
                "1280:720": "HD (720p)",
                "1280:800": "Wide XGA",
                "1366:768": "Full WXGA",
                "1280:1024": "Super XGA",
                "1600:1200": "Ultra XGA",
                "1920:1080": "Full HD (1080p)",
                "2560:1440": "Wide Quad HD (1440p)",
                "3840:2160": "4K",
                "7680:4320": "8K"
            },
            recalcSize: function() {
                document.getElementById("new_canvas_size_width").min = MIN_CANVAS_SIZE;
                document.getElementById("new_canvas_size_height").min = MIN_CANVAS_SIZE;
                document.getElementById("new_canvas_size_width").value = Math.max(document.getElementById("new_canvas_size_width").value, MIN_CANVAS_SIZE);
                document.getElementById("new_canvas_size_height").value = Math.max(document.getElementById("new_canvas_size_height").value, MIN_CANVAS_SIZE);
                var width = Math.max(document.getElementById("new_canvas_size_width").value, MIN_CANVAS_SIZE) || MIN_CANVAS_SIZE;
                var height = Math.max(document.getElementById("new_canvas_size_height").value, MIN_CANVAS_SIZE) || MIN_CANVAS_SIZE;
                function gcd(x, y) {
                    if (y === 0) return x;
                    return gcd(y, x % y);
                }
                var g = gcd(width, height);
                var aspectWidth = width / g;
                var aspectHeight = height / g;

                document.getElementById("new_canvas_aspect").textContent = aspectWidth + " : " + aspectHeight + (width + ":" + height in FLS.WindowManager.newCanvas.aspectList ? " [" + FLS.WindowManager.newCanvas.aspectList[width + ":" + height] + "]" : "");
            },
            exec: function() {
                var width = Math.max(document.getElementById("new_canvas_size_width").value, MIN_CANVAS_SIZE) || MIN_CANVAS_SIZE;
                var height = Math.max(document.getElementById("new_canvas_size_height").value, MIN_CANVAS_SIZE) || MIN_CANVAS_SIZE;
                FLS.Renderer.openCanvas(new Canvas(width, height));
                var color = FLS.Palette.get();
                FLS.Renderer.selectingCanvas.draw.color = new Color(
                    Math.floor(color.r() * 255),
                    Math.floor(color.g() * 255),
                    Math.floor(color.b() * 255)
                );
                FLS.WindowManager.newCanvas.hide();
            },
            show: function(skipToggleCheck = false) {
                if (!skipToggleCheck && !document.getElementById("window_new_canvas").classList.contains("hide")) {
                    this.hide(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowShow("window_new_canvas", this);
                    FLS.WindowManager.newCanvas.recalcSize();
                }
            },
            hide: function(skipToggleCheck = false) {
                if (!skipToggleCheck && document.getElementById("window_new_canvas").classList.contains("hide")) {
                    this.show(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowHide("window_new_canvas");
                }
            }
        },
        about: {
            show: function(skipToggleCheck = false) {
                if (!skipToggleCheck && !document.getElementById("window_about").classList.contains("hide")) {
                    this.hide(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowShow("window_about", this);
                    FLS.WindowManager.about.checkUpdate();
                }
            },
            hide: function(skipToggleCheck = false) {
                if (!skipToggleCheck && document.getElementById("window_about").classList.contains("hide")) {
                    this.show(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowHide("window_about");
                }
            },
            checkUpdate: async function() {
                document.getElementById("about_update_icon").classList.remove("fa-exclamation-triangle");
                document.getElementById("about_update_icon").classList.remove("fa-bell");
                document.getElementById("about_update_icon").classList.remove("fa-check-circle");
                document.getElementById("about_update_icon").classList.add("fa-search");
                return new Promise(async (resolve, reject) => {
                    try {
                        // data:application/json,{"latest":{"build":0,"name":"1.0.0"},"last_update":202100000000}
                        const fetchWithErr = (url, options) => fetch(url, options).catch((e) => {throw Error(e);}).then((res) => {
                            if (res.ok) {
                                return res;
                            }

                            switch (res.status) {
                                case 400: throw Error('INVALID_TOKEN');
                                case 401: throw Error('UNAUTHORIZED');
                                case 500: throw Error('INTERNAL_SERVER_ERROR');
                                case 502: throw Error('BAD_GATEWAY');
                                case 404: throw Error('NOT_FOUND');
                                default:  throw Error('UNHANDLED_ERROR');
                            }
                        }).then(res => res.json());
                        var json = await fetchWithErr('data:application/json,{"latest":{"build":0,"name":"1.0.0"},"last_update":202100000000}');
                        if (json.latest.build > FLS.Build) {
                            document.getElementById("about_update_icon").classList.remove("fa-search");
                            document.getElementById("about_update_icon").classList.add("fa-bell");
                            document.getElementById("about_update_text").textContent = "新しいバージョン「" + json.latest.name + "」が見つかりました。";
                            resolve(json);
                        } else {
                            document.getElementById("about_update_icon").classList.remove("fa-search");
                            document.getElementById("about_update_icon").classList.add("fa-check-circle");
                            document.getElementById("about_update_text").textContent = "お使いの " + FLS.Name + " は最新です。";
                            resolve(null);
                        }
                    } catch (e) {
                        document.getElementById("about_update_icon").classList.remove("fa-search");
                        document.getElementById("about_update_icon").classList.add("fa-exclamation-triangle");
                        document.getElementById("about_update_text").textContent = "アップデートチェックエラー: " + e.message;
                        reject(e);
                    }
                });
            }
        },
        license: {
            show: function(skipToggleCheck = false) {
                if (!skipToggleCheck && !document.getElementById("window_license").classList.contains("hide")) {
                    this.hide(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowShow("window_license", this);

                    if (document.getElementById("license_list").children.length == 0)
                        FLS.System.LicenseInfo.forEach((license, i) => {
                            var p = document.createElement("p");
                            p.classList.add("link");
                            p.textContent = license.name;
                            p.onclick = () => FLS.WindowManager.licenseDetails.showLicense(Object.assign(i));

                            var li = document.createElement("li");
                            li.appendChild(p);

                            document.getElementById("license_list").appendChild(li);
                        });
                }
            },
            hide: function(skipToggleCheck = false) {
                if (!skipToggleCheck && document.getElementById("window_license").classList.contains("hide")) {
                    this.show(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowHide("window_license");
                }
            }
        },
        licenseDetails: {
            showLicense: async function(id) {
                document.getElementById("license_details_title").textContent = FLS.System.LicenseInfo[id].name + " のライセンス (" + FLS.System.LicenseInfo[id].path + ")";
                document.getElementById("license_details_content").innerHTML = "<div>" + (await (await fetch(FLS.System.LicenseInfo[id].path)).text()).replaceAll("\n", "<br>") + "</div>";
                this.show();
            },
            show: function(skipToggleCheck = false) {
                if (!skipToggleCheck && !document.getElementById("window_license_details").classList.contains("hide")) {
                    this.hide(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowShow("window_license_details", this);
                }
            },
            hide: function(skipToggleCheck = false) {
                if (!skipToggleCheck && document.getElementById("window_license_details").classList.contains("hide")) {
                    this.show(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowHide("window_license_details");
                }
            }
        },
        pluginManager: {
            show: function(skipToggleCheck = false) {
                if (!skipToggleCheck && !document.getElementById("window_plugin_manager").classList.contains("hide")) {
                    this.hide(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowShow("window_plugin_manager", this);
                }
            },
            hide: function(skipToggleCheck = false) {
                if (!skipToggleCheck && document.getElementById("window_plugin_manager").classList.contains("hide")) {
                    this.show(!skipToggleCheck);
                } else {
                    FLS.WindowManager._windowHide("window_plugin_manager");
                }
            }
        },
        managers: []
    },
    Loader: {
        show: function() {
            document.getElementById("window_loading").classList.remove("hide");
        },
        hide: function() {
            document.getElementById("window_loading").classList.add("hide");
        },
        setMainText: function(value) {
            document.getElementById("loading_main").textContent = value;
        },
        addDetailText: function(value, placeholder = null) {
            var content = document.createElement("p");
            if (placeholder) {
                content.innerHTML = value.replace("$$", "<span>" + placeholder + "</span>");
            } else {
                content.textContent = value;
            }
            document.getElementById("loading_detail").appendChild(content);
        }
    },
    System: {
        Bugfixer: {
            contextRefresh: function() {
                FLS.Renderer.Canvases.forEach(canvas => {
                    canvas.draw.context = canvas.draw.element.getContext('2d');
                    canvas.draw.imageData = canvas.draw.context.getImageData(0, 0, canvas.draw.canvas.width, canvas.draw.canvas.height);
                });
            }
        },
        Loader: {
            menu: async function() {
                CoreFLS.onMenu(obj => {
                    if (obj.menu == "file") {
                        if (obj.type == "create-canvas")
                            FLS.WindowManager.newCanvas.show();
                        else if (obj.type == "close-canvas")
                            if (FLS.Renderer.selectingCanvas) FLS.Renderer.closeCanvas(FLS.Renderer.selectingCanvas);
                    } else if (obj.menu == "display") {
                        if (obj.type == "reset-position")
                            FLS.Renderer.selectingCanvas._resetPosition();
                        else if (obj.type == "reset-size")
                            FLS.Renderer.selectingCanvas._resetScale();
                    } else if (obj.menu == "debug") {
                        if (obj.type == "context-refresh")
                            FLS.System.Bugfixer.contextRefresh();
                    } else if (obj.menu == "window") {
                        if (obj.type == "about")
                            FLS.WindowManager.about.show();
                        else if (obj.type == "preference")
                            FLS.WindowManager.preference.show();
                        else if (obj.type == "plugin-manager")
                            FLS.WindowManager.pluginManager.show();
                    }
                });
            },
            theme: async function() {
                FLS.Setting.onUpdate(() => {
                    switch (FLS.Setting.get("darkMode")) {
                        case "light":
                            document.body.setAttribute("data-theme", "light");
                            break;
                        case "dark":
                            document.body.setAttribute("data-theme", "dark");
                            break;
                        case "os":
                            document.body.setAttribute("data-theme", CoreFLS.osTheme.get());
                            break;
                    }
                });
                CoreFLS.osTheme.onUpdate(() => {
                    FLS.Setting._onUpdate.forEach(f => f());
                });
                await CoreFLS.request("themeEvent");
            },
            font: async function() {
                FLS.Setting.onUpdate(() => document.body.setAttribute("data-font", FLS.Setting.get("font")));
            },
            palette: async function() {
                FLS.Palette = colorjoe.rgb("color_picker", "#ff0000");
                FLS.Palette.on("change", color => {
                    if (FLS.Renderer.selectingCanvas) FLS.Renderer.selectingCanvas.draw.color = new Color(
                        Math.floor(color.r() * 255),
                        Math.floor(color.g() * 255),
                        Math.floor(color.b() * 255)
                    );
                });
            },
            setting: async function() {
                FLS.Setting._raw = await CoreFLS.request("setting");

                FLS.Setting._onUpdate.forEach(f => f());
            },
            versionInfo: async function() {
                var versionInfo = await CoreFLS.request("version");
                document.getElementById("about_title").textContent = versionInfo.name;
                document.getElementById("about_version").textContent = "v" + versionInfo.version.app;
                document.getElementById("about_detail_version").textContent = "Electron: v" + versionInfo.version.electron + ", Chromium: v" + versionInfo.version.chromium + ", Node: v" + versionInfo.version.node;
                document.getElementById("about_detail_flag").textContent = "コア: " + (versionInfo.isAlternativeCore ? "オルタナティブ スクリプト" : "Electron プリロード");
                FLS.Name = versionInfo.name;
                FLS.Version = versionInfo.version.app;
                FLS.Build = versionInfo.build;

                Array.prototype.forEach.call(document.getElementsByClassName("js__software_title"), e => {
                    e.textContent = FLS.Name;
                });
                Array.prototype.forEach.call(document.getElementsByClassName("js__software_version"), e => {
                    e.textContent = FLS.Version;
                });
            },
            file: async function() {
                await CoreFLS.onFileOpen(async file => {
                    // console.log(file.data);
                    if (file.type == "rawImage") {
                        if (file.asNew)
                            FLS.Renderer.openCanvas(new Canvas(file.data.width, file.data.height, file.path.split(/\/|\\/g).pop()).addLayer(new ImageLayer(file.data)));
                        else
                            FLS.Renderer.selectingCanvas.addLayer(new ImageLayer(file.data));
                        await CoreFLS.control("addRecentDocument", file.path);
                    } else if (file.type == "canvasData") {
                        // if (file.asNew)
                        //     FLS.Renderer.openCanvas(new Canvas(obj.data.width, obj.data.height, obj.path.split(/\/|\\/g).pop()).addLayer(new ImageLayer(obj.data)));
                        // else
                        //     FLS.Renderer.selectingCanvas.addLayer(new ImageLayer(obj.data));
                    }
                });
            }
        },
        LicenseInfo: [
            {name: "Electron", path: "documents/licenses/electron/LICENSE.txt"},
            {name: "image-pixels", path: "documents/licenses/image-pixels/license.md"},
            {name: "xml2json", path: "documents/licenses/xml2json/license.txt"},
            {name: "colorjoe", path: "libraries/colorjoe/LICENSE.txt"},
            {name: "Web Font Loader", path: "libraries/webfontloader/LICENSE.txt"},
            {name: "Font Awesome", path: "libraries/fontawesome/LICENSE.txt"},
            {name: "Zen Kaku Gothic New", path: "fonts/Zen_Kaku_Gothic_New/OFL.txt"},
            {name: "DotGothic16", path: "fonts/DotGothic16/OFL.txt"},
            {name: "Klee One", path: "fonts/Klee_One/OFL.txt"}
        ]
    }
};
const MIN_CANVAS_SIZE = 2;

FLS.WindowManager.managers = [
  FLS.WindowManager.preference,
  FLS.WindowManager.newCanvas,
  FLS.WindowManager.about,
  FLS.WindowManager.license,
  FLS.WindowManager.licenseDetails,
  FLS.WindowManager.pluginManager
];
FLS.Setting.onUpdate(async () => {
    switch (FLS.Setting.get("darkMode")) {
        case "light":
            document.getElementById("preference_darkMode_0").checked = true;
            document.getElementById("preference_darkMode_description").textContent = FLS.WindowManager.preference.settingMap.darkMode.light;
            break;
        case "dark":
            document.getElementById("preference_darkMode_2").checked = true;
            document.getElementById("preference_darkMode_description").textContent = FLS.WindowManager.preference.settingMap.darkMode.dark;
            break;
        case "os":
            document.getElementById("preference_darkMode_1").checked = true;
            document.getElementById("preference_darkMode_description").textContent = FLS.WindowManager.preference.settingMap.darkMode.os;
            break;
    }

    switch (FLS.Setting.get("font")) {
        case "os":
            document.getElementById("preference_font_0").checked = true;
            break;
        case "Zen_Kaku_Gothic_New":
            document.getElementById("preference_font_1").checked = true;
            break;
        case "DotGothic16":
            document.getElementById("preference_font_2").checked = true;
            break;
        case "Klee_One":
            document.getElementById("preference_font_3").checked = true;
            break;
    }

    var transparentColor0 = FLS.Setting.get("transparentColor0");
    document.getElementById("preference_transparentColor0").value = "#" + new Color(transparentColor0.r, transparentColor0.g, transparentColor0.b).serialize().toString(16);
    var transparentColor1 = FLS.Setting.get("transparentColor1");
    document.getElementById("preference_transparentColor1").value = "#" + new Color(transparentColor1.r, transparentColor1.g, transparentColor1.b).serialize().toString(16);

    document.getElementById("preference_backgroundImage_url").value = FLS.Setting.get("backgroundImage");

    await CoreFLS.control("setting", FLS.Setting._raw);
});

window.onload = async () => {
    FLS.Loader.addDetailText("設定とUIを読み込んでいます。");
    await FLS.System.Loader.versionInfo();
    await FLS.System.Loader.setting();
    await FLS.System.Loader.menu();
    await FLS.System.Loader.theme();
    await FLS.System.Loader.font();
    await FLS.System.Loader.file();
    await FLS.System.Loader.palette();
    document.body.classList.remove("not-loaded");

    FLS.Loader.addDetailText("フォントを読み込んでいます。");
    await new Promise(resolve => WebFont.load({
        custom: {
            families: ["DotGothic16", "Zen_Kaku_Gothic_New:n3,n4,n5,n7,n9", "Klee_One:n4,n6"]
        },
        fontactive: (font, weight) => FLS.Loader.addDetailText("フォント $$ を読み込みました。", font + " (" + weight.replace("n", "") + "00)"),
        active: resolve
    }));

    FLS.Loader.addDetailText("アップデートを確認しています。");
    console.log("Startup Update Check:", await FLS.WindowManager.about.checkUpdate());

    document.body.style.backgroundImage = "url('" + FLS.Setting.get("backgroundImage") + "')";


    (function() {
        var refreshContextInterval = null;
        var refreshContextMoving = false;

        var touchZoomEventCaches = [];
        var touchZoomPrevDiff = -1;
        var touchZoomPrevCenter = null;
        var touchZoomStartDiff = -1;

        // https://triple-underscore.github.io/pointerevents3-ja.html#dom-element-setpointercapture
        FLS.Renderer.Container.onpointerdown = e => {
            if (!FLS.Renderer.selectingCanvas) return;
            if (e.pointerType === "touch") {
                touchZoomEventCaches.push(e);
            } else {
                if (e.target.tagName === "CANVAS" && e.buttons === 1) {
                    var vector = FLS.Renderer.selectingCanvas.draw.locateAsMouseEvent(e).floor();
                    FLS.Renderer.selectingCanvas.draw.brush(vector.x, vector.y, 1);
                }
            }
        };
        FLS.Renderer.Container.onpointermove = FLS.Renderer.Container.ontouchmove = e => {
            if (!FLS.Renderer.selectingCanvas || e.pressure === 0) return;
            if (e.buttons === 1) {
                var pressure;
                var drawable = true;
                switch (e.pointerType) {
                    case "mouse":
                        pressure = 1;
                        break;
                    case "pen":
                        pressure = e.pressure;
                        // console.log(e.tiltX, e.tiltY);
                        break;
                    case "touch":
                        for (var i = 0; i < touchZoomEventCaches.length; i++) {
                            if (e.pointerId == touchZoomEventCaches[i].pointerId) {
                                touchZoomEventCaches[i] = e;
                                break;
                            }
                        }
                        if (touchZoomEventCaches.length == 2) {
                            drawable = false;
                            if (refreshContextInterval === null) {
                                refreshContextInterval = setInterval(() => {
                                    if (!refreshContextMoving) {
                                        FLS.System.Bugfixer.contextRefresh();
                                        clearInterval(refreshContextInterval);
                                        refreshContextInterval = null;
                                    }
                                    refreshContextMoving = false;
                                }, 100);
                            }
                            var curDiff = new Vector2(touchZoomEventCaches[0].pageX, touchZoomEventCaches[0].pageY).sub(touchZoomEventCaches[1].pageX, touchZoomEventCaches[1].pageY);
                            var curDiffAverage = (curDiff.x + curDiff.y) / 2;
                            var curCenter = new Vector2(touchZoomEventCaches[0].pageX, touchZoomEventCaches[0].pageY).add(touchZoomEventCaches[1].pageX, touchZoomEventCaches[1].pageY).div(2, 2);
                            if (touchZoomPrevDiff > 0) {
                                if (Math.abs(touchZoomStartDiff - curDiffAverage) < 50) {
                                    // console.log(curCenter, touchZoomPrevCenter, curCenter.sub(touchZoomPrevCenter));
                                    // FLS.Renderer.selectingCanvas.view.move(curCenter.sub(touchZoomPrevCenter));
                                    // FLS.Renderer.selectingCanvas._updatePosition();
                                    refreshContextMoving = true;
                                } else if (curDiffAverage > touchZoomPrevDiff) {
                                    // console.log("Zoom In", curDiffAverage);
                                    FLS.Renderer.selectingCanvas.view.zoom(curDiffAverage / 200, curCenter);
                                    refreshContextMoving = true;
                                } else if (curDiffAverage < touchZoomPrevDiff) {
                                    // console.log("Zoom Out", -curDiffAverage);
                                    FLS.Renderer.selectingCanvas.view.zoom(-curDiffAverage / 200, curCenter);
                                    refreshContextMoving = true;
                                }
                            } else {
                                touchZoomStartDiff = curDiffAverage;
                            }
                            touchZoomPrevDiff = Math.abs(curDiffAverage);
                            touchZoomPrevCenter = curCenter;
                        }
                        pressure = 1;
                        // console.log(e.tiltX, e.tiltY);
                        break;
                }
                if (drawable) {
                    var vector = FLS.Renderer.selectingCanvas.draw.locateAsMouseEvent(e).floor();
                    FLS.Renderer.selectingCanvas.draw.brush(vector.x, vector.y, pressure);
                }
            }
        };
        FLS.Renderer.Container.onpointerup = FLS.Renderer.Container.onpointercancel = FLS.Renderer.Container.onpointerout = FLS.Renderer.Container.onpointerleave = e => {
            touchZoomEventCaches = touchZoomEventCaches.filter(ev => ev.pointerId !== e.pointerId);
            if (touchZoomEventCaches.length < 2) {
                touchZoomPrevDiff = -1;
                touchZoomStartDiff = -1;
            }
        };
        FLS.Renderer.Area.onwheel = e => {
            if (!FLS.Renderer.selectingCanvas) return;
            if (refreshContextInterval === null) {
                refreshContextInterval = setInterval(() => {
                    if (!refreshContextMoving) {
                        FLS.System.Bugfixer.contextRefresh();
                        clearInterval(refreshContextInterval);
                        refreshContextInterval = null;
                    }
                    refreshContextMoving = false;
                }, 100);
            }
            if (e.ctrlKey) {
                FLS.Renderer.selectingCanvas.view.zoom(-e.deltaY, new Vector2(e.pageX, e.pageY));
                refreshContextMoving = true;
            } else {
                FLS.Renderer.selectingCanvas.view.move(new Vector2(-e.deltaX, -e.deltaY));
                refreshContextMoving = true;
            }
            FLS.Renderer.selectingCanvas._updatePosition();
        };
        FLS.Renderer.Area.ondragover = e => {
            e.preventDefault();
            document.getElementById("canvas_container_file_drop").style.display = "block";
        };
        FLS.Renderer.Area.ondragleave = e => {
            e.preventDefault();
            document.getElementById("canvas_container_file_drop").style.display = "none";
        };
        FLS.Renderer.Area.ondrop = async e => {
            e.preventDefault();
            document.getElementById("canvas_container_file_drop").style.display = "none";
            await CoreFLS.request("openFile", Array.prototype.map.call(e.dataTransfer.files, f => f.path));
        };

        setInterval(() => {
            if (CoreFLS.window.isFocusing() && FLS.Renderer.selectingCanvas) {
                FLS.Renderer.selectingCanvas.workTime++;
            }
        }, 1000);

        FLS.Renderer.checkBackground();
        FLS.Loader.hide();
    })();
}

export default FLS;
