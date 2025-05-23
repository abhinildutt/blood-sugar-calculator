import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        define: {
            'process.env': {
                GOOGLE_APPLICATION_CREDENTIALS: JSON.stringify(env.GOOGLE_APPLICATION_CREDENTIALS),
                GOOGLE_CLOUD_PROJECT_ID: JSON.stringify(env.GOOGLE_CLOUD_PROJECT_ID)
            }
        }
    };
});
