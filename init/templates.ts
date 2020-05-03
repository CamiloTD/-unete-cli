const clone = require('git-shallow-clone')
const REPO_TYPESCRIPT = "https://github.com/CamiloTD/-unete-cli-typescript.git";

export function Typescript () {
    clone(REPO_TYPESCRIPT, process.cwd(), () => process.exit(0));
}

export function Javascript () {
    
}