export class Color {
    constructor(r, g, b, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    serialize() {
        return (this.r << 16) + (this.g << 8) + (this.b);
    }
}
