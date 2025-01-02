export function PreprocessShaderWithFlags(shader: string, flags: string[], printWarnings: boolean = true) {
    let unusedFlags: string[] = [...flags];
    let insideIfFlags: string[] = [];
    let insideIfnotFlags: string[] = [];
    let lastIfLine = 0;

    let lines = shader.split("\n");
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const matchesFlags = insideIfFlags.every(f => flags.includes(f)) && insideIfnotFlags.every(f => !flags.includes(f));
        let match;
        if ((match = lines[lineNumber].match(/^ *\/\/#if (\S+)/)) != null) {
            insideIfFlags.push(match[1]);
            lastIfLine = lineNumber;
            if (unusedFlags.includes(match[1])) {
                unusedFlags.splice(unusedFlags.indexOf(match[1]), 1);
            }
        } else if ((match = lines[lineNumber].match(/^ *\/\/#endif (\S+)/)) != null) {
            if (insideIfFlags.includes(match[1])) {
                if (matchesFlags && lineNumber-1 > 0 && lines[lineNumber-1].match(/\*\//) != null) {
                    lines[lineNumber-1] = "";
                }
                insideIfFlags.splice(insideIfFlags.indexOf(match[1]), 1);
            } else if (printWarnings) {
                console.log("wgslPreprocessor Warning: #endif in line '" + lines[lineNumber] + "' doesn't have a matching starting #if");
            }
        } else if ((match = lines[lineNumber].match(/^ *\/\/#ifnot (\S+)/)) != null) {
            insideIfnotFlags.push(match[1]);
            lastIfLine = lineNumber;
            if (unusedFlags.includes(match[1])) {
                unusedFlags.splice(unusedFlags.indexOf(match[1]), 1);
            }
        } else if ((match = lines[lineNumber].match(/^ *\/\/#endifnot (\S+)/)) != null) {
            if (insideIfnotFlags.includes(match[1])) {
                if (matchesFlags && lineNumber-1 > 0 && lines[lineNumber-1].match(/\*\//) != null) {
                    lines[lineNumber-1] = "";
                }
                insideIfnotFlags.splice(insideIfnotFlags.indexOf(match[1]), 1);
            } else if (printWarnings) {
                console.log("wgslPreprocessor Warning: #endif in line '" + lines[lineNumber] + "' doesn't have a matching starting #if");
            }
        } else {
            if (!matchesFlags && !lines[lineNumber].match(/^ *\/\//)) {
                lines[lineNumber] = "//"+lines[lineNumber];
            }
            if (lastIfLine == lineNumber-1 && (insideIfFlags.length > 0 || insideIfnotFlags.length > 0) && matchesFlags && lines[lineNumber].match(/\/\*/) != null) {
                lines[lineNumber] = "";
            }
        }
    }

    if (printWarnings) {
        for (let i = 0; i < unusedFlags.length; i++) {
            console.log("wgslPreprocessor Warning: Flag '" + unusedFlags[i] + "' isn't used in the shader.");
        }
        for (let i = 0; i < insideIfFlags.length; i++) {
            console.log("wgslPreprocessor Warning: Flag '" + insideIfFlags[i] + "' isn't finished with an #endif.");
        }
    }

    //console.log(lines.join("\n"));
    return lines.join("\n");
}


