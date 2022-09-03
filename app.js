import { MongoClient } from "mongodb"
import express from "express"
import joi from "joi"
import cors from "cors"
import dayjs from "dayjs"

const app = express()
app.use(express.json())
app.use(cors())

//conectando ao banco
const mongoClient = new MongoClient("mongodb://localhost:27017")
let db

mongoClient.connect().then(() => {
    db = mongoClient.db("teste")
})



const nameSchema = joi.object({
            name: joi.string()
            .empty()
            .required() 
}).options({ abortEarly: false })

const menssagemSchema = joi.object({
    to: joi.string()
    .empty()
    .required(),
    text: joi.string()
    .empty()
    .required(),
    type: joi.any().valid("message", "private_message").required()
}).options({ abortEarly: false })



app.post("/participants", (req, res) => {
	const { name } = req.body
    let time = dayjs().format("HH:mm:ss")

    async function ValidaDados() {

        const validador = nameSchema.validate(req.body)
    
        if(validador.error){
            console.log(validador.error)
            res.sendStatus(422)
            console.log(validador.error)
            return
        }

        const resposta = await db.collection("usuarios").findOne(req.body)
            
        if(resposta){
            res.status(409).send("Usuário já cadastrado!")
            return
        }
        // inserindo usuário
        db.collection("usuarios").insertOne({name: name, lastStatus: Date.now()});
        db.collection("mensagens").insertOne({from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time})
        res.status(201).send({message: "Usuário cadastrado com sucesso!"})
    }
      
    ValidaDados()
    
});

app.get("/participants", (req, res) => {
    //envia os usuários do banco de dados
    db.collection("usuarios").find().toArray().then(users => {
        res.status(200).send(users)
        //console.log(users); // array de usuários
    });
})

app.post("/messages", (req, res) => {
    const {to, text, type} = req.body
    const { user } = req.headers
    let time = dayjs().format("HH:mm:ss")
    
    async function ValidaDados() {

        const validador = menssagemSchema.validate({to, text, type})
    
        if(validador.error){
            console.log(validador.error)
            res.sendStatus(422)
            console.log(validador.error)
            return
        }

        const resposta = await db.collection("usuarios").findOne({ name: user})
        console.log(resposta)    
        if(resposta){
             // inserindo a mensagem no banco de dados.
        
            db.collection("mensagens").insertOne({from: user, to: to, text: text, type: type, time})
            res.status(200).send({message: "O usário existe!"})
            return
        }
       
        res.status(422).send("O usuário não existe!")
    }
    ValidaDados()
    //res.sendStatus(200)
})

app.get("/messages",async (req, res) => {
    //const user = req.headers.user
    const { user }  = req.headers
    const { limit } = req.query
    console.log(user)
    if(!limit){
       const limit = 100
    }
    try {
        const resposta = await db.collection("mensagens").find({$or: [{type: "message"}, {to: user}, {from: user}]}).toArray()
        res.status(200).send(resposta.slice(-limit))   
    } catch (error) {
        res.sendStatus(500)
    }

})

app.post("/status", async (req, res)=>{
    const { user } = req.headers
    
    try {
        const resposta = await db.collection("usuarios").findOne({ name: user })
        console.log(resposta)
        if(!resposta) {
            res.sendStatus(404)
            return
        }
        await db.collection("usuarios").updateOne({name: user},{$set: {lastStatus: Date.now()}})
        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
    }

})


app.listen(5000, () => {
    console.log("servidor ligado!")
})
