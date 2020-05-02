export interface MethodMetadata {
    name: string;
    method: any;

    args: string[];
}

export function getMethods (obj: any, base = '') {
    var methods: MethodMetadata[] = [];

    if(obj === undefined || obj === null) return methods;

    for(const prop in obj) {
        const el = obj[prop];
        const name = base? `${base}.${prop}` : prop;

        if(typeof el === "object") {
            methods = [...methods, ...getMethods(el, name)]
        } else {
            methods.push({
                name,
                method: el,
                args: getParamNames(el)
            })
        }
    }

    return methods;
}

/*
 
   _     _ _     
  | |   (_) |__  
  | |   | | '_ \ 
  | |___| | |_) |
  |_____|_|_.__/ 
                 
 
*/


var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;

function getParamNames(func: any) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
}