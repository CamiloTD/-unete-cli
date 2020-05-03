Object.defineProperty(exports, "__esModule", { value: true });
const termx_1 = require("termx");
const clone = require('git-shallow-clone');
const REPO_TYPESCRIPT = "https://github.com/CamiloTD/-unete-cli-typescript.git";
const REPO_JAVASCRIPT = "https://github.com/CamiloTD/-unete-cli-javascript.git";
function Typescript() {
    clone(REPO_TYPESCRIPT, process.cwd(), () => {
        termx_1.log("Done!");
        setTimeout(() => process.exit(0), 1000);
    });
}
exports.Typescript = Typescript;
function Javascript() {
    clone(REPO_JAVASCRIPT, process.cwd(), () => {
        termx_1.log("Done!");
        setTimeout(() => process.exit(0), 1000);
    });
}
exports.Javascript = Javascript;
