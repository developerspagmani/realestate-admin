export default function Footer() {
    return (
        <footer className="footer py-3 border-top bg-white opacity-75">
            <div className="container-fluid">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-muted">
                    <div>
                        <span className="fw-medium">© {new Date().getFullYear()}</span>
                        <span className="mx-1">•</span>
                        <span className="fw-bold text-dark">Intelligent Real Estate Marketing Platform</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <a href="/legal/privacy" className="text-decoration-none text-muted hvr-text-primary">Privacy</a>
                        <a href="/legal/terms" className="text-decoration-none text-muted hvr-text-primary">Terms</a>
                        <a href="/legal/data-deletion" className="text-decoration-none text-muted hvr-text-primary">Data Deletion</a>
                        <span className="mx-1">|</span>
                        <span>
                            Developed by
                            <a href="https://www.virpanix.com" target="_blank" rel="noopener noreferrer" className="text-primary fw-bold text-decoration-none ms-1 hvr-underline-from-left">
                                Virpanix LLP
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
