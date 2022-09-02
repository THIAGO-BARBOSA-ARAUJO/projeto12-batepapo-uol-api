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

var now = dayjs()


app.post("/participants", (req, res) => {
	const { name } = req.body
    
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
        db.collection("mensagens").insertOne({from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: `${now.hour()}:${now.minute()}:${now.second()}`})
        res.status(201).send({message: "Usuário cadastrado com sucesso!"})
    }
      
    ValidaDados()
    
});


app.listen(5000, () => {
    console.log("servidor ligado!")
})
