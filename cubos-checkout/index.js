const express = require('express');
const data = require('./banco/data.json');
const bodyParser = require('body-parser');
const roteador = require("./rotas");

const app = express();

app.use(express.json());

// app.use(roteador);

app.get('/produtos', (req, res) =>{
    const produtos = data.produtos;
    const produtosEstoque = produtos.filter(x => {
        if(x.estoque !== 0){
            return x
    }});
    const query = req.query;


    if (query.categoria){
        console.log(query.categoria)
        const filtroCategoria = produtosEstoque.filter(x => x.categoria.toLowerCase() === query.categoria.toLowerCase());
        res.json(filtroCategoria)
    } else {
        res.json(produtosEstoque)
    }
})

app.listen(3000);