import jwt from "jsonwebtoken"

export const generateTokens = (userId: string ) => {

    const accessSecret = process.env.ACCESS_TOKEN_SECRET as string
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string

 

    if (!accessSecret || !refreshSecret) {
        throw new Error("JWT secrets are not defined in .env")
    }

    const accessToken = jwt.sign(
        { userId },
        accessSecret,
        { expiresIn: "15m"}
    )

    const refreshToken = jwt.sign(
        { userId },
        refreshSecret,
        { expiresIn: "2d"}
    )

    return { accessToken, refreshToken }
}