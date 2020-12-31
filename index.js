const core = require('@actions/core');
const exec = require('@actions/exec');


const BASE = 'origin/main~1';

// most @actions toolkit packages have async methods
async function run() {
    try {

        let output = '';
        const options = {
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                }
            }
        }

        await exec.exec('npm', ['run', 'nx', '--', 'affected:libs', '--plain', `--base=${BASE}`], options);
        core.setOutput('updated', output);
        console.log(output);
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
