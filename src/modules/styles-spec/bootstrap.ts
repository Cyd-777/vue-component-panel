import { initColorPaletteOverrides } from './tokens/colorPaletteOverrides'
import { initColorPaletteSettings } from './tokens/colorPaletteSettings'
import { initDesignTokens } from './tokens/designTokenStore'
import { initColorPalette } from './tokens/colorPaletteStore'
import { initStylePresets } from './tokens/stylePresetStore'
import { initComponentThemeBindings } from './tokens/componentThemeBindingStore'
import { initThemeUsage } from './tokens/themeUsageStore'
import { initUsageRules } from './tokens/usageRulesStore'

let initialized = false

/** 应用启动时调用一次：注入 CSS 变量、加载色板与命名样式、主题应用设置 */
export function initStylesSpecModule(): void {
  if (initialized) return
  initialized = true

  initColorPaletteOverrides()
  initColorPaletteSettings()
  initDesignTokens()
  initColorPalette()
  initStylePresets()
  initThemeUsage()
  initUsageRules()
  initComponentThemeBindings()
}
