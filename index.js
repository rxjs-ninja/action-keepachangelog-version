var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var core = require('@actions/core');
var exec = require('@actions/exec');
var glob = require('@actions/glob');
var promisify = require('util').promisify;
var _a = require('fs'), readFile = _a.readFile, writeFile = _a.writeFile;
var readF = promisify(readFile);
var writeF = promisify(writeFile);
/**
 * Get global config from core
 */
var rootDir = core.getInput('rootdir', { required: true });
var baseBranch = core.getInput('basebranch', { required: true });
var libFolder = core.getInput('libfolder', { required: true });
var fileName = core.getInput('filename', { required: true });
var replaceText = core.getInput('replacement', { required: true });
/**
 * The the date formatted by YYYY-MM-DD
 * @returns {string}
 */
function getFormattedDate() {
    var d = new Date();
    var ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    var mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    var da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
    return ye + "-" + mo + "-" + da;
}
function runExec(rootDir, command, args) {
    return __awaiter(this, void 0, void 0, function () {
        var output, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    output = '';
                    options = {
                        listeners: {
                            stdout: function (data) { return output += data.toString(); }
                        },
                        cwd: rootDir
                    };
                    return [4 /*yield*/, exec.exec(command, args, options)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, output.trim()];
            }
        });
    });
}
/**
 * Get the list of libraries that only contain changelogs
 * @param foundChangelogs
 * @returns {*}
 */
function getUpdatedLibs(foundChangelogs) {
    return foundChangelogs.map(function (changelog) {
        var parts = changelog.split('/');
        return parts[parts.length - 2];
    });
}
/**
 * For libraries with a changelog, get their package json files and and extract the version
 * @param rootDir
 * @param libFolder
 * @param libsWithChangelogs
 * @returns {Promise<[]>}
 */
function getLibsVersions(rootDir, libFolder, libsWithChangelogs) {
    return __awaiter(this, void 0, void 0, function () {
        var versions, packageFiles, packages, foundPackages, _i, foundPackages_1, pack, version;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    versions = [];
                    packageFiles = libsWithChangelogs.map(function (lib) { return rootDir + "/" + libFolder + "/" + lib + "/package.json"; });
                    return [4 /*yield*/, glob.create(packageFiles.join('\n'))];
                case 1:
                    packages = _a.sent();
                    return [4 /*yield*/, packages.glob()];
                case 2:
                    foundPackages = _a.sent();
                    _i = 0, foundPackages_1 = foundPackages;
                    _a.label = 3;
                case 3:
                    if (!(_i < foundPackages_1.length)) return [3 /*break*/, 6];
                    pack = foundPackages_1[_i];
                    return [4 /*yield*/, runExec(rootDir, 'jq', ['-r', '.version', pack])];
                case 4:
                    version = _a.sent();
                    versions.push(version.trim());
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, versions];
            }
        });
    });
}
/**
 * Check for the token text to replace in the changelog file
 * @param foundChangelogs
 * @param versions
 * @param replaceText
 * @returns {Promise<void>}
 */
function updateChangelog(foundChangelogs, versions, replaceText) {
    return __awaiter(this, void 0, void 0, function () {
        var dryRun, count, _i, foundChangelogs_1, changelog, version, replace, file, result, update;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dryRun = core.getInput('dryrun');
                    count = 0;
                    _i = 0, foundChangelogs_1 = foundChangelogs;
                    _a.label = 1;
                case 1:
                    if (!(_i < foundChangelogs_1.length)) return [3 /*break*/, 5];
                    changelog = foundChangelogs_1[_i];
                    version = versions[count];
                    replace = "[" + version + "] - " + getFormattedDate();
                    return [4 /*yield*/, readF(changelog)];
                case 2:
                    file = _a.sent();
                    result = file.toString();
                    if (!result.includes("[" + replaceText)) {
                        throw new Error("The changelog " + changelog + " does not have an [" + replaceText + "] token. Exiting.");
                    }
                    update = result.replace("[" + replaceText + "]", replace);
                    if (!(!dryRun || dryRun && dryRun === 'false')) return [3 /*break*/, 4];
                    return [4 /*yield*/, writeF(changelog, update)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var affected, changelogFiles, checkExistingChangelogs, foundChangelogs, libsWithChangelogs, versions, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, runExec(rootDir, 'node_modules/.bin/nx', ['affected:libs', '--plain', "--base=" + baseBranch])];
                case 1:
                    affected = _a.sent();
                    changelogFiles = affected.split(' ').map(function (lib) {
                        return rootDir + "/" + libFolder + "/" + lib + "/" + fileName;
                    });
                    return [4 /*yield*/, glob.create(changelogFiles.join('\n'))];
                case 2:
                    checkExistingChangelogs = _a.sent();
                    return [4 /*yield*/, checkExistingChangelogs.glob()];
                case 3:
                    foundChangelogs = _a.sent();
                    libsWithChangelogs = getUpdatedLibs(foundChangelogs);
                    return [4 /*yield*/, getLibsVersions(rootDir, libFolder, libsWithChangelogs)];
                case 4:
                    versions = _a.sent();
                    return [4 /*yield*/, updateChangelog(foundChangelogs, versions, replaceText)];
                case 5:
                    _a.sent();
                    core.setOutput('updated', libsWithChangelogs.join(','));
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
run();
