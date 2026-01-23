'use client';

import { useState, useEffect } from 'react';

interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

const ProcessFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      id: 1,
      title: 'Search & Discover',
      description: 'Browse through our extensive network of coworking workspace. Filter by location, price, amenities, and availability.',
      icon: 'bi-search',
      completed: false
    },
    {
      id: 2,
      title: 'Compare & Choose',
      description: 'Compare different workspace based on your requirements. View photos, amenities, and read reviews.',
      icon: 'bi-ui-checks-grid',
      completed: false
    },
    {
      id: 3,
      title: 'Book & Reserve',
      description: 'Select your dates and book instantly. Receive confirmation and booking details via email.',
      icon: 'bi-calendar-check',
      completed: false
    },
    {
      id: 4,
      title: 'Work & Enjoy',
      description: 'Check in at your chosen space and start being productive. Access all booked amenities.',
      icon: 'bi-laptop',
      completed: false
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          // Reset and start over
          setSteps((prevSteps) => 
            prevSteps.map((step, index) => ({
              ...step,
              completed: index < prevSteps.length
            }))
          );
          return 0;
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold mb-3">How It Works</h2>
          <p className="lead text-muted">Find and book your perfect seats in 4 simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="row mb-5">
          <div className="col-lg-8 mx-auto">
            <div className="position-relative">
              {/* Progress Line */}
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-primary"
                  style={{ 
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                ></div>
              </div>

              {/* Step Indicators */}
              <div className="d-flex justify-content-between position-relative" style={{ marginTop: '-20px' }}>
                {steps.map((step, index) => (
                  <div key={step.id} className="text-center">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center mb-3 ${
                        getStepStatus(step.id) === 'completed' 
                          ? 'bg-success text-white' 
                          : getStepStatus(step.id) === 'active'
                          ? 'bg-primary text-white border border-3 border-white'
                          : 'bg-white border border-3 border-secondary'
                      }`}
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {getStepStatus(step.id) === 'completed' ? (
                        <i className="bi bi-check-lg"></i>
                      ) : (
                        <span className="fw-bold">{step.id}</span>
                      )}
                    </div>
                    <h6 className={`fw-bold mb-2 ${
                      getStepStatus(step.id) === 'active' ? 'text-primary' : 'text-muted'
                    }`}>
                      {step.title}
                    </h6>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step Details */}
        <div className="row g-4">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`col-md-6 col-lg-3 transition-all duration-500 ${
                getStepStatus(step.id) === 'active' ? 'scale-105' : ''
              }`}
            >
              <div className={`card h-100 border-0 shadow-sm ${
                getStepStatus(step.id) === 'active' ? 'border-primary border-2' : ''
              }`}>
                <div className="card-body text-center p-4">
                  <div className={`mb-3 ${
                    getStepStatus(step.id) === 'completed' 
                      ? 'text-success' 
                      : getStepStatus(step.id) === 'active'
                      ? 'text-primary'
                      : 'text-muted'
                  }`}>
                    <i className={`bi ${step.icon}`} style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h5 className={`card-title fw-bold mb-3 ${
                    getStepStatus(step.id) === 'active' ? 'text-primary' : ''
                  }`}>
                    Step {step.id}: {step.title}
                  </h5>
                  <p className={`card-text ${
                    getStepStatus(step.id) === 'active' ? 'text-dark' : 'text-muted'
                  }`}>
                    {step.description}
                  </p>
                  {getStepStatus(step.id) === 'completed' && (
                    <div className="text-success">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Completed
                    </div>
                  )}
                  {getStepStatus(step.id) === 'active' && (
                    <div className="text-primary">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-5">
          <a 
            href="/workspace" 
            className="btn btn-primary btn-lg"
          >
            <i className="bi bi-play-circle me-2"></i>
            Get Started Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;
