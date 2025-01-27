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

type PostFormData = z.infer<typeof postSchema>;

const CATEGORIES: Record<CategoryType, string> = {
  COMIC: "만화",
  ROMANCE: "로맨스",
  ACTION: "액션",
  THRILLER: "스릴러",
  DRAMA: "드라마",
  PERIOD: "시대물",
  FANTASY: "판타지",
  HIGHTEEN: "하이틴",
  ADULT: "성인", 
  NOTIFICATION: "안내", 
  MSPOST: "블로그",
} as const;

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
  const [videos, setVideos] = useState<VideoType[]>(
    initialData?.videos || []
  );
  const mutation = useSubmitPostMutation();
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>(
    initialData?.categories || []
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '내용을 입력하세요... (필수)',
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
        videos: videos.map(video => ({
          id: video.id,
          url: video.url,
          filename: video.filename,
          sequence: video.sequence,
          isPremium: video.isPremium,
          subtitle: video.subtitle || []
        }))
      };
  
      const result = postSchema.safeParse(postData);
  
      if (!result.success) {
        const errorMessage = result.error.errors.map(error => {
          switch (error.path[0]) {
            case 'title':
              return '제목을 입력해주세요';
            case 'titleOriginal':
              return '원작제목을 입력해주세요';
            case 'content':
              return '내용을 입력해주세요';
            case 'priority':
              return '우선순위를 1-10 사이의 숫자로 입력해주세요';
            case 'categories':
              return '카테고리를 선택해주세요';
            case 'ageLimit':
              return '연령제한은 12-18 사이여야 합니다';
            case 'videos':
              return '최소 1개의 비디오가 필요합니다';
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
        description: status === 'PUBLISHED' ? "포스트가 발행되었습니다." : "임시저장되었습니다.",
      });
  
      if (newPost && typeof newPost === 'object' && 'id' in newPost) {
        router.push(`/posts/${newPost.id}?t=${Date.now()}`);
      }
  
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        description: "포스트 저장에 실패했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-1 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          제목
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder="제목을 입력해주세요 (필수)"
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
          placeholder="원작제목의 언어가 다르다면 입력하세요 (옵션)"
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
          동영상 언어
        </label>
        <div className="flex gap-3">
          {Object.values(Language)
            .filter((lang) => 
              !['ENGLISH', 'JAPANESE', 'THAI', 'SPANISH', 'INDONESIAN', 'VIETNAMESE'].includes(lang)
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
          썸네일 이미지
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
              src={existingThumbnail} 
              alt="현재 썸네일" 
              width={90}
              height={135}
              className="rounded-lg"
            />
            <button
              type="button"
              onClick={() => setExistingThumbnail(null)}
              className="mt-2 text-sm text-red-600"
            >
              썸네일 제거
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
        카테고리 (최대 3개)
        </label>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(CATEGORIES)
            .filter(([key]) => key !== 'NOTIFICATION' && key !== 'MSPOST')
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const category = key as CategoryType;
                  const currentCategories = Array.from(selectedCategories);
                  const index = currentCategories.indexOf(category);
                  
                  if (index === -1) {
                    if (currentCategories.length >= 3) {
                      toast({
                        description: "카테고리는 최대 3개까지 선택 가능합니다.",
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
                  ${selectedCategories.includes(key as CategoryType)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"}
                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50
                  active:scale-95 transform duration-100
                `}
              >
                {label}
              </button>
            ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {CATEGORIES[category]}
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          비디오
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
          내용
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

       <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
             컨텐츠 이용연령
           </label>
           <select
            {...register("ageLimit")}
            defaultValue="15"
            className="w-32 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary p-2"
          >
            <option value="0">전체</option>
            <option value="12">12세 이상</option>
            <option value="15">15세 이상</option>
            <option value="18">18세 이상</option>
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
          임시저장
        </Button>
        <Button
          type="button"
          onClick={() => handleSave('PUBLISHED')}
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : initialData ? "수정" : "저장"}
        </Button>
      </div>
    </div>
  );
}
