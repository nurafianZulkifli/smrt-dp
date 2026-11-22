const fs = require('node:fs');
const path = require('node:path');

function discoverScreens(root) {
    const screens = [];
    const mdpDir = path.join(root, 'smrt-mdp');
    const bdpDir = path.join(root, 'smrt-bdp');

    for (const entry of fs.readdirSync(mdpDir, { withFileTypes: true })) {
        const match = /^([a-z0-9_]+)\.html$/i.exec(entry.name);
        if (entry.isFile() && match && match[1].toLowerCase() !== 'index') {
            screens.push({
                name: `${match[1].toLowerCase()}-E1`,
                url: `smrt-mdp/${entry.name}`,
                type: 'MDP'
            });
        }
    }

    for (const location of fs.readdirSync(bdpDir, { withFileTypes: true })) {
        if (!location.isDirectory() || !/^[a-z0-9_]+$/i.test(location.name)) continue;
        const directory = path.join(bdpDir, location.name);
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const match = /^berth([1-9]\d*)\.html$/i.exec(entry.name);
            if (entry.isFile() && match) {
                screens.push({
                    name: `${location.name.toLowerCase()}-B${match[1]}`,
                    url: `smrt-bdp/${location.name}/${entry.name}`,
                    type: 'BDP'
                });
            }
        }
    }

    screens.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (let i = 1; i < screens.length; i++) {
        if (screens[i - 1].name === screens[i].name) {
            throw new Error(`Duplicate screen name: ${screens[i].name}`);
        }
    }
    return screens;
}

function generateManifest(root) {
    return `const DEFAULT_SCREENS = ${JSON.stringify(discoverScreens(root), null, 4)};\n`;
}

if (require.main === module) {
    const root = path.resolve(__dirname, '..');
    const output = path.join(root, 'js', 'screen-manifest.js');
    fs.writeFileSync(output, generateManifest(root));
    console.log(`Generated ${output}`);
}

module.exports = { discoverScreens, generateManifest };
