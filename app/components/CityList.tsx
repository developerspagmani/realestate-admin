'use client';

import { useState } from 'react';
import Link from 'next/link';

interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  image: string;
  spaceCount: number;
  featured: boolean;
}

const CityList = () => {
  const [cities] = useState<City[]>([
    {
      id: 'new-york',
      name: 'New York',
      state: 'NY',
      country: 'USA',
      image: '/cities/new-york.jpg',
      spaceCount: 125,
      featured: true
    },
    {
      id: 'san-francisco',
      name: 'San Francisco',
      state: 'CA',
      country: 'USA',
      image: '/cities/san-francisco.jpg',
      spaceCount: 98,
      featured: true
    },
    {
      id: 'austin',
      name: 'Austin',
      state: 'TX',
      country: 'USA',
      image: '/cities/austin.jpg',
      spaceCount: 76,
      featured: true
    },
    {
      id: 'chicago',
      name: 'Chicago',
      state: 'IL',
      country: 'USA',
      image: '/cities/chicago.jpg',
      spaceCount: 89,
      featured: false
    },
    {
      id: 'seattle',
      name: 'Seattle',
      state: 'WA',
      country: 'USA',
      image: '/cities/seattle.jpg',
      spaceCount: 112,
      featured: false
    },
    {
      id: 'boston',
      name: 'Boston',
      state: 'MA',
      country: 'USA',
      image: '/cities/boston.jpg',
      spaceCount: 67,
      featured: false
    }
  ]);

  const featuredCities = cities.filter(city => city.featured);
  const allCities = cities;

  return (
    <section className="py-5 bg-white">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold mb-3">Popular Cities</h2>
          <p className="lead text-muted">Find coworking workspace in major cities</p>
        </div>

        {/* Featured Cities */}
        <div className="row g-4 mb-5">
          {featuredCities.map((city) => (
            <div key={city.id} className="col-lg-4 col-md-6">
              <Link 
                href={`/workspace?city=${city.id}`}
                className="text-decoration-none"
              >
                <div className="card h-100 border-0 shadow hover-lift transition-all duration-300 overflow-hidden">
                  <div className="position-relative" style={{ height: '200px' }}>
                    <div 
                      className="w-100 h-100 bg-gradient"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${city.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-25 d-flex align-items-center justify-content-center">
                      <div className="text-center text-white">
                        <h3 className="h4 fw-bold mb-1">{city.name}</h3>
                        <p className="small mb-0">{city.state}, {city.country}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        <i className="bi bi-building me-1"></i>
                        {city.spaceCount} workspace
                      </span>
                      <span className="text-primary">
                        <i className="bi bi-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* All Cities Grid */}
        <div className="text-center mb-4">
          <h4 className="fw-bold mb-3">More Cities</h4>
        </div>
        <div className="row g-3 mb-4">
          {allCities.map((city) => (
            <div key={city.id} className="col-lg-2 col-md-4 col-sm-6">
              <Link 
                href={`/workspace?city=${city.id}`}
                className="text-decoration-none"
              >
                <div className="card border-0 shadow-sm hover-lift transition-all duration-300">
                  <div className="card-body text-center p-3">
                    <div 
                      className="rounded-circle mx-auto mb-2"
                      style={{
                        width: '60px',
                        height: '60px',
                        backgroundImage: `url(${city.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <h6 className="fw-bold mb-1">{city.name}</h6>
                    <p className="text-muted small mb-0">{city.spaceCount} workspace</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/workspace" className="btn btn-outline-primary">
            View All Cities
            <i className="bi bi-geo-alt ms-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CityList;
