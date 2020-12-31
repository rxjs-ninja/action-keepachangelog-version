const process = require('process');
const cp = require('child_process');
const path = require('path');

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
    process.env['INPUT_ROOTDIR'] = path.join(__dirname, 'test-workspace');
    process.env['INPUT_BASEBRANCH'] = 'origin/main';
    const ip = path.join(__dirname, 'index.js');
    try {
        const result = cp.execSync(`node ${ip}`, {env: process.env});
        const output = result.toString()
        expect(output).toContain('test-lib-1 test-lib-2')
    } catch (e) {
        console.log(e);
    }


})
