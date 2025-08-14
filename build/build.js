#!/usr/bin/env node
/* eslint-disable no-console */
// CABANA build pipeline: images, CSS, JS, HTML, fingerprinting

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier-terser');
const { rollup } = require('rollup');
const { terser } = require('@rollup/plugin-terser');
const critical = require('critical');
const replaceInFile = require('replace-in-file');
const crypto = require('crypto');

const root = process.cwd();
const outDir = path.join(root, 'dist');

function log(msg) {
  console.log(`[build] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFileSync(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function fingerprint(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

async function optimizeImages() {
  log('Optimizing images via scripts/optimize-images.sh');
  try {
    execSync('bash ./scripts/optimize-images.sh', { stdio: 'inherit' });
  } catch (e) {
    console.warn('[build] Image optimization failed or skipped:', e.message);
  }
}

function minifyCssFiles() {
  log('Minifying CSS');
  const cssFiles = glob.sync('css/**/*.css', { nodir: true });
  cssFiles.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    const output = new CleanCSS({ level: 2 }).minify(src).styles;
    const dest = path.join(outDir, file);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, output);
  });
}

async function bundleJs() {
  log('Bundling and minifying JS');
  const jsFiles = glob.sync('js/**/*.js', { nodir: true });
  for (const entry of jsFiles) {
    const bundle = await rollup({ input: entry, plugins: [terser()] });
    const { output } = await bundle.generate({ format: 'iife', sourcemap: false });
    const fileName = path.basename(entry);
    const dest = path.join(outDir, 'js', fileName);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, output[0].code);
  }
}

async function minifyHtml() {
  log('Minifying HTML');
  const htmlFiles = glob.sync('**/*.html', {
    ignore: ['node_modules/**', 'dist/**'],
    nodir: true,
  });
  for (const file of htmlFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const min = await htmlMinifier.minify(src, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      keepClosingSlash: true,
      sortAttributes: true,
      sortClassName: true,
    });
    const dest = path.join(outDir, file);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, min);
  }
}

function copyStaticAssets() {
  log('Copying static assets');
  // Copy assets directory as-is (videos, images, etc.)
  const assets = glob.sync('assets/**/*', { nodir: true });
  assets.forEach((file) => {
    copyFileSync(file, path.join(outDir, file));
  });
  // Public directory (mobile fixes etc.)
  const pub = glob.sync('public/**/*', { nodir: true });
  pub.forEach((file) => copyFileSync(file, path.join(outDir, file)));
  // Manifest, sw, robots, sitemap
  ['site.webmanifest', 'sw.js', 'robots.txt', 'sitemap.xml'].forEach((f) => {
    if (fs.existsSync(f)) copyFileSync(f, path.join(outDir, f));
  });
}

function fingerprintAssetsAndRewrite() {
  log('Fingerprinting assets and rewriting references');
  const filesToFingerprint = glob.sync(`${outDir}/**/*.{css,js}`, { nodir: true });
  const rewrites = [];

  filesToFingerprint.forEach((filePath) => {
    const content = fs.readFileSync(filePath);
    const hash = fingerprint(content);
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const ext = path.extname(base);
    const name = base.slice(0, -ext.length);
    const hashed = `${name}.${hash}${ext}`;
    fs.renameSync(filePath, path.join(dir, hashed));
    const rel = path.relative(outDir, path.join(dir, base)).replace(/\\/g, '/');
    const relHashed = path.relative(outDir, path.join(dir, hashed)).replace(/\\/g, '/');
    rewrites.push({ from: rel, to: relHashed });
  });

  // Replace in HTML and CSS within dist
  const targets = glob.sync(`${outDir}/**/*.{html,css}`, { nodir: true });
  rewrites.forEach(({ from, to }) => {
    replaceInFile.sync({ files: targets, from: new RegExp(from.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), to });
  });
}

async function extractCritical() {
  log('Extracting critical CSS (mobile + desktop)');
  const pages = [
    'index.html',
    'products/mens-boxer-brief-black.html',
    'products/womens-set.html',
    'about.html',
  ].filter((p) => fs.existsSync(path.join(outDir, p)));

  for (const page of pages) {
    try {
      await critical.generate({
        base: outDir,
        src: page,
        target: page,
        inline: true,
        minify: true,
        dimensions: [
          { width: 360, height: 640 },
          { width: 1366, height: 768 },
        ],
      });
      log(`  - Inlined critical CSS for ${page}`);
    } catch (e) {
      console.warn(`[build] Critical CSS failed for ${page}:`, e.message);
    }
  }
}

(async function run() {
  try {
    // Clean dist
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
    ensureDir(outDir);

    await optimizeImages();
    copyStaticAssets();
    minifyCssFiles();
    await bundleJs();
    await minifyHtml();
    await extractCritical();
    fingerprintAssetsAndRewrite();

    log('Build complete → dist/');
  } catch (err) {
    console.error('[build] Failed:', err);
    process.exit(1);
  }
})();


