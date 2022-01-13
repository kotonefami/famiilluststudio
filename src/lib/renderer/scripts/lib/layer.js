export class Layer {
    constructor(width, height, name = null) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;

        this.empty();
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        this.name = (this.name || "レイヤー " + (this.canvas.layers.length - 1));
    }

    empty() {
        this.data = new Uint8Array(this.width * this.height * 4);
        return this;
    }
    rename(newName) {
        this.name = newName;
        return this;
    }

    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return [0, 0, 0, 0];
        }
        var index = 4 * (x + this.width * y);
        return [
            this.data[index],
            this.data[index + 1],
            this.data[index + 2],
            this.data[index + 3],
        ];
    }
}

export class ImageLayer extends Layer {
    constructor(data, name = null) {
        super(data.width, data.height, name);
        this.data = data.data;
    }
}
