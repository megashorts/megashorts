"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from 'zod';
import { postSchema } from "@/lib/validation";
import { ImageUploader } from "@/components/ImageUploader"; 
import { VideoUploader } from "@/components/videos/VideoUploader";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Language, CategoryType } from "@prisma/client";
import { PostData, VideoWithSubtitles } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { toast, useToast } from "@/components/ui/use-toast";
import { Label } from "@radix-ui/react-label";
import { useUploader } from "@/hooks/useUploader";
import { useSubmitPostMutation } from "./mutations";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import LanguageFlag from "@/components/LanguageFlag";
import { getThumbnailUrl } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { USER_ROLE } from "@/lib/constants";

type PostFormData = z.infer<typeof postSchema>;

const BASE_SELECTABLE_CATEGORIES: CategoryType[] = [
  "COMEDY", "ROMANCE", "ACTION", "THRILLER", "DRAMA",
  "PERIODPLAY", "FANTASY", "HIGHTEEN", "ADULT", "HUMANE",
  "CALM", "VARIETYSHOW",
];

const PRIVILEGED_CATEGORIES: CategoryType[] = [
  "NOTIFICATION",
  "MSPOST",
];

const TRANSLATION_LOCALES: Array<{ locale: 'ko' | 'zh'; language: Language }> = [
  { locale: 'ko', language: Language.KOREAN },
  { locale: 'zh', language: Language.CHINESE },
];

const TRANSLATION_LOCALE_LANGUAGE = TRANSLATION_LOCALES.reduce<Record<string, Language>>((acc, item) => {
  acc[item.locale] = item.language;
  return acc;
}, {});

interface PreparedImage {
  file: File;
  preview: string;
}

interface PostEditorProps {
  initialData?: PostData;
}

type VideoType = NonNullable<PostData['videos']>[number];

