"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Shield, MapPin, Phone, AlertTriangle } from "lucide-react"

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: Shield,
      title: "Smart Detection",
      description:
        "Our AI-powered system automatically detects road accidents using advanced sensors and machine learning algorithms.",
      color: "bg-blue-500",
    },
    {
      icon: AlertTriangle,
      title: "Swift Response",
      description:
        "Instant emergency alerts are sent to nearby emergency services and your emergency contacts within seconds.",
      color: "bg-red-500",
    },
    {
      icon: Phone,
      title: "Emergency Services",
      description: "Direct access to emergency hotlines including police, fire department, and medical services.",
      color: "bg-green-500",
    },
    {
      icon: MapPin,
      title: "Location Tracking",
      description: "Precise GPS location sharing helps emergency responders reach you faster when every second counts.",
      color: "bg-purple-500",
    },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const skipOnboarding = () => {
    onComplete()
  }

  const step = steps[currentStep]
  const IconComponent = step.icon

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <Image
                src="/images/instaaid-logo.png"
                alt="InstaAid Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h1 className="text-white text-lg font-semibold">InstaAid</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-white" onClick={skipOnboarding}>
            Skip
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="text-center space-y-8">
          <div className={`${step.color} rounded-full p-8 w-32 h-32 flex items-center justify-center mx-auto`}>
            <IconComponent className="w-16 h-16 text-white" />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">{step.description}</p>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-blue-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-8">
        <Button
          onClick={nextStep}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-full text-lg font-semibold flex items-center justify-center space-x-2"
        >
          <span>{currentStep < steps.length - 1 ? "Next" : "Get Started"}</span>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
