"use client"

import type React from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Simple markdown parser for common formatting
  const parseMarkdown = (text: string) => {
    // Split by lines to handle different elements
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let currentList: string[] = []
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let codeLanguage = ""
    let skipLines = 0 // Track lines to skip

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 ml-4">
            {currentList.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>,
        )
        currentList = []
      }
    }

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-3">
            <div className="bg-slate-900 rounded-lg overflow-hidden">
              {codeLanguage && (
                <div className="bg-slate-800 px-3 py-1 text-xs text-slate-300 border-b border-slate-700">
                  {codeLanguage}
                </div>
              )}
              <pre className="p-3 overflow-x-auto">
                <code className="text-sm text-slate-100 font-mono">{codeBlockContent.join("\n")}</code>
              </pre>
            </div>
          </div>,
        )
        codeBlockContent = []
        codeLanguage = ""
      }
    }

    lines.forEach((line, index) => {
      // Skip lines if we're in the middle of processing a table
      if (skipLines > 0) {
        skipLines--
        return
      }

      // Handle code blocks
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          flushCodeBlock()
          inCodeBlock = false
        } else {
          flushList()
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
        }
        return
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        return
      }

      // Handle headers
      if (line.startsWith("### ")) {
        flushList()
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-slate-800 mt-4 mb-2">
            {line.slice(4)}
          </h3>,
        )
        return
      }

      if (line.startsWith("## ")) {
        flushList()
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-semibold text-slate-800 mt-4 mb-2">
            {line.slice(3)}
          </h2>,
        )
        return
      }

      if (line.startsWith("# ")) {
        flushList()
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-2xl font-bold text-slate-800 mt-4 mb-3">
            {line.slice(2)}
          </h1>,
        )
        return
      }

      // Handle lists
      if (line.match(/^[\s]*[-*+]\s/)) {
        const listItem = line.replace(/^[\s]*[-*+]\s/, "")
        currentList.push(listItem)
        return
      }

      if (line.match(/^[\s]*\d+\.\s/)) {
        flushList()
        const listItem = line.replace(/^[\s]*\d+\.\s/, "")
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 ml-4">
            <li className="text-sm leading-relaxed">{parseInlineMarkdown(listItem)}</li>
          </ol>,
        )
        return
      }

      // Handle blockquotes
      if (line.startsWith("> ")) {
        flushList()
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-blue-50 italic text-slate-700"
          >
            {parseInlineMarkdown(line.slice(2))}
          </blockquote>,
        )
        return
      }

      // Handle horizontal rules
      if (line.match(/^[-*_]{3,}$/)) {
        flushList()
        elements.push(<hr key={`hr-${elements.length}`} className="my-4 border-slate-300" />)
        return
      }

      // Handle empty lines
      if (line.trim() === "") {
        flushList()
        if (elements.length > 0) {
          elements.push(<div key={`space-${elements.length}`} className="h-2" />)
        }
        return
      }

      // Handle tables
      if (line.includes("|") && !inCodeBlock) {
        // Check if this might be a table row
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell !== "")

        if (cells.length >= 2) {
          // Look ahead to see if next line is a separator
          const nextLine = lines[index + 1]
          const isHeaderRow = nextLine && nextLine.match(/^\s*\|?[\s\-|:]+\|?\s*$/)

          if (isHeaderRow) {
            // This is a table header, collect all table rows
            flushList()
            const tableRows: string[][] = []
            const alignments: string[] = []

            // Add header row
            tableRows.push(cells)

            // Parse alignment row
            const alignCells = nextLine
              .split("|")
              .map((cell) => cell.trim())
              .filter((cell) => cell !== "")
            alignCells.forEach((cell) => {
              if (cell.startsWith(":") && cell.endsWith(":")) {
                alignments.push("center")
              } else if (cell.endsWith(":")) {
                alignments.push("right")
              } else {
                alignments.push("left")
              }
            })

            // Skip the separator line (we'll handle this with skipLines)
            let tableIndex = index + 2
            let tableRowCount = 1 // Start with 1 for the separator line

            // Collect data rows
            while (tableIndex < lines.length) {
              const tableLine = lines[tableIndex]
              if (tableLine.includes("|")) {
                const rowCells = tableLine
                  .split("|")
                  .map((cell) => cell.trim())
                  .filter((cell) => cell !== "")
                if (rowCells.length >= 2) {
                  tableRows.push(rowCells)
                  tableIndex++
                  tableRowCount++
                } else {
                  break
                }
              } else {
                break
              }
            }

            // Set skipLines to skip all the table lines we just processed
            skipLines = tableRowCount

            // Create table element
            elements.push(
              <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
                <table className="min-w-full border border-slate-300 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100">
                    <tr>
                      {tableRows[0].map((header, cellIndex) => (
                        <th
                          key={cellIndex}
                          className={`px-4 py-2 text-sm font-semibold text-slate-700 border-b border-slate-300 ${
                            alignments[cellIndex] === "center"
                              ? "text-center"
                              : alignments[cellIndex] === "right"
                                ? "text-right"
                                : "text-left"
                          }`}
                        >
                          {parseInlineMarkdown(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={`px-4 py-2 text-sm text-slate-600 border-b border-slate-200 ${
                              alignments[cellIndex] === "center"
                                ? "text-center"
                                : alignments[cellIndex] === "right"
                                  ? "text-right"
                                  : "text-left"
                            }`}
                          >
                            {parseInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>,
            )

            // Return early to skip processing this line as a paragraph
            return
          }
        }
      }

      // Handle regular paragraphs
      flushList()
      elements.push(
        <p key={`p-${elements.length}`} className="text-sm leading-relaxed my-1">
          {parseInlineMarkdown(line)}
        </p>,
      )
    })

    // Flush any remaining content
    flushList()
    flushCodeBlock()

    return elements
  }

  // Parse inline markdown (bold, italic, code, links)
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let currentText = text
    let key = 0

    // Handle inline code first
    currentText = currentText.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__CODE_${key}__`
      parts.push(
        <code key={`code-${key}`} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">
          {code}
        </code>,
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
        <em key={`italic-${key}`} className="italic">
          {italic}
        </em>,
      )
      key++
      return placeholder
    })

    // Handle links - fix the regex pattern
    currentText = currentText.replace(/\[([^\]]+)\]$$([^)]+)$$/g, (match, text, url) => {
      const placeholder = `__LINK_${key}__`
      parts.push(
        <a
          key={`link-${key}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {text}
        </a>,
      )
      key++
      return placeholder
    })

    // Split by placeholders and reconstruct
    const finalParts: React.ReactNode[] = []
    const textParts = currentText.split(/(__(?:CODE|BOLD|ITALIC|LINK)_\d+__)/g)

    textParts.forEach((part, index) => {
      if (part.startsWith("__") && part.endsWith("__")) {
        // Find the corresponding component
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

  return <div className={`markdown-content ${className}`}>{parseMarkdown(content)}</div>
}
