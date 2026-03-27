/**
 * Print helper: renders content in a hidden iframe and triggers print
 */
export function printContent(html: string, title = 'Print'): void {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-10000px'
  iframe.style.left = '-10000px'
  iframe.style.width = '0'
  iframe.style.height = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `)
  doc.close()

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 250)
  }
}

/**
 * Print a DOM element by ID
 */
export function printElement(elementId: string, title = 'Print'): void {
  const el = document.getElementById(elementId)
  if (!el) return
  printContent(el.innerHTML, title)
}
