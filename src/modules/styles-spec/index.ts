/**
 * styles-spec — 全局样式规范独立模块
 *
 * 与组件库、画板无页面级耦合；仅通过 publicApi 向外提供主题数据。
 * 详见 STYLES_SPEC.md
 */
export { default as StylesView } from './views/StylesView.vue'

export { initStylesSpecModule } from './bootstrap'
export * from './publicApi'
