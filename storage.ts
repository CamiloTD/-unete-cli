const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, 'data')

try { fs.mkdirSync(DATA_PATH); } catch (exc) {}

class Storage {
    path: string;
    data: { [key: string]: any };

    constructor (name: string) {
        this.path = path.join(DATA_PATH, name + '.json')
        this.data = {};

        this.load();
    }

    load () {
        try {
            return this.data = JSON.parse(fs.readFileSync(this.path));
        } catch (exc) {
            return this.data = {};
        }
    }
    
    save () {
        return fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
    
    set (key: string, value: any) {
        this.data[key] = value;
        this.save();
    }
    
    get (key: string) {
        return this.data[key];
    }

    remove (key: string) {
        delete this.data[key];
        this.save();
    }

    _export () {
        return Buffer.from(JSON.stringify(this.data)).toString('base64');
    }

    _import (_data: string) {
        const data = JSON.parse(Buffer.from(_data, 'base64').toString());

        for(const i in data) this.data[i] = data[i];

        this.save();
    }
}

export default (name: string) => new Storage(name);