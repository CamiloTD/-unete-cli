import { log } from "termx";

const clone = require('git-shallow-clone')

const REPO_TYPESCRIPT = "https://github.com/CamiloTD/-unete-cli-typescript.git";
const REPO_JAVASCRIPT = "https://github.com/CamiloTD/-unete-cli-javascript.git";

export function Typescript () {
    clone(REPO_TYPESCRIPT, process.cwd(), () => {
        log("Done!");

        setTimeout(() => process.exit(0), 1000);
    });
}

export function Javascript () {
    clone(REPO_JAVASCRIPT, process.cwd(), () => {
        log("Done!");

        setTimeout(() => process.exit(0), 1000);
    });
}