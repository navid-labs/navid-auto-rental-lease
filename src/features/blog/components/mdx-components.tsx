import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1
      className="mb-6 mt-10 text-3xl font-bold leading-tight first:mt-0"
      style={{ color: "var(--chayong-text)" }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="mb-4 mt-8 text-2xl font-bold leading-tight"
      style={{ color: "var(--chayong-text)" }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="mb-3 mt-6 text-xl font-semibold leading-tight"
      style={{ color: "var(--chayong-text)" }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      className="mb-4 leading-relaxed"
      style={{ color: "var(--chayong-text-sub)" }}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul
      className="mb-4 list-disc pl-6 leading-relaxed"
      style={{ color: "var(--chayong-text-sub)" }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className="mb-4 list-decimal pl-6 leading-relaxed"
      style={{ color: "var(--chayong-text-sub)" }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="mb-1" style={{ color: "var(--chayong-text-sub)" }}>
      {children}
    </li>
  ),
  table: ({ children }) => (
    <div className="mb-6 overflow-x-auto">
      <table
        className="w-full border-collapse rounded-xl text-sm"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="border px-4 py-2.5 text-left font-semibold"
      style={{
        borderColor: "var(--chayong-divider)",
        backgroundColor: "var(--chayong-surface)",
        color: "var(--chayong-text)",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="border px-4 py-2.5"
      style={{
        borderColor: "var(--chayong-divider)",
        color: "var(--chayong-text-sub)",
      }}
    >
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="mb-4 rounded-r-xl border-l-4 py-3 pl-4 pr-4"
      style={{
        borderLeftColor: "var(--chayong-primary)",
        backgroundColor: "var(--chayong-surface)",
        color: "var(--chayong-text-sub)",
      }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code
      className="rounded px-1.5 py-0.5 font-mono text-sm"
      style={{
        backgroundColor: "var(--chayong-surface)",
        color: "var(--chayong-primary)",
      }}
    >
      {children}
    </code>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: "var(--chayong-text)" }}>
      {children}
    </strong>
  ),
};
