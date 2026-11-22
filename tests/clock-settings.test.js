const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const utility = fs.readFileSync(path.join(root, 'smrt-mdp', 'js', 'settings-util.js'), 'utf8');

function createClock(settings, date) {
    const elements = {
        'clock-time': { textContent: '' },
        'clock-date': { textContent: '' }
    };
    const state = { settings, date, interval: null };
    const context = vm.createContext({
        document: { getElementById: id => elements[id], body: { classList: { toggle() {} } } },
        localStorage: { getItem: () => JSON.stringify(state.settings) },
        Date: class extends Date {
            constructor(...args) { super(...(args.length ? args : [state.date.getTime()])); }
        },
        window: { addEventListener() {} },
        setInterval: callback => { state.interval = callback; },
        console
    });
    vm.runInContext(utility, context);
    return { context, elements, state };
}

test('clock formats follow saved settings, including noon and midnight', () => {
    const { context, elements, state } = createClock({}, new Date(2021, 0, 15, 0, 5));
    const update = () => vm.runInContext('SettingsUtil.updateClock()', context);
    update();
    assert.equal(elements['clock-time'].textContent, '00:05');
    assert.equal(elements['clock-date'].textContent, 'Fri, Jan 15');

    state.settings = { clockFormat: '12h', dateFormat: 'full' };
    update();
    assert.equal(elements['clock-time'].textContent, '12:05 AM');
    assert.equal(elements['clock-date'].textContent, 'Friday, January 15');

    state.date = new Date(2021, 0, 15, 12, 5);
    state.settings.dateFormat = 'short';
    update();
    assert.equal(elements['clock-time'].textContent, '12:05 PM');
    assert.equal(elements['clock-date'].textContent, '15 Jan');

    state.date = new Date(2021, 0, 15, 23, 9);
    update();
    assert.equal(elements['clock-time'].textContent, '11:09 PM');
});

test('arrival times use the clock format while preserving arrival and invalid labels', () => {
    const { context, state } = createClock({}, new Date(2021, 0, 15, 11, 0));
    const format = value => {
        context.value = value;
        return vm.runInContext('SettingsUtil.formatArrival(value)', context);
    };
    const future = new Date(2021, 0, 15, 13, 5).toISOString();
    const past = new Date(2021, 0, 15, 10, 0).toISOString();
    assert.equal(format(future), '13:05');
    assert.equal(format('13:05'), '13:05');

    state.settings = { clockFormat: '12h' };
    assert.equal(format(future), '1:05 PM');
    assert.equal(format('00:05'), '12:05 AM');
    assert.equal(format('12:05'), '12:05 PM');
    assert.equal(format('23:09'), '11:09 PM');
    assert.equal(format(past), 'Arr');
    assert.equal(format('Arr'), 'Arr');
    assert.equal(format(''), '');
    assert.equal(format('not-a-time'), 'not-a-time');
    assert.equal(format('25:99'), '25:99');
});

test('each display uses the shared clock and refreshes changed settings', () => {
    const mdp = fs.readdirSync(path.join(root, 'smrt-mdp'))
        .filter(name => name.endsWith('.html'))
        .map(name => path.join(root, 'smrt-mdp', name));
    const bdp = fs.readdirSync(path.join(root, 'smrt-bdp'), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .flatMap(entry => {
            const directory = path.join(root, 'smrt-bdp', entry.name);
            return fs.readdirSync(directory).filter(name => name.endsWith('.html'))
                .map(name => path.join(directory, name));
        });

    for (const file of [...mdp, ...bdp]) {
        const html = fs.readFileSync(file, 'utf8');
        const scriptPath = html.match(/<script src="([^"]*settings-util\.js)"><\/script>/);
        assert.ok(scriptPath, `${file} must load settings utility`);
        assert.equal(path.resolve(path.dirname(file), scriptPath[1]), path.join(root, 'smrt-mdp', 'js', 'settings-util.js'));
        const clockScript = html.match(/<script>\s*([\s\S]*?)\s*let allServices =/);
        assert.ok(clockScript, `${file} must initialize the clock`);
        const { context, elements, state } = createClock({}, new Date(2021, 0, 15, 13, 5));
        vm.runInContext(clockScript[1], context);
        assert.equal(elements['clock-time'].textContent, '13:05', file);
        assert.equal(elements['clock-date'].textContent, 'Fri, Jan 15', file);
        assert.equal(typeof state.interval, 'function', file);
        state.settings = { clockFormat: '12h', dateFormat: 'short' };
        state.interval();
        assert.equal(elements['clock-time'].textContent, '1:05 PM', file);
        assert.equal(elements['clock-date'].textContent, '15 Jan', file);
    }
});
