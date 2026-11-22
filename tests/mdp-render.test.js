const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const settingsScript = fs.readFileSync(path.join(root, 'smrt-mdp', 'js', 'settings-util.js'), 'utf8');

class Element {
    constructor() {
        this.children = [];
        this.style = {};
        this.textContent = '';
        this.html = '';
    }

    set innerHTML(value) {
        this.html = value;
        this.children = [];
    }

    get innerHTML() {
        return this.html;
    }

    appendChild(child) {
        const children = child.fragment ? child.children : [child];
        for (const element of children) {
            element.index = this.children.length;
            this.children.push(element);
        }
    }

    querySelectorAll() {
        return this.children;
    }

    getBoundingClientRect() {
        return { top: 320, bottom: (this.index + 1) * 100 };
    }
}

for (const location of ['bnl', 'bpj', 'cck', 'wdl']) {
    test(`${location} renders arrivals using the appropriate configured pagination buffer`, async () => {
        const base = path.join(root, 'smrt-mdp');
        const html = fs.readFileSync(path.join(base, `${location}.html`), 'utf8');
        const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
        const allocation = JSON.parse(fs.readFileSync(path.join(base, 'json', `berth-allocation-${location}.json`), 'utf8'));
        const elements = Object.fromEntries(
            ['clock-time', 'clock-date', 'bus-table-body', 'page-indicator', 'ticker-text', 'title', 'ticker']
                .map(id => [id, new Element()])
        );
        const errors = [];
        const timers = [];
        const listeners = {};
        const document = {
            getElementById: id => elements[id],
            body: { classList: { toggle() {} } },
            querySelector: selector => elements[selector === '.title' ? 'title' : 'ticker'],
            createDocumentFragment: () => Object.assign(new Element(), { fragment: true }),
            createElement: () => new Element()
        };
        const settings = { bufferWithoutDirections: 30, bufferWithDirections: 10 };
        const services = ['856', '858', '900'].map(ServiceNo => ({
            ServiceNo,
            NextBus: { EstimatedArrival: '12:34', Type: 'SD' },
            NextBus2: { EstimatedArrival: '12:45', Type: 'DD' }
        }));
        const context = vm.createContext({
            document,
            window: { innerWidth: 1400, addEventListener: (type, handler) => { listeners[type] = handler; } },
            localStorage: { getItem: key => key === 'mdpScreenSettings' ? JSON.stringify(settings) : null },
            setInterval: (fn, delay) => (timers.push({ fn, delay }), timers.length),
            clearInterval() {},
            console: { error: (...args) => errors.push(args), warn: (...args) => errors.push(args) },
            fetch: async url => ({ json: async () => url.startsWith('json/') ? allocation : { Services: services } })
        });

        vm.runInContext(settingsScript, context);
        vm.runInContext(script, context);
        await new Promise(resolve => setImmediate(resolve));

        const tbody = elements['bus-table-body'];
        assert.deepEqual(errors, []);
        assert.equal(tbody.style.visibility, '');
        assert.equal(tbody.children.length, location === 'wdl' ? 3 : 2);
        assert.match(tbody.children[0].innerHTML, /12:34/);
        assert.match(tbody.children[0].innerHTML, /12:45/);
        assert.equal(elements['page-indicator'].textContent, location === 'wdl' ? 'Page 1/1' : 'Page 1/2');
        if (location === 'wdl') {
            assert.match(tbody.children[0].innerHTML, /Train/);
            assert.match(tbody.children[0].innerHTML, /Checkpoint/);
        }

        test('BDP departure times update when the clock format changes', async () => {
            const html = fs.readFileSync(path.join(root, 'smrt-bdp', 'bpj', 'berth1.html'), 'utf8');
            const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
            const elements = Object.fromEntries(
                ['clock-time', 'clock-date', 'bus-table-body', 'page-indicator', 'ticker-text', 'title', 'ticker']
                    .map(id => [id, new Element()])
            );
            const settings = { clockFormat: '24h' };
            const listeners = {};
            const context = vm.createContext({
                document: {
                    getElementById: id => elements[id],
                    body: { classList: { toggle() {} } },
                    querySelector: selector => elements[selector === '.title' ? 'title' : 'ticker'],
                    createDocumentFragment: () => Object.assign(new Element(), { fragment: true }),
                    createElement: () => new Element()
                },
                window: { innerWidth: 1400, addEventListener: (type, handler) => { listeners[type] = handler; } },
                localStorage: { getItem: key => key === 'mdpScreenSettings' ? JSON.stringify(settings) : null },
                setInterval() {},
                clearInterval() {},
                console,
                fetch: async url => ({
                    json: async () => url.includes('berth1.json') ? ['856']
                        : url.includes('bus-arrivals') ? {
                            Services: [{ ServiceNo: '856', NextBus: { EstimatedArrival: '13:34' }, NextBus2: { EstimatedArrival: '00:45' } }]
                        } : {}
                })
            });

            vm.runInContext(settingsScript, context);
            vm.runInContext(script, context);
            await new Promise(resolve => setImmediate(resolve));
            const tbody = elements['bus-table-body'];
            assert.match(tbody.children[0].innerHTML, /13:34/);
            settings.clockFormat = '12h';
            listeners.storage({ key: 'mdpScreenSettings' });
            assert.match(tbody.children[0].innerHTML, /1:34 PM/);
            assert.match(tbody.children[0].innerHTML, /12:45 AM/);
        });
        const pageTimer = timers.find(timer => timer.delay === 7000);
        assert.ok(pageTimer);
        pageTimer.fn();
        assert.equal(elements['page-indicator'].textContent, location === 'wdl' ? 'Page 1/1' : 'Page 2/2');
        assert.equal(tbody.children.length, location === 'wdl' ? 3 : 1);
        assert.match(tbody.children[0].innerHTML, /12:34/);

        settings.clockFormat = '12h';
        listeners.storage({ key: 'mdpScreenSettings' });
        assert.match(tbody.children[0].innerHTML, /12:34 PM/);
        assert.match(tbody.children[0].innerHTML, /12:45 PM/);
    });
}
