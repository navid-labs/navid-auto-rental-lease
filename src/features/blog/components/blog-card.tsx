import Link from "next/link";
import type { BlogPost } from "@/lib/blog/mdx";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const { slug, frontmatter } = post;
  const formattedDate = new Date(frontmatter.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <div
        className="overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        {/* Thumbnail */}
        <div
          className="flex h-44 items-center justify-center"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          {frontmatter.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frontmatter.thumbnail}
              alt={frontmatter.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: "var(--chayong-primary-light)",
                color: "var(--chayong-primary)",
              }}
            >
              {frontmatter.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <span
            className="mb-2 inline-block text-xs font-medium"
            style={{ color: "var(--chayong-primary)" }}
          >
            {frontmatter.category}
          </span>
          <h2
            className="mb-2 font-semibold leading-snug transition-colors group-hover:text-[var(--chayong-primary)]"
            style={{ color: "var(--chayong-text)" }}
          >
            {frontmatter.title}
          </h2>
          <p
            className="mb-4 line-clamp-2 text-sm leading-relaxed"
            style={{ color: "var(--chayong-text-sub)" }}
          >
            {frontmatter.description}
          </p>
          <time
            className="text-xs"
            style={{ color: "var(--chayong-text-caption)" }}
            dateTime={frontmatter.date}
          >
            {formattedDate}
          </time>
        </div>
      </div>
    </Link>
  );
}
