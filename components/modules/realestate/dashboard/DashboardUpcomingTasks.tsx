import React from 'react';
import { Task } from '@/app/services/types';

interface DashboardUpcomingTasksProps {
    tasks: Task[];
    loading: boolean;
}

export default function DashboardUpcomingTasks({ tasks, loading }: DashboardUpcomingTasksProps) {
    return (
        <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Upcoming Tasks</h5>
                <button className="btn btn-sm btn-light rounded-pill px-3">View All</button>
            </div>
            <div className="card-body p-4 pt-0">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="d-flex align-items-start mb-4">
                            <div className="skeleton rounded-circle me-3" style={{ width: '20px', height: '20px' }}></div>
                            <div className="flex-grow-1">
                                <div className="skeleton h-1rem w-75 mb-1"></div>
                                <div className="skeleton h-1rem w-50"></div>
                            </div>
                        </div>
                    ))
                ) : tasks.length === 0 ? (
                    <div className="text-center py-5 text-muted small">No upcoming tasks</div>
                ) : (
                    <div className="task-list">
                        {tasks.map((task) => (
                            <div key={task.id} className="d-flex align-items-start mb-4 position-relative task-item">
                                <div className={`flex-shrink-0 mt-1 me-3`}>
                                    <div className={`rounded-circle border-2 p-1 d-flex align-items-center justify-content-center ${task.priority === 3 ? 'border-danger' :
                                            task.priority === 2 ? 'border-warning' : 'border-info'
                                        }`} style={{ width: '22px', height: '22px' }}>
                                        <div className={`rounded-circle ${task.priority === 3 ? 'bg-danger' :
                                                task.priority === 2 ? 'bg-warning' : 'bg-info'
                                            }`} style={{ width: '10px', height: '10px' }}></div>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <h6 className="mb-0 fw-bold small">{task.title}</h6>
                                        <span className={`extra-small ${task.dueDate && new Date(task.dueDate) < new Date() ? 'text-danger fw-bold' : 'text-muted'
                                            }`}>
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center mt-1">
                                        <span className="extra-small text-muted me-2">
                                            <i className="bi bi-person me-1"></i>
                                            {task.agent?.user?.name || 'Unassigned'}
                                        </span>
                                        {task.lead && (
                                            <span className="extra-small text-info">
                                                <i className="bi bi-link-45deg me-1"></i>
                                                {task.lead.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
                .extra-small { font-size: 11px; }
                .task-item:not(:last-child):after {
                    content: '';
                    position: absolute;
                    left: 10px;
                    top: 25px;
                    bottom: -20px;
                    width: 1px;
                    background-color: #f0f0f0;
                    z-index: 0;
                }
                .skeleton {
                    background: rgba(0,0,0,0.05);
                    border-radius: 4px;
                    animation: pulse 1.5s infinite ease-in-out;
                }
                .h-1rem { height: 1rem; }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
