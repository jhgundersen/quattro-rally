import {defineConfig} from 'vite';
export default defineConfig({server:{proxy:{'/multiplayer':{target:'http://127.0.0.1:8081',ws:true}}}});
