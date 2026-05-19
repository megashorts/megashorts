import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import { UpdateUserProfileValues } from "@/lib/validation";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateUserProfile } from "./actions";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { myLanguageToLocale } from "@/lib/locale-language";
import type { LocaleCode } from "@/i18n/config";

export function useUpdateProfileMutation() {
  const { toast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as LocaleCode;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      values,
    }: {
      values: UpdateUserProfileValues;
    }) => {
      return Promise.all([
        updateUserProfile(values),
      ]);
    },
    onSuccess: async ([updatedUser]) => {

      const queryFilter = {
        queryKey: ["post-feed"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData) return;

          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                if (post.user.id === updatedUser.id) {
                  return {
                    ...post,
                    user: {
                      ...updatedUser,
                    },
                  };
                }
                return post;
              }),
            })),
          };
        },
      );

      queryClient.setQueryData(["session"], (oldData: any) => {
        if (!oldData?.user) return oldData;

        return {
          ...oldData,
          user: {
            ...oldData.user,
            myLanguage: updatedUser.myLanguage,
          },
        };
      });

      const nextLocale = myLanguageToLocale(updatedUser.myLanguage);

      if (nextLocale !== locale) {
        router.replace(pathname, { locale: nextLocale });
      }

      router.refresh();

      toast({
        description: "Profile updated",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to update profile. Please try again.",
      });
    },
  });

  return mutation;
}
