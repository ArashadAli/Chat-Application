import  { z }  from 'zod'

export const signupSchema = z.object({
    phoneNo:z
    .string()
    .min(10, "Phone number must be 10 digit")
    .max(13, "Phone number is too long"),
    
    username:z
    .string()
    .min(5, "username must be 5 length")
    .max(20, "username is too long"),

    password:z
    .string()
    .min(5, "password is too small")
    .max(20, "password is too long")
})


export const loginSchema = z.object({
    phoneNo:z
    .string()
    .min(10, "Phone number must be 10 digit")
    .max(13, "Phone number is too long"),

    password:z
    .string()
    .min(5, "password is too short")
    .max(20, "password is too long")
})
