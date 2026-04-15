import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getCategories } from "@/lib/blog/mdx";
import { BlogCard } from "@/features/blog/components/blog-card";

export const metadata: Metadata = {
  title: "블로그",
  description: "리스·렌트 승계, 절세 팁, 차량 비교 등 유용한 정보를 제공합니다.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category ?? null;

  const allPosts = getAllPosts();
  const categories = getCategories();

  const filteredPosts = selectedCategory
    ? allPosts.filter((p) => p.frontmatter.category === selectedCategory)
    : allPosts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold" style={{ color: "var(--chayong-text)" }}>
          블로그
        </h1>
        <p className="mt-3 text-base" style={{ color: "var(--chayong-text-sub)" }}>
          리스·렌트 승계에 관한 유용한 정보를 확인하세요
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/blog"
          className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          style={
            !selectedCategory
              ? { backgroundColor: "var(--chayong-primary)", color: "#fff" }
              : {
                  backgroundColor: "var(--chayong-surface)",
                  color: "var(--chayong-text-sub)",
                  border: "1px solid var(--chayong-divider)",
                }
          }
        >
          전체
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/blog?category=${encodeURIComponent(cat)}`}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={
              selectedCategory === cat
                ? { backgroundColor: "var(--chayong-primary)", color: "#fff" }
                : {
                    backgroundColor: "var(--chayong-surface)",
                    color: "var(--chayong-text-sub)",
                    border: "1px solid var(--chayong-divider)",
                  }
            }
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Posts grid */}
      {filteredPosts.length === 0 ? (
        <div
          className="rounded-2xl py-20 text-center"
          style={{ backgroundColor: "var(--chayong-surface)" }}
        >
          <p className="text-base" style={{ color: "var(--chayong-text-sub)" }}>
            아직 게시글이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
