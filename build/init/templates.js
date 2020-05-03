Object.defineProperty(exports, "__esModule", { value: true });
const clone = require('git-clone');
const REPO_TYPESCRIPT = "https://github.com/CamiloTD/-unete-cli-typescript.git";
function Typescript() {
    clone(REPO_TYPESCRIPT, process.cwd(), () => process.exit());
}
exports.Typescript = Typescript;
function Javascript() {
}
exports.Javascript = Javascript;
