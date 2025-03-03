"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { USER_ROLE, USER_ROLE_NAME } from "@/lib/constants";

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  userRole: number;
}

interface UserSearchInputProps {
  onSelect: (user: User) => void;
  selectedUser?: User | null;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function UserSearchInput({
  onSelect,
  selectedUser,
  placeholder = "유저네임 또는 이메일 검색...",
  className = "",
  disabled = false
}: UserSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 컴포넌트 언마운트 시 타임아웃 정리
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 검색 결과 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    if (searchTerm.length < 2) {
      setUsers([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setUsers(data.users || []);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectUser = (user: User) => {
    onSelect(user);
    setShowResults(false);
    setSearchTerm("");
    setUsers([]);
  };

  const handleClearSelection = () => {
    onSelect(null as any);
  };

  const getUserRoleName = (userRole: number) => {
    // 직접 userRole을 문자열로 변환하여 USER_ROLE_NAME에서 찾기
    const roleName = (USER_ROLE_NAME as Record<number, string>)[userRole];
    return roleName || "일반 사용자";
  };

  return (
    <div className={`relative ${className}`}>
      {selectedUser ? (
        <div className="flex items-center gap-2 p-2 border rounded-md text-sm">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedUser.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {selectedUser.username} ({getUserRoleName(selectedUser.userRole)})
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClearSelection}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative text-sm">
          <div className="flex items-center border rounded-md">
            <Input
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              disabled={disabled}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-1"
              onClick={handleSearch}
              disabled={disabled || searchTerm.length < 2}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {showResults && (
            <div 
              ref={resultsRef}
              className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto"
            >
              {loading ? (
                <div className="py-6 text-center text-sm">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2">검색 중...</p>
                </div>
              ) : users.length > 0 ? (
                <ul className="divide-y">
                  {users.map((user) => (
                    <li
                      key={user.id}
                      className="p-2 hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.username} ({getUserRoleName(user.userRole)})
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
