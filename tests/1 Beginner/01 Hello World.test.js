const test = require('../../courses/1 Beginner/01 Hello World');

it('01 Hello World', async () => {
    let lastLog;
    console.log = x => lastLog = x.toLowerCase();

    await new Promise(res => setTimeout(res, 2000));

    test();
    expect(lastLog).toMatch(/hello/);
    expect(lastLog).toMatch(/world/);
});