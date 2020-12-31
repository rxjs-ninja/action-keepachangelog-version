const process = require('process');
const {exec, execSync} = require('child_process');
const path = require('path');

const {promisify} = require('util');
const {readFile, writeFile} = require('fs');

const readF = promisify(readFile);
const writeF = promisify(writeFile);
const execAsync = promisify(exec);


describe('NX Keep-A-Changelog Action', () => {

    beforeAll(async () => {
        const cl = path.join(__dirname, 'test-workspace/packages/test-lib-1/src', 'index.ts');
        let content = await readF(cl);
        content = `// New Comment\n` + cl;
        await writeF(cl, content)
        await execAsync('git config user.email "test@test" && git config user.name "Test"')
        await execAsync(`git add . && git commit -m "Add test lib"`)
    })


    beforeEach(() => {
        process.env['INPUT_ROOTDIR'] = path.join(__dirname, 'test-workspace');
        process.env['INPUT_BASEBRANCH'] = 'origin/main';
        process.env['INPUT_LIBFOLDER'] = 'packages';
        process.env['INPUT_FILENAME'] = 'CHANGELOG.md';
        process.env['INPUT_REPLACEMENT'] = 'Unreleased';
        process.env['INPUT_DRYRUN'] = 'true';
    });

    afterAll(async () => {
        await execAsync(`git reset HEAD~1 --soft && git reset HEAD --hard`);
    })


    // shows how the runner will run a javascript action with env / stdout protocol
    it('should update a changelog based on changes', () => {
        const ip = path.join(__dirname, 'index.js');
        const result = execSync(`node ${ip}`, {env: process.env});
        const lines = result.toString().split('\n');
        const parts = lines.find(line => line.includes('name=updated')).split('::');
        const output = parts[parts.length - 1].trim();
        expect(output).toStrictEqual('test-lib-1');
    });
})


