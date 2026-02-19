import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import bcrypt from 'bcryptjs';


export async function POST(request: Request) {

  const reqBody = await request.json() //conver this to data
  const {name, email, password} = reqBody

  try {
    
    //validating the data
  if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    //checking if person exists
    const existingUser = await prisma.user.findUnique({
                where: {
                    email: email as string
              },
            })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      )
    } 

    //hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    //creating a user
    const newUser = await prisma.user.create({
          data: {
            email,
            name,
            hashedPassword: hashedPassword,
          },
        });

      return NextResponse.json(
        {
          message: "User Created Successfully",
          user: {
            id: newUser.id,
            name: newUser.name,
          email: newUser.email,
        },
  }, { status: 201 }
 )
  } catch (error) {
  
    console.error(error)
    return NextResponse.json(
      {error: "was not able to add person to data base: through api register"},
    {status: 500})
  }
  
    

}



