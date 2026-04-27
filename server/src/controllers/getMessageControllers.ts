import message from '../models/message.model'
import ApiError from '../utils/ApiError'
import { Request, Response } from 'express'
const getMessage = async (req:Request, res:Response) => {
    const {conversationId} = req.params
    // console.log("req params from msgCnt : ", req.params)
    if(!conversationId) new ApiError(404, "ConversationId not Found")
    const msg = await message.find({conversationId}).sort({ createdAt : 1})
    if(!msg) res.json({success : false})
    res.json({
        sucess : true,
        data : msg
    })
}

export default getMessage