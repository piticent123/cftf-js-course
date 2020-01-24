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

function csv(value) {
    return value.split(',');
}

function testList(level) {
    return fs.readdirSync(`tests/${levelFolders[level - 1]}`).map(name => name.replace('.test.js', ''));
}

/**
 * Parses a list of levels and tests given from Commander into something parseable by runJestTest
 * 
 * @param {String[]} level 
 * @param {String[]} test 
 * @returns {String[][]}
 */
function parseTestList(level, test) {
    const testsToArray = (input, defaultLevel) => {
        const [, level = defaultLevel, test] = /(\d+)?[._@#-]?(\d+)/.exec(input);
        return level && test ? [level, test] : `I couldn't find a valid test in "${input}"`;
    };

    if (level.length && !test.length) {
        return level.flatMap(l => testList(l).map((_, t) => ([l, t])));
    } else if (test.length && !level.length) {
        return test.map(testsToArray);
    } else if (test.length && level.length) {
        if (level.length === 2) {
            console.log(`Ignoring level ${level[1]}`);
        } else if (level.length === 3) {
            console.log(`Ignoring levels ${level[1]} and ${level[2]}`);
        }
        return test.map(t => testsToArray(t, level[0]));
    } else {
        return "You didn't specify a test to run!";
    }
}

/**
 * Runs 1 Jest test in the background.
 * Adds a spinner to the CLI and fails/passes it according to the test.
 * 
 * @param {String} level 
 * @param {String} test 
 */
function runJest(level, test) {
    return new Promise(resolve => {
        const jest = path.join('.', 'node_modules', '.bin', 'jest');
        const testName = `${levelFolders[level - 1].substr(2)}#${test + 1}`;
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

(async function app() {
    const args = program
        .version('1.0.0', '-v, --version')
        .option('-l, --level <level>', 'Level Difficulty', csv)
        .option('-t, --test <test>', 'Test', csv)
        .option('-a, --all', 'Run all tests')
        .parse(process.argv);   
    clear();
    console.log(`Welcome to the ${chalk.bgYellow.black.underline('Camp Fitch Tech Focus')} course for ${chalk.bgYellow.black.underline('Javascript')}!`)

    let {level = [], test = [], all} = program;
    if (all) level = levelFolders.map((_, i) => i + 1);
    if (level.length || test.length) {
        const tests = parseTestList(level, test);
        await Promise.all(tests.map(([l, t]) => runJest(l, t)));
        return;
    }

    let response = {};
    do {
        // Ask for tests to run
        // Run tests (TODO: Watch all tests, run changed ones)
        response = await inquirer.prompt([{type: 'confirm', name: 'runMore', message: 'Run more tests?'}]);
    } while (response.runMore);
})();
