import {
    FiDownload, FiFileText, FiBook, FiClipboard,
    FiBookOpen, FiEdit3, FiLayout, FiFile
} from 'react-icons/fi';

const templates = [
    {
        name: 'Internship Proposal Format',
        file: '1 Internship Proposal Format1.docx',
        description: 'Template for writing your internship proposal. Must be submitted before internship starts.',
        Icon: FiFileText,
        category: 'Registration'
    },
    {
        name: 'Student Undertaking Form',
        file: '2 Student Internship Undetaking 2025-26.docx',
        description: 'Pledge form to be signed by the student and parent/guardian.',
        Icon: FiClipboard,
        category: 'Registration'
    },
    {
        name: 'Daily Logbook',
        file: '3 Internship LogBook.docx',
        description: 'Daily log of activities performed during the internship. Maintain throughout the internship.',
        Icon: FiBookOpen,
        category: 'During Internship'
    },
    {
        name: 'Weekly Report Format',
        file: '4 Internship_Weekly_Report_Format.docx',
        description: 'Standard template for weekly progress reporting. Submit every Saturday. Worth 20 marks.',
        Icon: FiEdit3,
        category: 'During Internship'
    },
    {
        name: 'Final Report Guidelines',
        file: '5 Guidelines for project Report 2025-26.doc',
        description: 'Guidelines for writing the final internship report. Includes structure, formatting, citation rules.',
        Icon: FiLayout,
        category: 'Final Submission'
    },
    {
        name: 'Presentation Template',
        file: 'InternshipReport_CourseName_AddPRN_AddName.pptx',
        description: 'Template for final internship presentation. Customize with your details for the viva.',
        Icon: FiFile,
        category: 'Final Submission'
    },
    {
        name: 'MCA Internship Handbook',
        file: 'MCA_Internship_Handbook.docx',
        description: 'Complete handbook with rules, responsibilities, assessment criteria, rubrics & timelines.',
        Icon: FiBook,
        category: 'Reference'
    }
];

export default function Downloads() {
    const categories = [...new Set(templates.map(t => t.category))];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Downloads & Resources</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Download all required templates and reference documents for your internship
                </p>
            </div>

            {/* Important Note */}
            <div className="alert alert-info" style={{ marginBottom: 24 }}>
                <FiBook />
                <span>
                    All templates follow the MIT VPU School of Computing internship format for 2025-26.
                    Use the correct file naming convention: <strong>RollNo_LastName_DocType_Internship</strong>
                </span>
            </div>

            {categories.map(category => (
                <div key={category} className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h2>{category}</h2>
                    </div>
                    <div className="downloads-grid">
                        {templates.filter(t => t.category === category).map((template, i) => {
                            const TemplateIcon = template.Icon;
                            return (
                                <div key={i} className="download-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20, gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                        <div className="dl-icon"><TemplateIcon size={20} /></div>
                                        <div className="dl-info" style={{ flex: 1 }}>
                                            <h4>{template.name}</h4>
                                            <span>{template.file.split('.').pop().toUpperCase()} file</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                        {template.description}
                                    </p>
                                    <button className="btn btn-sm btn-outline" style={{ marginTop: 'auto' }} onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `/templates/${template.file}`;
                                        link.download = template.file;
                                        link.click();
                                    }}>
                                        <FiDownload /> Download
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
