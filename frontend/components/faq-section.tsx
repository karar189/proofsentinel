"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is ProofSentinel and who is it for?",
    answer:
      "ProofSentinel is a continuous proof-of-reserves monitoring system for protocols and exchanges. It tracks reserve ratios on-chain and triggers alerts and on-chain safeguards when risk thresholds are breached. It's for teams that want to reduce detection latency between periodic audits.",
  },
  {
    question: "How does reserve monitoring work?",
    answer:
      "You register your protocol with reserve wallets and a liability source (e.g. token totalSupply). Our backend fetches on-chain reserves and liabilities, computes the ratio, and evaluates it against your warning and critical thresholds. Chainlink CRE runs this on a schedule (e.g. every 5 minutes).",
  },
  {
    question: "Can I integrate ProofSentinel with my stack?",
    answer:
      "Yes. ProofSentinel exposes a REST API for registering protocols, fetching monitoring status, and listing alerts. The CRE workflow can call your backend and the ReserveMonitor contract on Sepolia (or other EVM chains) for safeguards.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer documentation, architecture guides, and onboarding support. For the hackathon we provide a full backend, CRE workflow, and dashboard so you can run the full flow locally.",
  },
  {
    question: "Is my data secure with ProofSentinel?",
    answer:
      "Monitoring uses on-chain data (reserves, liabilities) and your configured thresholds. Alerts are stored by your backend. For production you would deploy your own backend and configure CRE with your secrets.",
  },
  {
    question: "How do I get started with ProofSentinel?",
    answer:
      "Get started by running the backend API, then the frontend. Register a protocol with reserve wallets and a token address, and open the dashboard to see monitoring and alerts. See the repo README and architecture.md for the full setup.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <section id="faq" className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Reserve monitoring, alerts, and safeguards—
            <br className="hidden md:block" />
            all in one place.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
