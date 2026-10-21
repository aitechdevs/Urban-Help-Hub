import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny, fontsource } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
            fonts: [
                // Keep the cPanel provider by default; local builds can use the same font from npm.
                (process.env.UHH_LOCAL_FONTS === '1' ? fontsource : bunny)('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
