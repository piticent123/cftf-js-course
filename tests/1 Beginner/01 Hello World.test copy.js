const test = require('../../courses/1 Beginner/01 Hello World');

it('02 Hello World', () => {
    let lastLog;
    console.log = x => lastLog = x.toLowerCase();

    test();
    expect(lastLog).toMatch(/hello/);
    expect(lastLog).toMatch(/world/);
});