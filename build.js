var fs = require("fs-extra");
var path = require("path");


exports.generateCombinedComponentScripts = function generateCombinedComponentScripts(webComponents) {
    fs.ensureDirSync("./rnwc");

    let defaultScriptPath = "./node_modules/react-native/scripts/react-native-xcode.sh";
    if (!fs.existsSync(defaultScriptPath)) defaultScriptPath = "./node_modules/react-native/packager/react-native-xcode.sh";

    let combinedScript = `import {createElement} from "react";\n`
            + `import {embedComponent} from "react-native-web-components";\n`
            + `import {render} from "react-dom";\n`
            + `var webComponents = {};\n`;
    var bundlerScript = fs.readFileSync(defaultScriptPath, "utf-8")
        .replace(/REACT_NATIVE_DIR=.*\n/, "REACT_NATIVE_DIR=" + path.resolve(process.cwd(), "node_modules/react-native") + "\n")
        + "mkdir -p $DEST/rnwc";
    bundlerScript += "\n\n# Code below is automatically added by react-native-web-components\n";
    for (let i = 0; i < webComponents.length; i++) {
        let def = webComponents[i];
        let impname = def.namedExport ? `{${def.namedExport} as ${def.key}}` : def.key;
        combinedScript += `\
            import ${impname} from "${def.path}";\n\
            webComponents["${def.key}"] = ${def.key};\n`;
    }

    let bundlerCmd = `$NODE_BINARY "$REACT_NATIVE_DIR/local-cli/cli.js" bundle`
        + ` --entry-file "rnwc/allcomponents.js" `
        + ` --platform ios `
        + ` --dev $DEV `
        + ` --bundle-output "$DEST/rnwc/allcomponents.jsbundle" `
        + ` --assets-dest "$DEST";`;
    bundlerScript += "\n" + bundlerCmd + "\n";


    combinedScript += `\n\
        render(createElement(embedComponent(webComponents[window.componentKey])), document.body);\n`;

    fs.writeFileSync("./rnwc/allcomponents.js", combinedScript, "utf-8");
    fs.writeFileSync("./react-native-xcode.sh", bundlerScript, {encoding: "utf-8", mode: 0o755});

};

exports.generateComponentScripts = function generateComponentScripts(webComponents) {
    fs.ensureDirSync("./rnwc");

    let defaultScriptPath = "./node_modules/react-native/scripts/react-native-xcode.sh";
    if (!fs.existsSync(defaultScriptPath)) defaultScriptPath = "./node_modules/react-native/packager/react-native-xcode.sh";

    var bundlerScript = fs.readFileSync(defaultScriptPath, "utf-8")
        .replace(/REACT_NATIVE_DIR=.*\n/, "REACT_NATIVE_DIR=" + path.resolve(process.cwd(), "node_modules/react-native") + "\n")
        + "mkdir -p $DEST/rnwc";
    bundlerScript += "\n\n# Code below is automatically added by react-native-web-components\n";
    for (let i = 0; i < webComponents.length; i++) {
        let def = webComponents[i];
        let outFile = "./rnwc/" + def.key + ".js";
        let impname = def.namedExport ? `{${def.namedExport} as ${def.key}}` : def.key;
        let src = `import {createElement} from "react";\n`
            + `import {embedComponent} from "react-native-web-components";\n`
            + `import {render} from "react-dom";\n`
            + `import ${impname} from "${def.path}";\n`
            + `render(createElement(embedComponent(${def.key})), document.body);\n`;
        fs.writeFileSync(outFile, src, "utf-8");

        let bundlerCmd = `$NODE_BINARY "$REACT_NATIVE_DIR/local-cli/cli.js" bundle`
            + ` --entry-file "rnwc/${def.key}.js" `
            + ` --platform ios `
            + ` --dev $DEV `
            + ` --bundle-output "$DEST/rnwc/${def.key}.jsbundle" `
            + ` --assets-dest "$DEST";`;
        bundlerScript += "\n" + bundlerCmd + "\n";
    }

    fs.writeFileSync("./react-native-xcode.sh", bundlerScript, {encoding: "utf-8", mode: 0o755});

};