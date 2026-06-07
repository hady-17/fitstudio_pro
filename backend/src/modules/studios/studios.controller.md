# Studios Controller Documentation

This file defines the controller functions for handling HTTP requests related to studios in the FitStudio Pro backend. Each controller is wrapped with `asyncHandler` for error handling and expects an authenticated user (`req.user`).

## Exports


### 1. `createStudioController`
- **POST /studios**
- Creates a new studio for the authenticated user.
- **Example:**
	- **URL:** `/studios`
	- **Headers:**
		- `Authorization: Bearer <token>`
		- `Content-Type: application/json`
	- **Body:**
		```json
		{
			"name": "My Studio",
			"location": "123 Main St",
			"description": "A great place to train."
		}
		```
- **Response:** `{ success: true, data: { studio } }`


### 2. `getMyStudiosController`
- **GET /studios/mine**
- Retrieves all studios owned by the authenticated user.
- **Example:**
	- **URL:** `/studios/mine`
	- **Headers:**
		- `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: { studios } }`


### 3. `getStudioByIdController`
- **GET /studios/:studioId**
- Retrieves a specific studio by its ID for the authenticated user.
- **Example:**
	- **URL:** `/studios/abc123`
	- **Headers:**
		- `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: { studio } }`


### 4. `updateStudioController`
- **PUT /studios/:studioId**
- Updates a studio's details.
- **Example:**
	- **URL:** `/studios/abc123`
	- **Headers:**
		- `Authorization: Bearer <token>`
		- `Content-Type: application/json`
	- **Body:**
		```json
		{
			"name": "Updated Studio Name",
			"location": "456 New Ave"
		}
		```
- **Response:** `{ success: true, data: { studio } }`


### 5. `getStudioMembersController`
- **GET /studios/:studioId/members**
- Retrieves all members of a specific studio.
- **Example:**
	- **URL:** `/studios/abc123/members`
	- **Headers:**
		- `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: { members } }`


### 6. `addTrainerController`
- **POST /studios/:studioId/trainers**
- Adds a trainer to a studio.
- **Example:**
	- **URL:** `/studios/abc123/trainers`
	- **Headers:**
		- `Authorization: Bearer <token>`
		- `Content-Type: application/json`
	- **Body:**
		```json
		{
			"trainerId": "trainer456"
		}
		```
- **Response:** `{ success: true, data: { member } }`


### 7. `deleteStudioController`
- **DELETE /studios/:studioId**
- Deletes a studio owned by the authenticated user.
- **Example:**
	- **URL:** `/studios/abc123`
	- **Headers:**
		- `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: result }`


### 8. `removeStudioMemberController`
- **DELETE /studios/:studioId/members/:memberId**
- Removes a member from a studio.
- **Example:**
	- **URL:** `/studios/abc123/members/member789`
	- **Headers:**
		- `Authorization: Bearer <token>`
- **Response:** `{ success: true, data: result }`

## Notes
- All controllers require authentication (`req.user`).
- All responses are JSON with a `success` flag and a `data` object.
- Business logic is delegated to the corresponding service functions in `studios.service.ts`.
