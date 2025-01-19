import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserData } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useUpdateProfileMutation } from "./mutations";
import { Language } from "@prisma/client";
import LanguageFlag from "@/components/LanguageFlag";
import { Button } from "@/components/ui/button";
import ProfileActionButtons from "@/components/auth/ProfileActionButtons";

interface EditProfileDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({
  user,
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const form = useForm<UpdateUserProfileValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio || "",
      myLanguage: user.myLanguage as Language,
    },
  });

  const mutation = useUpdateProfileMutation();

  const handleOpenChange = (newOpen: boolean) => {
    // Dialog가 열리거나 닫힐 때 모두 데이터베이스 값으로 리셋
    form.reset({
      displayName: user.displayName,
      bio: user.bio || "",
      myLanguage: user.myLanguage as Language,
    });
    onOpenChange(newOpen);
  };

  async function onSubmit(values: UpdateUserProfileValues) {
    mutation.mutate(
      {
        values,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full md:min-w-[450px] max-w-[90%] md:max-w-[30%] rounded-lg h-auto">
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
        </DialogHeader>
        {/* <div className="space-y-1.5">
          <Label>Avatar</Label>

        </div> */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="myLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>나의 언어선택</FormLabel>
                  <FormControl>
                    {/* <div className="flex flex-wrap gap-2">
                      {Object.values(Language).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => field.onChange(lang)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                            field.value === lang
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          <LanguageFlag language={lang} />
                        </button>
                      ))}
                    </div> */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        Language.KOREAN,
                        Language.ENGLISH, 
                        Language.CHINESE, 
                        Language.JAPANESE
                      ].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => field.onChange(lang)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                            field.value === lang  // 현재 선택된 언어와 비교
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          <LanguageFlag language={lang} />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <LoadingButton type="submit" loading={mutation.isPending}>
                프로필 수정 & 저장
              </LoadingButton>
            </DialogFooter>
            {/* <hr className="my-4 border-t " />
            <div className="flex flex-wrap gap-4 justify-start md:justify-start">
              <Button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-md w-full md:w-[120px] flex-1"
                >
                비밀번호 변경
              </Button>
              <Button
                type="button"
                className="px-4 py-2 text-sm text-black hover:text-white border-gray-50 bg-white font-medium rounded-md w-full md:w-[120px] flex-1"
                >
                구독취소
              </Button>
              <Button
                type="button"
                className="px-4 py-2 text-sm text-black hover:text-white border-gray-50 bg-white font-medium rounded-md w-full md:w-[120px] flex-1"
                >
                회원탈퇴
              </Button>
            </div> */}
          
            <hr className="my-4 border-t" />
              <ProfileActionButtons
                subscriptionStatus={user.subscription?.status}
              />
          
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}