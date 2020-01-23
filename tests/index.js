const program = require('commander');
const inquirer = require('inquirer');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const clear = require('clear');
const chalk = require('chalk');
const Spinnies = require('spinnies');

const spinnies = new Spinnies();
const levelFolders = ['1 Beginner', '2 Intermediate', '3 Advanced'];

function runJest(level, test) {
    return new Promise(resolve => {
        const jest = path.join('.', 'node_modules', '.bin', 'jest');
        const testName = `${levelFolders[level - 1].substr(2)} - ${test}`;
        const testFinished = exitCode => {
            if (exitCode) spinnies.fail(testName, {text: `Test ${testName} failed!`});
            else spinnies.succeed(testName, {text: `Test ${testName} passed!`});

            resolve(exitCode);
        }

        spinnies.add(testName, {text: `Running ${testName}`});
        child_process
            .exec(`${jest} --testNamePattern="${test} " --testPathPattern="tests/${level}"`)
            .on('close', testFinished);
    });
};

function testList(level) {
    return fs.readdirSync(levelFolders[level - 1]).map(name => name.replace('.test.js', ''));
}

(async function app() {
    const args = program
        .version('1.0.0')
        .option('-l, --level <level>', 'Level Difficulty')
        .option('-t, --test <test>', 'Test')
        .option('-a, --all', 'Run all tests')
        .parse(process.argv);   
    clear();
    console.log(`Welcome to the ${chalk.green('Camp Fitch Tech Focus')} course for ${chalk.cyan('Javascript')}!`)

    let {level, test, all} = program;
    if (level || test) {
        const testFailed = await runJest(level, test);
        const {runMore} = await inquirer.prompt([{type: 'confirm', name: 'runMore', message: 'Run more tests?'}]);
        if (!runMore) return;
    }

    if (all) {
        // TODO
        return;
    }
})();
