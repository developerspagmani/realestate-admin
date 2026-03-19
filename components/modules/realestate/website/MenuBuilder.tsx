import React, { useState } from 'react';

interface MenuItem {
    id: string;
    label: string;
    type: 'page' | 'custom';
    pageSlug?: string;
    url?: string;
    target?: '_self' | '_blank';
}

interface MenuBuilderProps {
    label: string;
    items: MenuItem[];
    onChange: (items: MenuItem[]) => void;
    cmsPages: any[];
}

export default function MenuBuilder({ label, items = [], onChange, cmsPages }: MenuBuilderProps) {
    const [newItemType, setNewItemType] = useState<'page' | 'custom'>('page');
    const [selectedPageId, setSelectedPageId] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customUrl, setCustomUrl] = useState('');

    const handleAddItem = () => {
        const newItem: MenuItem = {
            id: Math.random().toString(36).substr(2, 9),
            label: '',
            type: newItemType,
            target: '_self'
        };

        if (newItemType === 'page') {
            const page = cmsPages.find(p => p.id === selectedPageId);
            if (!page) return;
            newItem.label = page.title;
            newItem.pageSlug = page.slug;
        } else {
            if (!customLabel || !customUrl) return;
            newItem.label = customLabel;
            newItem.url = customUrl;
        }

        onChange([...items, newItem]);

        // Reset form
        setSelectedPageId('');
        setCustomLabel('');
        setCustomUrl('');
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const newItems = [...items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        onChange(newItems);
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex === dropIndex) return;

        const newItems = [...items];
        const [movedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(dropIndex, 0, movedItem);
        onChange(newItems);
    };

    return (
        <div className="card border bg-light-subtle rounded-4 mb-4">
            <div className="card-header bg-white p-3 border-bottom">
                <h6 className="fw-bold mb-0 text-dark small text-uppercase">{label}</h6>
            </div>
            <div className="card-body p-3">
                {/* List of Items */}
                <div className="mb-4">
                    {items.length === 0 ? (
                        <div className="text-center p-4 border-2 border-dashed rounded-3 text-muted small">
                            No items in this menu yet. Add one below.
                        </div>
                    ) : (
                        <ul className="list-group list-group-flush rounded-3 border">
                            {items.map((item, index) => (
                                <li
                                    key={item.id}
                                    className="list-group-item d-flex align-items-center justify-content-between p-2 bg-white"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    style={{ cursor: 'move' }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-grip-vertical text-muted opacity-50"></i>
                                        <div>
                                            <div className="fw-bold small">{item.label}</div>
                                            <div className="extra-small text-muted">
                                                {item.type === 'page' ? `Page: /page/${item.pageSlug}` : `Link: ${item.url}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            type="button"
                                            className="btn btn-light border-0 text-muted"
                                            onClick={() => handleMoveItem(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <i className="bi bi-arrow-up-short"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-light border-0 text-muted"
                                            onClick={() => handleMoveItem(index, 'down')}
                                            disabled={index === items.length - 1}
                                        >
                                            <i className="bi bi-arrow-down-short"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-light border-0 text-danger"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Add New Item */}
                <div className="bg-white p-3 rounded-3 border shadow-sm">
                    <h6 className="fw-bold small mb-3 text-muted">Add Menu Item</h6>
                    <div className="row g-2 align-items-end">
                        <div className="col-12 mb-2">
                            <div className="btn-group w-100" role="group">
                                <div className="d-flex gap-3">
                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name={`type-${label}`}
                                        id={`page-${label}`}
                                        autoComplete="off"
                                        checked={newItemType === 'page'}
                                        onChange={() => setNewItemType('page')}
                                    />
                                    <label className="btn btn-primary btn-sm" htmlFor={`page-${label}`}>CMS Page</label>

                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name={`type-${label}`}
                                        id={`custom-${label}`}
                                        autoComplete="off"
                                        checked={newItemType === 'custom'}
                                        onChange={() => setNewItemType('custom')}
                                    />
                                    <label className="btn btn-outline-primary btn-sm" htmlFor={`custom-${label}`}>Custom Link</label>

                                </div>
                            </div>
                        </div>

                        {newItemType === 'page' ? (
                            <div className="col-md-9">
                                <label className="form-label extra-small fw-bold">Select Page</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedPageId}
                                    onChange={(e) => setSelectedPageId(e.target.value)}
                                >
                                    <option value="">-- Choose a Page --</option>
                                    {cmsPages.map(page => (
                                        <option key={page.id} value={page.id}>
                                            {page.title} (Status: {page.status === 2 ? 'Published' : 'Draft'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div className="col-md-4">
                                    <label className="form-label extra-small fw-bold">Label</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="e.g. Google"
                                        value={customLabel}
                                        onChange={(e) => setCustomLabel(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label extra-small fw-bold">URL</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="https://..."
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="col-md-3">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm w-100 fw-bold"
                                onClick={handleAddItem}
                                disabled={newItemType === 'page' ? !selectedPageId : (!customLabel || !customUrl)}
                            >
                                <i className="bi bi-plus-lg me-1"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .extra-small { font-size: 0.75rem; }
            `}</style>
        </div>
    );
}
