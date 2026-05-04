import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, MapPin, Phone, Tag } from "lucide-react";
import { ContentImage } from "@/components/shared/content-image";
import { NavbarShell } from "@/components/shared/navbar-shell";
import { Footer } from "@/components/shared/footer";
import { TaskPostCard } from "@/components/shared/task-post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildPostUrl, fetchTaskPostBySlug, fetchTaskPosts } from "@/lib/task-data";
import { SITE_CONFIG, getTaskConfig, type TaskKey } from "@/lib/site-config";
import type { SitePost } from "@/lib/site-connector";
import { TaskImageCarousel } from "@/components/tasks/task-image-carousel";
import { ArticleComments } from "@/components/tasks/article-comments";
import { SchemaJsonLd } from "@/components/seo/schema-jsonld";
import { RichContent, formatRichHtml } from "@/components/shared/rich-content";
import { getSiteExperience } from "@/lib/site-experience";

type PostContent = {
  category?: string;
  location?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  description?: string;
  body?: string;
  excerpt?: string;
  author?: string;
  highlights?: string[];
  logo?: string;
  images?: string[];
  latitude?: number | string;
  longitude?: number | string;
};

const isValidImageUrl = (value?: string | null) =>
  typeof value === "string" && (value.startsWith("/") || /^https?:\/\//i.test(value));

const getContent = (post: SitePost): PostContent => {
  const content = post.content && typeof post.content === "object" ? post.content : {};
  return content as PostContent;
};

const getPrimaryRichContent = (content: PostContent, post: SitePost) =>
  (typeof content.body === "string" && content.body.trim()) ||
  (typeof content.description === "string" && content.description.trim()) ||
  (typeof content.excerpt === "string" && content.excerpt.trim()) ||
  (typeof post.summary === "string" && post.summary.trim()) ||
  "";

const formatArticleHtml = (content: PostContent, post: SitePost) => {
  const raw =
    (typeof content.body === "string" && content.body.trim()) ||
    (typeof content.description === "string" && content.description.trim()) ||
    (typeof post.summary === "string" && post.summary.trim()) ||
    "";

  return formatRichHtml(raw, "Details coming soon.");
};

const getImageUrls = (post: SitePost, content: PostContent) => {
  const media = Array.isArray(post.media) ? post.media : [];
  const mediaImages = media.map((item) => item?.url).filter((url): url is string => isValidImageUrl(url));
  const contentImages = Array.isArray(content.images)
    ? content.images.filter((url): url is string => isValidImageUrl(url))
    : [];
  const merged = [...mediaImages, ...contentImages];
  if (merged.length) return merged;
  if (isValidImageUrl(content.logo)) return [content.logo as string];
  return ["/placeholder.svg?height=900&width=1400"];
};

function DetailMeta({
  content,
  location,
  website,
  experience,
}: {
  content: PostContent;
  location?: string;
  website?: string;
  experience: ReturnType<typeof getSiteExperience>;
}) {
  return (
    <div className={`rounded-[1.75rem] p-5 ${experience.softPanelClass}`}>
      <h2 className="text-lg font-semibold text-foreground">Details</h2>
      <div className={`mt-4 space-y-3 text-sm ${experience.mutedClass}`}>
        {website ? (
          <div className="flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4" />
            <a href={website} target="_blank" rel="noreferrer" className="break-all text-foreground hover:underline">
              {website}
            </a>
          </div>
        ) : null}
        {content.phone ? (
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4" />
            <span>{content.phone}</span>
          </div>
        ) : null}
        {content.email ? (
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4" />
            <a href={`mailto:${content.email}`} className="break-all text-foreground hover:underline">
              {content.email}
            </a>
          </div>
        ) : null}
        {location ? (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4" />
            <span>{location}</span>
          </div>
        ) : null}
      </div>
      {website ? (
        <Button asChild className={`mt-5 w-full ${experience.buttonClass}`}>
          <a href={website} target="_blank" rel="noreferrer">
            Visit website
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function renderSuggestions(
  experience: ReturnType<typeof getSiteExperience>,
  related: SitePost[],
  task: TaskKey,
  category: string,
  route?: string
) {
  if (!related.length) return null;

  if (experience.key === "codepixelmedia" || experience.key === "helloartcity") {
    return (
      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Related work</h2>
          {route ? (
            <Link href={route} className={`text-sm font-semibold ${experience.mutedClass}`}>
              View all
            </Link>
          ) : null}
        </div>
        <div className="flex gap-5 overflow-x-auto pb-2">
          {related.map((item) => (
            <div key={item.id} className="min-w-[280px] max-w-[320px] flex-none">
              <TaskPostCard post={item} href={buildPostUrl(task, item.slug)} taskKey={task} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-14">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Related work</h2>
        {route ? (
          <Link href={route} className={`text-sm font-semibold ${experience.mutedClass}`}>
            View all
          </Link>
        ) : null}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {related.map((item) => (
          <TaskPostCard key={item.id} post={item} href={buildPostUrl(task, item.slug)} taskKey={task} />
        ))}
      </div>
      <nav className={`mt-6 rounded-[1.75rem] p-5 ${experience.softPanelClass}`}>
        <p className="text-sm font-semibold text-foreground">More paths</p>
        <ul className="mt-3 space-y-2 text-sm">
          {route ? (
            <li>
              <Link href={route} className="text-primary underline-offset-4 hover:underline">
                Browse all {task}
              </Link>
            </li>
          ) : null}
          <li>
            <Link href={`/search?q=${encodeURIComponent(category)}`} className="text-primary underline-offset-4 hover:underline">
              Search more in {category}
            </Link>
          </li>
        </ul>
      </nav>
    </section>
  );
}

export async function TaskDetailPage({ task, slug }: { task: TaskKey; slug: string }) {
  const taskConfig = getTaskConfig(task);
  const post = await fetchTaskPostBySlug(task, slug);

  if (!post) notFound();

  const content = getContent(post);
  const isArticle = task === "article";
  const isBookmark = task === "sbm" || task === "social";
  const category = content.category || post.tags?.[0] || taskConfig?.label || task;
  const description = getPrimaryRichContent(content, post) || "Details coming soon.";
  const descriptionHtml = !isArticle ? formatRichHtml(description, "Details coming soon.") : "";
  const articleHtml = isArticle ? formatArticleHtml(content, post) : "";
  const articleSummary = post.summary || (typeof content.excerpt === "string" ? content.excerpt : "") || "";
  const articleAuthor =
    (typeof content.author === "string" && content.author.trim()) || post.authorName || "Editorial Team";
  const articleDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const postTags = Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === "string") : [];
  const location = content.address || content.location;
  const images = getImageUrls(post, content);
  const website = content.website;
  const related = (await fetchTaskPosts(task, 6)).filter((item) => item.slug !== post.slug).slice(0, 3);
  const baseUrl = SITE_CONFIG.baseUrl.replace(/\/$/, "");
  const experience = getSiteExperience(SITE_CONFIG.baseUrl);

  const schemaPayload = {
    "@context": "https://schema.org",
    "@type": isArticle ? "Article" : "WebPage",
    name: post.title,
    description: articleSummary || description,
    url: `${baseUrl}${taskConfig?.route || "/posts"}/${post.slug}`,
  };

  const introCard =
    experience.key === "scoreminers"
      ? `${experience.softPanelClass} border-[3px]`
      : experience.softPanelClass;

  return (
    <div className={`min-h-screen ${experience.pageClass} ${experience.fontClass}`}>
      <NavbarShell />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SchemaJsonLd data={schemaPayload} />
        <Link href={taskConfig?.route || "/"} className={`inline-flex items-center gap-2 text-sm font-semibold ${experience.mutedClass}`}>
          <span aria-hidden>←</span> Back to {taskConfig?.label || "posts"}
        </Link>

        {/* Hero Image Section - Always at top */}
        <section className="mt-6">
          <div className={`overflow-hidden rounded-[2.4rem] ${experience.panelClass}`}>
            <div className="relative aspect-[16/9] group">
              <ContentImage src={images[0]} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                <span className={`inline-flex rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] ${experience.badgeClass} backdrop-blur-sm`}>
                  {category}
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-white/90">
                  {content.excerpt || post.summary || "Discover more about this amazing content."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section - Under Hero Image */}
        {task === "image" && images.length > 1 && (
          <section className="mt-8">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Gallery</h2>
            <div className={`overflow-hidden rounded-[2rem] ${experience.panelClass} p-6`}>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {images.slice(1).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border-2 border-white shadow-lg">
                    <ContentImage src={image} alt={`${post.title} ${index + 2}`} fill className="object-cover transition-all duration-500 hover:scale-110 hover:rotate-1" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related Posts Section */}
        {renderSuggestions(experience, related, task, category, taskConfig?.route)}

        {/* Content Section */}
        <section className={`grid gap-8 lg:grid-cols-[1.1fr_0.9fr] mt-8`}>
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                  <Tag className="h-3.5 w-3.5" />
                  {category}
                </span>
                {location ? (
                  <span className={`inline-flex items-center gap-1 text-sm ${experience.mutedClass}`}>
                    <MapPin className="h-4 w-4" />
                    {location}
                  </span>
                ) : null}
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                About This Post
              </h2>

              {isArticle ? (
                <>
                  <p className={`mt-3 text-sm font-medium ${experience.mutedClass}`}>By {articleAuthor}</p>
                  {articleSummary ? <p className={`mt-4 text-sm leading-8 ${experience.mutedClass}`}>{articleSummary}</p> : null}
                  <RichContent html={articleHtml} className="mt-6 leading-8 prose-p:my-5 prose-h2:my-7 prose-h3:my-6" />
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">Discussion</p>
                    <div className="mt-4">
                      <ArticleComments slug={post.slug} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <RichContent html={descriptionHtml} className="mt-4 max-w-3xl" />
                                  </>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            
            
            
                      </aside>
        </section>

        
        </main>
      <Footer />
    </div>
  );
}
