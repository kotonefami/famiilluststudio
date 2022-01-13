import { Vector2 } from "./vector.js";
import { Color } from "./color.js";

export class Draw {
    constructor(canvas) {
        this.canvas = canvas;
        this.color = new Color(255, 0, 0);

        this.element = document.createElement("canvas");
        this.element.width = this.canvas.width;
        this.element.height = this.canvas.height;
        this.context = this.element.getContext('2d');
        this.imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
        FLS.Renderer.Container.appendChild(this.element);
    }

    locate(vector) {
        var rect = this.element.getBoundingClientRect();
        return new Vector2(vector.x, vector.y).sub(rect.left, rect.top).div(new Vector2(this.canvas.view.scale / 100, this.canvas.view.scale / 100));
    }
    locateAsMouseEvent(mouseEvent) {
        return this.locate(new Vector2(mouseEvent.pageX, mouseEvent.pageY));
    }

    brush(x, y, pressure = 1) {
        if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return;
        // this.point(x, y, this.color.r, this.color.g, this.color.b, this.color.a);
        // this.rectangleOutline(x, y, x + 3, y + 3, this.color.r, this.color.g, this.color.b, this.color.a);
        this.circleOutline(x, y, Math.floor(pressure * 4), this.color.r, this.color.g, this.color.b, this.color.a);
        this.render();
    }


    // すごい火 https://playground.anychart.com/gallery/src/Graphics/Bonfire
    point(x, y, r, g, b, a = 255) {
        if (x < 0 || y < 0 || x >= this.canvas.selectingLayer.width || y >= this.canvas.selectingLayer.height) return;
        var index = (x + y * this.canvas.selectingLayer.width) * 4;
        this.canvas.selectingLayer.data[index] = r;
        this.canvas.selectingLayer.data[index + 1] = g;
        this.canvas.selectingLayer.data[index + 2] = b;
        this.canvas.selectingLayer.data[index + 3] = a;
    }
    rectangle(x1, y1, x2, y2, r, g, b, a = 255) {
        x2++;
        y2++;
        for (var i = 0; i < y2 - y1; i++) {
            for (var s = 0; s < x2 - x1; s++) {
                this.point(x1 + s, y1 + i, r, g, b, a);
            }
        }
    }
    rectangleOutline(x1, y1, x2, y2, r, g, b, a = 255) {
        for (var i = 0; i < x2 - x1 + 1; i++) {
            this.point(x1 + i, y1, r, g, b, a);
            this.point(x1 + i, y2, r, g, b, a);
        }
        for (var i = 0; i < y2 - y1 - 1; i++) {
            this.point(x1, y1 + 1 + i, r, g, b, a);
            this.point(x2, y1 + 1 + i, r, g, b, a);
        }
    }
    // rectangleは左上、circleとellipseは中心が起点
    // https://aznote.jakou.com/prog/paint/021_aacircle.html
    // https://daeudaeu.com/circle/
    // https://daeudaeu.com/line/#i-13
    // https://daeudaeu.com/scaling/
    // https://daeudaeu.com/image-rotation/
    circleOutline(x, y, radius, r, g, b, a = 255) {
        var _x = radius;
        var _y = 0;
        var f = -2 * radius + 3;

        while (_x >= _y) {
            this.point(x + _x, y + _y, r, g, b, a);
            this.point(x - _x, y + _y, r, g, b, a);
            this.point(x + _x, y - _y, r, g, b, a);
            this.point(x - _x, y - _y, r, g, b, a);
            this.point(x + _y, y + _x, r, g, b, a);
            this.point(x - _y, y + _x, r, g, b, a);
            this.point(x + _y, y - _x, r, g, b, a);
            this.point(x - _y, y - _x, r, g, b, a);
            if (f >= 0) {
                _x--;
                f -= 4 * _x;
            }
            _y++;
            f += 4 * _y + 2;
        }
    }
    ellipse(x, y, rx, ry, r, g, b, a = 255) {
        for (var i = 0; i < this.canvas.height; i++) {
            for (var s = 0; s < this.canvas.width; s++) {
                var dx = s - x;
                var dy = i - y;

                if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
                    this.point(s, i, r, g, b, a);
                }
            }
        }
    }

    render() {
        this.canvas.layers.forEach(layer => {
            for (var y = 0; y < this.canvas.height; y++) {
                for (var x = 0; x < this.canvas.width; x++) {
                    var pixel = layer.getPixel(x, y);
                    var index = 4 * (this.canvas.width * y + x);
                    if (pixel[3] === 0) {
                        continue;
                    } else if (pixel[3] === 255) {
                        this.imageData.data[index] = pixel[0];
                        this.imageData.data[index + 1] = pixel[1];
                        this.imageData.data[index + 2] = pixel[2];
                        this.imageData.data[index + 3] = pixel[3];
                    } else {

                    }
                    // this.imageData.data[index] = this.imageData.data[index] * ((255 - pixel[3]) / 255) + pixel[0] * pixel[3];
                    // this.imageData.data[index + 1] = this.imageData.data[index + 1] * ((255 - pixel[3]) / 255) + pixel[1] * pixel[3];
                    // this.imageData.data[index + 2] = this.imageData.data[index + 2] * ((255 - pixel[3]) / 255) + pixel[2] * pixel[3];
                    // this.imageData.data[index + 3] = this.imageData.data[index + 3] * ((255 - pixel[3]) / 255) + pixel[3] * pixel[3];
                    //
                    // // dst = this.imageData.data[index + n]
                    // // src = pixel[n]
                    // // 1 = 255
                    // if (this.imageData.data[index + 3] === 255) {
                    //     this.imageData.data[index] = pixel[0] * pixel[3] + this.imageData.data[index] * (255 - pixel[3]);
                    //     this.imageData.data[index + 1] = pixel[1] * pixel[3] + this.imageData.data[index + 1] * (255 - pixel[3]);
                    //     this.imageData.data[index + 2] = pixel[2] * pixel[3] + this.imageData.data[index + 2] * (255 - pixel[3]);
                    //     this.imageData.data[index + 3] = 1;
                    // } else {
                    //     var outA = pixel[3] + this.imageData.data[index + 3] * (255 - pixel[3]);
                    //     this.imageData.data[index] = (pixel[0] * pixel[3] + this.imageData.data[index] * this.imageData.data[index + 3] * (255 - pixel[3])) / outA;
                    //     this.imageData.data[index + 1] = (pixel[1] * pixel[3] + this.imageData.data[index + 1] * this.imageData.data[index + 3] * (255 - pixel[3])) / outA;
                    //     this.imageData.data[index + 2] = (pixel[2] * pixel[3] + this.imageData.data[index + 2] * this.imageData.data[index + 3] * (255 - pixel[3])) / outA;
                    //     this.imageData.data[index + 3] = outA;
                    // }
                }
            }
        });
        this.context.putImageData(this.imageData, 0, 0);
    }
}
