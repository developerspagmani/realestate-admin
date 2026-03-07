'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['link', 'clean'],
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'indent',
        'link',
    ];


    return (
        <div className={`rich-text-wrapper ${className || ''}`}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white rounded-3 overflow-hidden"
            />
            <style jsx global>{`
                .rich-text-wrapper .ql-toolbar {
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    border-color: #f0f0f0;
                    background: #f8f9fa;
                }
                .rich-text-wrapper .ql-container {
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    border-color: #f0f0f0;
                    min-height: 200px;
                    font-size: 0.95rem;
                }
                .rich-text-wrapper .ql-editor {
                    min-height: 200px;
                    color: #212529 !important; /* Force black text */
                }
                .rich-text-wrapper .ql-editor p,
                .rich-text-wrapper .ql-editor li,
                .rich-text-wrapper .ql-editor span {
                    color: #212529 !important;
                }
                .rich-text-wrapper .ql-editor.ql-blank::before {
                    font-style: normal;
                    color: #adb5bd;
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
