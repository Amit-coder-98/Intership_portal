import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiUpload, FiFile, FiCheck, FiClock, FiX, FiDownload,
    FiFileText, FiClipboard, FiEdit3, FiBookOpen, FiAward,
    FiLayout, FiStar, FiAlertTriangle, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const documentTypes = [
    { value: 'offer_letter', label: 'Offer Letter', Icon: FiFileText, required: true, stage: 'Before Internship' },
    { value: 'internship_proposal', label: 'Internship Proposal', Icon: FiClipboard, required: true, stage: 'Before Internship' },
    { value: 'undertaking', label: 'Undertaking Form', Icon: FiEdit3, required: true, stage: 'Before Internship' },
    { value: 'completion_certificate', label: 'Completion Certificate', Icon: FiAward, required: true, stage: 'End of Internship' },
    { value: 'final_report', label: 'Final Internship Report', Icon: FiLayout, required: true, stage: 'End of Internship' },
    { value: 'presentation_slides', label: 'Presentation Slides', Icon: FiFile, required: true, stage: 'End of Internship' },
    { value: 'mentor_evaluation', label: 'Mentor Evaluation Form', Icon: FiStar, required: true, stage: 'End of Internship' },
];

export default function Documents() {
    const { token } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await fetch('/api/student/documents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.data || []);
            }
        } catch { /* backend unreachable */ }
        setLoadingDocs(false);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="status-badge approved"><FiCheck /> Approved</span>;
            case 'rejected': return <span className="status-badge rejected"><FiX /> Rejected</span>;
            default: return <span className="status-badge pending"><FiClock /> Pending</span>;
        }
    };

    const getUploadedType = (type) => documents.find(d => d.documentType === type);

    const handleUpload = async () => {
        if (!selectedType || !selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('documentType', selectedType);
            formData.append('document', selectedFile);
            const res = await fetch('/api/student/upload-document', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments([...documents, data.data]);
                setShowUpload(false);
                setSelectedType('');
                setSelectedFile(null);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Upload failed');
            }
        } catch {
            toast.error('Cannot connect to server.');
        }
        setUploading(false);
    };

    const handleFileSelect = (file) => {
        const allowedTypes = [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg', 'image/png'
        ];
        if (file && allowedTypes.includes(file.type)) {
            setSelectedFile(file);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const stages = ['Before Internship', 'End of Internship'];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Document Management</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Upload and track all required internship documents
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                    <FiUpload /> Upload Document
                </button>
            </div>

            {/* Document Status by Stage */}
            {stages.map(stage => (
                <div key={stage} className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <h2>{stage}</h2>
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                        {documentTypes.filter(dt => dt.stage === stage).map(docType => {
                            const uploaded = getUploadedType(docType.value);
                            const DocIcon = docType.Icon;
                            return (
                                <div key={docType.value} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    padding: '14px 18px',
                                    background: uploaded ? 'var(--accent-light)' : 'transparent',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${uploaded ? 'var(--accent)' : 'var(--accent-light)'}`,
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                                        background: uploaded ? 'rgba(178,13,53,0.08)' : 'var(--accent-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: uploaded ? 'var(--primary)' : 'var(--text-muted)'
                                    }}>
                                        <DocIcon size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{docType.label}</span>
                                            {docType.required && (
                                                <span style={{
                                                    fontSize: '0.6rem', fontWeight: 700,
                                                    background: 'var(--danger-light)', color: 'var(--danger)',
                                                    padding: '2px 6px', borderRadius: 'var(--radius-full)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        {uploaded && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {uploaded.fileName} &bull; {formatFileSize(uploaded.fileSize)} &bull; {uploaded.uploadDate ? new Date(uploaded.uploadDate).toLocaleDateString() : '-'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        {uploaded ? (
                                            getStatusBadge(uploaded.status)
                                        ) : (
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => { setSelectedType(docType.value); setShowUpload(true); }}
                                            >
                                                <FiUpload /> Upload
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* File Naming Convention */}
            <div className="card">
                <div className="card-header">
                    <h2><FiInfo style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--info)' }} /> File Naming Convention</h2>
                </div>
                <div style={{
                    padding: '16px 20px', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7
                }}>
                    <p><strong>Format:</strong> RollNo_LastName_DocType_Internship</p>
                    <p>Example: <code style={{ background: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>MCA401_Agarwal_OfferLetter_Internship.pdf</code></p>
                    <p>Weekly report: <code style={{ background: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>MCA401_Agarwal_Week05_Report.pdf</code></p>
                    <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiAlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                        Mentor evaluations must be on <strong>company letterhead or signed PDF</strong>.
                    </p>
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && createPortal(
                <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload Document</h2>
                            <button className="modal-close" onClick={() => setShowUpload(false)}><FiX /></button>
                        </div>

                        <div className="form-group">
                            <label>Document Type</label>
                            <select className="form-control" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                                <option value="">Select document type...</option>
                                {documentTypes.map(dt => (
                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div
                            className="file-upload-area"
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ borderColor: dragOver ? 'var(--primary)' : undefined }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.pptx,.jpeg,.jpg,.png"
                                style={{ display: 'none' }}
                                onChange={(e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }}
                            />
                            <div className="upload-icon"><FiUpload /></div>
                            {selectedFile ? (
                                <p style={{ color: 'var(--success)', fontWeight: 600 }}>
                                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                                </p>
                            ) : (
                                <>
                                    <p><span>Click to browse</span> or drag & drop your file</p>
                                    <p style={{ fontSize: '0.75rem', marginTop: 8, color: 'var(--text-muted)' }}>
                                        PDF, DOC, DOCX, PPTX &bull; Max 10MB
                                    </p>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => { setShowUpload(false); setSelectedFile(null); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedType || !selectedFile || uploading}>
                                <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>,
            document.body)}
        </div>
    );
}
