import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) // while using save(), mongoose models kicks in i.e. all the required field in User model (eg: password) but here we only changed one field (refreshToken) so we use {validateBeforeSave: false}

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens.")
    }
}

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


const loginUser = asyncHandler(async (req, res) => {
    // 1. get data from frontend i.e. req body -> data
    // 2. way to login user i.e. using username only or email only or any one.
    // 3. find the user ( username or email)
    // 4. check password
    // 5. access and refresh token
    // 6. send tokens using cookies
    // 7. send response

    // 1.
    const {email, username, password} = req.body

    // 2.
    if(!(username || email)){
        throw new ApiError(400, "Username or Email is required")
    }

    // 3.
    const user = await User.findOne({ // communicating with database so await
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    // 4.
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    // 5. 
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id) 
    // actually refreshToken in user in empty because we have the reference of user from point number 3. but we called method for generating tokens in point 5. 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    // 6. 
    const options = {
        httpOnly: true, // these two make sure only server can modify cookies.
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            {
                user: loggedInUser, accessToken, refreshToken
            }, 
            "User Logged in successfully")
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )

})

const refreshAcessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // req.cookies.refreshToken -- for PCs and another for mobile devices.
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired.")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken
}