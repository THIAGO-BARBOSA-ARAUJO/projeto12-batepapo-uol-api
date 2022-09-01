import { MongoClient } from "mongodb"
import express from "express"

const app = express()
app.use(express.json())

//conectando ao banco
const mongoClient = new MongoClient("mongodb://localhost:27017")
let db

mongoClient.connect().then(() => {
    db = mongoClient.db("teste")
})

app.post("/participants", (req, res) => {
	const { name } = req.body

    if(name === ""){
        res.sendStatus(422)
        return
    }

    // inserindo usuário
	db.collection("usuarios").insertOne({name: name, lastStatus: Date.now()});
    res.status(201).send({message: "Usuário cadastrado com sucesso!"})
});


app.listen(5000, () => {
    console.log("servidor ligado!")
})