export function PostEditor({ initialData }: PostEditorProps) {
  const router = useRouter();
  const { user } = useSession();
  const tCat = useTranslations('Category');
  const tEditor = useTranslations('PostEditor');
  const [videos, setVideos] = useState<VideoType[]>(
    initialData?.videos || []
  );
  const mutation = useSubmitPostMutation();
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>(
    initialData?.categories || []
  );
  
  const [titleI18n, setTitleI18n] = useState<Record<string, string>>(
    (initialData?.titleI18n as Record<string, string>) || {}
  );
  const [contentI18n, setContentI18n] = useState<Record<string, string>>(
    (initialData?.contentI18n as Record<string, string>) || {}
  );
  const [translationLocales, setTranslationLocales] = useState<string[]>(
    Object.keys((initialData?.titleI18n as Record<string, string>) || {})
      .filter((locale) => TRANSLATION_LOCALES.some((item) => item.locale === locale))
  );
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(
    initialData?.thumbnailId || null
  );

  const { toast } = useToast();
  const { uploadImage } = useUploader();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    initialData?.postLanguage || Language.CHINESE
  );
  const canManageNoticeAndBlog = (user?.userRole ?? 0) >= USER_ROLE.OPERATION1;
  const selectableCategories = canManageNoticeAndBlog
    ? [...BASE_SELECTABLE_CATEGORIES, ...PRIVILEGED_CATEGORIES]
    : BASE_SELECTABLE_CATEGORIES;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: tEditor('contentPlaceholder'),
        showOnlyWhenEditable: true,
        emptyEditorClass: 'is-editor-empty'
      })
    ],
    content: initialData?.content || '',
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setValue('content', text);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none'
      }
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: initialData ? {
      title: initialData.title || '',
      titleOriginal: initialData.titleOriginal || undefined,
      content: initialData.content || '',
      priority: initialData.priority || 5,
      categories: initialData.categories || [],
      ageLimit: initialData.ageLimit || 15,
      featured: initialData.featured || false,
      status: initialData.status || 'DRAFT',
      postLanguage: initialData.postLanguage || 'CHINESE'
    } : undefined
  });

  const handleVideosChange = (updatedVideos: VideoType[]) => {
    setVideos(updatedVideos);
  };

  const handleSave = async (status: 'PUBLISHED' | 'DRAFT') => {
    if (!editor || isSaving) return;
  
    try {
      setIsSaving(true);
  
      const formValues = getValues();
      const cleanContent = editor.getHTML()
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<br>/g, '\n')
        .trim();
  
      const now = new Date().toISOString();
  
      const selectedTitleI18n = translationLocales.reduce<Record<string, string>>((acc, locale) => {
        const value = titleI18n[locale];
        if (value?.trim()) acc[locale] = value;
        return acc;
      }, {});

      const selectedContentI18n = translationLocales.reduce<Record<string, string>>((acc, locale) => {
        const value = contentI18n[locale];
        if (value?.trim()) acc[locale] = value;
        return acc;
      }, {});

      const postData = {
        id: initialData?.id,
        title: formValues.title,
        titleOriginal: formValues.titleOriginal || undefined,
        content: cleanContent,
        priority: formValues.priority ? Number(formValues.priority) : 5,
        categories: selectedCategories,
        ageLimit: Number(formValues.ageLimit),
        featured: formValues.featured || false,
        status,
        createdAt: now,
        publishedAt: status === 'PUBLISHED' ? now : null,
        postLanguage: selectedLanguage,
        titleI18n: Object.keys(selectedTitleI18n).length > 0 ? selectedTitleI18n : undefined,
        contentI18n: Object.keys(selectedContentI18n).length > 0 ? selectedContentI18n : undefined,
        videos: videos.map(video => ({
          id: video.id,
          filename: video.filename,
          sequence: video.sequence,
          isPremium: video.isPremium,
          // subtitle: video.subtitle || []
          // subtitle: Array.isArray(video.subtitle) ? video.subtitle : [],
          subtitle: video.subtitle ?? [],
        }))
      };
  
      console.log('Saving post data:', {
        videos: videos,  // 원본 videos 배열
        mappedVideos: postData.videos,  // 매핑된 videos 배열
        validation: postSchema.safeParse(postData)  // 검증 결과
      });

      const result = postSchema.safeParse(postData);
  
      if (!result.success) {
        const errorMessage = result.error.errors.map(error => {
          switch (error.path[0]) {
            case 'title':
              return tEditor('validationTitle');
            case 'titleOriginal':
              return tEditor('validationTitleOriginal');
            case 'content':
              return tEditor('validationContent');
            case 'priority':
              return tEditor('validationPriority');
            case 'categories':
              return tEditor('validationCategories');
            case 'ageLimit':
              return tEditor('validationAgeLimit');
            case 'videos':
              return tEditor('validationVideos');
            default:
              return error.message;
          }
        })[0];
  
        toast({
          variant: "destructive",
          description: errorMessage,
        });
        setIsSaving(false);
        return;
      }
  
      let thumbnailId = existingThumbnail || undefined;
      if (preparedImage) {
        thumbnailId = await uploadImage(preparedImage.file);
      }
  
      const newPost = await mutation.mutateAsync({
        ...result.data,
        thumbnailId,
      });
  
      toast({
        variant: "default",
        description: status === 'PUBLISHED' ? tEditor('publishedToast') : tEditor('draftToast'),
      });
  
      if (newPost && typeof newPost === 'object' && 'id' in newPost) {
        router.push(`/posts/${newPost.id}?t=${Date.now()}`);
      }
  
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        description: tEditor('saveFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-1 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          {tEditor('title')}
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder={tEditor('titlePlaceholder')}
          className="w-full text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-3"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <input
          type="text"
          {...register("titleOriginal")}
          placeholder={tEditor('titleOriginalPlaceholder')}
          className="w-full text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 p-3"
        />
        {errors.titleOriginal && (
          <p className="mt-1 text-sm text-red-600">
            {errors.titleOriginal.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {tEditor('videoLanguage')}
        </label>
        <div className="flex gap-3">
          {Object.values(Language)
            .filter((lang) => 
              ['ENGLISH', 'KOREAN', 'CHINESE'].includes(lang)
            )
            .map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`p-2 h-10 rounded-3xl transition-colors ${
                selectedLanguage === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <LanguageFlag language={lang} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium mb-2">
          {tEditor('thumbnailImage')}
        </label>

        <ImageUploader
          onImagePrepared={(image) => {
            setPreparedImage(image);
            setExistingThumbnail(null);
          }}
          aspectRatio={2/3}
          username={user?.username}
        />
        {errors.thumbnailId && (
          <p className="mt-1 text-sm text-red-600">
            {errors.thumbnailId?.message}
          </p>
        )}

        {existingThumbnail && !preparedImage && (
          <div className="mb-4">
            <img 
              src={getThumbnailUrl(existingThumbnail)}
              alt={tEditor('currentThumbnailAlt')}
              width={90}
              height={135}
              className="rounded-lg"
            />
            <button
              type="button"
              onClick={() => setExistingThumbnail(null)}
              className="mt-2 text-sm text-red-600"
            >
              {tEditor('removeThumbnail')}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {tEditor('categoriesMax')}
        </label>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectableCategories
            .map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  const currentCategories = Array.from(selectedCategories);
                  const index = currentCategories.indexOf(category);
                  
                  if (index === -1) {
                    if (currentCategories.length >= 3) {
                      toast({
                        description: tEditor('categoryMaxToast'),
                      });
                      return;
                    }
                    currentCategories.push(category);
                  } else {
                    currentCategories.splice(index, 1);
                  }
                  
                  setSelectedCategories(currentCategories);
                  setValue('categories', currentCategories);
                }}
                className={`
                  px-4 py-2 rounded-md text-xs transition-colors
                  ${selectedCategories.includes(category)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"}
                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50
                  active:scale-95 transform duration-100
                `}
              >
                {tCat(category)}
              </button>
            ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {tCat(category)}
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {tEditor('video')}
        </label>
        <VideoUploader
          videos={videos}
          onChange={handleVideosChange}
          maxFiles={10}
          isNewPost={!initialData}
        />
        {errors.videos && (
          <p className="mt-1 text-sm text-red-600">
            {errors.videos.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {tEditor('content')}
        </label>
        <EditorContent
          editor={editor}
          className="mt-1 text-base min-h-[200px] border border-gray-300 rounded-md p-3 [&_.ProseMirror]:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 [&_.is-editor-empty]:before:text-gray-400 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">
            {errors.content.message}
          </p>
        )}
      </div>

      <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
        <label className="block text-sm font-bold mb-4">
          {tEditor('translationSection')}
        </label>
        <div className="flex gap-4 mb-4">
          {TRANSLATION_LOCALES.map(({ locale, language }) => (
            <label key={locale} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={translationLocales.includes(locale)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setTranslationLocales([...translationLocales, locale]);
                  } else {
                    setTranslationLocales(translationLocales.filter(l => l !== locale));
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <LanguageFlag language={language} />
            </label>
          ))}
        </div>

        {translationLocales.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            {translationLocales.map(loc => (
              <div key={loc} className="p-4 bg-white dark:bg-slate-800 rounded-md border space-y-3">
                <h4 className="flex items-center gap-2 font-bold text-sm text-primary">
                  <LanguageFlag language={TRANSLATION_LOCALE_LANGUAGE[loc]} />
                  <span>{tEditor('translationTitle', { locale: loc.toUpperCase() })}</span>
                </h4>
                <div>
                  <input
                    type="text"
                    placeholder={tEditor('translationTitlePlaceholder', { locale: loc.toUpperCase() })}
                    value={titleI18n[loc] || ''}
                    onChange={(e) => setTitleI18n({ ...titleI18n, [loc]: e.target.value })}
                    className="w-full text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-primary p-2"
                  />
                </div>
                <div>
                  <textarea
                    placeholder={tEditor('translationContentPlaceholder', { locale: loc.toUpperCase() })}
                    value={contentI18n[loc] || ''}
                    onChange={(e) => setContentI18n({ ...contentI18n, [loc]: e.target.value })}
                    className="w-full text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-primary p-2 min-h-[80px]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

       <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
             {tEditor('ageLimit')}
           </label>
           <select
            {...register("ageLimit")}
            defaultValue="15"
            className="w-32 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary p-2"
          >
            <option value="0">{tEditor('ageAll')}</option>
            <option value="12">{tEditor('agePlus', { age: 12 })}</option>
            <option value="15">{tEditor('agePlus', { age: 15 })}</option>
            <option value="18">{tEditor('agePlus', { age: 18 })}</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave('DRAFT')}
          disabled={isSaving}
        >
          {tEditor('draft')}
        </Button>
        <Button
          type="button"
          onClick={() => handleSave('PUBLISHED')}
          disabled={isSaving}
        >
          {isSaving ? tEditor('saving') : initialData ? tEditor('edit') : tEditor('save')}
        </Button>
      </div>
    </div>
  );
}
