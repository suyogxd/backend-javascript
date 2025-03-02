// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
// import mongoose from "mongoose"
// import {DB_NAME} from './constants'
import connectDB from "./database/index.js"



dotenv.config({
    path: './env'
})


connectDB()








/* first approach but make index.js crowded.
import express from "express" 
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
})() //IIFE function

*/