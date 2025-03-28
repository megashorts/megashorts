'use client';

import { useEffect, useState, useRef } from 'react';
import { NoticeModal, NoticeModalFormData } from './types';
import { NoticeModalForm } from './NoticeModalForm';
import { NoticeModalList } from './NoticeModalList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface NoticeModalClientProps {
  currentUser?: { displayName: string };
}

export default function NoticeModalClient({ currentUser }: NoticeModalClientProps) {
  const [modals, setModals] = useState<NoticeModal[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingModal, setEditingModal] = useState<NoticeModal | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchModals();
  }, []);

  const fetchModals = async () => {
    try {
      const response = await fetch('/api/admin/notice-modals');
      if (!response.ok) throw new Error('Failed to fetch modals');
      const data = await response.json();
      console.log('Fetched modals:', data);
      setModals(data);
    } catch (error) {
      console.error('Failed to fetch modals:', error);
      toast({
        variant: "destructive",
        description: "모달 목록을 불러오는데 실패했습니다.",
        duration: 1500,
      });
    }
  };

  const handleSubmit = async (data: NoticeModalFormData) => {
    try {
      const url = editingModal 
        ? `/api/admin/notice-modals/${editingModal.id}`
        : '/api/admin/notice-modals';
      
      // 데이터 깊은 복사 (참조 문제 방지)
      const submitData = JSON.parse(JSON.stringify({
        ...data,
        isActive: editingModal ? editingModal.isActive : true,
      }));
      
      console.log('Submitting to API:', url);
      console.log('Data being sent:', JSON.stringify(submitData, null, 2));
      
      const response = await fetch(url, {
        method: editingModal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to save modal: ${errorText}`);
      }
  
      const savedModal = await response.json();
      console.log(editingModal ? 'Updated modal:' : 'Created modal:', savedModal);
      
      setModals(prev => 
        editingModal
          ? prev.map(modal => modal.id === editingModal.id ? savedModal : modal)
          : [...prev, savedModal]
      );
      
      setFormOpen(false);
      setEditingModal(null);
  
      toast({
        description: editingModal 
          ? "모달이 수정되었습니다."
          : "새 모달이 추가되었습니다.",
        duration: 1500,
      });
    } catch (error) {
      console.error('Failed to save modal:', error);
      toast({
        variant: "destructive",
        description: "모달 저장에 실패했습니다.",
        duration: 1500,
      });
    }
  };

  const handleUpdate = async (id: number, data: Partial<NoticeModal>) => {
    try {
      const response = await fetch(`/api/admin/notice-modals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update modal');

      const updatedModal = await response.json();
      console.log('Updated modal:', updatedModal);
      setModals(prev => prev.map(modal => 
        modal.id === id ? updatedModal : modal
      ));

      toast({
        description: "모달이 업데이트되었습니다.",
        duration: 1500,
      });
    } catch (error) {
      console.error('Failed to update modal:', error);
      toast({
        variant: "destructive",
        description: "모달 업데이트에 실패했습니다.",
        duration: 1500,
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/notice-modals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete modal');

      console.log('Deleted modal:', id);
      setModals(prev => prev.filter(modal => modal.id !== id));

      toast({
        description: "모달이 삭제되었습니다.",
        duration: 1500,
      });
    } catch (error) {
      console.error('Failed to delete modal:', error);
      toast({
        variant: "destructive",
        description: "모달 삭제에 실패했습니다.",
        duration: 1500,
      });
    }
  };

  const handleEdit = (modal: NoticeModal) => {
    // i18nData가 문자열인 경우 파싱
    let parsedI18nData;
    try {
      parsedI18nData = typeof modal.i18nData === 'string' 
        ? JSON.parse(modal.i18nData)
        : modal.i18nData;
    } catch (error) {
      console.error('Failed to parse i18nData:', error);
      parsedI18nData = {};
    }
    
    const processedModal = {
      ...modal,
      i18nData: parsedI18nData
    };
    
    console.log('Editing modal with processed data:', processedModal);
    setEditingModal(processedModal);
    setFormOpen(true);
  };

  // 현재 편집 중인 모달의 초기 데이터
  const initialFormData = editingModal ? {
    title: editingModal.title,
    priority: editingModal.priority,
    hideOption: editingModal.hideOption,
    linkUrl: editingModal.linkUrl || undefined,
    buttonUrl: editingModal.buttonUrl || undefined,
    i18nData: typeof editingModal.i18nData === 'string'
      ? JSON.parse(editingModal.i18nData)
      : editingModal.i18nData
  } : undefined;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold ml-2 mt-1">메인팝업 운영</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setEditingModal(null);
            setFormOpen(true);
          }}
          className="h-8 w-12"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <NoticeModalList
        modals={modals}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <NoticeModalForm
        key={editingModal ? `edit-${editingModal.id}` : 'create-new'} // 중요: 키를 추가하여 컴포넌트를 강제로 다시 마운트
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingModal(null);
        }}
        onSubmit={handleSubmit}
        initialData={initialFormData}
      />
    </div>
  );
}
