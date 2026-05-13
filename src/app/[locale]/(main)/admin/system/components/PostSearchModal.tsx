'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { PostData } from "@/lib/types";
import { CategoryType } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { useDebounceCallback } from "@/hooks/useDebounceCallback";

interface PostSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostsSelect: (posts: PostData[]) => void;
  existingPosts?: PostData[];
  categories?: CategoryType[];
}

// 검색 결과에 필요한 최소한의 포스트 데이터 타입
interface SearchPostData {
  id: string;
  postNum: number;
  title: string | null;
  categories: CategoryType[];
  featured: boolean;
  priority: number;
}

interface PostListItemProps {
  post: SearchPostData;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onFeaturedChange: (featured: boolean) => void;
  onPriorityChange: (priority: number) => void;
}

function PostListItem({ post, isSelected, onSelect, onFeaturedChange, onPriorityChange }: PostListItemProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 p-2 hover:bg-accent rounded-md">
      {/* 모바일: 2줄 레이아웃 */}
      <div className="flex flex-col sm:flex-row w-full gap-2">
        {/* 첫 번째 줄 */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(checked as boolean)}
            />
            <span className="text-sm font-medium">#{post.postNum}</span>
          </div>

          {/* 데스크탑에서만 타이틀 표시 */}
          <p className="text-sm truncate hidden sm:block flex-1">{post.title}</p>

          <div className="flex items-center gap-2 ml-auto">
            {/* 카테고리 */}
            <div className="flex gap-1">
              {post.categories?.map((category) => (
                <span
                  key={category}
                  className="text-xs bg-secondary px-1.5 py-0.5 rounded"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* 추천 체크박스와 우선순위 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center h-8 w-8 justify-center">
                <Checkbox
                  id={`featured-${post.id}`}
                  checked={post.featured}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      onFeaturedChange(checked);
                    }
                  }}
                />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={post.priority || 0}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  onPriorityChange(parseInt(value) || 0);
                }}
                className="w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* 두 번째 줄 - 모바일에서만 표시되는 타이틀 */}
        <p className="text-sm sm:hidden">{post.title}</p>
      </div>
    </div>
  );
}

interface SelectedPost extends SearchPostData {
  isSelected: boolean;
}

export function PostSearchModal({ open, onOpenChange, onPostsSelect, existingPosts = [], categories }: PostSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPostData[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Map<string, SearchPostData & { isSelected: boolean }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedPosts(new Map());
    }
  }, [open]);

  const searchPosts = useDebounceCallback(async (term: string) => {
    if (!term) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const categoriesParam = categories?.length 
        ? `&categories=${categories.join(',')}`
        : '';
      const response = await fetch(
        `/api/admin/admin-post-search?term=${encodeURIComponent(term)}${categoriesParam}`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Failed to search posts:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    searchPosts(value);
  };

  const handleSave = async () => {
    try {
      // 이미 존재하는 포스트는 제외하고 새로 선택된 포스트만 업데이트
      const newPosts = Array.from(selectedPosts.values())
        .filter(post => !existingPosts.some(existing => existing.id === post.id));

      // 선택된 포스트들의 featured/priority 업데이트
      const updatePromises = newPosts.map(post => 
        fetch('/api/admin/featured-priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: post.id,
            featured: post.featured,
            priority: post.priority
          })
        }).then(res => {
          if (!res.ok) throw new Error('Update failed');
          return res.json();
        })
      );

      const updatedPosts = await Promise.all(updatePromises);
      onPostsSelect(updatedPosts);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update posts:', error);
    }
  };

  const togglePostSelection = (post: SearchPostData, selected: boolean) => {
    setSelectedPosts(prev => {
      const next = new Map(prev);
      if (selected) {
        next.set(post.id, { ...post, isSelected: true });
      } else {
        next.delete(post.id);
      }
      return next;
    });
  };

  const handleFeaturedChange = (post: SearchPostData, featured: boolean) => {
    setSearchResults(prev => 
      prev.map(p => p.id === post.id ? { ...p, featured } : p)
    );

    setSelectedPosts(prev => {
      const next = new Map(prev);
      if (!next.has(post.id)) {
        next.set(post.id, { ...post, isSelected: true });
      }
      const existing = next.get(post.id)!;
      next.set(post.id, { ...existing, featured });
      return next;
    });
  };

  const handlePriorityChange = (post: SearchPostData, priority: number) => {
    setSearchResults(prev => 
      prev.map(p => p.id === post.id ? { ...p, priority } : p)
    );

    setSelectedPosts(prev => {
      const next = new Map(prev);
      if (!next.has(post.id)) {
        next.set(post.id, { ...post, isSelected: true });
      }
      const existing = next.get(post.id)!;
      next.set(post.id, { ...existing, priority });
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] mx-2 sm:mx-4 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>포스트 검색</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="포스트 번호 또는 제목으로 검색"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Button variant="outline" size="icon" disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-[400px] overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="space-y-2">
            {searchResults
              .filter(post => !existingPosts.some(existing => existing.id === post.id))
              .map((post) => (
                <PostListItem
                  key={post.id}
                  post={selectedPosts.has(post.id) ? selectedPosts.get(post.id)! : post}
                  isSelected={selectedPosts.has(post.id)}
                  onSelect={(selected) => togglePostSelection(post, selected)}
                  onFeaturedChange={(featured) => handleFeaturedChange(post, featured)}
                  onPriorityChange={(priority) => handlePriorityChange(post, priority)}
                />
              ))}
            {searchResults.length === 0 && !isLoading && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                검색중...
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            선택 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
