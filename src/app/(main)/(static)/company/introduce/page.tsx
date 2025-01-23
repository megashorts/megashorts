import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import ReportDialog from "@/components/posts/ReportDialog";
import { InquiryType } from "@prisma/client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: '회사소개',
  description: '메가쇼츠는 창의적인 기획과 설계로 숏폼 컨텐츠의 새로운 가치를 창출합니다.',
  openGraph: {
    title: '메가쇼츠 회사소개',
    description: '메가쇼츠는 창의적인 기획과 설계로 숏폼 컨텐츠의 새로운 가치를 창출합니다.',
    images: ['/MSWebLogo.png'],
  },
  alternates: {
    canonical: 'https://megashorts.vercel.app/company/introduce',
  },
};

// Schema.org 구조화 데이터
export const generateStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "APPLIED LABS Co.,ltd",
  description: "메가쇼츠는 숏폼컨텐츠 최적화 플랫폼으로 다양한 장르의 짧은 컨텐츠를 제공합니다.",
  url: "https://megashorts.com",
  logo: "https://megashorts.com/MSWebLogo.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "송도미래로 30 스마트밸리 지식산업센터 D-1106",
    addressLocality: "연수구",
    addressRegion: "인천광역시",
    postalCode: "21990",
    addressCountry: "KR"
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@megashorts.com",
    contactType: "customer service"
  }
});

export default function CompanyIntroduce() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">메가쇼츠 소개</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 bass:grid-cols-2 mb-4">
          {/* 첫 번째 그리드 */}
          <div className="flex items-center sm:justify-end justify-center h-[250px] pt-16 sm:pr-12">
            <div className="relative aspect-square w-[250px]">
              <Image
                src="/MSphone.webp"
                alt="MS Making Phone"
                fill
                sizes="250px"
                priority  // priority 대신 lazy 로딩 사용
                className="object-contain"
              />
            </div>
          </div>



          {/* 두 번째 그리드 */}
          <div className="flex flex-col justify-center sm:items-start sm:justify-end items-center h-[200px] sm:pl-12 relative">
            <h1 className="text-2xl font-bold mb-6 relative z-10">
              Speedy & Funny ! 
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[105%] translate-y-0.6"></span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-4">
              숏폼 컨텐츠를 즐기는 최선의 선택
            </p>
            <p className="text-base text-gray-500 leading-relaxed">
              메가쇼츠와 함께하세요.
            </p>
          </div>


          {/* 세 번째 그리드 */}
          <div className="flex items-center justify-center sm:justify-end h-[250px] pt-8 sm:pr-12">
            <div className="relative aspect-square w-[280px]">
              <Image
                src="/MSgirl.webp"
                alt="MS Making Girl"
                fill
                sizes="280px"
                priority  // priority 대신 lazy 로딩 사용
                className="object-contain"
              />
            </div>
          </div>

          {/* 네 번째 그리드 */}
          <div className="flex flex-col justify-center sm:items-start sm:justify-end items-center h-[200px] sm:pl-12 relative">
            <h1 className="text-2xl font-bold relative mb-6">
              You are the content.
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[105%] translate-y-0.6"></span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-4">
              나의 이야기가 작품이 되는 메가쇼츠.
            </p>
            <p className="text-base text-gray-500 leading-relaxed">
              폭넓은 창작지원으로 함께하세요.
            </p>
          </div>
        </div>

        {/* 하단 2개 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:pt-2">
          {/* 첫 번째 하단 그리드 */}
          <div className="relative flex flex-col justify-start items-center pr-10 pt-10 sm:items-end">
            <h3 className="text-3xl font-bold mb-3 text-white relative">
              FAQ
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[110%] translate-y-0.6"></span>
            </h3>
            <Accordion type="single" collapsible className="w-full sm:w-11/12">
            <AccordionItem value="item-1" className="border-b">
              <AccordionTrigger className="text-base py-4 hover:no-underline">
              메가쇼츠는 어떤 플랫폼인가요?
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              메가쇼츠는 숏폼컨텐츠 최적화 플랫폼으로 다양한 장르의 짧은 컨텐츠를 즐길 수 있습니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              컨텐츠는 어떻게 등록하나요?
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              이용약관에 동의한 모든 가입사용자가 등록할 수 있습니다. 컨텐츠 이용 수익은 창작자의 레벨에 따라 일정한 수수료 공제후 창작자에게 투명하게 지급됩니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              컨텐츠 등록 제한사항이 있나요?
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              메가쇼츠는 컨텐츠 제공에 관한 대한민국 법률을 준수합니다. 미성년자, 폭력, 아동, 마약, 사회적 안정을 저해하고 저작권을 침해하는 컨텐츠는 서비스될 수 없으며 계정이 정지되거나 수익지급이 제한됩니다. 자세한 내용은 약관을 참고하세요.  
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              어떤 언어가 지원되나요?
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              메가쇼츠는 업로더의 사용언어에 기반합니다. 한국어를 기본으로 창작자 업로드에 따라 다국어를 반영하게 됩니다
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              창작자를 위한 어떤 지원이 있나요?
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              메가쇼츠는 컨텐츠 제작을 위한 프리프로덕션 단계의 아이디어, 제작참여, 제작지원, 오리지널 시리즈 공동제작, 공모전 개최 등 다양한 제작지원 프로그램이 있습니다. 세부사항은 공지사항을 참고하세요.   
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              MS크루는 무엇인가요?
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              MS크루는 메가쇼츠팀과 함께하는 무료 파트너쉽으로 모든 회원이 무료로 참가할 수 있습니다. 자막수정, 자막업로드, 자막생성, 컨텐츠 전문리뷰 등 다양한 활동이 가능하며 혜택이 제공됩니다.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>

          {/* 두 번째 하단 그리드 */}
          <div className="flex flex-col justify-start items-center p-10 sm:items-start relative">
            <h3 className="text-3xl font-bold mb-6 text-white relative">
              회사정보
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[110%] translate-y-0.6"></span>  
            </h3>
            <div className="flex flex-col space-y-6 items-center justify-center sm:items-start">
                <h3 className="text-base font-bold mb-1 text-gray-400">APPLIED LABS Co.,ltd</h3>
                <div className="block sm:hidden text-white text-center sm:text-start space-y-1">
                  <p>외부로는 모두 표현되지 않는</p> 
                  <p>창의적인 기획과 설계.</p> 
                  <p>구조적 전략의 상호작용을 통한</p> 
                  <p>퍼포먼스의 극대화.</p>
                </div>
                <div className="hidden sm:block text-white text-center sm:text-start space-y-1">
                  <p>외부로는 모두 표현되지 않는 창의적인 기획과 설계.</p> 
                  <p>구조적 전략의 상호작용을 통한 퍼포먼스 극대화.</p>
                </div>

                <div className="text-gray-500 text-center sm:text-start space-y-1">
                  <p className="flex justify-center sm:justify-start"><Mail className="w-5 h-5 text-white" /></p>
                  <p>인천광역시 연수구 송도미래로 30</p>
                  <p>스마트밸리 지식산업센터 D-1106</p>
                  <p>(우) 21990</p>
                  <p>어플라이드 랩스</p>
                </div>
                <p className="text-stone-400 mt-4 pb-4">
                  hello@megashorts.com
                </p>
            </div>
            <ReportDialog 
              type={InquiryType.INQUIRY}
              title="문의하기"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
