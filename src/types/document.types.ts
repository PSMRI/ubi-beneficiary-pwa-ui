export interface DocumentUploadResponse {
    doc_id?: string; // Optional - not present in issue_vc: "yes" response
    user_id?: string; // Optional - not present in issue_vc: "yes" response
    doc_type: string;
    doc_subtype: string;
    doc_name: string;
    imported_from: string;
    doc_datatype?: string; // Optional - not present in issue_vc: "yes" response
    uploaded_at?: string; // Optional - not present in issue_vc: "yes" response
    is_update?: boolean; // Optional - not present in issue_vc: "yes" response
    download_url?: string; // Optional - not present in issue_vc: "yes" response
    issue_vc: "yes" | "no";
    mapped_data?: Record<string, any>;
}

