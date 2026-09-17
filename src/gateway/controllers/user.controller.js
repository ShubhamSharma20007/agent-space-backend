import ApiResponse from "../shared/apis/ApiResponse.js"


export const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.body?.user || req.user;    
    if (!user) {
      return res.status(404).json(ApiResponse.error("User not found", 404));    
    }

    return res.status(200).json(ApiResponse.success("User retrieved successfully", user));
  } catch (error) {
    next(error);
  } 
}