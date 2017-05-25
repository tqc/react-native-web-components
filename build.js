var fs = require("fs-extra");
var path = require("path");

exports.generateComponentScripts = function generateComponentScripts(webComponents) {
    fs.ensureDirSync("./rnwc");

    var bundlerScript = fs.readFileSync("./node_modules/react-native/packager/react-native-xcode.sh", "utf-8")
        .replace(/REACT_NATIVE_DIR=.*\n/, "REACT_NATIVE_DIR=" + path.resolve(process.cwd(), "node_modules/react-native") + "\n")
        + "mkdir -p $DEST/rnwc";
    bundlerScript += "\n\n# Code below is automatically added by react-native-web-components\n";
    for (let i = 0; i < webComponents.length; i++) {
        let def = webComponents[i];
        let outFile = "./rnwc/" + def.key + ".js";
        let impname = def.namedExport ? `{${def.namedExport} as ${def.key}}` : def.key;
        let src = `import {createElement} from "react";\n`
            + `import {render} from "react-dom";\n`
            + `import ${impname} from "${def.path}";\n`
            + `render(createElement(${def.key}), document.body);\n`;
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