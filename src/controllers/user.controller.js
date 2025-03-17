import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
    // 1. get user details from frontend
    // 2. validation - not empty
    // 3. check if user already exists: username, email unique
    // 4. check for images , check for avatars -- required xa so
    // 5. upload images to cloudinary, check avatar (validate)
    // 6. create user object - create entry in database
    // 7. remove password and refresh token field from response
    // 8. check for user creation
    // 9. return response

    // 1. //
    const {username, fullname, email, password} = req.body
    // console.log("email: ",email)

    // 2. //

    // if (fullname === "") {
    //     throw new ApiError(400, "fullname is required")
    // } // sabai ko lagi ek ek garera yei code le check garnu parxa.

    if ( [fullname, email, username, password].some((field) => 
        field?.trim() === "") 
    ){
        throw new ApiError(400, "all fields are required")
    } // ekaichoti sabiko lagi bhayo.

    // 3. //

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);

    // 4. //
    // req.files multer le dinxa so paila multer configured hunuparxa
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    // mathiko coverImageLocalPath wala code le -- if postman ma coverImage field unselect garera data send garexi cannot read properties of undefined bhanera aauthyo so we wrote below code to solve this bug.

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }

    // 5. //
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar is required")
    }

    // 6. //
    const userObj = await User.create({ // because we are working with database 
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // because it is not required field.
        email,
        password,
        username: username.toLowerCase()
    })


    // 7. //
    const createdUser = await User.findById(userObj._id).select( // by default all are selected
        "-password -refreshToken"
    ) // to check if userObj is created or not

    // 8. //
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user") 
    }

    // 9. //
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd successfully")
    )

})
    

export {registerUser}