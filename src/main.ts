import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import router from './router';
import { queryClient } from './services/queryClient';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

const app=createApp(App);
app.use(createPinia());
app.use(router);
app.use(VueQueryPlugin,{queryClient});
app.mount('#app');
