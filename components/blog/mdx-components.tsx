import type { MDXComponents } from "mdx/types"
import Link from "next/link"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export const mdxComponents: MDXComponents = {
  h2: ({ children, ...props }) => {
    const id = typeof children === "string" ? slugify(children) : undefined
    return (
      <h2 id={id} className="mt-10 mb-4 scroll-mt-20 text-2xl font-bold tracking-tight" {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }) => {
    const id = typeof children === "string" ? slugify(children) : undefined
    return (
      <h3 id={id} className="mt-8 mb-3 scroll-mt-20 text-xl font-semibold" {...props}>
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }) => (
    <h4 className="mt-6 mb-2 text-lg font-semibold" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed text-muted-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted-foreground" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith("http")
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          {...props}
        >
          {children}
        </a>
      )
    }
    return (
      <Link href={href || "#"} className="font-medium text-primary underline underline-offset-4 hover:text-primary/80" {...props}>
        {children}
      </Link>
    )
  },
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="mb-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-t px-4 py-2 text-muted-foreground" {...props}>
      {children}
    </td>
  ),
  code: ({ children, ...props }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm" {...props}>
      {children}
    </pre>
  ),
}
