"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import SmartSimpleBrilliant from "./smart-simple-brilliant"
import YourWorkInSync from "./your-work-in-sync"
import EffortlessIntegration from "./effortless-integration-updated"
import NumbersThatSpeak from "./numbers-that-speak"
import DocumentationSection from "./documentation-section"
import FAQSection from "./faq-section"
import PricingSection from "./pricing-section"
import CTASection from "./cta-section"
import FooterSection from "./footer-section"

function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs transition-colors duration-200 hover:border-[rgba(55,50,47,0.12)]">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 transition-colors duration-200 ${
        isActive
          ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-l-0 border-r-0 md:border border-[#E0DEDB]/80 hover:bg-[rgba(55,50,47,0.02)] hover:border-[#E0DEDB]"
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#322D2B] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#49423D] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#605A57] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}

export default function LandingPageClient() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  const handleCardClick = (index: number) => {
    setActiveCard(index)
    setProgress(0)
  }

  useEffect(() => {
    if (!mountedRef.current) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActiveCard((c) => (c + 1) % 3)
          return 0
        }
        return p + 2
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <div className="w-full min-h-screen relative bg-gradient-to-b from-[#E5F0FA] via-[#EEF4FA] to-[#F5F7F9] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        <div className="w-full max-w-none relative flex flex-col justify-start items-start min-h-screen">
          <div className="self-stretch pt-[9px] overflow-x-visible overflow-y-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation - full width bar */}
            <header className="w-full absolute left-0 top-0 z-20 border-b border-[rgba(55,50,47,0.08)] bg-[#F5F7F9]/95 backdrop-blur-md">
              <nav className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-6">
                <Link href="/" className="flex-shrink-0 text-[#2F3037] text-base sm:text-lg font-semibold font-sans tracking-tight hover:text-[#37322F] transition-colors duration-200">
                  ProofSentinel
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  <Link href="#features" className="px-3 py-2 text-[#49423D] text-sm font-medium font-sans rounded-md hover:bg-[rgba(55,50,47,0.06)] hover:text-[#37322F] transition-colors duration-200">
                    Features
                  </Link>
                  <Link href="#demo" className="px-3 py-2 text-[#49423D] text-sm font-medium font-sans rounded-md hover:bg-[rgba(55,50,47,0.06)] hover:text-[#37322F] transition-colors duration-200">
                    Product
                  </Link>
                  <Link href="#docs" className="px-3 py-2 text-[#49423D] text-sm font-medium font-sans rounded-md hover:bg-[rgba(55,50,47,0.06)] hover:text-[#37322F] transition-colors duration-200">
                    Docs
                  </Link>
                  <Link href="#pricing" className="px-3 py-2 text-[#49423D] text-sm font-medium font-sans rounded-md hover:bg-[rgba(55,50,47,0.06)] hover:text-[#37322F] transition-colors duration-200">
                    Pricing
                  </Link>
                  <Link href="#faq" className="px-3 py-2 text-[#49423D] text-sm font-medium font-sans rounded-md hover:bg-[rgba(55,50,47,0.06)] hover:text-[#37322F] transition-colors duration-200">
                    FAQ
                  </Link>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <Link href="/login" className="px-3 sm:px-4 py-2 text-[#37322F] text-sm font-medium font-sans rounded-lg hover:bg-[rgba(55,50,47,0.08)] transition-colors duration-200">
                    Log in
                  </Link>
                  <Link href="/login" className="px-4 sm:px-5 py-2 bg-[#37322F] text-white text-sm font-medium font-sans rounded-lg hover:bg-[#2a2624] hover:shadow-md transition-all duration-200 shadow-sm">
                    Get started
                  </Link>
                </div>
              </nav>
            </header>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 w-full max-w-[900px] mx-auto">
              <div className="w-full flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <div className="w-full text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif">
                    The better way to
                    <br />
                    monitor your reserves
                  </div>
                  <div className="w-full max-w-[680px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans lg:text-lg font-medium text-sm whitespace-normal">
                    Continuous on-chain solvency monitoring. Track reserve ratios,
                    <br />
                    trigger alerts and safeguards when risk thresholds are breached.
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4">
                  <Link href="/login" className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center hover:bg-[#2a2624] hover:shadow-md transition-all duration-200">
                    <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                    <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                      Get started
                    </div>
                  </Link>
                  <Link href="#demo" className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 py-2 sm:py-[6px] bg-white border border-[rgba(55,50,47,0.15)] overflow-hidden rounded-full flex justify-center items-center hover:bg-gray-50 hover:border-[rgba(55,50,47,0.25)] transition-all duration-200 text-[#37322F] text-sm font-medium">
                    Watch demo
                  </Link>
                </div>
              </div>

              <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
                <img
                  src="/mask-group-pattern.svg"
                  alt=""
                  className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-45 sm:opacity-55 md:opacity-65 mix-blend-multiply"
                  style={{
                    filter: "saturate(1.05) brightness(1.05)",
                  }}
                />
              </div>

              <div id="demo" className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
                <div className="w-full max-w-[960px] lg:w-[960px] h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px] flex flex-col justify-start items-start">
                  <div className="self-stretch flex-1 flex justify-start items-start">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative w-full h-full overflow-hidden">
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                            activeCard === 0 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                          }`}
                        >
                          <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dsadsadsa.jpg-xTHS4hGwCWp2H5bTj8np6DXZUyrxX7.jpeg"
                            alt="Schedules Dashboard - Customer Subscription Management"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                            activeCard === 1 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                          }`}
                        >
                          <img
                            src="/analytics-dashboard-with-charts-graphs-and-data-vi.jpg"
                            alt="Analytics Dashboard"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                            activeCard === 2 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                          }`}
                        >
                          <img
                            src="/data-visualization-dashboard-with-interactive-char.jpg"
                            alt="Data Visualization Dashboard"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features - full width like navbar */}
            <section id="features" className="w-full border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-stretch">
              <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden flex-shrink-0">
                <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    ></div>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
                <FeatureCard
                  title="Reserve monitoring"
                  description="Track reserves vs liabilities on-chain. Real-time ratio and status per protocol."
                  isActive={activeCard === 0}
                  progress={activeCard === 0 ? progress : 0}
                  onClick={() => handleCardClick(0)}
                />
                <FeatureCard
                  title="Alerts & risk events"
                  description="Get warnings and critical alerts when reserve ratio breaches your thresholds."
                  isActive={activeCard === 1}
                  progress={activeCard === 1 ? progress : 0}
                  onClick={() => handleCardClick(1)}
                />
                <FeatureCard
                  title="On-chain safeguards"
                  description="Automated pause and alerts via Chainlink CRE and ReserveMonitor contract."
                  isActive={activeCard === 2}
                  progress={activeCard === 2 ? progress : 0}
                  onClick={() => handleCardClick(2)}
                />
              </div>

              <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden flex-shrink-0">
                <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    ></div>
                  ))}
                </div>
              </div>
            </section>

            {/* Social Proof Section */}
            <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
              <div className="self-stretch px-4 sm:px-6 md:px-24 py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                <div className="w-full max-w-[586px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
                  <Badge
                    icon={
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="3" width="4" height="6" stroke="#37322F" strokeWidth="1" fill="none" />
                        <rect x="7" y="1" width="4" height="8" stroke="#37322F" strokeWidth="1" fill="none" />
                        <rect x="2" y="4" width="1" height="1" fill="#37322F" />
                        <rect x="3.5" y="4" width="1" height="1" fill="#37322F" />
                        <rect x="2" y="5.5" width="1" height="1" fill="#37322F" />
                        <rect x="3.5" y="5.5" width="1" height="1" fill="#37322F" />
                        <rect x="8" y="2" width="1" height="1" fill="#37322F" />
                        <rect x="9.5" y="2" width="1" height="1" fill="#37322F" />
                        <rect x="8" y="3.5" width="1" height="1" fill="#37322F" />
                        <rect x="9.5" y="3.5" width="1" height="1" fill="#37322F" />
                        <rect x="8" y="5" width="1" height="1" fill="#37322F" />
                        <rect x="9.5" y="5" width="1" height="1" fill="#37322F" />
                      </svg>
                    }
                    text="Risk & Compliance"
                  />
                  <div className="w-full max-w-[472.55px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                    Reduce detection latency
                  </div>
                  <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                    ProofSentinel fills the gap between periodic audits.
                    <br className="hidden sm:block" />
                    Continuous monitoring and automated safeguards when reserves slip.
                  </div>
                </div>
              </div>

              {/* Logo Grid */}
              <div className="self-stretch border-[rgba(55,50,47,0.12)] flex justify-center items-start border-t border-b-0">
                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                  {Array.from({ length: 8 }).map((_, index) => {
                    const isMobileFirstColumn = index % 2 === 0
                    const isMobileLastColumn = index % 2 === 1
                    const isDesktopFirstColumn = index % 4 === 0
                    const isDesktopLastColumn = index % 4 === 3
                    const isMobileBottomRow = index >= 6
                    const isDesktopTopRow = index < 4
                    const isDesktopBottomRow = index >= 4

                    return (
                      <div
                        key={index}
                        className={`
                          h-24 xs:h-28 sm:h-32 md:h-36 lg:h-40 flex justify-center items-center gap-1 xs:gap-2 sm:gap-3
                          border-b border-[rgba(227,226,225,0.5)]
                          transition-colors duration-200 hover:bg-[rgba(55,50,47,0.02)]
                          ${index < 6 ? "sm:border-b-[0.5px]" : "sm:border-b"}
                          ${index >= 6 ? "border-b" : ""}
                          ${isMobileFirstColumn ? "border-r-[0.5px]" : ""}
                          sm:border-r-[0.5px] sm:border-l-0
                          ${isDesktopFirstColumn ? "md:border-l" : "md:border-l-[0.5px]"}
                          ${isDesktopLastColumn ? "md:border-r" : "md:border-r-[0.5px]"}
                          ${isDesktopTopRow ? "md:border-b-[0.5px]" : ""}
                          ${isDesktopBottomRow ? "md:border-t-[0.5px] md:border-b" : ""}
                          border-[#E3E2E1]
                        `}
                      >
                        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 relative shadow-[0px_-4px_8px_rgba(255,255,255,0.64)_inset] overflow-hidden rounded-full">
                          <img src="/horizon-icon.svg" alt="Horizon" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center flex justify-center flex-col text-[#37322F] text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-tight md:leading-9 font-sans">
                          {["Chainlink", "Sepolia", "CRE", "EVM"][index % 4]}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid Section */}
            <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
              <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
                  <Badge
                    icon={
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                        <rect x="7" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                        <rect x="1" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                        <rect x="7" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                      </svg>
                    }
                    text="Features"
                  />
                  <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                    Built for protocols and exchanges
                  </div>
                  <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                    Register protocols, set thresholds, and let Chainlink CRE
                    <br />
                    run continuous monitoring and trigger on-chain safeguards.
                  </div>
                </div>
              </div>

              <div className="self-stretch flex justify-center items-start">
                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 200 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                  <div className="border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                        Reserve ratio at a glance
                      </h3>
                      <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                        See reserves, liabilities, and status per protocol. Healthy, warning, or critical—clearly labeled.
                      </p>
                    </div>
                    <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex items-center justify-center overflow-hidden">
                      <SmartSimpleBrilliant
                        width="100%"
                        height="100%"
                        theme="light"
                        className="scale-50 sm:scale-65 md:scale-75 lg:scale-90"
                      />
                    </div>
                  </div>

                  <div className="border-b border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[#37322F] font-semibold leading-tight font-sans text-lg sm:text-xl">
                        Alerts when it matters
                      </h3>
                      <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                        Warnings and critical alerts when reserve ratio breaches thresholds. CRE posts to your dashboard.
                      </p>
                    </div>
                    <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden text-right items-center justify-center">
                      <YourWorkInSync
                        width="400"
                        height="250"
                        theme="light"
                        className="scale-60 sm:scale-75 md:scale-90"
                      />
                    </div>
                  </div>

                  <div className="border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6 bg-transparent">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                        Chainlink CRE
                      </h3>
                      <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                        Cron-triggered workflow fetches reserves and liabilities, computes ratio, and calls ReserveMonitor on critical.
                      </p>
                    </div>
                    <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden justify-center items-center relative bg-transparent">
                      <div className="w-full h-full flex items-center justify-center bg-transparent">
                        <EffortlessIntegration width={400} height={250} className="max-w-full max-h-full" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#F5F7F9] to-transparent pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                        On-chain safeguards
                      </h3>
                      <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                        pauseWithdrawals() and emitReserveAlert() on ReserveMonitor when ratio stays below threshold.
                      </p>
                    </div>
                    <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden items-center justify-center relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <NumbersThatSpeak
                          width="100%"
                          height="100%"
                          theme="light"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#F5F7F9] to-transparent pointer-events-none"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 hidden">
                        <div className="flex flex-col items-center gap-2 p-4">
                          <div className="w-3/4 h-full bg-green-500 rounded-full"></div>
                        </div>
                        <div className="text-sm text-green-600">Growth Rate</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 200 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DocumentationSection />
            <PricingSection />
            <FAQSection />
            <CTASection />
            <FooterSection />
          </div>
        </div>
      </div>
    </div>
  )
}
