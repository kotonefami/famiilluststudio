export class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v, y) {
        if (y !== undefined) {
            this.x += v;
            this.y += y;
        } else {
            this.x += v.x;
            this.y += v.y;
        }
        return this;
    }
    sub(v, y) {
        if (y !== undefined) {
            this.x -= v;
            this.y -= y;
        } else {
            this.x -= v.x;
            this.y -= v.y;
        }
        return this;
    }
    mul(v, y) {
        if (y !== undefined) {
            this.x *= v;
            this.y *= y;
        } else {
            this.x *= v.x;
            this.y *= v.y;
        }
        return this;
    }
    div(v, y) {
        if (y !== undefined) {
            this.x /= v;
            this.y /= y;
        } else {
            this.x /= v.x;
            this.y /= v.y;
        }
        return this;
    }

    setX(x) {
        this.x = x;
        return this;
    }
    setY(y) {
        this.y = y;
        return this;
    }

    floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
    abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    filter(f) {
        this.x = f(this.x);
        this.y = f(this.y);
        return this;
    }

    clone() {
        return new this.constructor(this.x, this.y);
    }

    copy(v, y) {
        if (y !== undefined) {
            this.x = v;
            this.y = y;
        } else {
            this.x = v.x;
            this.y = v.y;
        }
        return this;
    }
}
