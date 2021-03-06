"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFile = exports.validateArduinoPath = exports.resolveArduinoPath = void 0;
const childProcess = require("child_process");
const path = require("path");
const util_1 = require("../util");
function resolveArduinoPath() {
    let result;
    const defaultCommonPaths = [path.join(process.env.HOME, "Applications"), "/Applications"];
    for (const scanPath of defaultCommonPaths) {
        if (util_1.directoryExistsSync(path.join(scanPath, "Arduino.app"))) {
            result = scanPath;
            break;
        }
    }
    return result || "";
}
exports.resolveArduinoPath = resolveArduinoPath;
function validateArduinoPath(arduinoPath, useArduinoCli = false) {
    return util_1.fileExistsSync(path.join(util_1.resolveMacArduinoAppPath(arduinoPath, useArduinoCli), useArduinoCli ? "arduino-cli" : "/Contents/MacOS/Arduino"));
}
exports.validateArduinoPath = validateArduinoPath;
function findFile(fileName, cwd) {
    let pathString;
    try {
        pathString = childProcess.execSync(`find ${cwd} -name ${fileName} -type f`, { encoding: "utf8" }).split("\n");
        if (pathString && pathString[0] && util_1.fileExistsSync(pathString[0].trim())) {
            pathString = path.normalize(pathString[0].trim());
        }
        else {
            pathString = null;
        }
    }
    catch (ex) {
        // Ignore the errors.
    }
    return pathString;
}
exports.findFile = findFile;

//# sourceMappingURL=darwin.js.map
