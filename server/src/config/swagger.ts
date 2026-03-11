import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat Application API",
      version: "1.0.0",
      description: "API documentation for Chat Application",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },

  apis: ["./src/routes/*.ts"], // swagger comments yaha se read karega
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;