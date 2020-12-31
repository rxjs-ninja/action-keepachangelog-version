const process = require('process');
const cp = require('child_process');
const path = require('path');

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {

    process.env['INPUT_ROOTDIR'] = path.join(__dirname, 'test-workspace');
    process.env['INPUT_BASEBRANCH'] = 'origin/main';
    process.env['INPUT_LIBFOLDER'] = 'packages';
    process.env['INPUT_FILENAME'] = 'CHANGELOG.md';
    process.env['INPUT_REPLACEMENT'] = 'Unreleased';
    process.env['INPUT_DRYRUN'] = 'true';
    const ip = path.join(__dirname, 'index.js');


    const result = cp.execSync(`node ${ip}`, {env: process.env}).toString();
    const lines = result.toString().split('\n');

    const parts = lines.find(line => line.includes('name=updated')).split('::');
    const output = parts[parts.length - 1].trim();
    expect(output).toStrictEqual('test-lib-1');
})
