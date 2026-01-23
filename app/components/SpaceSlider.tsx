'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Space {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  images: string[];
  totalWorkspaces: number;
  availableWorkspaces: number;
  rating: number;
}

const SpaceSlider = () => {
  const [workspace, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Mock data - replace with API call
    const mockSpaces: Space[] = [
      {
        id: '1',
        name: 'TechHub Downtown',
        description: 'Modern coworking space with high-speed internet and meeting rooms',
        city: 'New York',
        state: 'NY',
        images: ['/space1.jpg', '/space2.jpg'],
        totalWorkspaces: 50,
        availableWorkspaces: 12,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Creative Corner',
        description: 'Inspiring seats for designers and creative professionals',
        city: 'San Francisco',
        state: 'CA',
        images: ['/space3.jpg', '/space4.jpg'],
        totalWorkspaces: 30,
        availableWorkspaces: 8,
        rating: 4.6
      },
      {
        id: '3',
        name: 'Business Central',
        description: 'Professional environment for entrepreneurs and startups',
        city: 'Austin',
        state: 'TX',
        images: ['/space5.jpg', '/space6.jpg'],
        totalWorkspaces: 40,
        availableWorkspaces: 15,
        rating: 4.9
      }
    ];
    
    setSpaces(mockSpaces);
    setLoading(false);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === workspace.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? workspace.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-primary mb-3">Featured Spaces</h2>
          <p className="lead text-muted">Discover amazing coworking workspace in your city</p>
        </div>
        
        <div className="position-relative">
          <div className="overflow-hidden rounded-3" style={{ height: '400px' }}>
            {workspace.map((space, index) => (
              <div
                key={space.id}
                className={`position-absolute w-100 h-100 transition-transform duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  transform: `translateX(${(index - currentIndex) * 100}%)`
                }}
              >
                <div className="row h-100 g-0">
                  <div className="col-md-6">
                    <Image
                      src={space.images[0]}
                      alt={space.name}
                      fill
                      className="img-fluid object-fit-cover rounded-start-3"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="col-md-6 d-flex align-items-center bg-white">
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h3 className="h4 fw-bold mb-0">{space.name}</h3>
                        <div className="text-warning">
                          <i className="bi bi-star-fill"></i>
                          <span className="ms-1">{space.rating}</span>
                        </div>
                      </div>
                      <p className="text-muted mb-3">{space.description}</p>
                      <div className="d-flex align-items-center text-muted small mb-3">
                        <i className="bi bi-geo-alt me-2"></i>
                        <span>{space.city}, {space.state}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="badge bg-success me-2">
                            {space.availableWorkspaces} available
                          </span>
                          <span className="badge bg-secondary">
                            {space.totalWorkspaces} total
                          </span>
                        </div>
                        <Link 
                          href={`/workspace/${space.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <button
          className="position-absolute top-50 start-0 translate-middle-y btn btn-light btn-lg rounded-circle shadow ms-3"
          onClick={prevSlide}
          aria-label="Previous space"
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <button
          className="position-absolute top-50 end-0 translate-middle-y btn btn-light btn-lg rounded-circle shadow me-3"
          onClick={nextSlide}
          aria-label="Next space"
        >
          <i className="bi bi-chevron-right"></i>
        </button>

        {/* Slide Indicators */}
        <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
          <div className="d-flex gap-2">
            {workspace.map((_, index) => (
              <button
                key={index}
                className={`btn btn-sm rounded-circle ${
                  index === currentIndex ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                style={{ width: '12px', height: '12px' }}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="text-center mt-4">
        <Link href="/workspace" className="btn btn-outline-primary btn-lg">
          View All Spaces
          <i className="bi bi-arrow-right ms-2"></i>
        </Link>
      </div>
    </section>
  );
};

export default SpaceSlider;
