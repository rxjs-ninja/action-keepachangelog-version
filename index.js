const core = require('@actions/core');
const exec = require('@actions/exec');
const glob = require('@actions/glob');

async function getAffectedLibs(rootDir, baseBranch) {
    let output = '';
    const options = {
        listeners: {
            stdout: (data) => {
                output += data.toString();
            }
        },
        cwd: rootDir
    }

    await exec.exec(`node_modules/.bin/nx`, ['affected:libs', '--plain', `--base=${baseBranch}`], options);
    return output.trim().split(' ');
}

function getUpdatedLibs(foundChangelogs) {
    return foundChangelogs.map(changelog => {
        const parts = changelog.split('/');
        return parts[parts.length - 2];
    })
}

async function getLibsVersions(rootDir, libFolder, libsWithChangelogs) {
    const versions = [];
    const packageFiles = libsWithChangelogs.map(lib => `${rootDir}/${libFolder}/${lib}/package.json`);
    const packages = await glob.create(packageFiles.join('\n'))
    const foundPackages = await packages.glob();

    for (const pack of foundPackages) {
        let output = '';
        const options = {
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                }
            },
        }
        await exec.exec(`jq`, ['-r', '.version', pack], options);
        versions.push(output.toString().trim())
    }
    return versions;
}

async function updateChangelog(foundChangelogs, versions) {
    let count = 0;
    for (const changelog of foundChangelogs) {
        const version = versions[count];
        await exec.exec('sed', ['-i', `s/\\[Unreleased\\]/${version}/`, changelog]);
    }
}


// most @actions toolkit packages have async methods
async function run() {
    try {
        const rootDir = core.getInput('rootdir', {required: true});
        const baseBranch = core.getInput('basebranch');
        const libFolder = core.getInput('libfolder');
        const fileName = core.getInput('filename');
        const replaceText = core.getInput('replacement');

        const affected = await getAffectedLibs(rootDir, baseBranch)
        const changelogFiles = affected.map(lib => `${rootDir}/${libFolder}/${lib}/${fileName}`);
        const checkExistingChangelogs = await glob.create(changelogFiles.join('\n'))
        const foundChangelogs = await checkExistingChangelogs.glob();

        const libsWithChangelogs = getUpdatedLibs(foundChangelogs);
        const versions = await getLibsVersions(rootDir, libFolder, libsWithChangelogs);
        await updateChangelog(foundChangelogs, versions);

        core.setOutput('updated', libsWithChangelogs);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();


// const core = require('@actions/core');
// const wait = require('./wait');
//
//
// // most @actions toolkit packages have async methods
// async function run() {
//   try {
//     const ms = core.getInput('milliseconds');
//     core.info(`Waiting ${ms} milliseconds ...`);
//
//     core.debug((new Date()).toTimeString()); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
//     await wait(parseInt(ms));
//     core.info((new Date()).toTimeString());
//
//     core.setOutput('time', new Date().toTimeString());
//   } catch (error) {
//     core.setFailed(error.message);
//   }
// }
//
// run();
