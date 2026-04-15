import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog/mdx";
import { mdxComponents } from "@/features/blog/components/mdx-components";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const { frontmatter, content } = post;

  const formattedDate = new Date(frontmatter.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--chayong-primary)]"
        style={{ color: "var(--chayong-text-sub)" }}
      >
        ← 블로그 목록으로
      </Link>

      {/* Header */}
      <div className="mb-10">
        {/* Category badge */}
        <span
          className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--chayong-primary-light)",
            color: "var(--chayong-primary)",
          }}
        >
          {frontmatter.category}
        </span>

        <h1
          className="mb-3 text-3xl font-bold leading-tight"
          style={{ color: "var(--chayong-text)" }}
        >
          {frontmatter.title}
        </h1>

        <p className="mb-4 text-base leading-relaxed" style={{ color: "var(--chayong-text-sub)" }}>
          {frontmatter.description}
        </p>

        <time
          className="text-sm"
          style={{ color: "var(--chayong-text-caption)" }}
          dateTime={frontmatter.date}
        >
          {formattedDate}
        </time>
      </div>

      {/* Divider */}
      <hr className="mb-10" style={{ borderColor: "var(--chayong-divider)" }} />

      {/* MDX content */}
      <article className="prose-none">
        <MDXRemote source={content} components={mdxComponents} />
      </article>

      {/* Footer nav */}
      <div
        className="mt-14 border-t pt-8"
        style={{ borderColor: "var(--chayong-divider)" }}
      >
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--chayong-primary)]"
          style={{ color: "var(--chayong-text-sub)" }}
        >
          ← 블로그 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
