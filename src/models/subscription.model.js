import mongoose from "mongoose"

const subscriptionSchema = new mongoose.Schema({
    subscriber:{    // one who is subscribing
        type: Schema.Types.ObjectId,  
        ref: "User"
    },
    channel:{       // one to whom subscriber is subscribing
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

// example, i subscribed a youtube channel named "FreeCodeCamp" then i will be the subscriber and "FreeCodeCamp" will be the channel.

export const Subscription = mongoose.model("Subscription", subscriptionSchema)