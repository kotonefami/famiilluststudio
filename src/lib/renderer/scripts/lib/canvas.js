import { Vector2 } from "./vector.js";
import { Layer } from "./layer.js";
import { Draw } from "./draw.js";

export class Canvas {
    constructor(width, height, name = "Untitled") {
        this.name = name;
        this.width = width;
        this.height = height;
        this.layers = [];
        this.view = {
            x: 0,
            y: 0,
            scale: 100,
            move: function(vector) {
                this.x += vector.x;
                this.y += vector.y;
            },
            zoom: function(delta, centerPos = new Vector2(0, 0)) {
                var canvasPos = FLS.Renderer.selectingCanvas.draw.locate(centerPos);
                FLS.Renderer.Container.style.transformOrigin = Math.min(Math.max(0, canvasPos.x), FLS.Renderer.selectingCanvas.width) + "px " + Math.min(Math.max(0, canvasPos.y), FLS.Renderer.selectingCanvas.height) + "px";

                this.scale += delta * (this.scale / 20);
                this.scale = Math.min(Math.max(1, this.scale), 6400);
                // ・縮小中にScale？がおかしくなる？からズームがずれている可能性
                // ・マイナス座標をlocateしようとするとなぜかプラスになるから、そこでズームがずれている可能性

                FLS.Renderer.Container.style.transform = "scale(" + this.scale / 100 + ")";
            }
        };
        this.workTime = 0;

        this.draw = new Draw(this);

        this.addLayer(new Layer(this.width, this.height, "背景レイヤー"));
        var x, y = 0;
        var size = Math.min(Math.min(this.width, this.height) / 2, 16);
        var prevDrawGray, prevRowFirstGray = true;
        var color0 = FLS.Setting.get("transparentColor0");
        var color1 = FLS.Setting.get("transparentColor1");
        for (var i = 0; i < Math.floor(this.height / size); i++) {
            prevRowFirstGray = !prevRowFirstGray;
            prevDrawGray = prevRowFirstGray;
            y = i * size;
            for (var s = 0; s < Math.floor(this.width / size); s++) {
                prevDrawGray = !prevDrawGray;
                x = s * size;
                this.draw.rectangle(x, y, x + size - 1, y + size - 1, ...(prevDrawGray ? [color0.r, color0.g, color0.b] : [color1.r, color1.g, color1.b]));
            }
        }
        this.addLayer(new Layer(this.width, this.height));
        this.draw.render();

        this._resetScale();
        this._resetPosition();
    }
    addLayer(layer, select = true) {
        this.layers.push(layer);
        layer.setCanvas(this);
        if (select) this.selectingLayer = layer;
        this.draw.render();
        return this;
    }
    removeLayer(layer) {
        layer.element.remove();
        this.layers = this.layers.filter(l => l !== layer);
        return this;
    }
    renameLayer(layer, name) {
        layer.rename(name);
        return this;
    }

    _resetScale() {
        this.view.scale = 100;
        this._updatePosition();
    }
    _resetPosition() {
        this.view.x = FLS.Renderer.Area.clientWidth / 2 - this.width / 2;
        this.view.y = FLS.Renderer.Area.clientHeight / 2 - this.height / 2;
        this._updatePosition();
    }
    _updatePosition() {
        if (this.view.x > FLS.Renderer.Area.clientWidth) {
            this.view.x = FLS.Renderer.Area.clientWidth;
        }
        if (this.view.x < -this.width) {
            this.view.x = -this.width;
        }
        if (this.view.y > FLS.Renderer.Area.clientHeight) {
            this.view.y = FLS.Renderer.Area.clientHeight;
        }
        if (this.view.y < -this.height) {
            this.view.y = -this.height;
        }

        FLS.Renderer.Container.width = this.width;
        FLS.Renderer.Container.height = this.height;
        FLS.Renderer.Container.style.left = this.view.x + "px";
        FLS.Renderer.Container.style.top = this.view.y + "px";
        FLS.Renderer.Container.style.transform = "scale(" + this.view.scale / 100 + ")";
    }

    static get(canvasId) {
        if (typeof canvasId === "number") {
            return FLS.Renderer.Canvases[canvasId];
        } else if (canvasId instanceof Canvas) {
            return canvasId;
        } else {
            return null;
        }
    }
}
