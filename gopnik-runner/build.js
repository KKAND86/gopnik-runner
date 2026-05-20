import * as esbuild from 'esbuild';

async function main() {
    try {
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

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

main();
