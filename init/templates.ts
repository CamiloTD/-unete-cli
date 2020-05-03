import { log } from "termx";

const clone = require('git-shallow-clone')
const REPO_TYPESCRIPT = "https://github.com/CamiloTD/-unete-cli-typescript.git";

export function Typescript () {
    clone(REPO_TYPESCRIPT, process.cwd(), () => {
        log("Done!");
        
        setTimeout(() =>process.exit(0), 1000);
    });
}

export function Javascript () {
    process.exit(0);
}