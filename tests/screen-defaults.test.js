const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { discoverScreens, generateManifest } = require('../scripts/generate-screen-manifest.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const loader = script.slice(0, script.indexOf('        function getSections()'));
const manifest = fs.readFileSync(path.join(root, 'js', 'screen-manifest.js'), 'utf8');

function loadScreens(saved) {
    const storage = new Map(saved === undefined ? [] : [['screenManagerScreens', JSON.stringify(saved)]]);
    const context = vm.createContext({
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value)
        }
    });
    vm.runInContext(manifest + '\n' + loader + '\nloadScreens();', context);
    return JSON.parse(storage.get('screenManagerScreens'));
}

test('fresh screen configuration includes the exported locations', () => {
    const screens = loadScreens();
    assert.deepEqual(screens.map(screen => screen.name), [
        'bnl-E1', 'bpj-B1', 'bpj-B2', 'bpj-B3', 'bpj-E1',
        'cck-B1', 'cck-B2', 'cck-B3', 'cck-B4', 'cck-B5', 'cck-E1',
        'eun-E1', 'ser-E1', 'wdl-E1', 'wlg-E1'
    ]);
    for (const screen of screens) {
        assert.ok(fs.existsSync(path.join(root, screen.url)), screen.url);
    }
    for (const location of ['eun', 'wlg', 'ser']) {
        assert.deepEqual(screens.find(screen => screen.name === `${location}-E1`), {
            name: `${location}-E1`, url: `smrt-mdp/${location}.html`, type: 'MDP'
        });

    }
});

test('existing screen configuration is not replaced by new defaults', () => {
    const saved = [
        { name: 'wdl-E1', url: 'smrt-mdp/wdl.html', type: 'MDP' },
        { name: 'custom-E1', url: 'custom.html', type: 'MDP' }
    ];
    assert.deepEqual(loadScreens(saved), saved);
});

test('generator detects new display pages and ignores unrelated files', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'screen-manifest-'));
    try {
        fs.mkdirSync(path.join(directory, 'smrt-mdp'));
        fs.mkdirSync(path.join(directory, 'smrt-bdp', 'new'), { recursive: true });
        fs.writeFileSync(path.join(directory, 'smrt-mdp', 'new.html'), '');
        fs.writeFileSync(path.join(directory, 'smrt-mdp', 'index.html'), '');
        fs.writeFileSync(path.join(directory, 'smrt-bdp', 'new', 'berth2.html'), '');
        fs.writeFileSync(path.join(directory, 'smrt-bdp', 'new', 'other.html'), '');

        assert.deepEqual(discoverScreens(directory), [
            { name: 'new-B2', url: 'smrt-bdp/new/berth2.html', type: 'BDP' },
            { name: 'new-E1', url: 'smrt-mdp/new.html', type: 'MDP' }
        ]);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('checked-in manifest matches the available display pages', () => {
    assert.equal(manifest, generateManifest(root));
});
