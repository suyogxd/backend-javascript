import {v2 as cloudinary} from 'cloudinary'
import fs from "fs" // filesystem


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});
   

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file uploaded successfully
        //console.log("file uploaded successfully",response.url)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove locally saved temp file as upload operation got failed.
        return null
    }
}

export {uploadOnCloudinary}