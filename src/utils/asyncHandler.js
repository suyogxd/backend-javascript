const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}



export {asyncHandler}

//************************* try-catch approach ****************************//

// const asyncHandler = () => {} // simple function
// const asyncHandler = (func) => () => {} // if i have to pass 'func' to another function
// const asyncHandler = (func) => async () => {} // if i have to use async funtion 


// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//         console.log("first")
//     }
// }