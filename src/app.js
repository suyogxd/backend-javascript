import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "16kb"})) // for things that gives data in json format.
app.use(express.urlencoded({extended: true, limit:"16kb"})) // for data from the url
app.use(express.static("public")) // for public resources like favicons, images.
app.use(cookieParser())


export {app}