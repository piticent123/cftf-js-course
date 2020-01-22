const program = require('commander');
const inquirer = require('inquirer');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const clear = require('clear');
const chalk = require('chalk');
const spinnies = require('spinnies');

function runJest(level, test) {
    return new Promise(resolve => {
        const jest = path.join('.', 'node_modules', '.bin', 'jest');
        child_process
            .exec(`${jest} --testNamePattern="${test} " --testPathPattern="tests/${level}"`)
            .on('close', resolve);
    });
};

function testList(level) {
    const folder = [, '1 Beginner', '2 Intermediate', '3 Advanced'][level];
    return fs.readdirSync(folder).map(name => name.replace('.test.js', ''));
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
        const {runMore} = await inquirer.prompt([{type: 'confirm', name: 'runMore', message: 'Run more tests?'}]);
        if (!runMore) return;
    }

    if (all) {
        // TODO
        return;
    }

    
    const testFailed = await runJest(level, test);
    console.log(`Test ${args.level}.${args.test} ${testFailed ? 'failed' : 'passed'}.`);
})();
