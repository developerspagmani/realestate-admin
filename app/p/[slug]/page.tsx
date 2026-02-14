import { cmsService } from '@/app/services/cms';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '@/app/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface PageProps {
    params: {
        slug: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const response = await cmsService.getPublicPage(params.slug);
        if (response.success && response.data) {
            const page = response.data;
            return {
                title: page.seoTitle || page.title,
                description: page.seoDescription || '',
                keywords: page.seoKeywords || '',
                openGraph: {
                    title: page.seoTitle || page.title,
                    description: page.seoDescription || '',
                    images: page.featureImage ? [page.featureImage.url] : [],
                },
            };
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
    }
    return {
        title: 'Page Not Found',
    };
}

export default async function PublicPage({ params }: PageProps) {
    let page = null;
    try {
        const response = await cmsService.getPublicPage(params.slug);
        if (response.success && response.data) {
            page = response.data;
        }
    } catch (error) {
        console.error('Error fetching page:', error);
    }

    if (!page) {
        notFound();
    }

    return (
        <div className="bg-light min-vh-100">
            {/* Simple Header */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 mb-5">
                <div className="container">
                    <a className="navbar-brand fw-bold text-primary" href="/">
                        {page.tenant?.name || 'Real Estate'}
                    </a>
                </div>
            </nav>

            <main className="container pb-5">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {page.featureImage && (
                            <div className="mb-5 rounded-4 overflow-hidden shadow-sm" style={{ maxHeight: '450px' }}>
                                <img
                                    src={page.featureImage.url}
                                    className="w-100 h-100 object-fit-cover"
                                    alt={page.title}
                                    style={{ minHeight: '300px' }}
                                />
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-body p-4 p-md-5">
                                <h1 className="fw-bold display-4 mb-4">{page.title}</h1>
                                <hr className="my-4 opacity-10" />
                                <div
                                    className="page-content lead text-secondary"
                                    dangerouslySetInnerHTML={{ __html: page.content || '' }}
                                />
                            </div>
                            <div className="card-footer bg-light border-0 p-4 text-center text-muted small">
                                Published on {new Date(page.publishedAt || page.createdAt).toLocaleDateString()}
                                {page.tenant?.name && ` • © ${page.tenant.name}`}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-dark text-white py-5 mt-5">
                <div className="container text-center">
                    <p className="mb-0">© {new Date().getFullYear()} {page.tenant?.name || 'Real Estate'}. All rights reserved.</p>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .page-content p { margin-bottom: 1.5rem; line-height: 1.8; }
                .page-content h2 { margin-top: 2rem; margin-bottom: 1rem; font-weight: 700; color: #333; }
                .page-content h3 { margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600; color: #444; }
                .page-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem 0; }
                .page-content ul, .page-content ol { margin-bottom: 1.5rem; padding-left: 2rem; }
                .page-content li { margin-bottom: 0.5rem; }
            `}} />
        </div>
    );
}
