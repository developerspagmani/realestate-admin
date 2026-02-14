'use client';

interface Page {
    id: string;
    title: string;
    slug: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    featureImage?: any;
}

interface CMSListProps {
    pages: Page[];
    onEdit: (page: Page) => void;
    onDelete: (id: string) => void;
}

export default function CMSList({ pages, onEdit, onDelete }: CMSListProps) {
    return (
        <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3 text-muted small text-uppercase fw-bold">Page</th>
                                <th className="py-3 text-muted small text-uppercase fw-bold">URL Slug</th>
                                <th className="py-3 text-muted small text-uppercase fw-bold text-center">Status</th>
                                <th className="py-3 text-muted small text-uppercase fw-bold">Last Updated</th>
                                <th className="px-4 py-3 text-muted small text-uppercase fw-bold text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map((page) => (
                                <tr key={page.id}>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="rounded-3 bg-light overflow-hidden me-3 d-flex align-items-center justify-content-center"
                                                style={{ width: '48px', height: '48px' }}
                                            >
                                                {page.featureImage ? (
                                                    <img
                                                        src={page.featureImage.url}
                                                        className="w-100 h-100 object-fit-cover"
                                                        alt={page.title}
                                                    />
                                                ) : (
                                                    <i className="bi bi-file-earmark-text text-muted"></i>
                                                )}
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0">{page.title}</h6>
                                                <small className="text-muted">ID: {page.id.substring(0, 8)}...</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-muted">
                                        <code className="small text-lowercase">/p/{page.slug}</code>
                                        <a
                                            href={`/p/${page.slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-link btn-sm p-0 ms-2 text-decoration-none"
                                        >
                                            <i className="bi bi-box-arrow-up-right"></i>
                                        </a>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`badge rounded-pill px-3 py-2 ${page.status === 2 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                            {page.status === 2 ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-muted small">
                                        {new Date(page.updatedAt).toLocaleDateString()}
                                        <div className="extra-small opacity-75">{new Date(page.updatedAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="btn-group">
                                            <button
                                                className="btn btn-light btn-sm rounded-3 me-2"
                                                title="Edit Page"
                                                onClick={() => onEdit(page)}
                                            >
                                                <i className="bi bi-pencil-square text-primary"></i>
                                            </button>
                                            <button
                                                className="btn btn-light btn-sm rounded-3"
                                                title="Delete Page"
                                                onClick={() => onDelete(page.id)}
                                            >
                                                <i className="bi bi-trash text-danger"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .extra-small { font-size: 10px; }
                .table-hover tbody tr:hover { background-color: rgba(13, 110, 253, 0.02); }
                .badge { font-weight: 600; font-size: 11px; }
            `}</style>
        </div>
    );
}
