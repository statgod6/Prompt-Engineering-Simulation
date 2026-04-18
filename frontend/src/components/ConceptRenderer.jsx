import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

export default function ConceptRenderer({ content }) {
  if (!content) return null

  return (
    <div className="concept-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h2: ({ children }) => (
            <h2 className="concept-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="concept-h3">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="concept-blockquote">{children}</blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return <code className="concept-inline-code" {...props}>{children}</code>
            }
            return <code className={className} {...props}>{children}</code>
          },
          pre: ({ children }) => (
            <pre className="concept-code-block">{children}</pre>
          ),
          table: ({ children }) => (
            <div className="concept-table-wrap">
              <table className="concept-table">{children}</table>
            </div>
          ),
          a: ({ href, children }) => (
            <a href={href} className="concept-link" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
