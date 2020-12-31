const core = require('@actions/core');
const exec = require('@actions/exec');
const glob = require('@actions/glob');
const {promisify} = require('util');
const {readFile, writeFile} = require('fs');

const readF = promisify(readFile);
const writeF = promisify(writeFile)

/**
 * Get global config from core
 */
const rootDir = core.getInput('rootdir', {required: true});
const baseBranch = core.getInput('basebranch', {required: true});
const libFolder = core.getInput('libfolder', {required: true});
const fileName = core.getInput('filename', {required: true});
const replaceText = core.getInput('replacement', {required: true});


/**
 * The the date formatted by YYYY-MM-DD
 * @returns {string}
 */
function getFormattedDate(): string {
    const d = new Date();
    const ye = new Intl.DateTimeFormat('en', {year: 'numeric'}).format(d);
    const mo = new Intl.DateTimeFormat('en', {month: '2-digit'}).format(d);
    const da = new Intl.DateTimeFormat('en', {day: '2-digit'}).format(d);
    return `${ye}-${mo}-${da}`;
}

async function runExec(rootDir: string, command: string, args: string[]) {
    try {
        let output = '';
        const options = {
            listeners: {
                stdout: (data: Buffer) => output += data.toString()
            },
            cwd: rootDir
        }
        await exec.exec(command, args, options);
        return output.trim();
    } catch (e) {
        console.error(e);
        throw e;
    }
}

/**
 * Get the list of libraries that only contain changelogs
 * @param foundChangelogs
 * @returns {*}
 */
function getUpdatedLibs(foundChangelogs: string[]) {
    return foundChangelogs.map(changelog => {
        const parts = changelog.split('/');
        return parts[parts.length - 2];
    })
}

/**
 * For libraries with a changelog, get their package json files and and extract the version
 * @param rootDir
 * @param libFolder
 * @param libsWithChangelogs
 * @returns {Promise<[]>}
 */
async function getLibsVersions(rootDir: string, libFolder: string, libsWithChangelogs: string[]) {
    try {
        const versions = [];
        const packageFiles = libsWithChangelogs.map(lib => `${rootDir}/${libFolder}/${lib}/package.json`);
        const packages = await glob.create(packageFiles.join('\n'))
        const foundPackages = await packages.glob();

        for (const pack of foundPackages) {
            let output = '';
            const options = {
                listeners: {
                    stdout: (data: Buffer) => {
                        output += data.toString();
                    }
                },
            }
            await exec.exec(`jq`, ['-r', '.version', pack], options);
            versions.push(output.toString().trim())
        }
        return versions;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

/**
 * Check for the token text to replace in the changelog file
 * @param foundChangelogs
 * @param versions
 * @param replaceText
 * @returns {Promise<void>}
 */
async function updateChangelog(foundChangelogs: string[], versions: string[], replaceText: string) {
    try {
        const dryRun = core.getInput('dryrun');
        let count = 0;
        for (const changelog of foundChangelogs) {

            const version = versions[count];
            const replace = `[${version}] - ${getFormattedDate()}`;

            const file = await readF(changelog);
            const result = file.toString();

            if (!result.includes(`[${replaceText}`)) {
                return Promise.reject(`The changelog ${changelog} does not have an [${replaceText}] token`)
            }
            const update = result.replace(`[${replaceText}]`, replace);
            if (!dryRun || dryRun && dryRun === 'false') {
                await writeF(changelog, update);
            }
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function run() {
    try {
        const affected = await runExec(rootDir, 'node_modules/.bin/nx', ['affected:libs', '--plain', `--base=${baseBranch}`]);
        const changelogFiles = affected.split(' ').map(lib =>
            `${rootDir}/${libFolder}/${lib}/${fileName}`
        );

        const checkExistingChangelogs = await glob.create(changelogFiles.join('\n'))
        const foundChangelogs = await checkExistingChangelogs.glob();
        const libsWithChangelogs = getUpdatedLibs(foundChangelogs);

        const versions = await getLibsVersions(rootDir, libFolder, libsWithChangelogs);

        await updateChangelog(foundChangelogs, versions, replaceText);

        core.setOutput('updated', libsWithChangelogs.join(','));
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
