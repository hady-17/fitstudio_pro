import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCurrentUserData, linkClientProfile } from './auth.service.js';

// This controller function handles the GET /me endpoint, which returns the authenticated user's 
// profile and studio memberships.
// It uses the asyncHandler utility to catch any errors that occur during the asynchronous operations.
// If the user is not authenticated (i.e., req.user is not set), it throws a 401 Unauthenticated error.
// Otherwise, it retrieves the user's profile and memberships using the getCurrentUserData service function
// and responds with a JSON object containing the data.
export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthenticated');
  }

  const data = await getCurrentUserData(req.user.id);

  res.json({
    success: true,
    data,
  });
});
export const linkClientProfileController = asyncHandler(
  async (req, res) => {
    const result = await linkClientProfile(req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);