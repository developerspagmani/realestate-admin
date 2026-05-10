import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '@/app/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const BACKEND_URL = process.env.BACKEND_URL;

async function getPageData(slug: string) {
    if (!slug) return null;
    try {
        const url = `${BACKEND_URL}/cms/public/${slug}`;
        const res = await fetch(url, {
            next: { revalidate: 60 }
        });
        if (!res.ok) {
            console.error(`Backend returned ${res.status} for ${url}`);
            return null;
        }
        return res.json();
    } catch (err) {
        console.error('Error fetching page data:', err);
        return null;
    }
}

interface PageProps {
    params: Promise<{
        domain: string;
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const response = await getPageData(resolvedParams.slug);

        if (response?.success && response?.data) {
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

export default async function CMSStandalonePage({ params }: PageProps) {
    const resolvedParams = await params;
    let page = null;
    const response = await getPageData(resolvedParams.slug);

    if (response?.success && response?.data) {
        page = response.data;
    }

    if (!page) {
        notFound();
    }

    return (
        <div className="bg-white min-vh-100">
            {/* Header is handled by StandaloneLayout/Provider usually, but we can add specific page content wrappers */}
            <main className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {page.featureImage && (
                            <div className="mb-5 rounded-4 overflow-hidden shadow-sm position-relative" style={{ height: '400px' }}>
                                <img
                                    src={page.featureImage.url}
                                    className="w-100 h-100 object-fit-cover"
                                    alt={page.title}
                                />
                                <div className="position-absolute bottom-0 start-0 begin-0 w-100 p-4 bg-gradient-to-t from-black/70 to-transparent">
                                    {/* Optional overlay text if needed */}
                                </div>
                            </div>
                        )}

                        <div className="prose max-w-none">
                            <h1 className="fw-bold display-4 mb-4 text-dark">{page.title}</h1>

                            {!page.featureImage && <hr className="my-5 opacity-10" />}

                            <div
                                className="page-content lead text-secondary"
                                dangerouslySetInnerHTML={{ __html: page.content || '' }}
                            />
                        </div>

                        <div className="mt-5 pt-4 border-top text-muted small">
                            Last updated on {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .page-content p { margin-bottom: 1.5rem; line-height: 1.8; color: #4a5568; }
                .page-content h2 { margin-top: 2.5rem; margin-bottom: 1.5rem; font-weight: 700; color: #1a202c; font-size: 2rem; }
                .page-content h3 { margin-top: 2rem; margin-bottom: 1rem; font-weight: 600; color: #2d3748; font-size: 1.5rem; }
                .page-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 2rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                .page-content ul, .page-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; color: #4a5568; }
                .page-content li { margin-bottom: 0.75rem; }
                .page-content a { color: #3182ce; text-decoration: none; border-bottom: 1px solid transparent; transition: all 0.2s; }
                .page-content a:hover { border-bottom-color: #3182ce; }
                .page-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1.5rem; font-style: italic; color: #718096; margin: 2rem 0; }
            `}} />
        </div>
    );
}
