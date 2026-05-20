import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const distDir = 'dist';
    
    // Clean dist
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // Bundle JS with esbuild
    const result = await esbuild.build({
        entryPoints: ['src/main.js'],
        bundle: true,
        outfile: 'dist/bundle.js',
        format: 'esm',
        sourcemap: false,
        minify: true,
        loader: { '.js': 'js' },
    });

    if (result.errors.length > 0) {
        console.error('Build errors:', result.errors);
        process.exit(1);
    }

    // Copy index.html and update script path
    let indexHtml = fs.readFileSync('index.html', 'utf8');
    // Replace src/main.js?v=21 with bundle.js
    indexHtml = indexHtml.replace(
        /src="\.\/src\/main\.js[^"]*"/,
        'src="./bundle.js"'
    );
    fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

    // Copy lib folder
    if (fs.existsSync('lib')) {
        copyDir('lib', path.join(distDir, 'lib'));
    }

    // Copy assets folder if exists
    if (fs.existsSync('assets')) {
        copyDir('assets', path.join(distDir, 'assets'));
    }

    console.log('Build completed successfully! Files in dist/:');
    listDir(distDir, '');
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function listDir(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            console.log(prefix + entry.name + '/');
            listDir(entryPath, prefix + '  ');
        } else {
            const stats = fs.statSync(entryPath);
            console.log(prefix + entry.name + ' (' + (stats.size / 1024).toFixed(1) + ' KB)');
        }
    }
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
