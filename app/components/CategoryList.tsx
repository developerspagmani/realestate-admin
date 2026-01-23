'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  color: string;
}

const CategoryList = () => {
  const [categories] = useState<Category[]>([
    {
      id: 'desk',
      name: 'Hot Desks',
      icon: 'bi-laptop',
      description: 'Flexible seats for individuals',
      count: 150,
      color: 'primary'
    },
    {
      id: 'office',
      name: 'Private Offices',
      icon: 'bi-building',
      description: 'Dedicated workspace for teams',
      count: 45,
      color: 'success'
    },
    {
      id: 'meeting',
      name: 'Meeting Rooms',
      icon: 'bi-people',
      description: 'Professional meeting workspace',
      count: 80,
      color: 'info'
    },
    {
      id: 'event',
      name: 'Event Spaces',
      icon: 'bi-calendar-event',
      description: 'Large workspace for events and workshops',
      count: 25,
      color: 'warning'
    },
    {
      id: 'virtual',
      name: 'Virtual Offices',
      icon: 'bi-globe',
      description: 'Remote seats solutions',
      count: 60,
      color: 'secondary'
    }
  ]);

  return (
    <section className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold mb-3">Browse by Category</h2>
          <p className="lead text-muted">Find the perfect seats type for your needs</p>
        </div>

        <div className="row g-4">
          {categories.map((category) => (
            <div key={category.id} className="col-lg-2 col-md-4 col-sm-6">
              <Link 
                href={`/workspace?category=${category.id}`}
                className="text-decoration-none"
              >
                <div className="card h-100 border-0 shadow-sm hover-lift transition-all duration-300">
                  <div className="card-body text-center p-4">
                    <div className={`text-${category.color} mb-3`}>
                      <i 
                        className={`bi ${category.icon}`}
                        style={{ fontSize: '2.5rem' }}
                      ></i>
                    </div>
                    <h4 className="card-title h5 fw-bold mb-2">{category.name}</h4>
                    <p className="card-text text-muted small mb-3">{category.description}</p>
                    <div className="d-flex align-items-center justify-content-center">
                      <span className={`badge bg-${category.color} bg-opacity-10 text-${category.color}`}>
                        {category.count} workspace
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <Link href="/workspace" className="btn btn-outline-primary">
            Browse All Categories
            <i className="bi bi-grid ms-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryList;
