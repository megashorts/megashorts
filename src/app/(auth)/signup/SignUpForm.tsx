
"use client"; 
// 이 파일이 클라이언트에서 실행된다는 것을 Next.js에게 알려주는 선언입니다.

import LoadingButton from "@/components/LoadingButton";
// 'LoadingButton' 컴포넌트를 가져옵니다. 사용자가 회원가입 버튼을 클릭했을 때 로딩 상태를 표시할 수 있습니다.

import { PasswordInput } from "@/components/PasswordInput";
// 'PasswordInput' 컴포넌트를 가져옵니다. 비밀번호를 입력하는 입력란입니다.

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// 여러 UI 폼 요소를 가져옵니다. Form은 전체 폼을 감싸고, FormControl은 입력 필드를 감싸는 용도로 사용됩니다.
// FormItem은 각각의 입력 필드 그룹을 만들고, FormLabel은 필드의 레이블을 표시하며, FormMessage는 오류 메시지를 보여주는 데 사용됩니다.

import { Input } from "@/components/ui/input";
// Input 컴포넌트를 가져와 텍스트 입력 필드로 사용합니다.

import { signUpSchema, SignUpValues } from "@/lib/validation";
// signUpSchema와 SignUpValues를 가져옵니다. signUpSchema는 회원가입 시 입력값의 유효성을 검사하는 규칙을 정의한 스키마이고, SignUpValues는 폼 값의 타입을 정의합니다.

import { zodResolver } from "@hookform/resolvers/zod";
// zodResolver를 가져옵니다. 이 도구는 zod를 사용하여 React Hook Form에서 유효성 검사를 쉽게 처리할 수 있게 해줍니다.

import { useState, useTransition } from "react";
// useState와 useTransition 훅을 가져옵니다. useState는 상태 관리를 위해, useTransition은 폼 제출 중 비동기 전환을 처리할 때 사용됩니다.

import { useForm } from "react-hook-form";
// useForm 훅을 가져옵니다. 이 훅은 폼의 상태 관리 및 유효성 검사를 쉽게 처리할 수 있게 해줍니다.

import { signUp } from "./actions";
import { toast } from "@/components/ui/use-toast";
// signUp 함수를 가져옵니다. 이 함수는 폼이 제출되었을 때 실제로 회원가입 요청을 처리하는 비동기 함수입니다.

export default function SignUpForm() {
  const addcoinUser = 2;
  const [error, setError] = useState<string>();
  // error 상태 변수를 선언하고, setError로 오류 메시지를 설정합니다. 회원가입 중 오류가 발생하면 이 변수를 통해 오류 메시지를 화면에 표시합니다.

  const [isPending, startTransition] = useTransition();
  // isPending은 현재 폼 제출이 진행 중인지 여부를 나타내고, startTransition은 비동기 작업을 처리하는 함수입니다.

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    // zodResolver를 통해 signUpSchema로 입력값 유효성 검사를 처리합니다.
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "", // 비밀번호 확인 필드를 기본값으로 빈 문자열로 설정합니다.
      referredBy: "",
    },
  });
  // useForm을 사용하여 폼 데이터를 관리하고, 초기값을 설정합니다.

  async function onSubmit(values: SignUpValues) {
    setError(undefined);
    // 오류 메시지를 초기화합니다. 폼이 제출될 때마다 오류 상태를 지웁니다.

    startTransition(async () => {
      // startTransition을 사용하여 폼 제출 중 비동기 작업을 처리합니다.
      const { error } = await signUp(values);
      // signUp 함수가 반환하는 결과에서 error가 있는지 확인합니다.
      if (error) {
        setError(error);
      // 오류가 있으면 setError를 통해 오류 메시지를 설정하고 화면에 표시합니다.
      } else {
        // 성공 시 클라이언트에서 toast 표시
        toast({
          description: `추천가입 선물 ${addcoinUser}MS코인이 지급되었습니다`,
        });
      }
    });
  }

  return (
    <Form {...form}>
      {/* 전체 폼을 감싸는 Form 컴포넌트입니다. {...form}은 useForm에서 반환된 모든 폼 속성을 전달합니다. */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-xs">
        {/* form.handleSubmit은 폼 제출 시 onSubmit 함수를 실행하게 해줍니다. space-y-3 클래스는 항목 사이에 여백을 추가합니다. */}
        
        {error && <p className="text-xs text-center text-destructive pt-4">{error}</p>}
        {/* error 상태가 있으면 오류 메시지를 화면에 붉은색으로 표시합니다. */}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Email</FormLabel> */}
              {/* 이메일 입력란의 레이블을 표시합니다. */}
              <FormControl>
                <Input placeholder="이메일주소" type="email" {...field} />
                {/* 이메일을 입력받는 필드입니다. 필드 속성은 form.control을 통해 제어됩니다. */}
              </FormControl>
              <FormMessage />
              {/* 이메일 입력 오류 메시지가 있을 때 표시됩니다. */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Username</FormLabel> */}
              {/* 사용자 이름 입력란의 레이블을 표시합니다. */}
              <FormControl>
                <Input placeholder="사용자 ID" {...field} />
                {/* 사용자 이름을 입력받는 필드입니다. */}
              </FormControl>
              <FormMessage />
              {/* 사용자 이름 입력 오류 메시지가 있을 때 표시됩니다. */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Password</FormLabel> */}
              {/* 비밀번호 입력란의 레이블을 표시합니다. */}
              <FormControl>
                <PasswordInput placeholder="비밀번호" {...field} />
                {/* 비밀번호를 입력받는 필드입니다. PasswordInput 컴포넌트를 사용하여 비밀번호 형식을 지원합니다. */}
              </FormControl>
              <FormMessage />
              {/* 비밀번호 입력 오류 메시지가 있을 때 표시됩니다. */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword" 
          // 비밀번호 확인 필드 추가
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Confirm Password</FormLabel> */}
              {/* 비밀번호 확인 입력란의 레이블을 표시합니다. */}
              <FormControl>
                <PasswordInput placeholder="비밀번호 확인" {...field} />
                {/* 비밀번호 확인을 입력받는 필드입니다. */}
              </FormControl>
              {form.watch("password") !== field.value && (
                // 비밀번호와 비밀번호 확인 입력값이 다를 경우 오류 메시지를 출력합니다.
                <p className="text-destructive">Passwords do not match</p>
                // 비밀번호가 일치하지 않을 경우 붉은색 오류 메시지를 보여줍니다.
              )}
              <FormMessage />
              {/* 비밀번호 확인 입력 오류 메시지가 있을 때 표시됩니다. */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referredBy"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="(옵션) 추천친구 - @제외 입력" {...field} />
              </FormControl>
              <FormMessage />
              {/* 비밀번호 입력 오류 메시지가 있을 때 표시됩니다. */}
            </FormItem>
          )}
        />
        <LoadingButton loading={isPending} type="submit" className="w-full">
          {/* 로딩 상태일 때 버튼에 로딩 애니메이션을 표시하며, 버튼은 회원가입 제출 버튼입니다. */}
          회원가입
        </LoadingButton>
      </form>
    </Form>
  );
}
