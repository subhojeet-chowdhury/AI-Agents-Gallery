"use client"

import type React from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Enhanced markdown parser with better table handling and more formats
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let currentList: string[] = []
    let currentOrderedList: string[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let codeLanguage = ""
    let skipLines = 0

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3 ml-4">
            {currentList.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed text-slate-700">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>,
        )
        currentList = []
      }
    }

    const flushOrderedList = () => {
      if (currentOrderedList.length > 0) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-3 ml-4">
            {currentOrderedList.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed text-slate-700">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ol>,
        )
        currentOrderedList = []
      }
    }

    const flushAllLists = () => {
      flushList()
      flushOrderedList()
    }

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-4">
            <div className="bg-slate-900 rounded-lg overflow-hidden shadow-lg">
              {codeLanguage && (
                <div className="bg-slate-800 px-4 py-2 text-xs text-slate-300 border-b border-slate-700 font-medium">
                  {codeLanguage.toUpperCase()}
                </div>
              )}
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-slate-100 font-mono leading-relaxed">{codeBlockContent.join("\n")}</code>
              </pre>
            </div>
          </div>,
        )
        codeBlockContent = []
        codeLanguage = ""
      }
    }

    // Enhanced table detection and parsing
    const parseTable = (startIndex: number) => {
      const tableRows: string[][] = []
      let tableIndex = startIndex
      let hasValidTable = false

      // Collect all potential table rows
      while (tableIndex < lines.length) {
        const line = lines[tableIndex].trim()

        // Skip empty lines within table
        if (line === "") {
          tableIndex++
          continue
        }

        // Check if line contains table-like structure
        if (line.includes("|") || (line.includes("---") && tableRows.length > 0)) {
          // Handle separator lines
          if (line.match(/^[\s\-|:]+$/)) {
            tableIndex++
            continue
          }

          // Parse table row
          const cells = line.split("|").map((cell) => cell.trim())

          // Remove empty cells at start/end (common in malformed tables)
          while (cells.length > 0 && cells[0] === "") {
            cells.shift()
          }
          while (cells.length > 0 && cells[cells.length - 1] === "") {
            cells.pop()
          }

          // Only add if we have at least 2 cells or if it's a continuation of a valid table
          if (cells.length >= 2 || (cells.length >= 1 && tableRows.length > 0)) {
            // Pad cells to match the maximum column count
            const maxCols = Math.max(2, ...tableRows.map((row) => row.length), cells.length)
            while (cells.length < maxCols) {
              cells.push("")
            }
            tableRows.push(cells)
            hasValidTable = true
          } else {
            break
          }
        } else {
          break
        }
        tableIndex++
      }

      if (hasValidTable && tableRows.length > 0) {
        // Determine if first row is header (if it has meaningful content)
        const firstRow = tableRows[0]
        const isHeaderRow = firstRow.some((cell) => cell.length > 0 && !cell.match(/^\d+$/))

        const headerRow = isHeaderRow ? tableRows[0] : null
        const dataRows = isHeaderRow ? tableRows.slice(1) : tableRows

        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
            <div className="inline-block min-w-full shadow-sm rounded-lg border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                {headerRow && (
                  <thead className="bg-slate-50">
                    <tr>
                      {headerRow.map((header, cellIndex) => (
                        <th
                          key={cellIndex}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-r-0"
                        >
                          {parseInlineMarkdown(header || `Column ${cellIndex + 1}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="bg-white divide-y divide-slate-200">
                  {dataRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 text-sm text-slate-700 border-r border-slate-200 last:border-r-0 whitespace-nowrap"
                        >
                          {parseInlineMarkdown(cell || "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>,
        )

        return tableIndex - startIndex
      }

      return 0
    }

    lines.forEach((line, index) => {
      if (skipLines > 0) {
        skipLines--
        return
      }

      const trimmedLine = line.trim()

      // Handle code blocks
      if (trimmedLine.startsWith("```")) {
        if (inCodeBlock) {
          flushCodeBlock()
          inCodeBlock = false
        } else {
          flushAllLists()
          inCodeBlock = true
          codeLanguage = trimmedLine.slice(3).trim()
        }
        return
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        return
      }

      // Handle headers
      if (trimmedLine.startsWith("#### ")) {
        flushAllLists()
        elements.push(
          <h4 key={`h4-${elements.length}`} className="text-base font-semibold text-slate-800 mt-4 mb-2">
            {parseInlineMarkdown(trimmedLine.slice(5))}
          </h4>,
        )
        return
      }

      if (trimmedLine.startsWith("### ")) {
        flushAllLists()
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-slate-800 mt-5 mb-3">
            {parseInlineMarkdown(trimmedLine.slice(4))}
          </h3>,
        )
        return
      }

      if (trimmedLine.startsWith("## ")) {
        flushAllLists()
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-bold text-slate-800 mt-6 mb-3">
            {parseInlineMarkdown(trimmedLine.slice(3))}
          </h2>,
        )
        return
      }

      if (trimmedLine.startsWith("# ")) {
        flushAllLists()
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-2xl font-bold text-slate-800 mt-6 mb-4">
            {parseInlineMarkdown(trimmedLine.slice(2))}
          </h1>,
        )
        return
      }

      // Handle horizontal rules
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        flushAllLists()
        elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-slate-300" />)
        return
      }

      // Handle blockquotes
      if (trimmedLine.startsWith("> ")) {
        flushAllLists()
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 italic text-slate-700 rounded-r-lg"
          >
            {parseInlineMarkdown(trimmedLine.slice(2))}
          </blockquote>,
        )
        return
      }

      // Handle unordered lists
      if (trimmedLine.match(/^[\s]*[-*+]\s/)) {
        flushOrderedList()
        const listItem = trimmedLine.replace(/^[\s]*[-*+]\s/, "")
        currentList.push(listItem)
        return
      }

      // Handle ordered lists
      if (trimmedLine.match(/^[\s]*\d+\.\s/)) {
        flushList()
        const listItem = trimmedLine.replace(/^[\s]*\d+\.\s/, "")
        currentOrderedList.push(listItem)
        return
      }

      // Handle tables (enhanced detection)
      if (trimmedLine.includes("|") && !inCodeBlock) {
        flushAllLists()
        const linesSkipped = parseTable(index)
        if (linesSkipped > 0) {
          skipLines = linesSkipped - 1
          return
        }
      }

      // Handle empty lines
      if (trimmedLine === "") {
        flushAllLists()
        if (elements.length > 0) {
          elements.push(<div key={`space-${elements.length}`} className="h-3" />)
        }
        return
      }

      // Handle regular paragraphs
      flushAllLists()
      elements.push(
        <p key={`p-${elements.length}`} className="text-sm leading-relaxed my-2 text-slate-700">
          {parseInlineMarkdown(trimmedLine)}
        </p>,
      )
    })

    // Flush any remaining content
    flushAllLists()
    flushCodeBlock()

    return elements
  }

  // Enhanced inline markdown parser
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let currentText = text
    let key = 0

    // Handle inline code first (highest priority)
    currentText = currentText.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__CODE_${key}__`
      parts.push(
        <code key={`code-${key}`} className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-mono border">
          {code}
        </code>,
      )
      key++
      return placeholder
    })

    // Handle strikethrough
    currentText = currentText.replace(/~~([^~]+)~~/g, (match, strikethrough) => {
      const placeholder = `__STRIKE_${key}__`
      parts.push(
        <span key={`strike-${key}`} className="line-through text-slate-500">
          {strikethrough}
        </span>,
      )
      key++
      return placeholder
    })

    // Handle bold text
    currentText = currentText.replace(/\*\*([^*]+)\*\*/g, (match, bold) => {
      const placeholder = `__BOLD_${key}__`
      parts.push(
        <strong key={`bold-${key}`} className="font-semibold text-slate-800">
          {bold}
        </strong>,
      )
      key++
      return placeholder
    })

    // Handle italic text
    currentText = currentText.replace(/\*([^*]+)\*/g, (match, italic) => {
      const placeholder = `__ITALIC_${key}__`
      parts.push(
        <em key={`italic-${key}`} className="italic text-slate-700">
          {italic}
        </em>,
      )
      key++
      return placeholder
    })

    // Handle links
    currentText = currentText.replace(/\[([^\]]+)\]$$([^)]+)$$/g, (match, text, url) => {
      const placeholder = `__LINK_${key}__`
      parts.push(
        <a
          key={`link-${key}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
        >
          {text}
        </a>,
      )
      key++
      return placeholder
    })

    // Handle email links
    currentText = currentText.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, (match, email) => {
      const placeholder = `__EMAIL_${key}__`
      parts.push(
        <a
          key={`email-${key}`}
          href={`mailto:${email}`}
          className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
        >
          {email}
        </a>,
      )
      key++
      return placeholder
    })

    // Handle URLs
    currentText = currentText.replace(/\b(https?:\/\/[^\s]+)/g, (match, url) => {
      const placeholder = `__URL_${key}__`
      parts.push(
        <a
          key={`url-${key}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors break-all"
        >
          {url}
        </a>,
      )
      key++
      return placeholder
    })

    // Handle numbers with special formatting (like currency, percentages)
    currentText = currentText.replace(/\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g, (match, number) => {
      const placeholder = `__NUMBER_${key}__`
      parts.push(
        <span key={`number-${key}`} className="font-medium text-slate-800 tabular-nums">
          {number}
        </span>,
      )
      key++
      return placeholder
    })

    // Split by placeholders and reconstruct
    const finalParts: React.ReactNode[] = []
    const textParts = currentText.split(/(__(?:CODE|BOLD|ITALIC|LINK|EMAIL|URL|STRIKE|NUMBER)_\d+__)/g)

    textParts.forEach((part, index) => {
      if (part.startsWith("__") && part.endsWith("__")) {
        const componentIndex = Number.parseInt(part.match(/_(\d+)__$/)?.[1] || "0")
        const component = parts[componentIndex]
        if (component) {
          finalParts.push(component)
        }
      } else if (part) {
        finalParts.push(part)
      }
    })

    return finalParts.length > 0 ? finalParts : text
  }

  return <div className={`markdown-content prose prose-sm max-w-none ${className}`}>{parseMarkdown(content)}</div>
}
