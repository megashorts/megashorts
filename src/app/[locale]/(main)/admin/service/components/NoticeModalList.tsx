import { NoticeModal } from './types';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import LanguageFlag from '@/components/LanguageFlag';

interface NoticeModalListProps {
  modals: NoticeModal[];
  onUpdate: (id: number, data: Partial<NoticeModal>) => void;
  onDelete: (id: number) => void;
  onEdit: (modal: NoticeModal) => void;
}

export function NoticeModalList({ modals, onUpdate, onDelete, onEdit }: NoticeModalListProps) {
  return (
    <div className="space-y-2">
      {modals.map((modal) => (
        <div
          key={modal.id}
          className="flex items-center gap-4 rounded-lg border py-2 pl-2"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">#{modal.id}</span>
              <button
                className="text-base hover:text-foreground"
                onClick={() => onEdit(modal)}
              >
                {modal.title}
              </button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Priority: {modal.priority}
              <span className="ml-2">
                {Object.entries(typeof modal.i18nData === 'string' 
                  ? JSON.parse(modal.i18nData) 
                  : modal.i18nData)
                  .map(([locale]) => (
                    <LanguageFlag key={locale} language={locale} className="mx-0.5 h-4 w-4" />
                  ))}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`modal-${modal.id}-active`}
              checked={modal.isActive}
              onChange={(e) => {
                onUpdate(modal.id, { isActive: e.target.checked });
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(modal.id)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
