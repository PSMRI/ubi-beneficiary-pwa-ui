/**
 * API Types and Interfaces
 * 
 * Centralized type definitions for API requests and responses
 */

// =============================================
// Common API Response Types
// =============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
	data: T;
	message?: string;
	success?: boolean;
	status?: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages?: number;
}

/**
 * Standard API error structure
 */
export interface ApiError {
	message: string;
	status?: number;
	response?: any;
	isNetworkError?: boolean;
	cause?: any;
}

// =============================================
// Authentication Types
// =============================================

export interface LoginRequest {
	phoneNumber?: string;
	password?: string;
	username?: string;
}

export interface LoginResponse {
	access_token: string;
	refresh_token: string;
	user: UserData;
}

export interface UserData {
	id: string | number;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	userName?: string;
	email?: string;
	[key: string]: any;
}

export interface RegisterRequest {
	firstName?: string;
	lastName?: string;
	phoneNumber: string;
	password?: string;
}

export interface OTPRequest {
	phoneNumber: string;
}

export interface OTPVerifyRequest {
	phoneNumber: string;
	otp: number;
	token: string;
}

export interface UpdatePasswordRequest {
	username: string;
	oldPassword: string;
	newPassword: string;
}

// =============================================
// Document Types
// =============================================

export interface DocumentUploadRequest {
	file: File;
	docType: string;
	docSubType: string;
	docName: string;
	importedFrom?: string;
	issuer?: string;
}

export interface DocumentData {
	id: string | number;
	docType: string;
	docSubType: string;
	docName: string;
	uploadedAt: string;
	status?: string;
	[key: string]: any;
}

// =============================================
// Application Types
// =============================================

export interface ApplicationFilters {
	user_id?: string | number;
	benefit_id?: string;
	status?: string;
	[key: string]: any;
}

export interface ApplicationListRequest {
	filters?: ApplicationFilters;
	search?: string;
	page?: number;
	limit?: number;
}

export interface ApplicationData {
	id: string | number;
	user_id: string | number;
	benefit_id: string;
	status: string;
	application_data: any;
	created_at?: string;
	updated_at?: string;
	[key: string]: any;
}

// =============================================
// Benefit Types
// =============================================

export interface BenefitSearchFilters {
	annualIncome?: string;
	caste?: string;
	gender?: string;
	[key: string]: any;
}

export interface BenefitSearchRequest {
	filters?: BenefitSearchFilters;
	search: string;
	page: number;
	limit: number;
	strictCheck?: boolean;
}

export interface BenefitData {
	id: string;
	name: string;
	description?: string;
	provider_id?: string;
	bpp_id?: string;
	[key: string]: any;
}

// =============================================
// Context Types (for BECKN protocol)
// =============================================

export interface BECKNContext {
	domain?: string;
	action?: string;
	timestamp?: string;
	ttl?: string;
	version?: string;
	bap_id?: string;
	bap_uri?: string;
	bpp_id?: string;
	bpp_uri?: string;
	transaction_id?: string;
	message_id?: string;
	location?: any;
	[key: string]: any;
}

// =============================================
// Admin/Config Types
// =============================================

export interface FieldMapping {
	name?: string;
	label?: string;
	documentSubType?: string;
	docType?: string;
	fieldName?: string;
	documentMappings?: DocumentFieldMapping[];
	fieldValueNormalizationMapping?: FieldValueNormalization;
}

export interface DocumentFieldMapping {
	document: string;
	documentField: string;
}

export interface FieldValueNormalization {
	rawValue: string;
	transformedValue: string;
}

export interface FieldData {
	fieldId: string;
	label: string;
	name: string;
	type: string;
	isRequired: boolean;
	isEditable?: boolean;
	isEncrypted?: boolean;
	ordering?: number;
	fieldParams?: {
		options?: FieldOption[];
	};
}

export interface FieldOption {
	id: string;
	name: string;
	value: string;
}

// =============================================
// Utility Types
// =============================================

/**
 * Makes all properties of T optional recursively
 */
export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * Makes specific keys K of T required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;



