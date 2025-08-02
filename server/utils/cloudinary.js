// Enhanced cloudinary.js with better error handling and configuration
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration with validation
const validateCloudinaryConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary configuration: ${missing.join(', ')}`);
  }
};

validateCloudinaryConfig();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Enhanced upload function with better error handling
const uploadPhotoOnCloudinary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      throw new Error('Invalid file path provided');
    }

    const uploadOptions = {
      resource_type: "auto",
      folder: options.folder || "User/photos",
      transformation: options.transformation || [],
      ...options
    };

    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);
    
    // Clean up local file
    fs.unlinkSync(localFilePath);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced delete function with better URL parsing
const deleteImageOnCloudinary = async (url) => {
  try {
    if (!url) return { success: false, error: 'No URL provided' };

    // Extract public ID from URL
    const publicIdMatch = url.match(/\/v\d+\/(.+)\.\w+$/);
    if (!publicIdMatch) {
      throw new Error('Invalid Cloudinary URL format');
    }

    const publicId = publicIdMatch[1];
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });

    return {
      success: result.result === 'ok',
      message: result.result
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export {
  uploadPhotoOnCloudinary,
  deleteImageOnCloudinary,
};