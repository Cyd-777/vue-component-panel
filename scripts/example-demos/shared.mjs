/** Shared helpers for generating ExampleDemoBlock sections */

export function block(title, desc, body) {
  const descAttr = desc ? ` description="${desc}"` : ''
  return `    <ExampleDemoBlock title="${title}"${descAttr}>
${body}
    </ExampleDemoBlock>
`
}

/**
 * Vertical size comparison with explicit labels (small / medium / large).
 * @param {{ label: string, lines: string | string[] }[]} rows
 */
export function sizeBlockVertical(rows, desc = 'small / medium / large 三种规格对比。') {
  const body = rows
    .map(({ label, lines }) => {
      const inner = (Array.isArray(lines) ? lines : [lines])
        .map((l) => `        ${l}`)
        .join('\n')
      return `        <div class="demo-size-row">
          <span class="demo-size-label">${label}</span>
${inner}
        </div>`
    })
    .join('\n')
  return block('尺寸 size', desc, `      <div class="demo-size-stack">
${body}
      </div>`)
}

export const SIZE_DEMO_STYLE = `<style scoped>
.demo-size-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
.demo-size-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.demo-size-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
}
.badge-block {
  width: 40px;
  height: 40px;
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
}
.loading-size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 72px;
}
</style>`

export function mergeStyles(...parts) {
  const chunks = parts.filter(Boolean).map((s) => s.trim())
  if (!chunks.length) return ''
  const inner = chunks
    .map((s) => s.replace(/^<style scoped>\s*/i, '').replace(/<\/style>\s*$/i, ''))
    .join('\n')
  return `<style scoped>\n${inner}\n</style>`
}
