# VC Form Implementation Guide

## Status: **CURRENTLY DISABLED**

The VC form functionality is currently commented out because the backend (`http://localhost:3000/users/upload-document`) does not handle VC creation logic yet.

---

## When to Enable

Enable the VC form when:

1. Backend starts sending `issue_vc: "yes"` in the upload-document API response
2. Backend provides `mapped_data` with pre-filled form values
3. Frontend needs to collect additional information for VC creation

---

## Expected API Response Format

When the backend is ready to support VC form creation, the `/users/upload-document` API should return:

### For documents requiring VC creation (`issue_vc: "yes"`):

```json
{
	"statusCode": 200,
	"message": "Document uploaded successfully",
	"data": {
		"doc_type": "disability",
		"doc_subtype": "udid",
		"doc_name": "UDID Certificate",
		"imported_from": "Camera Capture",
		"issue_vc": "yes",
		"mapped_data": {
			"name": "John Doe",
			"gender": "Male",
			"aadhaar_number": "123456789012",
			"unique_disability_id_(udid)": "UDID123456",
			"disability_type": "Physical",
			"birthyear": 1990,
			"percentage_of_disability": 40,
			"issuedby": "Medical Board",
			"issuerauthority": "State Government",
			"issueddate": "2024-01-15T00:00:00.000Z",
			"recordvalidupto": "2029-01-15T00:00:00.000Z"
		}
	}
}
```

### For documents NOT requiring VC creation (`issue_vc: "no"`):

```json
{
	"statusCode": 200,
	"message": "Document uploaded successfully",
	"data": {
		"doc_id": "doc_123456",
		"user_id": "user_789",
		"doc_type": "identity",
		"doc_subtype": "aadhaar",
		"doc_name": "Aadhaar Card",
		"uploaded_at": "2024-11-13T10:30:00.000Z",
		"issue_vc": "no"
	}
}
```

---

## How to Enable

### Step 1: Uncomment VCFormWrapper Component

File: `src/components/forms/VCFormWrapper.tsx`

Look for comments marked with:

```typescript
// NOSONAR - VC Form disabled: Backend does not handle VC creation yet
```

Uncomment the entire form rendering logic.

### Step 2: Uncomment DocumentScanner Form Logic

File: `src/components/DocumentScanner.tsx`

Find the `handleUploadSuccess` function and uncomment the section that checks for `issue_vc === 'yes'` and shows the form.

### Step 3: Uncomment DocumentUploadWithForm Logic

File: `src/components/document/DocumentUploadWithForm.tsx`

Uncomment the form step logic that transitions from upload to form based on `issue_vc` flag.

### Step 4: Verify VC Configuration

Ensure your backend has VC configuration set up for the document types that require VC creation:

- Document type and subtype mapping
- Field definitions and validation rules
- UI schema for form rendering

---

## Key Components

### 1. VCFormWrapper

- Fetches VC configuration from backend
- Displays the form with pre-filled data from `mapped_data`
- Handles form submission
- Shows success/error messages

### 2. VCForm

- Renders the dynamic form based on configuration
- Uses RJSF (React JSON Schema Form) with Chakra UI theme
- Validates form data before submission

### 3. useVCForm Hook

- Manages form submission state
- Calls VCService to handle form data
- Currently just logs data to console (backend will handle actual VC creation)

### 4. useVCConfiguration Hook

- Fetches VC field configuration from `/admin/config/vcConfiguration`
- Transforms API response to RJSF-compatible schema
- Filters out metadata fields (like originalvc)

---

## Current Implementation Details

When enabled, the flow will be:

1. User uploads document → `POST /users/upload-document`
2. Backend returns `issue_vc: "yes"` with `mapped_data`
3. Frontend shows VCFormWrapper with pre-filled form
4. User fills/edits form fields
5. User clicks "Create Verifiable Credential"
6. Frontend calls VCService (currently just console logs)
7. Backend handles actual VC creation (future implementation)

---

## Configuration Required

### VC Configuration API

Endpoint: `GET /admin/config/vcConfiguration`

Should return configuration for each document type:

```json
{
	"statusCode": 200,
	"message": "Success",
	"data": {
		"value": [
			{
				"name": "udid_certificate",
				"label": "UDID Certificate",
				"docType": "disability",
				"documentSubType": "udid",
				"issueVC": "yes",
				"vcFields": "{\"name\":{\"type\":\"string\"},\"gender\":{\"type\":\"string\"},...}"
			}
		]
	}
}
```

---

## Testing Checklist

Before enabling in production:

- [ ] Backend returns correct `issue_vc` flag
- [ ] `mapped_data` contains valid pre-filled values
- [ ] VC configuration API is accessible
- [ ] Form renders correctly with all fields
- [ ] Form validation works as expected
- [ ] Backend handles VC creation when form is submitted
- [ ] Error handling works for failed submissions
- [ ] Success flow redirects properly after VC creation

---

## Notes

- The form uses dynamic schema generation based on backend configuration
- File upload fields (like originalvc) are automatically filtered out from the form
- Date fields are properly formatted for display and submission
- The uploaded document file is automatically attached during submission
- Backend should handle the actual VC creation and wallet integration

---

## Questions or Issues?

Contact the backend team to confirm:

1. When will `/users/upload-document` start supporting VC creation?
2. What is the expected timeline for backend VC logic implementation?
3. Are there any changes needed to the current frontend implementation?
