import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import App from './App.vue'
import { initDesignTokens } from './tokens/designTokenStore'
import { initStylePresets } from './tokens/stylePresetStore'
import { initColorPalette } from './tokens/colorPaletteStore'
import { initColorPaletteOverrides } from './tokens/colorPaletteOverrides'
import './style.css'

initColorPaletteOverrides()
initDesignTokens()
initColorPalette()
initStylePresets()

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/library' },
    { path: '/library', name: 'library', component: () => import('./views/LibraryView.vue') },
    { path: '/styles', name: 'styles', component: () => import('./views/StylesView.vue') },
    { path: '/editor', name: 'editor', component: () => import('./views/EditorView.vue') },
    { path: '/preview', name: 'preview', component: () => import('./views/ComponentPreviewView.vue') },
  ],
})

const app = createApp(App)
app.use(TDesign)
app.use(router)
app.mount('#app')
