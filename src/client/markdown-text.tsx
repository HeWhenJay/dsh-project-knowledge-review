import type { ReactNode } from 'react'

interface MarkdownTextProps { content: string; className?: string }
type TableBlock = { headers: string[]; rows: string[][]; alignments: Array<'left' | 'center' | 'right'> }

/** 从当前项目迁移的安全 Markdown 子集渲染器；不执行 HTML 或脚本。 */
export function MarkdownText({ content, className = '' }: MarkdownTextProps): ReactNode {
  return <div className={`dsh-knowledge-markdown ${className}`.trim()}>{renderBlocks(content || '')}</div>
}

function renderBlocks(content: string): ReactNode[] {
  const lines = normalizeMarkdown(content).split('\n')
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let code: string[] | null = null
  let index = 0
  const flush = (): void => {
    if (!paragraph.length) return
    const text = paragraph.join(' ')
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(text)}</p>); paragraph = []
  }
  while (index < lines.length) {
    const line = lines[index]; const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      if (code) { blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join('\n')}</code></pre>); code = null }
      else { flush(); code = [] }
      index += 1; continue
    }
    if (code) { code.push(line); index += 1; continue }
    if (!trimmed) { flush(); index += 1; continue }
    const table = parseTable(lines, index)
    if (table) { flush(); blocks.push(renderTable(table.block, `table-${blocks.length}`)); index = table.next; continue }
    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed)
    if (heading) { flush(); blocks.push(renderHeading(heading[1].length, heading[2], `h-${blocks.length}`)); index += 1; continue }
    const list = parseList(lines, index)
    if (list) { flush(); blocks.push(renderList(list.items, list.ordered, `list-${blocks.length}`, list.start)); index = list.next; continue }
    const quote = /^>\s?(.+)$/.exec(trimmed)
    if (quote) { flush(); blocks.push(<blockquote key={`q-${blocks.length}`}>{renderInline(quote[1])}</blockquote>); index += 1; continue }
    if (/^---+$/.test(trimmed)) { flush(); blocks.push(<hr key={`hr-${blocks.length}`} />); index += 1; continue }
    paragraph.push(trimmed); index += 1
  }
  if (code) blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join('\n')}</code></pre>)
  flush()
  return blocks.length ? blocks : [<p key="empty">暂无内容</p>]
}

function normalizeMarkdown(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim()
}

function renderHeading(level: number, text: string, key: string): ReactNode {
  if (level === 1) return <h2 key={key}>{renderInline(text)}</h2>
  if (level === 2) return <h3 key={key}>{renderInline(text)}</h3>
  return <h4 key={key}>{renderInline(text)}</h4>
}

function parseList(lines: string[], start: number): { items: string[]; ordered: boolean; start?: number; next: number } | null {
  const first = /^(\s*)(?:(\d+)[.)]|[-*+])\s+(.+)$/.exec(lines[start])
  if (!first) return null
  const ordered = Boolean(first[2]); const indent = first[1].replace(/\t/g, '    ').length
  const items: string[] = []; let index = start
  while (index < lines.length) {
    const match = /^(\s*)(?:(\d+)[.)]|[-*+])\s+(.+)$/.exec(lines[index])
    if (!match || Boolean(match[2]) !== ordered || match[1].replace(/\t/g, '    ').length !== indent) break
    let value = match[3]; index += 1
    while (index < lines.length && lines[index].trim() && !/^(\s*)(?:(\d+)[.)]|[-*+])\s+/.test(lines[index])) {
      if (lines[index].match(/^\s+/)) { value += ` ${lines[index].trim()}`; index += 1 } else break
    }
    items.push(value)
  }
  return { items, ordered, start: ordered && Number(first[2]) !== 1 ? Number(first[2]) : undefined, next: index }
}

function renderList(items: string[], ordered: boolean, key: string, start?: number): ReactNode {
  const children = items.map((item, index) => <li key={`${key}-${index}`}>{renderInline(item)}</li>)
  return ordered ? <ol key={key} start={start}>{children}</ol> : <ul key={key}>{children}</ul>
}

function parseTable(lines: string[], start: number): { block: TableBlock; next: number } | null {
  if (start + 1 >= lines.length) return null
  const headers = tableRow(lines[start]); const delimiters = tableRow(lines[start + 1])
  if (!headers || !delimiters || headers.length !== delimiters.length) return null
  const alignments = delimiters.map((value) => {
    const normalized = value.replace(/\s+/g, '')
    if (!/^:?-{3,}:?$/.test(normalized)) return null
    return normalized.startsWith(':') && normalized.endsWith(':') ? 'center' : normalized.endsWith(':') ? 'right' : 'left'
  })
  if (alignments.some((value) => value === null)) return null
  const rows: string[][] = []; let index = start + 2
  while (index < lines.length && lines[index].trim()) {
    const cells = tableRow(lines[index]); if (!cells) break
    rows.push(Array.from({ length: headers.length }, (_, cell) => cells[cell] || '')); index += 1
  }
  return { block: { headers, rows, alignments: alignments as TableBlock['alignments'] }, next: index }
}

function tableRow(line: string): string[] | null {
  let value = line.trim(); if (!value.includes('|')) return null
  if (value.startsWith('|')) value = value.slice(1)
  if (value.endsWith('|') && !value.endsWith('\\|')) value = value.slice(0, -1)
  const cells: string[] = []; let current = ''; let code = false
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\' && value[index + 1] === '|') { current += '|'; index += 1; continue }
    if (value[index] === '`') code = !code
    if (value[index] === '|' && !code) { cells.push(current.trim()); current = '' } else current += value[index]
  }
  cells.push(current.trim()); return cells.length > 1 ? cells : null
}

function renderTable(table: TableBlock, key: string): ReactNode {
  return <div className="dsh-knowledge-markdown-table" key={key} role="region" aria-label="Markdown 表格，可横向滚动" tabIndex={0}><table><thead><tr>{table.headers.map((cell, index) => <th key={index} style={{ textAlign: table.alignments[index] }}>{renderInline(cell)}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index} style={{ textAlign: table.alignments[index] }}>{renderInline(cell)}</td>)}</tr>)}</tbody></table></div>
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []; const pattern = /(\[([^\]]+)]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g
  let last = 0; let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const key = `${match.index}-${match[0]}`
    if (match[2] && match[3]) {
      const href = safeHref(match[3]); nodes.push(href ? <a key={key} href={href} target="_blank" rel="noreferrer">{renderInline(match[2])}</a> : <span key={key}>{match[2]}</span>)
    } else if (match[5]) nodes.push(<code key={key}>{match[5]}</code>)
    else if (match[7]) nodes.push(<strong key={key}>{renderInline(match[7])}</strong>)
    else if (match[9]) nodes.push(<em key={key}>{renderInline(match[9])}</em>)
    last = pattern.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function safeHref(raw: string): string | undefined {
  const value = raw.trim()
  if (value.startsWith('#')) return value
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined } catch { return undefined }
}
