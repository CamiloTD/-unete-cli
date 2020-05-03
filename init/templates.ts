const clone = require('git-clone');
const REPO_TYPESCRIPT = "https://github.com/CamiloTD/-unete-cli-typescript.git";

export function Typescript () {
    clone(REPO_TYPESCRIPT, process.cwd(), () => process.exit());
}

export function Javascript () {
    
}