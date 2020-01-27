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
    return fs
        .readdirSync(`tests/${typeof level === 'string' ? level : levelFolders[level - 1]}`)
        .map(name => name.replace('.test.js', ''));
}

function getTestName(level, test) {
    return fs
        .readdirSync(`tests/${typeof level === 'string' ? level : levelFolders[level - 1]}`)
        .find(name => name.includes(`${test} `))
        .replace('.test.js', '')
        .substring(3);
}

/**
 * Parses a list of levels and tests given from Commander into something parseable by runJestTest
 * 
 * @param {String[]} level 
 * @param {String[]} test 
 * @returns {String[][]}
 */
function parseTestList({tests: {level = [], test = [], all} = {}, runType} = {}) {
    const testsToArray = (input, defaultLevel) => {
        const [, level = defaultLevel, test] = /(\d+)?[._@#-]?(\d+)/.exec(input);
        return level && test ? [level, test] : `I couldn't find a valid test in "${input}"`;
    };

    if (all || runType === 'Run All Tests') {
        return levelFolders.flatMap(l => testList(l).map((_, t) => ([l, t])));
    } else if (level.length && !test.length) {
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
        const testName = `${typeof level === 'string' ? level : levelFolders[level - 1].substring(2)}#${getTestName(level, test)}`;
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
    program
        .version('1.0.0', '-v, --version')
        .option('-l, --level <level>', 'Level Difficulty', csv)
        .option('-t, --test <test>', 'Test', csv)
        .option('-a, --all', 'Run all tests')
        .parse(process.argv);   
    clear();
    console.log(`Welcome to the ${chalk.bgYellow.black.underline('Camp Fitch Tech Focus')} course for ${chalk.bgYellow.black.underline('Javascript')}!`)

    let response = {tests: program, runMore: false};
    while (true) {
        const tests = parseTestList(response);

        if (tests) await Promise.all(tests.map(([l, t]) => runJest(l, t)));
        if (tests && !response.runMore) return;
        
        response = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'runMore', 
                message: 'Run more tests?',
                when: tests !== undefined,
            },
            {
                type: 'list', 
                name: 'runType',
                message: 'What do you want to run?',
                choices: ['Run All Tests', 'Watch All Changed Tests', 'Run Specific Tests'],
                when: ({runMore}) => runMore || runMore === undefined,
            },
            {
                type: 'checkbox',
                name: 'tests.test',
                message: 'Which tests do you want to run?',
                choices: ['Use Text Input', ...levelFolders.flatMap(l => testList(l).map(t => `${l.substring(2)}#${t.substring(3)}`))],
                when: ({runType}) => runType === 'Run Specific Tests',
            },
            {
                type: 'input',
                name: 'tests.test', 
                message: 'Which tests do you want to run?',
                filter: x => x.split(','),
                when: ({tests}) => tests && tests.test && tests.test[0] === 'Use Text Input',
            }
        ]);
    }
})();
