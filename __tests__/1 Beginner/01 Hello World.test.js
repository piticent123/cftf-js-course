const test = require('../../courses/1 Beginner/01 Hello World');

it('01 Hello World', () => {
    let lastLog;
    console.log = x => lastLog = x;

    test();
    expect(lastLog).toBe('Hello, world!');
});