import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostAdmin } from "@/modules/admin";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function AdminPostEditor({ params }: PageProps) {
  const { postId } = await params;
  const isNew = postId === "new";

  const post = isNew ? null : await getPostAdmin(postId);
  if (!isNew && !post) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> К контенту
      </Link>

      <h1 className="font-serif text-2xl md:text-3xl font-semibold">
        {isNew ? "Новая статья" : post!.title}
      </h1>

      {post ? (
        <PostForm
          id={post.id}
          slug={post.slug}
          title={post.title}
          excerpt={post.excerpt ?? ""}
          body={post.body}
          metaTitle={post.metaTitle ?? ""}
          metaDescription={post.metaDescription ?? ""}
          isPublished={post.isPublished}
        />
      ) : (
        <PostForm />
      )}
    </div>
  );
}
