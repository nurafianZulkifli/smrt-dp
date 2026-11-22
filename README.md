# Screen configuration

After adding, removing or renaming display pages, run this command before deploying:

```powershell
node scripts\generate-screen-manifest.js
```

Deploy the generated `js/screen-manifest.js` with the pages. The generator discovers
`smrt-mdp/<location>.html` as `<location>-E1` and
`smrt-bdp/<location>/berth<number>.html` as `<location>-B<number>`.
Location names may contain letters, numbers and underscores.

The manifest supplies defaults on a device's first visit. Existing saved screen
lists and edits made in Screen Management remain local to each browser; they are
not automatically synchronized between devices.
