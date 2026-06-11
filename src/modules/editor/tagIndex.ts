/**
 * 与 livePreview.ensureDataIndex 使用相同的开标签计数规则。
 * tagIndex / dataIndex 参数为元素 data-el-i 值（无则回退为文档顺序 ordinal）。
 */
export function findTagLineInSource(
  code: string,
  tagIndex: number,
): { lineIndex: number; tagName: string; dataIndex: number } | null {
  const tmplMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  if (!tmplMatch) return null

  const templateContent = tmplMatch[1]
  const templateBodyStart = code.indexOf(templateContent)
  const linesBeforeBody = code.substring(0, templateBodyStart).split('\n').length - 1

  let ordinal = 0
  const re = /<(\w[\w-]*)((?:\s[^>]*)?)(\/?>)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(templateContent)) !== null) {
    if (m[1] === 'template') continue
    const attrs = m[2]
    const idMatch = attrs.match(/\bdata-el-i="(\d+)"/)
    const dataIndex = idMatch ? parseInt(idMatch[1], 10) : ordinal
    if (dataIndex === tagIndex) {
      const lineInBody = templateContent.substring(0, m.index).split('\n').length - 1
      return {
        lineIndex: linesBeforeBody + lineInBody,
        tagName: m[1],
        dataIndex,
      }
    }
    ordinal++
  }
  return null
}

/** 按开标签所在行号反查 tagIndex（data-el-i / ordinal） */
export function findTagIndexAtLine(code: string, lineIndex: number): number | null {
  const tmplMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  if (!tmplMatch) return null

  const templateContent = tmplMatch[1]
  const templateBodyStart = code.indexOf(templateContent)
  const linesBeforeBody = code.substring(0, templateBodyStart).split('\n').length - 1

  let ordinal = 0
  const re = /<(\w[\w-]*)((?:\s[^>]*)?)(\/?>)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(templateContent)) !== null) {
    if (m[1] === 'template') continue
    const lineInBody = templateContent.substring(0, m.index).split('\n').length - 1
    const absoluteLine = linesBeforeBody + lineInBody
    if (absoluteLine === lineIndex) {
      const idMatch = m[2].match(/\bdata-el-i="(\d+)"/)
      return idMatch ? parseInt(idMatch[1], 10) : ordinal
    }
    ordinal++
  }
  return null
}

/**
 * 按文档顺序为 template 内每个标签写入 data-el-i="0..n-1"。
 * 保证源码与画布 ordinal 一致，复制粘贴的相同标签也能区分。
 */
export function reindexTemplateDataIds(code: string): string {
  const match = code.match(/^([\s\S]*?<template>)([\s\S]*?)(<\/template>[\s\S]*)$/)
  if (!match) return code

  let idx = 0
  const inner = match[2].replace(
    /<(\w[\w-]*)((?:\s[^>]*)?)(\/?>)/g,
    (full, tagName: string, attrs: string, closer: string) => {
      if (tagName === 'template') return full
      const cleaned = attrs.replace(/\s*\bdata-el-i="\d+"/g, '')
      return `<${tagName} data-el-i="${idx++}"${cleaned}${closer}`
    },
  )

  const next = match[1] + inner + match[3]
  return next === code ? code : next
}

export function countTemplateTags(code: string): number {
  let n = 0
  while (findTagLineInSource(code, n)) n++
  return n
}
