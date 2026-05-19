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
import { getTranslations } from "next-intl/server";

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
const generateStructuredData = () => ({
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

export default async function CompanyIntroduce() {
  const t = await getTranslations('Company');

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">{t('introduce')}</h1>
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
              {t('speedy')}
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[105%] translate-y-0.6"></span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-4">
              {t('speedyDesc1')}
            </p>
            <p className="text-base text-gray-500 leading-relaxed">
              {t('speedyDesc2')}
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
              {t('youAreContent')}
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[105%] translate-y-0.6"></span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-4">
              {t('contentDesc1')}
            </p>
            <p className="text-base text-gray-500 leading-relaxed">
              {t('contentDesc2')}
            </p>
          </div>
        </div>

        {/* 하단 2개 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:pt-2">
          {/* 첫 번째 하단 그리드 */}
          <div className="relative flex flex-col justify-start items-center pl-4 md:pl-0 pr-4 md:pr-10 pt-10 sm:items-end">
            <h3 className="text-3xl font-bold mb-3 text-white relative">
              {t('faqTitle')}
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[110%] translate-y-0.6"></span>
            </h3>
            <Accordion type="single" collapsible className="w-full sm:w-11/12">
            <AccordionItem value="item-1" className="border-b">
              <AccordionTrigger className="text-base py-4 hover:no-underline">
              {t('faq1Q')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              {t('faq1A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              {t('faq2Q')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              {t('faq2A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              {t('faq3Q')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              {t('faq3A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              {t('faq4Q')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              {t('faq4A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              {t('faq5Q')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              {t('faq5A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="border-b">
              <AccordionTrigger className="text-bass py-4 hover:no-underline">
              {t('faq6Q')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500">
              {t('faq6A')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>

          {/* 두 번째 하단 그리드 */}
          <div className="flex flex-col justify-start items-center p-10 sm:items-start relative">
            <h3 className="text-3xl font-bold mb-6 text-white relative">
              {t('companyInfo')}
              <span className="absolute bottom-0 left-0 h-[10px] bg-red-500 -z-10 w-[110%] translate-y-0.6"></span>  
            </h3>
            <div className="flex flex-col space-y-6 items-center justify-center sm:items-start">
                <h3 className="text-base font-bold mb-1 text-gray-400">{t('companyName')}</h3>
                <div className="block sm:hidden text-white text-center sm:text-start space-y-1">
                  <p>{t('companyDescMobile1')}</p> 
                  <p>{t('companyDescMobile2')}</p> 
                  <p>{t('companyDescMobile3')}</p> 
                  <p>{t('companyDescMobile4')}</p>
                </div>
                <div className="hidden sm:block text-white text-center sm:text-start space-y-1">
                  <p>{t('companyDesc1')}</p> 
                  <p>{t('companyDesc2')}</p>
                </div>

                <div className="text-gray-500 text-center sm:text-start space-y-1">
                  <p className="flex justify-center sm:justify-start"><Mail className="w-5 h-5 text-white" /></p>
                  <p>{t('address1')}</p>
                  <p>{t('address2')}</p>
                  <p>{t('address3')}</p>
                  <p>{t('addressTitle')}</p>
                </div>
                <p className="text-stone-400 mt-4 pb-4">
                  hello@megashorts.com
                </p>
            </div>
            <ReportDialog 
              type={InquiryType.INQUIRY}
              title={t('inquiryBtn')}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
