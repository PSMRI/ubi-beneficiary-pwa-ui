export interface VCField {
	type: 'string' | 'number' | 'boolean' | 'object' | 'array';
	label: string;
	required: boolean;
	format?: string;
	validation?: {
		pattern?: string;
		minLength?: number;
		maxLength?: number;
		minimum?: number;
		maximum?: number;
	};
}

export interface VCConfiguration {
	id: string;
	name: string;
	label: string;
	doc_type: string;
	doc_subtype: string;
	issue_vc: boolean;
	vc_fields: Record<string, VCField>;
	ui_schema?: Record<string, any>;
}

export interface VCFormData {
	doc_id?: string; // Optional - not present in issue_vc: "yes" response
	doc_type?: string; // Required when doc_id is not present
	doc_subtype?: string; // Required when doc_id is not present
	form_data: Record<string, any>;
}
