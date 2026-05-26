import { revalidatePath, revalidateTag } from "next/cache";
import type { CategoryType } from "@prisma/client";
import { localeCodes } from "@/i18n/config";

export const CONTENT_TAGS = {
  home: "content:home",
  recent: "content:recent",
  recommended: "content:recommended",
  categories: "content:categories",
  posts: "content:posts",
  sliders: "content:sliders",
  settings: "content:settings",
} as const;

function withLocalePrefix(locale: string, path: string) {
  if (locale === "en") return path;
  return `/${locale}${path}`;
}

function getLocalizedPaths(path: string) {
  return localeCodes.map((locale) => withLocalePrefix(locale, path));
}

function getCategoryComboSegments(categories: string[]) {
  const normalized = Array.from(
    new Set(
      categories
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  const results = new Set<string>();

  const dfs = (start: number, picked: string[]) => {
    if (picked.length >= 2) {
      results.add(picked.join("-"));
    }
    for (let i = start; i < normalized.length; i += 1) {
      picked.push(normalized[i]);
      dfs(i + 1, picked);
      picked.pop();
    }
  };

  dfs(0, []);
  return Array.from(results);
}

function collectPostPaths(postId: string, categories: string[]) {
  const paths = new Set<string>();

  ["/", "/categories/recent", "/recommended-videos", `/posts/${postId}`].forEach((path) => {
    getLocalizedPaths(path).forEach((localizedPath) => paths.add(localizedPath));
  });

  categories.forEach((category) => {
    getLocalizedPaths(`/categories/${category.toLowerCase()}`).forEach((localizedPath) => {
      paths.add(localizedPath);
    });
  });

  getCategoryComboSegments(categories).forEach((segment) => {
    getLocalizedPaths(`/categories/combined/${segment}`).forEach((localizedPath) => {
      paths.add(localizedPath);
    });
  });

  return Array.from(paths);
}

export function invalidatePostContent(input: { postId: string; categories: CategoryType[] }) {
  const { postId, categories } = input;

  const tags = new Set<string>([
    CONTENT_TAGS.home,
    CONTENT_TAGS.recent,
    CONTENT_TAGS.recommended,
    CONTENT_TAGS.categories,
    CONTENT_TAGS.posts,
  ]);

  tags.add(`content:post:${postId}`);
  categories.forEach((category) => tags.add(`content:category:${category}`));
  localeCodes.forEach((locale) => tags.add(`content:locale:${locale}`));

  Array.from(tags).forEach((tag) => revalidateTag(tag));
  collectPostPaths(postId, categories).forEach((path) => revalidatePath(path));
}

export function invalidateHomeContentFromAdmin() {
  const tags = [
    CONTENT_TAGS.home,
    CONTENT_TAGS.recent,
    CONTENT_TAGS.recommended,
    CONTENT_TAGS.categories,
    CONTENT_TAGS.sliders,
    CONTENT_TAGS.settings,
    ...localeCodes.map((locale) => `content:locale:${locale}`),
  ];

  tags.forEach((tag) => revalidateTag(tag));

  ["/", "/categories/recent", "/recommended-videos"].forEach((path) => {
    getLocalizedPaths(path).forEach((localizedPath) => revalidatePath(localizedPath));
  });
}
